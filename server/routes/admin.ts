import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { count, desc, eq, sql } from 'drizzle-orm';
import { bookings, companies, creditLedger, users } from '../db/schema.js';
import { notFound } from '../lib/errors.js';
import { requireRole, type Env } from '../middleware/auth.js';
import { CREDIT_PRICE_FCFA } from '../../shared/constants.js';

const id = z.object({ id: z.string().uuid() });

export const adminRoutes = new Hono<Env>()
  .use(requireRole('admin'))
  .get('/stats', async (c) => {
    const db = c.get('db');
    const [[u], [co], [b]] = await Promise.all([
      db.select({ n: count() }).from(users),
      db.select({ n: count() }).from(companies),
      db.select({ n: count() }).from(bookings),
    ]);
    return c.json({ users: u.n, companies: co.n, bookings: b.n });
  })
  .get('/companies', v('query', z.object({ status: z.enum(['pending', 'active', 'suspended']).optional() })), async (c) => {
    const { status } = c.req.valid('query');
    const rows = await c.get('db')
      .select({ id: companies.id, name: companies.name, activity: companies.activity, city: companies.city, status: companies.status, credits: companies.credits, createdAt: companies.createdAt, ownerEmail: users.email })
      .from(companies).innerJoin(users, eq(users.id, companies.ownerId))
      .where(status ? eq(companies.status, status) : undefined)
      .orderBy(desc(companies.createdAt)).limit(200);
    return c.json({ companies: rows });
  })
  .post('/companies/:id/status', v('param', id), v('json', z.object({ status: z.enum(['active', 'suspended']) })), async (c) => {
    const [co] = await c.get('db').update(companies).set({ status: c.req.valid('json').status }).where(eq(companies.id, c.req.valid('param').id)).returning();
    if (!co) throw notFound('Entreprise');
    return c.json({ company: co });
  })
  /** Recharge de crédits (après paiement hors-ligne / mobile money). 1 crédit = 125 FCFA. */
  .post('/companies/:id/credits', v('param', id), v('json', z.object({ credits: z.number().int().min(1).max(100_000) })), async (c) => {
    const { credits } = c.req.valid('json');
    const co = await c.get('db').transaction(async (tx) => {
      const [row] = await tx.update(companies).set({ credits: sql`${companies.credits} + ${credits}` }).where(eq(companies.id, c.req.valid('param').id)).returning();
      if (!row) throw notFound('Entreprise');
      await tx.insert(creditLedger).values({ companyId: row.id, delta: credits, reason: 'topup' });
      return row;
    });
    return c.json({ company: co, amountFcfa: credits * CREDIT_PRICE_FCFA });
  });
