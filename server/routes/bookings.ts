import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { bookings, companies, creditLedger, offers, payments } from '../db/schema.js';
import { AppError, conflict, notFound } from '../lib/errors.js';
import { requireRole, type Env } from '../middleware/auth.js';
import { config } from '../config.js';
import { OrzayahError, type OrzayahClient } from '../lib/orzayah.js';
import { notify, notifyBookingConfirmed } from '../lib/notify.js';
import { phoneField } from '../lib/schemas.js';
import { applyLink, closePayment, linkInput, publicPayment, sweepExpired, syncPayment } from '../lib/payments.js';

const id = z.object({ id: z.string().uuid() });
const MAX_PENDING = 3;

const body = z.object({
  offerId: z.string().uuid(),
  seats: z.number().int().min(1).max(20).default(1),
  stop: z.string().trim().max(100).optional(),
  // « cash » : paiement à la livraison (réservation confirmée tout de suite) ; « digital » : lien de paiement ORZAYAH (Mobile Money, carte, wallet).
  payMode: z.enum(['cash', 'digital']).default('digital'),
  // Informations du réservant (obligatoires) : le fournisseur doit pouvoir le joindre.
  contact: z.object({ name: z.string().trim().min(2, 'Indiquez votre nom complet').max(100), phone: phoneField, email: z.string().trim().toLowerCase().email('E-mail invalide').max(200) }),
  guests: z.array(z.string().trim().min(2, 'Nom de participant trop court').max(100)).max(20).default([]),
  note: z.string().trim().max(500).default(''),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Vous devez accepter les conditions de réservation' }) }),
});

