import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { bookings, companies, creditLedger, offerPhotos, offers, payments, users } from '../db/schema.js';
import { AppError, conflict, notFound } from '../lib/errors.js';
import { CATEGORIES, ROUTE_ACTIVITIES } from '../../shared/search.js';
import type { Activity } from '../../shared/constants.js';
import { requireRole, type Env } from '../middleware/auth.js';
import { config } from '../config.js';
import { notify, notifyAdmins, sendMail } from '../lib/notify.js';
import { FULFILLMENT, FULFILLMENT_LABEL } from '../../shared/orders.js';
import { cityName, companyInput, countryCode, phoneField, placeList } from '../lib/schemas.js';
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
  category: z.string().trim().max(60).nullish(),
  allowCash: z.boolean().default(true), // paiement à la livraison autorisé
  canShipInternational: z.boolean().default(false), // capacité de livraison à l'international
  scope: z.enum(['national', 'international']).default('national'), // article visible dans son pays seulement, ou partout
  stops: placeList(20),
  priceFcfa: z.number().int().min(0).max(100_000_000),
  capacity: z.number().int().min(1).max(10_000),
  // Photos : URL Cloudinary (envoi direct du navigateur) ou, sans Cloudinary configuré, data URL JPEG (≈375 Ko max).
  // À la modification : « keep:N » conserve la photo N existante.
  photos: z.array(z.string().max(520_000)).max(4).default([]),
});

