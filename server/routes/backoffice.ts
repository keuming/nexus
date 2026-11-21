import { Hono } from 'hono';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { v } from '../lib/validate.js';
import { ads, bookings, companies, featuredOffers, offers, payments, reviews, users } from '../db/schema.js';
import { conflict, notFound } from '../lib/errors.js';
import { AppError } from '../lib/errors.js';
import { cloudinaryUrl } from '../lib/images.js';
import { config } from '../config.js';
import { notify } from '../lib/notify.js';
import { countryCode } from '../lib/schemas.js';
import { requireRole, type Env } from '../middleware/auth.js';
import type { Db } from '../db/client.js';

const uuid = z.object({ id: z.string().uuid() });
const when = z.string().datetime({ offset: true }).nullable().transform((x) => (x ? new Date(x) : null));
const countries = z.array(countryCode).max(60).transform((a) => [...new Set(a)]);

/** Lignes d'un `db.execute` (node-postgres et PGlite renvoient `{ rows }`). */
async function rows<T>(db: Db, q: ReturnType<typeof sql>): Promise<T[]> {
  const r = (await db.execute(q)) as unknown as { rows?: T[] } | T[];
  return Array.isArray(r) ? r : (r.rows ?? []);
}

/** Valeur d'une vente : prix figé à la réservation × places. */
const VALUE = sql`coalesce(b.unit_price_fcfa, o.price_fcfa) * b.seats`;
/** Ventes = réservations confirmées (hors annulées et « absent »). */
const SALE = sql`b.status = 'confirmed' and b.fulfillment <> 'no_show'`;

const datesOk = (x: { startsAt?: Date | null; endsAt?: Date | null }) => !x.startsAt || !x.endsAt || x.endsAt > x.startsAt;