export const bookingRoutes = new Hono<Env>()
  .use(requireRole('customer', 'owner', 'admin'))
  /**
   * Réservation atomique. 1 réservation = 1 crédit prélevé sur l'entreprise (modèle BackMarket).
   * Offre gratuite : confirmée tout de suite. Offre payante : places + crédit sont bloqués (« pending_payment ») le temps du
   * paiement Mobile Money ORZAYAH ; ils sont rendus si le paiement échoue ou expire. Gardes dans les UPDATE (WHERE).
   */
  .post('/', v('json', body), async (c) => {
    const { offerId, seats, stop, payMode, contact, guests, note } = c.req.valid('json');
    const user = c.get('user')!;
    const db = c.get('db');
    const ctx = { db, orzFor: c.get('orzFor') };

    try { await sweepExpired(ctx, 3); } catch (e) { console.error('[sweep]', e); }

    const [pre] = await db.select({ price: offers.priceFcfa, allowCash: offers.allowCash, companyId: offers.companyId }).from(offers).where(eq(offers.id, offerId)).limit(1);
    if (!pre) throw notFound('Offre');
    if (pre.price > 0 && payMode === 'cash' && !pre.allowCash) throw new AppError(400, 'cash_not_allowed', "Ce prestataire n'accepte pas le paiement à la livraison pour cette offre");
    const totalFcfa = pre.price * seats;
    const priced = totalFcfa > 0;
    const paid = priced && payMode === 'digital'; // paiement en ligne (sinon gratuit ou à la livraison)
    const payMethod = priced && payMode === 'cash' ? 'cash' : 'digital';

    let orz: OrzayahClient | null = null;
    if (paid) {
      // L'argent va directement sur le compte ORZAYAH du marchand : sans compte relié, le paiement en ligne est impossible.
      orz = await ctx.orzFor(pre.companyId, 'merchant');
      if (!orz) throw new AppError(400, 'online_not_available', "Ce prestataire n'a pas encore activé le paiement en ligne : choisissez le paiement à la livraison ou contactez-le");
      const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(payments).where(and(eq(payments.userId, user.id), eq(payments.status, 'pending')));
      if (n >= MAX_PENDING) throw new AppError(429, 'too_many_pending', 'Trop de paiements en attente : terminez-les ou attendez leur expiration');
    }
    const appUrl = (config().APP_URL ?? `${(c.req.header('x-forwarded-proto') ?? new URL(c.req.url).protocol.replace(':', '')).split(',')[0]}://${c.req.header('x-forwarded-host') ?? c.req.header('host') ?? new URL(c.req.url).host}`).replace(/\/$/, '');

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
        .where(and(eq(offers.id, offerId), eq(offers.active, true), sql`${offers.booked} + ${seats} <= ${offers.capacity}`))
        .returning({ companyId: offers.companyId, price: offers.priceFcfa });
      if (!o) {
        const [exists] = await tx.select({ id: offers.id }).from(offers).where(eq(offers.id, offerId)).limit(1);
        if (!exists) throw notFound('Offre');
        throw conflict('unavailable', 'Offre épuisée ou non disponible');
      }
      const [act] = await tx.select({ activity: companies.activity }).from(companies).where(eq(companies.id, o.companyId)).limit(1);
      if (act?.activity === 'transport' ? guests.length !== seats : guests.length > seats) throw new AppError(400, 'invalid', act?.activity === 'transport' ? 'Indiquez le nom de chaque passager' : 'Trop de noms de participants par rapport au nombre de places');
      // Le prix peut avoir changé entre la lecture et le verrou : on ne débite jamais un montant différent.
      if ((o.price * seats > 0) !== priced || o.price * seats !== totalFcfa) throw conflict('price_changed', "Le prix de l'offre vient de changer, réessayez");
      const [co] = await tx.update(companies)
        .set({ credits: sql`${companies.credits} - 1` })
        .where(and(eq(companies.id, o.companyId), eq(companies.status, 'active'), sql`${companies.credits} >= 1`))
        .returning({ id: companies.id });
      if (!co) throw new AppError(409, 'company_unavailable', "Cette entreprise ne peut pas accepter de réservation pour le moment");
      const [b] = await tx.insert(bookings).values({ offerId, companyId: o.companyId, userId: user.id, seats, stop: chosenStop, status: paid ? 'pending_payment' : 'confirmed', payMethod, unitPriceFcfa: o.price, contactName: contact.name, contactPhone: contact.phone, contactEmail: contact.email, guests, note, termsAcceptedAt: new Date() }).returning();
      await tx.insert(creditLedger).values({ companyId: o.companyId, delta: -1, reason: 'booking', bookingId: b.id });
      if (paid) {
        await tx.insert(payments).values({
          id: paymentId, orzScope: 'merchant', bookingId: b.id, companyId: o.companyId, userId: user.id, amountFcfa: totalFcfa,
          idempotencyKey: `bm-${paymentId}`, returnUrl: `${appUrl}/reservation/${b.id}`,
          expiresAt: new Date(Date.now() + config().HOLD_MINUTES * 60_000),
        });
      }
      return b;
    });
    if (!paid) { await notifyBookingConfirmed(db, booking.id); return c.json({ booking, payment: null }, 201); }

    // Création du lien de paiement ORZAYAH : le client y est redirigé pour payer (Mobile Money, carte, wallet).
    try {
      const [row] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
      const op = await orz!.createPaymentLink(await linkInput(db, row!));
      await applyLink(db, paymentId, op);
    } catch (e) {
      if (e instanceof OrzayahError && e.definitive) {
        await closePayment(db, paymentId, 'failed', e.message);
        throw new AppError(e.status === 400 ? 400 : 503, e.status === 400 ? 'payment_rejected' : 'payments_unavailable', e.status === 400 ? `Paiement refusé : ${e.message}` : 'Le paiement en ligne est momentanément indisponible');
      }
      // Issue incertaine (réseau, 5xx, 429) : on garde la réservation ; le suivi rejouera avec la même clé sans doublon.
      console.error('[orzayah] createPaymentLink incertain', e instanceof Error ? e.message : e);
    }
    const [p] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    const [b] = await db.select().from(bookings).where(eq(bookings.id, booking.id)).limit(1);
    return c.json({ booking: b, payment: publicPayment(p!) }, 201);
  })
  .get('/mine', async (c) => {
    const rows = await c.get('db')
      .select({ id: bookings.id, reference: bookings.reference, seats: bookings.seats, stop: bookings.stop, country: offers.country, city: offers.city, destCountry: offers.destCountry, destCity: offers.destCity, status: bookings.status, fulfillment: bookings.fulfillment, cancelReason: bookings.cancelReason, cancelledBy: bookings.cancelledBy, payMethod: bookings.payMethod, priceFcfa: sql<number>`coalesce(${bookings.unitPriceFcfa}, ${offers.priceFcfa})`, createdAt: bookings.createdAt, offerTitle: offers.title, startsAt: offers.startsAt, companyName: companies.name, paymentId: payments.id, paymentStatus: payments.status, amountFcfa: payments.amountFcfa })
      .from(bookings)
      .innerJoin(offers, eq(offers.id, bookings.offerId))
      .innerJoin(companies, eq(companies.id, bookings.companyId))
      .leftJoin(payments, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.userId, c.get('user')!.id))
      .orderBy(desc(bookings.createdAt))
      .limit(100);
    return c.json({ bookings: rows });
  })
  /** Détail d'une réservation (page de confirmation / reçu) : visible par son auteur ou un admin. */
  .get('/:id', v('param', id), async (c) => {
    const user = c.get('user')!;
    const db = c.get('db');
    // Retour de la page de paiement : on relit le lien chez ORZAYAH (espacé de 3 s) pour afficher l'état réel.
    const [open] = await db.select().from(payments).where(and(eq(payments.bookingId, c.req.valid('param').id), eq(payments.userId, user.id))).limit(1);
    if (open) await syncPayment({ db, orzFor: c.get('orzFor') }, open);
    const [r] = await db.select({
      id: bookings.id, userId: bookings.userId, reference: bookings.reference, status: bookings.status, payMethod: bookings.payMethod, fulfillment: bookings.fulfillment, cancelReason: bookings.cancelReason, cancelledBy: bookings.cancelledBy, cashCollectedAt: bookings.cashCollectedAt, seats: bookings.seats, stop: bookings.stop, createdAt: bookings.createdAt,
      contactName: bookings.contactName, contactPhone: bookings.contactPhone, contactEmail: bookings.contactEmail, guests: bookings.guests, note: bookings.note,
      offerId: offers.id, offerTitle: offers.title, startsAt: offers.startsAt, city: offers.city, country: offers.country, destCity: offers.destCity, destCountry: offers.destCountry, priceFcfa: sql<number>`coalesce(${bookings.unitPriceFcfa}, ${offers.priceFcfa})`, photoCount: sql<number>`(select count(*)::int from offer_photos p where p.offer_id = ${offers.id})`,
      companyName: companies.name, companyPhone: companies.phone, companyAddress: companies.address,
      payment: payments,
    }).from(bookings)
      .innerJoin(offers, eq(offers.id, bookings.offerId))
      .innerJoin(companies, eq(companies.id, bookings.companyId))
      .leftJoin(payments, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.id, c.req.valid('param').id)).limit(1);
    if (!r || (r.userId !== user.id && user.role !== 'admin')) throw notFound('Réservation');
    const { payment: pay, userId: _u, ...rest } = r;
    return c.json({ booking: { ...rest, payment: pay ? publicPayment(pay) : null } });
  })
  /** Annulation par le client (réservations confirmées gratuites) : libère les places et rembourse le crédit. */
  .post('/:id/cancel', v('param', id), async (c) => {
    const user = c.get('user')!;
    const cancelled = await c.get('db').transaction(async (tx) => {
      const [b] = await tx.select().from(bookings).where(and(eq(bookings.id, c.req.valid('param').id), eq(bookings.userId, user.id), eq(bookings.status, 'confirmed'))).for('update');
      if (!b) throw notFound('Réservation');
      const [pay] = await tx.select({ id: payments.id }).from(payments).where(eq(payments.bookingId, b.id)).limit(1);
      if (!['new', 'accepted'].includes(b.fulfillment) || b.cashCollectedAt) throw conflict('in_progress', 'Votre commande est déjà en préparation ou livrée : contactez le fournisseur pour toute modification')
      if (pay) throw conflict('paid_booking', "Cette réservation a été payée : contactez le fournisseur pour l'annuler et être remboursé");
      await tx.update(bookings).set({ status: 'cancelled', cancelledBy: 'customer', cancelReason: 'Annulée par le client', updatedAt: new Date() }).where(eq(bookings.id, b.id));
      await tx.update(offers).set({ booked: sql`${offers.booked} - ${b.seats}` }).where(eq(offers.id, b.offerId));
      await tx.update(companies).set({ credits: sql`${companies.credits} + 1` }).where(eq(companies.id, b.companyId));
      await tx.insert(creditLedger).values({ companyId: b.companyId, delta: 1, reason: 'refund', bookingId: b.id });
      const [info] = await tx.select({ ownerId: companies.ownerId, offerTitle: offers.title }).from(companies).innerJoin(offers, eq(offers.id, b.offerId)).where(eq(companies.id, b.companyId));
      return { b, info };
    });
    await notify(c.get('db'), [{ userId: cancelled.info.ownerId, kind: 'booking_cancelled', refId: cancelled.b.id, title: `Réservation annulée : ${cancelled.info.offerTitle}`, body: `Le client a annulé ${cancelled.b.seats} place(s).`, link: '/company' }]);
    return c.json({ ok: true });
  });
