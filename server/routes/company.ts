import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { bookings, companies, creditLedger, offerPhotos, offers, payments, users } from '../db/schema.js';
import { AppError, conflict, notFound } from '../lib/errors.js';
import { requireRole, type Env } from '../middleware/auth.js';
import { config } from '../config.js';
import { notifyAdmins } from '../lib/notify.js';
import { cityName, companyInput, countryCode, placeList } from '../lib/schemas.js';
import type { Db } from '../db/client.js';

/** Valide une photo : URL Cloudinary de NOTRE compte (jamais une URL arbitraire) ou JPEG en base64. */
function parsePhoto(p: string): { url: string; data: null } | { data: string; url: null } {
  if (p.startsWith('https://')) {
    const cloud = config().CLOUDINARY_CLOUD_NAME;
    let u: URL | null = null;
    try { u = new URL(p); } catch { /* invalide */ }
    if (!cloud || !u || u.protocol !== 'https:' || u.hostname !== 'res.cloudinary.com' || !u.pathname.startsWith(`/${cloud}/image/upload/`) || p.length > 400 || u.username || u.password)
      throw new AppError(400, 'invalid', 'Photo invalide');
    return { url: u.origin + u.pathname, data: null };
  }
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(p);
  if (!m || !Buffer.from(m[1].slice(0, 8), 'base64').subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) throw new AppError(400, 'invalid', 'Photo invalide (JPEG attendu)');
  return { data: m[1], url: null };
}

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
    await notifyAdmins(db, { kind: 'company_request', refId: co.id, title: `Nouvelle demande partenaire : ${co.name}`, body: co.city, link: '/admin' });
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
  /** Paramètres d'envoi direct des photos (publics par nature : nom du compte et preset non signé). */
  .get('/upload-config', (c) => {
    const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_UPLOAD_PRESET: preset } = config();
    return c.json({ cloudinary: cloudName && preset ? { cloudName, preset } : null });
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
    // Photos : URL Cloudinary (envoi direct du navigateur) ou, sans Cloudinary configuré, data URL JPEG (≈375 Ko max).
    photos: z.array(z.string().max(520_000)).max(4).default([]),
  })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const { photos, ...input } = c.req.valid('json');
    const rows = photos.map((p) => parsePhoto(p));
    const o = await c.get('db').transaction(async (tx) => {
      const [row] = await tx.insert(offers).values({ ...input, companyId: co.id }).returning();
      if (rows.length) await tx.insert(offerPhotos).values(rows.map((r, position) => ({ offerId: row.id, position, ...r })));
      return row;
    });
    return c.json({ offer: { ...o, photoCount: rows.length } }, 201);
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