/** Un article international exige la capacité de livraison internationale ET un marchand déclaré « international » ; un marchand uniquement international ne publie que des articles internationaux. */
function checkScope(co: { scopes: string[] }, scope: string, canShip: boolean) {
  if (scope === 'international') {
    if (!canShip) throw new AppError(400, 'invalid', "Cochez « capacité de livraison à l'international » pour publier un article international");
    if (!co.scopes.includes('international')) throw new AppError(400, 'invalid', "Votre entreprise n'est pas déclarée « international » : modifiez la portée dans Paramètres");
  } else if (!co.scopes.includes('national')) throw new AppError(400, 'invalid', "Votre entreprise n'est déclarée qu'« international » : publiez un article international");
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
  /** Profil : nom, téléphone, e-mail de contact et logo (modifiables à tout moment). */
  .patch('/profile', v('json', z.object({
    name: z.string().trim().min(2).max(120),
    phone: phoneField,
    email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(200)]),
    logoUrl: z.string().max(400).nullable(),
    scopes: companyInput.shape.scopes.optional(),
  })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const b = c.req.valid('json');
    if (b.scopes) {
      // Retirer une portée alors que des articles actifs l'utilisent les rendrait incohérents : on demande de les modifier d'abord.
      for (const sc of ['national', 'international'] as const) {
        if (b.scopes.includes(sc)) continue;
        const [{ n }] = await c.get('db').select({ n: sql<number>`count(*)::int` }).from(offers).where(and(eq(offers.companyId, co.id), eq(offers.scope, sc)));
        if (n > 0) throw conflict('scope_in_use', `${n} article(s) ${sc === 'national' ? 'nationaux' : 'internationaux'} existent : modifiez-les avant de retirer cette portée`);
      }
    }
    let logoUrl: string | null = null;
    if (b.logoUrl) {
      if (!b.logoUrl.startsWith('https://')) throw new AppError(400, 'invalid', 'Logo invalide');
      logoUrl = parsePhoto(b.logoUrl).url;
    }
    const [row] = await c.get('db').update(companies).set({ name: b.name, phone: b.phone, email: b.email, logoUrl, ...(b.scopes ? { scopes: b.scopes } : {}) }).where(eq(companies.id, co.id)).returning();
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
  /** Création : « startsAt » est la date d'ajout (automatique, sans effet sur l'affichage). */
  .post('/offers', v('json', offerFields.extend({ active: z.boolean().default(true) })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const { photos, ...input } = c.req.valid('json');
    const isRoute = (ROUTE_ACTIVITIES as readonly string[]).includes(co.activity);
    if (isRoute && (!input.destCountry || !input.destCity)) throw new AppError(400, 'invalid', "Indiquez le pays et la ville d'arrivée");
    if (!isRoute) { input.destCountry = null; input.destCity = null; }
    const cats = CATEGORIES[co.activity as Activity]?.options;
    if (input.category && !cats?.includes(input.category)) throw new AppError(400, 'invalid', 'Catégorie invalide');
    if (!cats) input.category = null;
    checkScope(co, input.scope, input.canShipInternational);
    const rows = photos.map((p) => parsePhoto(p));
    const o = await c.get('db').transaction(async (tx) => {
      const [row] = await tx.insert(offers).values({ ...input, companyId: co.id, startsAt: new Date() }).returning();
      if (rows.length) await tx.insert(offerPhotos).values(rows.map((r, position) => ({ offerId: row.id, position, ...r })));
      return row;
    });
    return c.json({ offer: { ...o, photoCount: rows.length } }, 201);
  })
  /** Modification d'une offre (champs partiels, y compris `active`) ; les photos sont remplacées par la liste fournie. */
  .patch('/offers/:id', v('param', z.object({ id: z.string().uuid() })), v('json', offerFields.partial().extend({ active: z.boolean().optional() })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const { photos, ...rest } = c.req.valid('json');
    const o = await c.get('db').transaction(async (tx) => {
      const [cur] = await tx.select().from(offers).where(and(eq(offers.id, c.req.valid('param').id), eq(offers.companyId, co.id))).for('update');
      if (!cur) throw notFound('Offre');
      const set: Partial<typeof offers.$inferInsert> = { ...rest };
      if (rest.scope !== undefined || rest.canShipInternational !== undefined) checkScope(co, rest.scope ?? cur.scope, rest.canShipInternational ?? cur.canShipInternational);
      if (rest.capacity !== undefined && rest.capacity < cur.booked) throw conflict('capacity_too_low', `${cur.booked} place(s) déjà réservée(s) : le stock ne peut pas descendre en dessous`);
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
      .select({ id: bookings.id, seats: bookings.seats, stop: bookings.stop, status: bookings.status, createdAt: bookings.createdAt, offerTitle: offers.title, customerName: sql<string>`coalesce(${bookings.contactName}, ${users.name})`, reference: bookings.reference, contactPhone: bookings.contactPhone, guests: bookings.guests, note: bookings.note, paymentStatus: payments.status, amountFcfa: payments.amountFcfa, payMethod: bookings.payMethod, dueFcfa: sql<number>`${offers.priceFcfa} * ${bookings.seats}` , contactEmail: bookings.contactEmail, fulfillment: bookings.fulfillment, merchantNote: bookings.merchantNote, cancelReason: bookings.cancelReason, cancelledBy: bookings.cancelledBy, cashCollectedAt: bookings.cashCollectedAt, updatedAt: bookings.updatedAt, offerId: offers.id })
      .from(bookings)
      .innerJoin(offers, eq(offers.id, bookings.offerId))
      .innerJoin(users, eq(users.id, bookings.userId))
      .leftJoin(payments, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.companyId, co.id))
      .orderBy(desc(bookings.createdAt)).limit(200);
    return c.json({ bookings: rows });
  })
  /** Suivi de commande : fait avancer (ou corrige) l'étape d'une réservation confirmée. Alerte le client aux étapes clés. */
  .post('/bookings/:id/status', v('param', z.object({ id: z.string().uuid() })), v('json', z.object({ fulfillment: z.enum(FULFILLMENT) })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const { fulfillment } = c.req.valid('json');
    const db = c.get('db');
    const [b] = await db.update(bookings).set({ fulfillment, updatedAt: new Date() })
      .where(and(eq(bookings.id, c.req.valid('param').id), eq(bookings.companyId, co.id), eq(bookings.status, 'confirmed'))).returning();
    if (!b) throw conflict('not_confirmed', 'Seules les réservations confirmées peuvent changer d\'étape');
    const [offer] = await db.select({ title: offers.title }).from(offers).where(eq(offers.id, b.offerId)).limit(1);
    const msg = fulfillment === 'accepted' ? { kind: 'booking_accepted', title: `Réservation acceptée : ${offer?.title}`, body: `${co.name} a accepté votre réservation ${b.reference}.` }
      : fulfillment === 'ready' ? { kind: 'booking_ready', title: `Votre commande est prête : ${offer?.title}`, body: `${co.name} : votre commande ${b.reference} est prête. Présentez cette référence.` } : null;
    if (msg) await tellCustomer(db, b, msg);
    return c.json({ ok: true, fulfillment: b.fulfillment, label: FULFILLMENT_LABEL[fulfillment] });
  })
  /** Encaissement d'un paiement à la livraison (ou annulation de la mention en cas d'erreur). */
  .post('/bookings/:id/cash', v('param', z.object({ id: z.string().uuid() })), v('json', z.object({ collected: z.boolean() })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const [b] = await c.get('db').update(bookings).set({ cashCollectedAt: c.req.valid('json').collected ? new Date() : null, updatedAt: new Date() })
      .where(and(eq(bookings.id, c.req.valid('param').id), eq(bookings.companyId, co.id), eq(bookings.status, 'confirmed'), eq(bookings.payMethod, 'cash'))).returning({ id: bookings.id, at: bookings.cashCollectedAt });
    if (!b) throw conflict('not_cash', 'Cette réservation n\'est pas un paiement à la livraison confirmé');
    return c.json({ ok: true, cashCollectedAt: b.at });
  })
  /** Note interne (visible du fournisseur uniquement). */
  .patch('/bookings/:id/note', v('param', z.object({ id: z.string().uuid() })), v('json', z.object({ note: z.string().trim().max(500) })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const [b] = await c.get('db').update(bookings).set({ merchantNote: c.req.valid('json').note, updatedAt: new Date() })
      .where(and(eq(bookings.id, c.req.valid('param').id), eq(bookings.companyId, co.id))).returning({ id: bookings.id });
    if (!b) throw notFound('Réservation');
    return c.json({ ok: true });
  })
  /**
   * Annulation par le fournisseur (motif obligatoire) : libère les places, rend le crédit, prévient le client.
   * Si le client avait payé en ligne, le paiement passe en « remboursement à effectuer » et le back-office est alerté.
   */
  .post('/bookings/:id/cancel', v('param', z.object({ id: z.string().uuid() })), v('json', z.object({ reason: z.string().trim().min(3, 'Indiquez le motif de l\'annulation').max(200) })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const db = c.get('db');
    const { reason } = c.req.valid('json');
    const r = await db.transaction(async (tx) => {
      const [b] = await tx.select().from(bookings).where(and(eq(bookings.id, c.req.valid('param').id), eq(bookings.companyId, co.id), eq(bookings.status, 'confirmed'))).for('update');
      if (!b) throw conflict('not_confirmed', 'Seules les réservations confirmées peuvent être annulées (une réservation en attente de paiement expire d\'elle-même)');
      await tx.update(bookings).set({ status: 'cancelled', cancelReason: reason, cancelledBy: 'merchant', updatedAt: new Date() }).where(eq(bookings.id, b.id));
      await tx.update(offers).set({ booked: sql`${offers.booked} - ${b.seats}` }).where(eq(offers.id, b.offerId));
      await tx.update(companies).set({ credits: sql`${companies.credits} + 1` }).where(eq(companies.id, b.companyId));
      await tx.insert(creditLedger).values({ companyId: b.companyId, delta: 1, reason: 'refund', bookingId: b.id });
      const [pay] = await tx.update(payments).set({ status: 'needs_refund', failureReason: `Annulée par le fournisseur (${reason}) : remboursement du client à effectuer` })
        .where(and(eq(payments.bookingId, b.id), eq(payments.status, 'paid'))).returning({ id: payments.id, amount: payments.amountFcfa });
      const [o] = await tx.select({ title: offers.title }).from(offers).where(eq(offers.id, b.offerId));
      return { b, pay, title: o?.title ?? '' };
    });
    await tellCustomer(db, r.b, { kind: 'booking_cancelled_merchant', title: `Réservation annulée : ${r.title}`, body: `${co.name} a annulé votre réservation ${r.b.reference}. Motif : ${reason}.${r.pay ? ' Vous serez remboursé.' : ''}` });
    if (r.pay) await notifyAdmins(db, { kind: 'needs_refund', refId: r.pay.id, title: 'Remboursement à effectuer', body: `${co.name} a annulé ${r.b.reference} (${new Intl.NumberFormat('fr-FR').format(r.pay.amount)} FCFA déjà payés).`, link: '/admin' });
    return c.json({ ok: true, refundDue: !!r.pay });
  })
  .get('/ledger', async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    return c.json({ ledger: await c.get('db').select().from(creditLedger).where(eq(creditLedger.companyId, co.id)).orderBy(desc(creditLedger.createdAt)).limit(200) });
  });

/** Alerte le client (dans l'application + e-mail de contact de la réservation). Ne lève jamais. */
async function tellCustomer(db: Db, b: { id: string; userId: string; contactEmail: string | null; reference: string }, m: { kind: string; title: string; body: string }) {
  await notify(db, [{ userId: b.userId, kind: m.kind, refId: b.id, title: m.title, body: m.body, link: `/reservation/${b.id}` }]);
  // notify() écrit déjà à l'e-mail du compte : on n'écrit à l'e-mail de la réservation que s'il est différent (invité, autre adresse).
  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, b.userId)).limit(1);
  if (b.contactEmail && b.contactEmail.toLowerCase() !== u?.email.toLowerCase()) await sendMail(b.contactEmail, m.title, `${m.body}\n\nDétail : réservation ${b.reference} sur BackMarket.`).catch(() => undefined);
}
