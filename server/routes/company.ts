import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { bookings, companies, creditLedger, offers, users } from '../db/schema.js';
import { conflict, notFound } from '../lib/errors.js';
import { requireRole, type Env } from '../middleware/auth.js';
import { ACTIVITIES } from '../../shared/constants.js';
import type { Db } from '../db/client.js';

async function myCompany(db: Db, ownerId: string) {
  const [co] = await db.select().from(companies).where(eq(companies.ownerId, ownerId)).limit(1);
  if (!co) throw notFound('Entreprise');
  return co;
}

export const companyRoutes = new Hono<Env>()
  .use(requireRole('owner'))
  .get('/', async (c) => c.json({ company: await myCompany(c.get('db'), c.get('user')!.id) }))
  .post('/', v('json', z.object({ name: z.string().trim().min(2).max(120), activity: z.enum(ACTIVITIES), city: z.string().trim().min(2).max(80) })), async (c) => {
    const db = c.get('db');
    const ownerId = c.get('user')!.id;
    const [dup] = await db.select({ id: companies.id }).from(companies).where(eq(companies.ownerId, ownerId)).limit(1);
    if (dup) throw conflict('company_exists', 'Vous avez déjà une entreprise');
    const [co] = await db.insert(companies).values({ ...c.req.valid('json'), ownerId }).returning();
    return c.json({ company: co }, 201);
  })
  .get('/offers', async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    return c.json({ offers: await c.get('db').select().from(offers).where(eq(offers.companyId, co.id)).orderBy(desc(offers.startsAt)).limit(200) });
  })
  .post('/offers', v('json', z.object({
    title: z.string().trim().min(2).max(150),
    description: z.string().trim().max(2000).default(''),
    priceFcfa: z.number().int().min(0).max(100_000_000),
    capacity: z.number().int().min(1).max(10_000),
    startsAt: z.string().datetime().transform((x) => new Date(x)).refine((d) => d.getTime() > Date.now(), 'La date doit être dans le futur'),
  })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const [o] = await c.get('db').insert(offers).values({ ...c.req.valid('json'), companyId: co.id }).returning();
    return c.json({ offer: o }, 201);
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
      .select({ id: bookings.id, seats: bookings.seats, status: bookings.status, createdAt: bookings.createdAt, offerTitle: offers.title, customerName: users.name })
      .from(bookings)
      .innerJoin(offers, eq(offers.id, bookings.offerId))
      .innerJoin(users, eq(users.id, bookings.userId))
      .where(eq(bookings.companyId, co.id))
      .orderBy(desc(bookings.createdAt)).limit(200);
    return c.json({ bookings: rows });
  })
  .get('/ledger', async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    return c.json({ ledger: await c.get('db').select().from(creditLedger).where(eq(creditLedger.companyId, co.id)).orderBy(desc(creditLedger.createdAt)).limit(200) });
  });
