import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { bookings, companies, creditLedger, offers, payments } from '../db/schema.js';
import { AppError, conflict, notFound } from '../lib/errors.js';
import { requireRole, type Env } from '../middleware/auth.js';
import { config } from '../config.js';
import { OrzayahError } from '../lib/orzayah.js';
import { notify, notifyBookingConfirmed } from '../lib/notify.js';
import { applyOrzOp, closePayment, publicPayment, sweepExpired } from '../lib/payments.js';

const id = z.object({ id: z.string().uuid() });
const MAX_PENDING = 3;

const body = z.object({
  offerId: z.string().uuid(),
  seats: z.number().int().min(1).max(20).default(1),
  stop: z.string().trim().max(100).optional(),
  payment: z.object({ operator: z.enum(['ORANGE', 'MTN', 'MOOV', 'WAVE']), accountNumber: z.string().trim().max(30) }).optional(),
});

export const bookingRoutes = new Hono<Env>()
  .use(requireRole('customer', 'owner', 'admin'))
  /**
   * Réservation atomique. 1 réservation = 1 crédit prélevé sur l'entreprise (modèle NEXUS).
   * Offre gratuite : confirmée tout de suite. Offre payante : places + crédit sont bloqués (« pending_payment ») le temps du
   * paiement Mobile Money ORZAYAH ; ils sont rendus si le paiement échoue ou expire. Gardes dans les UPDATE (WHERE).
   */
  .post('/', v('json', body), async (c) => {
    const { offerId, seats, stop, payment } = c.req.valid('json');
    const user = c.get('user')!;
    const db = c.get('db');
    const orz = c.get('orz');
    const ctx = { db, orz };

    try { await sweepExpired(ctx, 3); } catch (e) { console.error('[sweep]', e); }

    const [pre] = await db.select({ price: offers.priceFcfa }).from(offers).where(eq(offers.id, offerId)).limit(1);
    if (!pre) throw notFound('Offre');
    const totalFcfa = pre.price * seats;
    const paid = totalFcfa > 0;

    let account = '';
    if (paid) {
      if (!payment) throw new AppError(400, 'payment_required', 'Choisissez un moyen de paiement (opérateur et numéro Mobile Money)');
      account = payment.accountNumber.replace(/[\s.\-+]/g, '');
      if (!/^\d{8,15}$/.test(account)) throw new AppError(400, 'invalid', 'Numéro Mobile Money invalide (8 à 15 chiffres)');
      if (!orz) throw new AppError(503, 'payments_unavailable', 'Le paiement en ligne est momentanément indisponible');
      const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(payments).where(and(eq(payments.userId, user.id), eq(payments.status, 'pending')));
      if (n >= MAX_PENDING) throw new AppError(429, 'too_many_pending', 'Trop de paiements en attente : terminez-les ou attendez leur expiration');
    }

    const paymentId = randomUUID();
    const booking = await db.transaction(async (tx) => {
      // Arrêt : obligatoire et limité à la liste du fournisseur lorsque l'offre en définit une.
      const [info] = await tx.select({ stops: offers.stops }).from(offers).where(eq(offers.id, offerId)).limit(1);
      if (!info) throw notFound('Offre');
      let chosenStop: string | null = null;
      if (info.stops.length) {
        const match = info.stops.find((x) => x.toLowerCase() === (stop ?? '').toLowerCase());
        if (!match) throw new AppError(400, 'invalid', "Choisissez un arrêt parmi ceux proposés par le fournisseur");
        chosenStop = match;
      }
      const [o] = await tx.update(offers)
        .set({ booked: sql`${offers.booked} + ${seats}` })
        .where(and(eq(offers.id, offerId), eq(offers.active, true), gte(offers.startsAt, new Date()), sql`${offers.booked} + ${seats} <= ${offers.capacity}`))
        .returning({ companyId: offers.companyId, price: offers.priceFcfa });
      if (!o) {
        const [exists] = await tx.select({ id: offers.id }).from(offers).where(eq(offers.id, offerId)).limit(1);
        if (!exists) throw notFound('Offre');
        throw conflict('unavailable', 'Offre complète, expirée ou désactivée');
      }
      // Le prix peut avoir changé entre la lecture et le verrou : on ne débite jamais un montant différent.
      if ((o.price * seats > 0) !== paid || o.price * seats !== totalFcfa) throw conflict('price_changed', "Le prix de l'offre vient de changer, réessayez");
      const [co] = await tx.update(companies)
        .set({ credits: sql`${companies.credits} - 1` })
        .where(and(eq(companies.id, o.companyId), eq(companies.status, 'active'), sql`${companies.credits} >= 1`))
        .returning({ id: companies.id });
      if (!co) throw new AppError(409, 'company_unavailable', "Cette entreprise ne peut pas accepter de réservation pour le moment");
      const [b] = await tx.insert(bookings).values({ offerId, companyId: o.companyId, userId: user.id, seats, stop: chosenStop, status: paid ? 'pending_payment' : 'confirmed' }).returning();
      await tx.insert(creditLedger).values({ companyId: o.companyId, delta: -1, reason: 'booking', bookingId: b.id });
      if (paid) {
        await tx.insert(payments).values({
          id: paymentId, bookingId: b.id, companyId: o.companyId, userId: user.id, amountFcfa: totalFcfa,
          operator: payment!.operator, accountNumber: account, idempotencyKey: `nx-${paymentId}`,
          expiresAt: new Date(Date.now() + config().HOLD_MINUTES * 60_000),
        });
      }
      return b;
    });
    if (!paid) { await notifyBookingConfirmed(db, booking.id); return c.json({ booking, payment: null }, 201); }

    // Demande de débit Mobile Money : le client confirme ensuite sur son téléphone.
    try {
      const op = await orz!.createDeposit({ operator: payment!.operator, accountNumber: account, amountCentimes: totalFcfa * 100, idempotencyKey: `nx-${paymentId}` });
      await applyOrzOp(db, paymentId, op);
    } catch (e) {
      if (e instanceof OrzayahError && e.definitive) {
        await closePayment(db, paymentId, 'failed', e.message);
        throw new AppError(e.status === 400 ? 400 : 503, e.status === 400 ? 'payment_rejected' : 'payments_unavailable', e.status === 400 ? `Paiement refusé : ${e.message}` : 'Le paiement en ligne est momentanément indisponible');
      }
      // Issue incertaine (réseau, 5xx, 429) : on garde la réservation ; le suivi rejouera avec la même clé sans double débit.
      console.error('[orzayah] createDeposit incertain', e instanceof Error ? e.message : e);
    }
    const [p] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    const [b] = await db.select().from(bookings).where(eq(bookings.id, booking.id)).limit(1);
    return c.json({ booking: b, payment: publicPayment(p!) }, 201);
  })
  .get('/mine', async (c) => {
    const rows = await c.get('db')
      .select({ id: bookings.id, seats: bookings.seats, stop: bookings.stop, country: offers.country, city: offers.city, status: bookings.status, createdAt: bookings.createdAt, offerTitle: offers.title, startsAt: offers.startsAt, companyName: companies.name, paymentId: payments.id, paymentStatus: payments.status, amountFcfa: payments.amountFcfa })
      .from(bookings)
      .innerJoin(offers, eq(offers.id, bookings.offerId))
      .innerJoin(companies, eq(companies.id, bookings.companyId))
      .leftJoin(payments, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.userId, c.get('user')!.id))
      .orderBy(desc(bookings.createdAt))
      .limit(100);
    return c.json({ bookings: rows });
  })
  /** Annulation par le client (réservations confirmées gratuites) : libère les places et rembourse le crédit. */
  .post('/:id/cancel', v('param', id), async (c) => {
    const user = c.get('user')!;
    const cancelled = await c.get('db').transaction(async (tx) => {
      const [b] = await tx.select().from(bookings).where(and(eq(bookings.id, c.req.valid('param').id), eq(bookings.userId, user.id), eq(bookings.status, 'confirmed'))).for('update');
      if (!b) throw notFound('Réservation');
      const [pay] = await tx.select({ id: payments.id }).from(payments).where(eq(payments.bookingId, b.id)).limit(1);
      if (pay) throw conflict('paid_booking', "Cette réservation a été payée : contactez le fournisseur pour l'annuler et être remboursé");
      await tx.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, b.id));
      await tx.update(offers).set({ booked: sql`${offers.booked} - ${b.seats}` }).where(eq(offers.id, b.offerId));
      await tx.update(companies).set({ credits: sql`${companies.credits} + 1` }).where(eq(companies.id, b.companyId));
      await tx.insert(creditLedger).values({ companyId: b.companyId, delta: 1, reason: 'refund', bookingId: b.id });
      const [info] = await tx.select({ ownerId: companies.ownerId, offerTitle: offers.title }).from(companies).innerJoin(offers, eq(offers.id, b.offerId)).where(eq(companies.id, b.companyId));
      return { b, info };
    });
    await notify(c.get('db'), [{ userId: cancelled.info.ownerId, kind: 'booking_cancelled', refId: cancelled.b.id, title: `Réservation annulée : ${cancelled.info.offerTitle}`, body: `Le client a annulé ${cancelled.b.seats} place(s).`, link: '/company' }]);
    return c.json({ ok: true });
  });
