import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { and, asc, eq, gte, ilike, sql } from 'drizzle-orm';
import { countryCode } from '../lib/schemas.js';
import { companies, offerPhotos, offers } from '../db/schema.js';
import { notFound } from '../lib/errors.js';
import { sweepExpired } from '../lib/payments.js';
import type { Env } from '../middleware/auth.js';
import { ACTIVITIES } from '../../shared/constants.js';

/** Recherche partielle, caractères spéciaux de LIKE neutralisés. */
const like = (v: string) => `%${v.replace(/[%_\\]/g, '\\$&')}%`;

const cols = {
  id: offers.id,
  title: offers.title,
  description: offers.description,
  priceFcfa: offers.priceFcfa,
  startsAt: offers.startsAt,
  remaining: sql<number>`${offers.capacity} - ${offers.booked}`.as('remaining'),
  country: offers.country,
  city: offers.city,
  stops: offers.stops,
  photoCount: sql<number>`(select count(*)::int from offer_photos p where p.offer_id = ${offers.id})`.as('photo_count'),
  companyName: companies.name,
  activity: companies.activity,
};

/** Catalogue public : offres actives, d'entreprises validées, à venir. */
export const catalogRoutes = new Hono<Env>()
  .get(
    '/',
    v('query', z.object({
      activity: z.enum(ACTIVITIES).optional(),
      country: countryCode.optional(),
      city: z.string().trim().max(80).optional(),
      q: z.string().trim().max(100).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    })),
    async (c) => {
      const { activity, country, city, q, limit } = c.req.valid('query');
      // Libère les places des paiements expirés (pas de cron) ; ne doit jamais bloquer le catalogue.
      try { await sweepExpired({ db: c.get('db'), orz: c.get('orz') }, 3); } catch (e) { console.error('[sweep]', e); }
      const rows = await c.get('db')
        .select(cols)
        .from(offers)
        .innerJoin(companies, eq(companies.id, offers.companyId))
        .where(and(
          eq(offers.active, true),
          eq(companies.status, 'active'),
          gte(offers.startsAt, new Date()),
          activity ? eq(companies.activity, activity) : undefined,
          country ? eq(offers.country, country) : undefined,
          city ? sql`(${offers.city} ilike ${like(city)} or exists (select 1 from unnest(${offers.stops}) as s where s ilike ${like(city)}))` : undefined,
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
  })
  /** Photo d'une offre visible au public (image JPEG, cache navigateur 1 jour). */
  .get('/:id/photos/:pos', v('param', z.object({ id: z.string().uuid(), pos: z.coerce.number().int().min(0).max(3) })), async (c) => {
    const { id, pos } = c.req.valid('param');
    const [row] = await c.get('db').select({ data: offerPhotos.data }).from(offerPhotos)
      .innerJoin(offers, eq(offers.id, offerPhotos.offerId))
      .innerJoin(companies, eq(companies.id, offers.companyId))
      .where(and(eq(offerPhotos.offerId, id), eq(offerPhotos.position, pos), eq(offers.active, true), eq(companies.status, 'active'))).limit(1);
    if (!row) throw notFound('Photo');
    return new Response(Buffer.from(row.data, 'base64'), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' } });
  });
