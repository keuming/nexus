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

const offerFields = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).default(''),
  country: countryCode,
  city: cityName,
  destCountry: countryCode.nullish(),
  destCity: cityName.nullish(),
  stops: placeList(20),
  priceFcfa: z.number().int().min(0).max(100_000_000),
  capacity: z.number().int().min(1).max(10_000),
  startsAt: z.string().datetime(),
  // Photos : URL Cloudinary (envoi direct du navigateur) ou, sans Cloudinary configuré, data URL JPEG (≈375 Ko max).
  // À la modification : « keep:N » conserve la photo N existante.
  photos: z.array(z.string().max(520_000)).max(4).default([]),
});

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
  .post('/offers', v('json', offerFields.extend({ startsAt: z.string().datetime().transform((x) => new Date(x)).refine((d) => d.getTime() > Date.now(), 'La date doit être dans le futur') })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const { photos, ...input } = c.req.valid('json');
    if (co.activity === 'transport' && (!input.destCountry || !input.destCity)) throw new AppError(400, 'invalid', "Indiquez le pays et la ville d'arrivée");
    if (co.activity !== 'transport') { input.destCountry = null; input.destCity = null; }
    const rows = photos.map((p) => parsePhoto(p));
    const o = await c.get('db').transaction(async (tx) => {
      const [row] = await tx.insert(offers).values({ ...input, companyId: co.id }).returning();
      if (rows.length) await tx.insert(offerPhotos).values(rows.map((r, position) => ({ offerId: row.id, position, ...r })));
      return row;
    });
    return c.json({ offer: { ...o, photoCount: rows.length } }, 201);
  })
  /** Modification d'une offre (champs partiels, y compris `active`) ; les photos sont remplacées par la liste fournie. */
  .patch('/offers/:id', v('param', z.object({ id: z.string().uuid() })), v('json', offerFields.partial().extend({ active: z.boolean().optional() })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const { photos, startsAt, ...rest } = c.req.valid('json');
    const o = await c.get('db').transaction(async (tx) => {
      const [cur] = await tx.select().from(offers).where(and(eq(offers.id, c.req.valid('param').id), eq(offers.companyId, co.id))).for('update');
      if (!cur) throw notFound('Offre');
      const set: Partial<typeof offers.$inferInsert> = { ...rest };
      if (startsAt) {
        const d = new Date(startsAt);
        if (d.getTime() !== cur.startsAt.getTime()) {
          if (d.getTime() <= Date.now()) throw new AppError(400, 'invalid', 'La date doit être dans le futur');
          set.startsAt = d;
        }
      }
      if (rest.capacity !== undefined && rest.capacity < cur.booked) throw conflict('capacity_too_low', `${cur.booked} place(s) déjà réservée(s) : la capacité ne peut pas descendre en dessous`);
      let photoCount: number | undefined;
      if (photos) {
        const old = await tx.select().from(offerPhotos).where(eq(offerPhotos.offerId, cur.id));
        const next = photos.map((p) => {
          const m = /^keep:([0-3])$/.exec(p);
          if (!m) return parsePhoto(p);
          const prev = old.find((r) => r.position === Number(m[1]));
          if (!prev) throw new AppError(400, 'invalid', 'Photo introuvable');
          return prev.url ? { url: prev.url, data: null } : { data: prev.data!, url: null };
        });
        await tx.delete(offerPhotos).where(eq(offerPhotos.offerId, cur.id));
        if (next.length) await tx.insert(offerPhotos).values(next.map((r, position) => ({ offerId: cur.id, position, ...r })));
        photoCount = next.length;
      }
      const [row] = Object.keys(set).length ? await tx.update(offers).set(set).where(eq(offers.id, cur.id)).returning() : [cur];
      return { ...row, photoCount: photoCount ?? (await tx.select({ n: sql<number>`count(*)::int` }).from(offerPhotos).where(eq(offerPhotos.offerId, cur.id)))[0].n };
    });
    return c.json({ offer: o });
  })
  /** Suppression : refusée si des réservations existent (on désactive alors l'offre pour garder l'historique). */
  .delete('/offers/:id', v('param', z.object({ id: z.string().uuid() })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    await c.get('db').transaction(async (tx) => {
      const [cur] = await tx.select({ id: offers.id }).from(offers).where(and(eq(offers.id, c.req.valid('param').id), eq(offers.companyId, co.id))).for('update');
      if (!cur) throw notFound('Offre');
      const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(bookings).where(eq(bookings.offerId, cur.id));
      if (n > 0) throw conflict('has_bookings', 'Des réservations existent pour cette offre : désactivez-la plutôt (elle disparaît du catalogue et l\'historique est conservé)');
      await tx.delete(offers).where(eq(offers.id, cur.id));
    });
    return c.json({ ok: true });
  })
  /** Photo d'une de mes offres (visible même si l'offre est désactivée) : sert à l'écran de modification. */
  .get('/offers/:id/photos/:pos', v('param', z.object({ id: z.string().uuid(), pos: z.coerce.number().int().min(0).max(3) })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const { id, pos } = c.req.valid('param');
    const [row] = await c.get('db').select({ data: offerPhotos.data, url: offerPhotos.url }).from(offerPhotos)
      .innerJoin(offers, eq(offers.id, offerPhotos.offerId))
      .where(and(eq(offerPhotos.offerId, id), eq(offerPhotos.position, pos), eq(offers.companyId, co.id))).limit(1);
    if (!row) throw notFound('Photo');
    if (row.url) return c.redirect(row.url.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_400,c_limit/'), 302);
    return new Response(Buffer.from(row.data!, 'base64'), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=60', 'x-content-type-options': 'nosniff' } });
  })
  .get('/bookings', async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const rows = await c.get('db')
      .select({ id: bookings.id, seats: bookings.seats, stop: bookings.stop, status: bookings.status, createdAt: bookings.createdAt, offerTitle: offers.title, customerName: sql<string>`coalesce(${bookings.contactName}, ${users.name})`, reference: bookings.reference, contactPhone: bookings.contactPhone, guests: bookings.guests, note: bookings.note, paymentStatus: payments.status, amountFcfa: payments.amountFcfa })
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