export const backofficeRoutes = new Hono<Env>()
  .use(requireRole('admin'))

  /** Indicateurs clés. `country` = pays de création des boutiques ; `days` = fenêtre (comparée à la fenêtre précédente). */
  .get('/kpis', v('query', z.object({ country: countryCode.optional(), days: z.coerce.number().int().min(1).max(365).default(30) })), async (c) => {
    const db = c.get('db');
    const { country, days } = c.req.valid('query');
    const cf = country ? sql`and c.country = ${country}` : sql``;
    const win = (from: number, to: number) => sql`b.created_at >= now() - make_interval(days => ${from}) and b.created_at < now() - make_interval(days => ${to})`;
    const period = async (from: number, to: number) => {
      const [s] = await rows<{ bookings: number; gmv: number; cash: number; completed: number; cancelled: number }>(db, sql`
        select count(*) filter (where ${SALE})::int as bookings,
               coalesce(sum(${VALUE}) filter (where ${SALE}), 0)::float8 as gmv,
               coalesce(sum(${VALUE}) filter (where ${SALE} and b.pay_method = 'cash'), 0)::float8 as cash,
               count(*) filter (where ${SALE} and b.fulfillment = 'completed')::int as completed,
               count(*) filter (where b.status = 'cancelled')::int as cancelled
        from bookings b join offers o on o.id = b.offer_id join companies c on c.id = b.company_id
        where ${win(from, to)} ${cf}`);
      const [p] = await rows<{ online: number }>(db, sql`
        select coalesce(sum(p.amount_fcfa), 0)::float8 as online
        from payments p join companies c on c.id = p.company_id
        where p.status = 'paid' and p.paid_at >= now() - make_interval(days => ${from}) and p.paid_at < now() - make_interval(days => ${to}) ${cf}`);
      const [n] = await rows<{ partners: number }>(db, sql`select count(*)::int as partners from companies c where c.created_at >= now() - make_interval(days => ${from}) and c.created_at < now() - make_interval(days => ${to}) ${cf}`);
      const [cu] = await rows<{ customers: number }>(db, sql`select count(*)::int as customers from users u where u.role = 'customer' and u.created_at >= now() - make_interval(days => ${from}) and u.created_at < now() - make_interval(days => ${to})`);
      return { ...s, online: p.online, newPartners: n.partners, newCustomers: cu.customers };
    };
    const [current, previous] = await Promise.all([period(days, -1), period(days * 2, days)]);
    // `to = -1` : jusqu'à demain, pour inclure les réservations de l'instant.
    const [totals] = await rows<Record<string, number>>(db, sql`
      select (select count(*) from users where role = 'customer')::int as customers,
             (select count(*) from companies c where status = 'active' ${cf})::int as partners_active,
             (select count(*) from companies c where status = 'pending' ${cf})::int as partners_pending,
             (select count(*) from companies c where status = 'suspended' ${cf})::int as partners_suspended,
             (select count(*) from offers o join companies c on c.id = o.company_id where o.active ${cf})::int as offers_active,
             (select count(*) from payments p join companies c on c.id = p.company_id where p.status = 'needs_refund' ${cf})::int as needs_refund,
             (select count(*) from companies c where status = 'active' and orz_api_key_enc is null ${cf})::int as partners_without_orz,
             (select coalesce(round(avg(rating)::numeric, 2), 0)::float8 from reviews where status = 'published') as rating_avg,
             (select count(*) from reviews where status = 'published')::int as rating_count,
             (select count(*) from reviews where status = 'hidden')::int as reviews_hidden,
             (select coalesce(sum(views), 0) from ads)::int as ad_views,
             (select coalesce(sum(clicks), 0) from ads)::int as ad_clicks`);
    const series = await rows<{ day: string; bookings: number; gmv: number }>(db, sql`
      select to_char(d::date, 'YYYY-MM-DD') as day, coalesce(x.n, 0)::int as bookings, coalesce(x.gmv, 0)::float8 as gmv
      from generate_series((now() - make_interval(days => ${days - 1}))::date, now()::date, interval '1 day') d
      left join (select b.created_at::date as day, count(*) as n, sum(${VALUE}) as gmv
                 from bookings b join offers o on o.id = b.offer_id join companies c on c.id = b.company_id
                 where ${SALE} and b.created_at >= now() - make_interval(days => ${days}) ${cf} group by 1) x on x.day = d::date
      order by 1`);
    const topPartners = await rows<{ id: string; name: string; country: string; bookings: number; gmv: number }>(db, sql`
      select c.id, c.name, c.country, count(*)::int as bookings, sum(${VALUE})::float8 as gmv
      from bookings b join offers o on o.id = b.offer_id join companies c on c.id = b.company_id
      where ${SALE} and b.created_at >= now() - make_interval(days => ${days}) ${cf}
      group by c.id order by gmv desc limit 5`);
    const topOffers = await rows<{ id: string; title: string; companyName: string; bookings: number; gmv: number }>(db, sql`
      select o.id, o.title, c.name as "companyName", count(*)::int as bookings, sum(${VALUE})::float8 as gmv
      from bookings b join offers o on o.id = b.offer_id join companies c on c.id = b.company_id
      where ${SALE} and b.created_at >= now() - make_interval(days => ${days}) ${cf}
      group by o.id, c.name order by gmv desc limit 5`);
    const byCountry = await rows<{ country: string; shops: number; offers: number; bookings: number; gmv: number }>(db, sql`
      select c.country,
             count(distinct c.id) filter (where c.status = 'active')::int as shops,
             count(distinct o.id) filter (where o.active)::int as offers,
             count(b.id) filter (where ${SALE} and b.created_at >= now() - make_interval(days => ${days}))::int as bookings,
             coalesce(sum(${VALUE}) filter (where ${SALE} and b.created_at >= now() - make_interval(days => ${days})), 0)::float8 as gmv
      from companies c left join offers o on o.company_id = c.id left join bookings b on b.offer_id = o.id
      group by c.country order by gmv desc, shops desc`);
    return c.json({ days, country: country ?? null, current, previous, totals, series, topPartners, topOffers, byCountry });
  })

  /** Boutiques, filtrables par pays de création, statut et recherche, avec leurs chiffres. */
  .get('/partners', v('query', z.object({ country: countryCode.optional(), status: z.enum(['pending', 'active', 'suspended', 'rejected']).optional(), q: z.string().trim().max(80).optional() })), async (c) => {
    const db = c.get('db');
    const { country, status, q } = c.req.valid('query');
    const like = q ? `%${q.replace(/[%_\\]/g, '\\$&')}%` : null;
    const list = await rows<Record<string, unknown>>(db, sql`
      select c.id, c.name, c.logo_url as "logoUrl", c.activity, c.country, c.city, c.status, c.credits, c.created_at as "createdAt",
             u.name as "ownerName", u.email as "ownerEmail", c.phone,
             (c.orz_api_key_enc is not null) as "orzConnected",
             (select count(*) from offers o where o.company_id = c.id and o.active)::int as "offersActive",
             (select count(*) from bookings b where b.company_id = c.id and b.status = 'confirmed')::int as bookings,
             (select coalesce(sum(coalesce(b.unit_price_fcfa, o.price_fcfa) * b.seats), 0) from bookings b join offers o on o.id = b.offer_id where b.company_id = c.id and b.status = 'confirmed' and b.fulfillment <> 'no_show')::float8 as gmv,
             (select coalesce(round(avg(r.rating)::numeric, 1), 0)::float8 from reviews r where r.company_id = c.id and r.status = 'published') as rating
      from companies c join users u on u.id = c.owner_id
      where true ${country ? sql`and c.country = ${country}` : sql``} ${status ? sql`and c.status = ${status}` : sql``}
        ${like ? sql`and (c.name ilike ${like} or c.city ilike ${like} or u.email ilike ${like})` : sql``}
      order by c.created_at desc limit 300`);
    const countriesSummary = await rows<{ country: string; total: number; active: number; pending: number }>(db, sql`
      select country, count(*)::int as total, count(*) filter (where status = 'active')::int as active, count(*) filter (where status = 'pending')::int as pending
      from companies group by country order by total desc`);
    return c.json({ partners: list, countries: countriesSummary });
  })

  /** Paiements par partenaire : l'argent en ligne va directement chez le marchand (compte ORZAYAH) ; on suit encaissé, en attente, à la livraison et remboursements. */
  .get('/partner-payments', v('query', z.object({ country: countryCode.optional() })), async (c) => {
    const db = c.get('db');
    const country = c.req.valid('query').country;
    const list = await rows<Record<string, number | string | boolean | null>>(db, sql`
      select c.id, c.name, c.country, c.status, (c.orz_api_key_enc is not null) as "orzConnected", (c.orz_webhook_secret_enc is not null) as "webhookConfigured",
        coalesce((select sum(p.amount_fcfa) from payments p where p.company_id = c.id and p.status = 'paid' and p.orz_scope = 'merchant'), 0)::float8 as "onlinePaid",
        coalesce((select sum(p.amount_fcfa) from payments p where p.company_id = c.id and p.status = 'pending'), 0)::float8 as "onlinePending",
        coalesce((select sum(coalesce(b.unit_price_fcfa, o.price_fcfa) * b.seats) from bookings b join offers o on o.id = b.offer_id
                  where b.company_id = c.id and b.status = 'confirmed' and b.pay_method = 'cash' and b.cash_collected_at is not null), 0)::float8 as "cashCollected",
        coalesce((select sum(coalesce(b.unit_price_fcfa, o.price_fcfa) * b.seats) from bookings b join offers o on o.id = b.offer_id
                  where b.company_id = c.id and b.status = 'confirmed' and b.pay_method = 'cash' and b.cash_collected_at is null and b.fulfillment <> 'no_show'), 0)::float8 as "cashDue",
        (select count(*) from payments p where p.company_id = c.id and p.status = 'needs_refund')::int as "refundsDue",
        coalesce((select sum(p.amount_fcfa) from payments p where p.company_id = c.id and p.status = 'paid' and p.orz_scope = 'platform' and p.reversed_at is null), 0)::float8 as "legacyToReverse"
      from companies c where c.status in ('active', 'suspended') ${country ? sql`and c.country = ${country}` : sql``}
      order by "onlinePaid" desc, c.name`);
    const sum = (k: string) => list.reduce((a, r) => a + Number(r[k] ?? 0), 0);
    return c.json({
      partners: list,
      totals: { onlinePaid: sum('onlinePaid'), onlinePending: sum('onlinePending'), cashCollected: sum('cashCollected'), cashDue: sum('cashDue'), refundsDue: sum('refundsDue'), legacyToReverse: sum('legacyToReverse'), notConnected: list.filter((r) => !r.orzConnected).length },
    });
  })
  /** Rappel au marchand de relier son compte ORZAYAH (cloche + e-mail). */
  .post('/partners/:id/remind-orzayah', v('param', uuid), async (c) => {
    const db = c.get('db');
    const [co] = await db.select({ id: companies.id, ownerId: companies.ownerId, name: companies.name }).from(companies).where(eq(companies.id, c.req.valid('param').id)).limit(1);
    if (!co) throw notFound('Boutique');
    // Une relance par jour au maximum (le dédoublonnage des notifications se fait sur kind + ref_id).
    const [{ n }] = await rows<{ n: number }>(db, sql`select count(*)::int as n from notifications where user_id = ${co.ownerId} and kind = 'connect_orzayah' and created_at > now() - interval '1 day'`);
    if (n > 0) throw conflict('already_reminded', 'Un rappel a déjà été envoyé dans les dernières 24 h');
    await notify(db, [{ userId: co.ownerId, kind: 'connect_orzayah', title: 'Recevez vos paiements directement', body: 'Reliez votre compte ORZAYAH (Paramètres) : vos clients pourront payer en ligne et l’argent arrivera sur votre compte.', link: '/company' }]);
    return c.json({ ok: true });
  })
  /** Remboursement effectué (hors plateforme) : clôt l'alerte. */
  .post('/payments/:id/refunded', v('param', uuid), async (c) => {
    const [p] = await c.get('db').update(payments).set({ status: 'refunded' }).where(and(eq(payments.id, c.req.valid('param').id), eq(payments.status, 'needs_refund'))).returning({ id: payments.id });
    if (!p) throw conflict('not_pending_refund', 'Aucun remboursement à confirmer sur ce paiement');
    return c.json({ ok: true });
  })

  /** Mise en avant : offres « À la une ». */
  .get('/featured', async (c) => {
    const list = await rows<Record<string, unknown>>(c.get('db'), sql`
      select f.offer_id as "offerId", f.countries, f.starts_at as "startsAt", f.ends_at as "endsAt", f.rank, o.title, o.active, c.name as "companyName", c.country as "companyCountry",
             (o.admin_hidden or c.status <> 'active' or not o.active) as "notVisible",
             ((f.starts_at is null or f.starts_at <= now()) and (f.ends_at is null or f.ends_at >= now())) as "live"
      from featured_offers f join offers o on o.id = f.offer_id join companies c on c.id = o.company_id order by f.rank, f.created_at desc`);
    return c.json({ featured: list });
  })
  /** Recherche d'offres à mettre en avant. */
  .get('/offer-search', v('query', z.object({ q: z.string().trim().min(2).max(80) })), async (c) => {
    const like = `%${c.req.valid('query').q.replace(/[%_\\]/g, '\\$&')}%`;
    const list = await rows<Record<string, unknown>>(c.get('db'), sql`
      select o.id, o.title, o.price_fcfa as "priceFcfa", c.name as "companyName", c.country as "companyCountry", exists (select 1 from featured_offers f where f.offer_id = o.id) as featured
      from offers o join companies c on c.id = o.company_id
      where o.active and c.status = 'active' and (o.title ilike ${like} or c.name ilike ${like}) order by o.created_at desc limit 12`);
    return c.json({ offers: list });
  })
  .put('/featured/:id', v('param', uuid), v('json', z.object({ countries: countries.default([]), startsAt: when.default(null), endsAt: when.default(null), rank: z.number().int().min(0).max(999).default(0) })), async (c) => {
    const db = c.get('db');
    const b = c.req.valid('json');
    const [o] = await db.select({ id: offers.id }).from(offers).where(eq(offers.id, c.req.valid('param').id)).limit(1);
    if (!o) throw notFound('Offre');
    if (b.startsAt && b.endsAt && b.endsAt <= b.startsAt) throw new AppError(400, 'invalid', 'La date de fin doit suivre la date de début');
    await db.insert(featuredOffers).values({ offerId: o.id, ...b }).onConflictDoUpdate({ target: featuredOffers.offerId, set: b });
    return c.json({ ok: true });
  })
  .delete('/featured/:id', v('param', uuid), async (c) => {
    await c.get('db').delete(featuredOffers).where(eq(featuredOffers.offerId, c.req.valid('param').id));
    return c.json({ ok: true });
  })

  /** Publicités (dont gaRAN) : création, planification par pays, pause, statistiques. */
  .get('/ads', async (c) => {
    const list = await c.get('db').select().from(ads).orderBy(desc(ads.createdAt)).limit(200);
    const now = Date.now();
    return c.json({ ads: list.map((a) => ({ ...a, live: a.active && (!a.startsAt || a.startsAt.getTime() <= now) && (!a.endsAt || a.endsAt.getTime() >= now) })) });
  })
  .post('/ads', v('json', adInput().refine(datesOk, { message: 'La date de fin doit suivre la date de début' })), async (c) => {
    const b = c.req.valid('json');
    const [row] = await c.get('db').insert(ads).values({ ...b, imageUrl: b.imageUrl ? cloudinaryUrl(b.imageUrl) : null }).returning();
    return c.json({ ad: row }, 201);
  })
  .patch('/ads/:id', v('param', uuid), v('json', adInput().partial()), async (c) => {
    const b = c.req.valid('json');
    const set = { ...b, ...(b.imageUrl ? { imageUrl: cloudinaryUrl(b.imageUrl) } : {}) };
    if (!Object.keys(set).length) throw new AppError(400, 'invalid', 'Rien à modifier');
    const [row] = await c.get('db').update(ads).set(set).where(eq(ads.id, c.req.valid('param').id)).returning();
    if (!row) throw notFound('Publicité');
    return c.json({ ad: row });
  })
  .delete('/ads/:id', v('param', uuid), async (c) => {
    await c.get('db').delete(ads).where(eq(ads.id, c.req.valid('param').id));
    return c.json({ ok: true });
  })
  .get('/upload-config', (c) => {
    const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_UPLOAD_PRESET: preset } = config();
    return c.json({ cloudinary: cloudName && preset ? { cloudName, preset } : null });
  })

  /** Modération des avis. */
  .get('/reviews', v('query', z.object({ status: z.enum(['published', 'hidden']).optional() })), async (c) => {
    const { status } = c.req.valid('query');
    const list = await c.get('db').select({ id: reviews.id, rating: reviews.rating, comment: reviews.comment, status: reviews.status, createdAt: reviews.createdAt, offerTitle: offers.title, companyName: companies.name, customerName: users.name })
      .from(reviews).innerJoin(offers, eq(offers.id, reviews.offerId)).innerJoin(companies, eq(companies.id, reviews.companyId)).innerJoin(users, eq(users.id, reviews.userId))
      .where(status ? eq(reviews.status, status) : undefined).orderBy(desc(reviews.createdAt)).limit(200);
    return c.json({ reviews: list });
  })
  .post('/reviews/:id/status', v('param', uuid), v('json', z.object({ status: z.enum(['published', 'hidden']) })), async (c) => {
    const [r] = await c.get('db').update(reviews).set({ status: c.req.valid('json').status }).where(eq(reviews.id, c.req.valid('param').id)).returning({ id: reviews.id });
    if (!r) throw notFound('Avis');
    return c.json({ ok: true });
  });

function adInput() {
  const link = z.string().trim().max(500).refine((x) => /^https:\/\/[^\s]+$/.test(x) || /^\/[A-Za-z0-9/_\-?=&%#.]*$/.test(x), 'Lien invalide (https://… ou /chemin)');
  return z.object({
    advertiser: z.string().trim().min(2).max(80),
    title: z.string().trim().min(3).max(90),
    body: z.string().trim().max(240).default(''),
    imageUrl: z.string().trim().max(400).nullable().default(null),
    linkUrl: link,
    ctaLabel: z.string().trim().min(2).max(30).default('Découvrir'),
    slot: z.enum(['home_top', 'home_inline']).default('home_top'),
    countries: countries.default([]),
    active: z.boolean().default(true),
    startsAt: when.default(null),
    endsAt: when.default(null),
  });
}
