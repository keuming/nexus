import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { and, asc, eq, gte, ilike, sql } from 'drizzle-orm';
import { companies, offers } from '../db/schema.js';
import { notFound } from '../lib/errors.js';
import type { Env } from '../middleware/auth.js';
import { ACTIVITIES } from '../../shared/constants.js';

const cols = {
  id: offers.id,
  title: offers.title,
  description: offers.description,
  priceFcfa: offers.priceFcfa,
  startsAt: offers.startsAt,
  remaining: sql<number>`${offers.capacity} - ${offers.booked}`.as('remaining'),
  companyName: companies.name,
  activity: companies.activity,
  city: companies.city,
};

/** Catalogue public : offres actives, d'entreprises validées, à venir. */
export const catalogRoutes = new Hono<Env>()
  .get(
    '/',
    v('query', z.object({
      activity: z.enum(ACTIVITIES).optional(),
      q: z.string().trim().max(100).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    })),
    async (c) => {
      const { activity, q, limit } = c.req.valid('query');
      const rows = await c.get('db')
        .select(cols)
        .from(offers)
        .innerJoin(companies, eq(companies.id, offers.companyId))
        .where(and(
          eq(offers.active, true),
          eq(companies.status, 'active'),
          gte(offers.startsAt, new Date()),
          activity ? eq(companies.activity, activity) : undefined,
          q ? ilike(offers.title, `%${q.replace(/[%_\\]/g, '\\$&')}%`) : undefined,
        ))
        .orderBy(asc(offers.startsAt))
        .limit(limit);
      return c.json({ offers: rows });
    },
  )
  .get('/:id', v('param', z.object({ id: z.string().uuid() })), async (c) => {
    const [row] = await c.get('db')
      .select(cols)
      .from(offers)
      .innerJoin(companies, eq(companies.id, offers.companyId))
      .where(and(eq(offers.id, c.req.valid('param').id), eq(offers.active, true), eq(companies.status, 'active')))
      .limit(1);
    if (!row) throw notFound('Offre');
    return c.json({ offer: row });
  });
