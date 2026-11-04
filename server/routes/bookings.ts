import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { bookings, companies, creditLedger, offers } from '../db/schema.js';
import { AppError, conflict, notFound } from '../lib/errors.js';
import { requireRole, type Env } from '../middleware/auth.js';

const id = z.object({ id: z.string().uuid() });

export const bookingRoutes = new Hono<Env>()
  .use(requireRole('customer', 'owner', 'admin'))
  /**
   * Réservation atomique. 1 réservation = 1 crédit prélevé sur l'entreprise (modèle NEXUS).
   * Les gardes sont dans les UPDATE (WHERE) : aucune course possible entre deux requêtes simultanées.
   */
  .post('/', v('json', z.object({ offerId: z.string().uuid(), seats: z.number().int().min(1).max(20).default(1) })), async (c) => {
    const { offerId, seats } = c.req.valid('json');
    const user = c.get('user')!;
    const booking = await c.get('db').transaction(async (tx) => {
      const [o] = await tx.update(offers)
        .set({ booked: sql`${offers.booked} + ${seats}` })
        .where(and(eq(offers.id, offerId), eq(offers.active, true), gte(offers.startsAt, new Date()), sql`${offers.booked} + ${seats} <= ${offers.capacity}`))
        .returning({ companyId: offers.companyId });
      if (!o) {
        const [exists] = await tx.select({ id: offers.id }).from(offers).where(eq(offers.id, offerId)).limit(1);
        if (!exists) throw notFound('Offre');
        throw conflict('unavailable', 'Offre complète, expirée ou désactivée');
      }
      const [co] = await tx.update(companies)
        .set({ credits: sql`${companies.credits} - 1` })
        .where(and(eq(companies.id, o.companyId), eq(companies.status, 'active'), sql`${companies.credits} >= 1`))
        .returning({ id: companies.id });
      if (!co) throw new AppError(409, 'company_unavailable', "Cette entreprise ne peut pas accepter de réservation pour le moment");
      const [b] = await tx.insert(bookings).values({ offerId, companyId: o.companyId, userId: user.id, seats }).returning();
      await tx.insert(creditLedger).values({ companyId: o.companyId, delta: -1, reason: 'booking', bookingId: b.id });
      return b;
    });
    return c.json({ booking }, 201);
  })
  .get('/mine', async (c) => {
    const rows = await c.get('db')
      .select({ id: bookings.id, seats: bookings.seats, status: bookings.status, createdAt: bookings.createdAt, offerTitle: offers.title, startsAt: offers.startsAt, companyName: companies.name })
      .from(bookings)
      .innerJoin(offers, eq(offers.id, bookings.offerId))
      .innerJoin(companies, eq(companies.id, bookings.companyId))
      .where(eq(bookings.userId, c.get('user')!.id))
      .orderBy(desc(bookings.createdAt))
      .limit(100);
    return c.json({ bookings: rows });
  })
  /** Annulation par le client : libère les places et rembourse le crédit. */
  .post('/:id/cancel', v('param', id), async (c) => {
    const user = c.get('user')!;
    await c.get('db').transaction(async (tx) => {
      const [b] = await tx.update(bookings)
        .set({ status: 'cancelled' })
        .where(and(eq(bookings.id, c.req.valid('param').id), eq(bookings.userId, user.id), eq(bookings.status, 'confirmed')))
        .returning();
      if (!b) throw notFound('Réservation');
      await tx.update(offers).set({ booked: sql`${offers.booked} - ${b.seats}` }).where(eq(offers.id, b.offerId));
      await tx.update(companies).set({ credits: sql`${companies.credits} + 1` }).where(eq(companies.id, b.companyId));
      await tx.insert(creditLedger).values({ companyId: b.companyId, delta: 1, reason: 'refund', bookingId: b.id });
    });
    return c.json({ ok: true });
  });
