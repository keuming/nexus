import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { and, asc, eq, ilike, inArray, sql } from 'drizzle-orm';
import { countryCode } from '../lib/schemas.js';
import { activityDisplay, companies, offerPhotos, offers } from '../db/schema.js';
import { notFound } from '../lib/errors.js';
import { sweepExpired } from '../lib/payments.js';
import type { Env } from '../middleware/auth.js';
import { ACTIVITIES, DATED_ACTIVITIES } from '../../shared/constants.js';

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

/** Règles d'affichage : planification admin (type d'activité, offre) et date de l'offre pour les activités datées. */
const displayRules = () => and(
  eq(offers.adminHidden, false),
  sql`(${offers.showFrom} is null or ${offers.showFrom} <= now())`,
  sql`(${offers.showUntil} is null or ${offers.showUntil} >= now())`,
  sql`not exists (select 1 from activity_display d where d.activity = ${companies.activity} and (d.visible = false or d.show_from > now() or d.show_until < now()))`,
  sql`(${companies.activity} not in (${sql.join(DATED_ACTIVITIES.map((a) => sql`${a}`), sql`, `)}) or ${offers.startsAt} >= now())`,
);

/** Catalogue public : offres actives, d'entreprises validées, à venir. */
export const catalogRoutes = new Hono<Env>()
  .get(
    '/',
    v('query', z.object({
      activity: z.string().transform((x) => x.split(',')).pipe(z.array(z.enum(ACTIVITIES)).min(1).max(20)).optional(),
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
          displayRules(),
          activity ? inArray(companies.activity, activity) : undefined,
          country ? eq(offers.country, country) : undefined,
          city ? sql`(${offers.city} ilike ${like(city)} or exists (select 1 from unnest(${offers.stops}) as s where s ilike ${like(city)}))` : undefined,
          q ? ilike(offers.title, `%${q.replace(/[%_\\]/g, '\\$&')}%`) : undefined,
        ))
        .orderBy(asc(offers.startsAt))
        .limit(limit);
      return c.json({ offers: rows });
    },
  )
  .get('/activities', async (c) => {
    const rows = await c.get('db').select().from(activityDisplay);
    const now = Date.now();
    const hidden = new Set(rows.filter((r) => !r.visible || (r.showFrom && r.showFrom.getTime() > now) || (r.showUntil && r.showUntil.getTime() < now)).map((r) => r.activity));
    return c.json({ activities: ACTIVITIES.filter((a) => !hidden.has(a)) });
  })
  .get('/:id', v('param', z.object({ id: z.string().uuid() })), async (c) => {
    const [row] = await c.get('db')
      .select(cols)
      .from(offers)
      .innerJoin(companies, eq(companies.id, offers.companyId))
      .where(and(eq(offers.id, c.req.valid('param').id), eq(offers.active, true), eq(companies.status, 'active'), displayRules()))
      .limit(1);
    if (!row) throw notFound('Offre');
    return c.json({ offer: row });
  })
  /** Photo d'une offre visible au public (image JPEG, cache navigateur 1 jour). */
  .get('/:id/photos/:pos', v('param', z.object({ id: z.string().uuid(), pos: z.coerce.number().int().min(0).max(3) })), async (c) => {
    const { id, pos } = c.req.valid('param');
    const [row] = await c.get('db').select({ data: offerPhotos.data, url: offerPhotos.url }).from(offerPhotos)
      .innerJoin(offers, eq(offers.id, offerPhotos.offerId))
      .innerJoin(companies, eq(companies.id, offers.companyId))
      .where(and(eq(offerPhotos.offerId, id), eq(offerPhotos.position, pos), eq(offers.active, true), eq(companies.status, 'active'))).limit(1);
    if (!row) throw notFound('Photo');
    // Cloudinary : redirection vers une version optimisée (format et qualité automatiques, 900 px de large).
    if (row.url) { c.header('cache-control', 'public, max-age=3600'); return c.redirect(row.url.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_900,c_limit/'), 302); }
    return new Response(Buffer.from(row.data!, 'base64'), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=86400', 'x-content-type-options': 'nosniff' } });
  });
