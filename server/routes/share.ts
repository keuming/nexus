import { Hono } from 'hono';
import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { companies, offers } from '../db/schema.js';
import { config } from '../config.js';
import { SITE } from '../../shared/site.js';

const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

interface Card { title: string; description: string; url: string; image: string }

/** Page minimale lue par les robots d'aperçu (WhatsApp, Facebook, LinkedIn, X, Telegram…) : ils n'exécutent pas le JavaScript du site. */
function html(c: Card) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(c.title)}</title>
<meta name="description" content="${esc(c.description)}">
<link rel="canonical" href="${esc(c.url)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(SITE.name)}"><meta property="og:locale" content="fr_FR"><meta property="og:locale:alternate" content="en_US">
<meta property="og:title" content="${esc(c.title)}"><meta property="og:description" content="${esc(c.description)}">
<meta property="og:url" content="${esc(c.url)}"><meta property="og:image" content="${esc(c.image)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(c.title)}">
<meta name="twitter:description" content="${esc(c.description)}"><meta name="twitter:image" content="${esc(c.image)}">
</head><body><h1>${esc(c.title)}</h1><p>${esc(c.description)}</p><p><a href="${esc(c.url)}">Ouvrir sur ${esc(SITE.name)}</a></p></body></html>`;
}

/** Adresse publique du site : APP_URL si défini, sinon celle de la requête. */
export function siteUrl(req: Request): string {
  const u = new URL(req.url);
  const proto = (req.headers.get('x-forwarded-proto') ?? u.protocol.replace(':', '')).split(',')[0];
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? u.host;
  return (config().APP_URL ?? `${proto}://${host}`).replace(/\/$/, '');
}

const fcfa = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ')} FCFA`;

/** Aperçu de partage d'une offre (`/offre/:id`), servi uniquement aux robots via la règle de vercel.json. Le site lui-même est décrit dans index.html. */
export const shareRoutes = (getDb: () => Db) => new Hono()
  /** Aperçu de partage d'une boutique (`/boutique/:id`) : nom, ville et logo du marchand. */
  .get('/boutique/:id', async (c) => {
    const base = siteUrl(c.req.raw);
    const id = c.req.param('id');
    const site = { title: SITE.shareTitle, description: SITE.shareDescription, url: `${base}/`, image: `${base}/og.jpg` };
    if (!/^[0-9a-f-]{36}$/i.test(id)) return c.html(html(site));
    const [co] = await getDb().select({ name: companies.name, logoUrl: companies.logoUrl, city: companies.city, activity: companies.activity })
      .from(companies).where(and(eq(companies.id, id), eq(companies.status, 'active'))).limit(1);
    if (!co) return c.html(html(site));
    const image = co.logoUrl?.includes('/image/upload/') ? co.logoUrl.replace('/image/upload/', '/image/upload/f_jpg,q_auto,w_1200,h_630,c_pad,b_white/') : `${base}/og.jpg`;
    return c.html(html({
      title: cut(`${co.name} : commandez et réservez en ligne`, 90),
      description: cut(`${co.name}, ${co.city}. Découvrez tous nos articles et réservez en 1 clic sur ${SITE.name} : paiement à la livraison ou en ligne.`, 200),
      url: `${base}/boutique/${id}`, image,
    }), 200, { 'cache-control': 'public, s-maxage=300' });
  })
  .get('/offre/:id', async (c) => {
    const base = siteUrl(c.req.raw);
    const id = c.req.param('id');
    const fallback = html({ title: SITE.shareTitle, description: SITE.shareDescription, url: `${base}/`, image: `${base}/og.jpg` });
    if (!/^[0-9a-f-]{36}$/i.test(id)) return c.html(fallback);
    const [o] = await getDb().select({
      title: offers.title, description: offers.description, price: offers.priceFcfa, city: offers.city, destCity: offers.destCity,
      company: companies.name, remaining: sql<number>`${offers.capacity} - ${offers.booked}`,
      photoUrl: sql<string | null>`(select p.url from offer_photos p where p.offer_id = ${offers.id} and p.position = 0)`,
      hasPhoto: sql<boolean>`exists (select 1 from offer_photos p where p.offer_id = ${offers.id} and p.position = 0)`,
    }).from(offers).innerJoin(companies, eq(companies.id, offers.companyId))
      .where(and(eq(offers.id, id), eq(offers.active, true), eq(companies.status, 'active'), eq(offers.adminHidden, false))).limit(1);
    if (!o) return c.html(fallback);
    const place = o.destCity ? `${o.city} → ${o.destCity}` : o.city;
    const price = o.price > 0 ? fcfa(o.price) : 'Gratuit';
    const image = o.photoUrl ? o.photoUrl.replace('/image/upload/', '/image/upload/f_jpg,q_auto,w_1200,h_630,c_fill/')
      : o.hasPhoto ? `${base}/api/offers/${id}/photos/0` : `${base}/og.jpg`;
    return c.html(html({
      title: cut(`${o.title} · ${price} · ${place}`, 90),
      description: cut(`${o.company} sur ${SITE.name}. ${o.description ? `${o.description} ` : ''}Réservez en ligne en 1 clic.`, 200),
      url: `${base}/offre/${id}`, image,
    }), 200, { 'cache-control': 'public, s-maxage=300' });
  });
