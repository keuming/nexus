import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { bookings, companies, creditLedger, offerPhotos, offers, payments, users } from '../db/schema.js';
import { AppError, conflict, notFound } from '../lib/errors.js';
import { requireRole, type Env } from '../middleware/auth.js';
import { cityName, companyInput, countryCode, placeList } from '../lib/schemas.js';
import type { Db } from '../db/client.js';

async function myCompany(db: Db, ownerId: string) {
  const [co] = await db.select().from(companies).where(eq(companies.ownerId, ownerId)).limit(1);
  if (!co) throw notFound('Entreprise');
  return co;
}

export const companyRoutes = new Hono<Env>()
  .use(requireRole('owner'))
  .get('/', async (c) => c.json({ company: await myCompany(c.get('db'), c.get('user')!.id) }))
  .post('/', v('json', companyInput), async (c) => {
    const db = c.get('db');
    const ownerId = c.get('user')!.id;
    const [dup] = await db.select({ id: companies.id }).from(companies).where(eq(companies.ownerId, ownerId)).limit(1);
    if (dup) throw conflict('company_exists', 'Vous avez déjà une entreprise');
    const [co] = await db.insert(companies).values({ ...c.req.valid('json'), ownerId }).returning();
    return c.json({ company: co }, 201);
  })
  /** Correction d'une demande refusée : repasse en attente de validation. */
  .post('/resubmit', v('json', companyInput), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    if (co.status !== 'rejected') throw conflict('invalid_state', "Seule une demande refusée peut être corrigée et renvoyée");
    const [row] = await c.get('db').update(companies).set({ ...c.req.valid('json'), status: 'pending' }).where(eq(companies.id, co.id)).returning();
    return c.json({ company: row });
  })
  .patch('/', v('json', z.object({ serviceCities: placeList(30) })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const [row] = await c.get('db').update(companies).set({ serviceCities: c.req.valid('json').serviceCities }).where(eq(companies.id, co.id)).returning();
    return c.json({ company: row });
  })
  .get('/offers', async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    return c.json({ offers: await c.get('db').select({ ...getTableColumns(offers), photoCount: sql<number>`(select count(*)::int from offer_photos p where p.offer_id = ${offers.id})`.as('photo_count') }).from(offers).where(eq(offers.companyId, co.id)).orderBy(desc(offers.startsAt)).limit(200) });
  })
  .post('/offers', v('json', z.object({
    title: z.string().trim().min(2).max(150),
    description: z.string().trim().max(2000).default(''),
    country: countryCode,
    city: cityName,
    stops: placeList(20),
    priceFcfa: z.number().int().min(0).max(100_000_000),
    capacity: z.number().int().min(1).max(10_000),
    startsAt: z.string().datetime().transform((x) => new Date(x)).refine((d) => d.getTime() > Date.now(), 'La date doit être dans le futur'),
    // Photos : data URL JPEG (compressée par le navigateur), 4 max, ~375 Ko chacune.
    photos: z.array(z.string().max(520_000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, 'Photo invalide (JPEG attendu)')).max(4).default([]),
  })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const { photos, ...input } = c.req.valid('json');
    const bufs = photos.map((p) => p.slice('data:image/jpeg;base64,'.length));
    if (bufs.some((b) => !Buffer.from(b.slice(0, 8), 'base64').subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))) throw new AppError(400, 'invalid', 'Photo invalide (JPEG attendu)');
    const o = await c.get('db').transaction(async (tx) => {
      const [row] = await tx.insert(offers).values({ ...input, companyId: co.id }).returning();
      if (bufs.length) await tx.insert(offerPhotos).values(bufs.map((data, position) => ({ offerId: row.id, position, data })));
      return row;
    });
    return c.json({ offer: { ...o, photoCount: bufs.length } }, 201);
  })
  .patch('/offers/:id', v('param', z.object({ id: z.string().uuid() })), v('json', z.object({ active: z.boolean() })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const [o] = await c.get('db').update(offers).set({ active: c.req.valid('json').active })
      .where(and(eq(offers.id, c.req.valid('param').id), eq(offers.companyId, co.id))).returning();
    if (!o) throw notFound('Offre');
    return c.json({ offer: o });
  })
  .get('/bookings', async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const rows = await c.get('db')
      .select({ id: bookings.id, seats: bookings.seats, stop: bookings.stop, status: bookings.status, createdAt: bookings.createdAt, offerTitle: offers.title, customerName: users.name, paymentStatus: payments.status, amountFcfa: payments.amountFcfa })
      .from(bookings)
      .innerJoin(offers, eq(offers.id, bookings.offerId))
      .innerJoin(users, eq(users.id, bookings.userId))
      .leftJoin(payments, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.companyId, co.id))
      .orderBy(desc(bookings.createdAt)).limit(200);
    return c.json({ bookings: rows });
  })
  .get('/ledger', async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    return c.json({ ledger: await c.get('db').select().from(creditLedger).where(eq(creditLedger.companyId, co.id)).orderBy(desc(creditLedger.createdAt)).limit(200) });
  });
