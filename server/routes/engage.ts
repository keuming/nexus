import { Hono } from 'hono';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { v } from '../lib/validate.js';
import { ads, bookings, companies, favorites, offers, reviews } from '../db/schema.js';
import { conflict, notFound } from '../lib/errors.js';
import { countryCode } from '../lib/schemas.js';
import { requireRole, type Env } from '../middleware/auth.js';
import { cols, displayRules, visitorMarket } from './catalog.js';

const uuid = z.object({ id: z.string().uuid() });

/** Publicités affichées sur la vitrine : actives, dans leur fenêtre de dates, ciblées sur le pays du visiteur (vide = tous les pays). */
export const adsRoutes = new Hono<Env>()
  .get('/', v('query', z.object({ country: countryCode.optional(), slot: z.enum(['home_top', 'home_inline']).optional() })), async (c) => {
    const q = c.req.valid('query');
    const m = visitorMarket(q.country, c.req.header('x-vercel-ip-country'));
    const rows = await c.get('db')
      .select({ id: ads.id, advertiser: ads.advertiser, title: ads.title, body: ads.body, imageUrl: ads.imageUrl, linkUrl: ads.linkUrl, ctaLabel: ads.ctaLabel, slot: ads.slot })
      .from(ads)
      .where(and(
        eq(ads.active, true),
        sql`(${ads.startsAt} is null or ${ads.startsAt} <= now())`,
        sql`(${ads.endsAt} is null or ${ads.endsAt} >= now())`,
        q.slot ? eq(ads.slot, q.slot) : undefined,
        // pays inconnu : seulement les publicités destinées à tous les pays
        m.market ? sql`(cardinality(${ads.countries}) = 0 or ${m.market} = any(${ads.countries}))` : sql`cardinality(${ads.countries}) = 0`,
      ))
      .orderBy(desc(ads.createdAt)).limit(6);
    return c.json({ ads: rows, market: m.market });
  })
  .post('/:id/view', v('param', uuid), async (c) => {
    await c.get('db').update(ads).set({ views: sql`${ads.views} + 1` }).where(eq(ads.id, c.req.valid('param').id));
    return c.json({ ok: true });
  })
  .post('/:id/click', v('param', uuid), async (c) => {
    await c.get('db').update(ads).set({ clicks: sql`${ads.clicks} + 1` }).where(eq(ads.id, c.req.valid('param').id));
    return c.json({ ok: true });
  });

/** Favoris du client connecté. */
export const favoriteRoutes = new Hono<Env>()
  .use(requireRole('customer', 'owner', 'admin'))
  .get('/', async (c) => {
    const rows = await c.get('db').select(cols).from(favorites)
      .innerJoin(offers, eq(offers.id, favorites.offerId))
      .innerJoin(companies, eq(companies.id, offers.companyId))
      .where(and(eq(favorites.userId, c.get('user')!.id), eq(offers.active, true), eq(companies.status, 'active'), displayRules()))
      .orderBy(desc(favorites.createdAt)).limit(100);
    return c.json({ offers: rows });
  })
  .get('/ids', async (c) => {
    const rows = await c.get('db').select({ id: favorites.offerId }).from(favorites).where(eq(favorites.userId, c.get('user')!.id)).limit(500);
    return c.json({ ids: rows.map((r) => r.id) });
  })
  .put('/:id', v('param', uuid), async (c) => {
    const db = c.get('db');
    const [o] = await db.select({ id: offers.id }).from(offers).where(eq(offers.id, c.req.valid('param').id)).limit(1);
    if (!o) throw notFound('Offre');
    await db.insert(favorites).values({ userId: c.get('user')!.id, offerId: o.id }).onConflictDoNothing();
    return c.json({ ok: true });
  })
  .delete('/:id', v('param', uuid), async (c) => {
    await c.get('db').delete(favorites).where(and(eq(favorites.userId, c.get('user')!.id), eq(favorites.offerId, c.req.valid('param').id)));
    return c.json({ ok: true });
  });

/** Avis : un par réservation, seulement par son auteur et seulement une fois la commande livrée. */
export const reviewRoutes = new Hono<Env>()
  .use(requireRole('customer', 'owner', 'admin'))
  .post('/', v('json', z.object({
    bookingId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(600).default(''),
  })), async (c) => {
    const db = c.get('db');
    const b = c.req.valid('json');
    const [bk] = await db.select({ id: bookings.id, offerId: bookings.offerId, companyId: bookings.companyId, status: bookings.status, fulfillment: bookings.fulfillment })
      .from(bookings).where(and(eq(bookings.id, b.bookingId), eq(bookings.userId, c.get('user')!.id))).limit(1);
    if (!bk) throw notFound('Réservation');
    if (bk.status !== 'confirmed' || bk.fulfillment !== 'completed') throw conflict('not_delivered', "Vous pourrez donner votre avis une fois la commande livrée");
    const [row] = await db.insert(reviews).values({ bookingId: bk.id, offerId: bk.offerId, companyId: bk.companyId, userId: c.get('user')!.id, rating: b.rating, comment: b.comment }).onConflictDoNothing().returning({ id: reviews.id });
    if (!row) throw conflict('already_reviewed', 'Vous avez déjà donné votre avis sur cette commande');
    return c.json({ ok: true }, 201);
  });
