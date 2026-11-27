import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { and, desc, eq, getTableColumns, isNull, sql } from 'drizzle-orm';
import { bookings, companies, creditLedger, creditPurchases, offerPhotos, offers, payments, users } from '../db/schema.js';
import { AppError, conflict, notFound } from '../lib/errors.js';
import { CATEGORIES, ROUTE_ACTIVITIES } from '../../shared/search.js';
import type { Activity } from '../../shared/constants.js';
import { requireRole, type Env } from '../middleware/auth.js';
import { config } from '../config.js';
import { notify, notifyAdmins, sendMail } from '../lib/notify.js';
import { encryptSecret, safeCompany } from '../lib/secrets.js';
import { OrzayahError } from '../lib/orzayah.js';
import { appUrlOf, purchaseAmount, startPurchase, sweepLocked, syncPurchase } from '../lib/credits.js';
import { CREDIT_PRICE_FCFA, LOCK_MINUTES } from '../../shared/constants.js';
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
  .get('/', async (c) => c.json({ company: safeCompany(await myCompany(c.get('db'), c.get('user')!.id)) }))
  .post('/', v('json', companyInput), async (c) => {
    const db = c.get('db');
    const ownerId = c.get('user')!.id;
    const [dup] = await db.select({ id: companies.id }).from(companies).where(eq(companies.ownerId, ownerId)).limit(1);
    if (dup) throw conflict('company_exists', 'Vous avez déjà une entreprise');
    const [co] = await db.insert(companies).values({ ...c.req.valid('json'), ownerId }).returning();
    await notifyAdmins(db, { kind: 'company_request', refId: co.id, title: `Nouvelle demande partenaire : ${co.name}`, body: co.city, link: '/admin' }, co.country);
    return c.json({ company: safeCompany(co) }, 201);
  })
  /** Correction d'une demande refusée : repasse en attente de validation. */
  .post('/resubmit', v('json', companyInput), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    if (co.status !== 'rejected') throw conflict('invalid_state', "Seule une demande refusée peut être corrigée et renvoyée");
    const [row] = await c.get('db').update(companies).set({ ...c.req.valid('json'), status: 'pending' }).where(eq(companies.id, co.id)).returning();
    return c.json({ company: safeCompany(row) });
  })
  .patch('/', v('json', z.object({ serviceCities: placeList(30) })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const [row] = await c.get('db').update(companies).set({ serviceCities: c.req.valid('json').serviceCities }).where(eq(companies.id, co.id)).returning();
    return c.json({ company: safeCompany(row) });
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
    return c.json({ company: safeCompany(row) });
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
    try { await sweepLocked({ db: c.get('db'), orzFor: c.get('orzFor'), appUrl: appUrlOf(c) }, 5); } catch (e) { console.error('[sweep-locked]', e); }
    const rows = await c.get('db')
      .select({ id: bookings.id, seats: bookings.seats, stop: bookings.stop, status: bookings.status, createdAt: bookings.createdAt, offerTitle: offers.title, customerName: sql<string>`coalesce(${bookings.contactName}, ${users.name})`, reference: bookings.reference, contactPhone: bookings.contactPhone, guests: bookings.guests, note: bookings.note, paymentStatus: payments.status, amountFcfa: payments.amountFcfa, payMethod: bookings.payMethod, dueFcfa: sql<number>`coalesce(${bookings.unitPriceFcfa}, ${offers.priceFcfa}) * ${bookings.seats}` , contactEmail: bookings.contactEmail, fulfillment: bookings.fulfillment, merchantNote: bookings.merchantNote, cancelReason: bookings.cancelReason, cancelledBy: bookings.cancelledBy, cashCollectedAt: bookings.cashCollectedAt, updatedAt: bookings.updatedAt, offerId: offers.id, creditLockUntil: bookings.creditLockUntil })
      .from(bookings)
      .innerJoin(offers, eq(offers.id, bookings.offerId))
      .innerJoin(users, eq(users.id, bookings.userId))
      .leftJoin(payments, eq(payments.bookingId, bookings.id))
      .where(eq(bookings.companyId, co.id))
      .orderBy(desc(bookings.createdAt)).limit(200);
    // Commande verrouillée (boutique sans crédit) : AUCUN détail (ni client, ni article, ni montant) tant que du crédit n'est pas acheté.
    const out = rows.map(({ creditLockUntil, ...r }) => creditLockUntil
      ? { ...r, locked: true, lockUntil: creditLockUntil, offerTitle: '', customerName: '', reference: '', contactPhone: null, contactEmail: null, guests: [] as string[], note: '', stop: null, seats: 0, paymentStatus: null, amountFcfa: null, dueFcfa: 0, merchantNote: '', offerId: '' }
      : { ...r, locked: false, lockUntil: null as Date | null });
    return c.json({ bookings: out });
  })
  /**
   * Crédits : solde, commandes verrouillées (aucun détail), derniers achats, et coordonnées de l'administrateur pays
   * (recours si l'achat en ligne est indisponible).
   */
  .get('/credits', async (c) => {
    const db = c.get('db');
    const co = await myCompany(db, c.get('user')!.id);
    try { await sweepLocked({ db, orzFor: c.get('orzFor'), appUrl: appUrlOf(c) }, 5); } catch (e) { console.error('[sweep-locked]', e); }
    const [fresh] = await db.select({ credits: companies.credits }).from(companies).where(eq(companies.id, co.id)).limit(1);
    const locked = await db.select({ id: bookings.id, createdAt: bookings.createdAt, lockUntil: bookings.creditLockUntil }).from(bookings)
      .where(and(eq(bookings.companyId, co.id), eq(bookings.status, 'pending_payment'), sql`${bookings.creditLockUntil} is not null`)).orderBy(bookings.createdAt);
    const purchases = await db.select({ id: creditPurchases.id, credits: creditPurchases.credits, amountFcfa: creditPurchases.amountFcfa, status: creditPurchases.status, createdAt: creditPurchases.createdAt, payUrl: creditPurchases.payUrl })
      .from(creditPurchases).where(eq(creditPurchases.companyId, co.id)).orderBy(desc(creditPurchases.createdAt)).limit(8);
    const [mgr] = await db.select({ name: users.name, phone: users.phone, orzAccount: users.orzAccount }).from(users)
      .where(and(eq(users.role, 'admin'), eq(users.adminCountry, co.country), sql`${users.disabledAt} is null`)).limit(1);
    return c.json({ credits: fresh?.credits ?? 0, priceFcfa: CREDIT_PRICE_FCFA, lockMinutes: LOCK_MINUTES, onlinePurchase: !!c.get('orz'), locked, purchases, countryManager: mgr ? { name: mgr.name, phone: mgr.phone, orzAccount: mgr.orzAccount } : null });
  })
  /** Achat de crédit en ligne : crée le lien de paiement ORZAYAH (1 crédit = CREDIT_PRICE_FCFA). */
  .post('/credits/purchase', v('json', z.object({ credits: z.number().int().min(1).max(5000) })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    if (co.status !== 'active') throw conflict('not_active', "Votre entreprise doit être validée avant d'acheter du crédit");
    const orz = c.get('orz');
    if (!orz) throw new AppError(503, 'purchase_unavailable', "L'achat de crédit en ligne n'est pas disponible pour le moment : contactez votre administrateur pays");
    const { credits } = c.req.valid('json');
    try {
      const r = await startPurchase({ db: c.get('db'), orzFor: c.get('orzFor'), appUrl: appUrlOf(c) }, orz, co.id, credits);
      return c.json({ id: r.id, payUrl: r.payUrl, amountFcfa: purchaseAmount(credits) }, 201);
    } catch (e) {
      if (e instanceof OrzayahError) throw new AppError(e.status === 400 ? 400 : 503, 'purchase_failed', e.status === 400 ? `Paiement refusé : ${e.message}` : "Le paiement en ligne est momentanément indisponible");
      throw e;
    }
  })
  /** Retour de la page de paiement : relit l'achat chez ORZAYAH et crédite le solde s'il est payé. */
  .post('/credits/purchases/:id/sync', v('param', z.object({ id: z.string().uuid() })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const orz = c.get('orz');
    if (!orz) throw new AppError(503, 'purchase_unavailable', "L'achat de crédit en ligne n'est pas disponible pour le moment");
    const status = await syncPurchase({ db: c.get('db'), orzFor: c.get('orzFor'), appUrl: appUrlOf(c) }, orz, c.req.valid('param').id, co.id);
    return c.json({ status });
  })
  /** Suivi de commande : fait avancer (ou corrige) l'étape d'une réservation confirmée. Alerte le client aux étapes clés. */
  .post('/bookings/:id/status', v('param', z.object({ id: z.string().uuid() })), v('json', z.object({ fulfillment: z.enum(FULFILLMENT) })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const { fulfillment } = c.req.valid('json');
    const db = c.get('db');
    // Livrée = remise faite : pour un paiement à la livraison, l'argent est encaissé à ce moment (la mention peut être retirée ensuite).
    const [b] = await db.update(bookings).set({ fulfillment, updatedAt: new Date(), ...(fulfillment === 'completed' ? { cashCollectedAt: sql`coalesce(${bookings.cashCollectedAt}, case when ${bookings.payMethod} = 'cash' then now() end)` } : {}) })
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
      .where(and(eq(bookings.id, c.req.valid('param').id), eq(bookings.companyId, co.id), isNull(bookings.creditLockUntil))).returning({ id: bookings.id });
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
      if (b.fulfillment === 'completed') throw conflict('delivered', 'Cette commande est déjà livrée : elle ne peut plus être annulée');
      if (b.cashCollectedAt) throw conflict('cash_collected', 'Le paiement a déjà été encaissé : retirez d\'abord la mention « encaissé » avant d\'annuler');
      await tx.update(bookings).set({ status: 'cancelled', cancelReason: reason, cancelledBy: 'merchant', updatedAt: new Date() }).where(eq(bookings.id, b.id));
      await tx.update(offers).set({ booked: sql`${offers.booked} - ${b.seats}` }).where(eq(offers.id, b.offerId));
      await tx.update(companies).set({ credits: sql`${companies.credits} + 1` }).where(eq(companies.id, b.companyId));
      await tx.insert(creditLedger).values({ companyId: b.companyId, delta: 1, reason: 'refund', bookingId: b.id });
      const [pay] = await tx.update(payments).set({ status: 'needs_refund', failureReason: `Annulée par le fournisseur (${reason}) : remboursement du client à effectuer` })
        .where(and(eq(payments.bookingId, b.id), eq(payments.status, 'paid'))).returning({ id: payments.id, amount: payments.amountFcfa, scope: payments.orzScope });
      const [o] = await tx.select({ title: offers.title }).from(offers).where(eq(offers.id, b.offerId));
      return { b, pay, title: o?.title ?? '' };
    });
    await tellCustomer(db, r.b, { kind: 'booking_cancelled_merchant', title: `Réservation annulée : ${r.title}`, body: `${co.name} a annulé votre réservation ${r.b.reference}. Motif : ${reason}.${r.pay ? ' Vous serez remboursé.' : ''}` });
    if (r.pay && r.pay.scope !== 'merchant') await notifyAdmins(db, { kind: 'needs_refund', refId: r.pay.id, title: 'Remboursement à effectuer', body: `${co.name} a annulé ${r.b.reference} (${new Intl.NumberFormat('fr-FR').format(r.pay.amount)} FCFA déjà payés).`, link: '/admin' }, co.country);
    return c.json({ ok: true, refundDue: !!r.pay });
  })
  /**
   * Paiement direct : le marchand relie SON compte ORZAYAH. Les liens de paiement de ses clients sont créés avec sa clé,
   * l'argent arrive donc sur son compte sans passer par BackMarket. Les clés sont chiffrées et ne sont jamais renvoyées.
   */
  .get('/payments-setup', async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const [r] = await c.get('db').select({ key: companies.orzApiKeyEnc, hook: companies.orzWebhookSecretEnc, at: companies.orzConnectedAt }).from(companies).where(eq(companies.id, co.id));
    const base = (config().APP_URL ?? '').replace(/\/$/, '');
    return c.json({ connected: !!r?.key, connectedAt: r?.at ?? null, webhookConfigured: !!r?.hook, webhookUrl: `${base || 'https://www.backmarket-ci.com'}/api/orzayah/webhook/${co.id}` });
  })
  .put('/payments-setup', v('json', z.object({
    apiKey: z.string().trim().min(10, 'Collez la clé API ORZAYAH complète').max(200),
    webhookSecret: z.string().trim().max(200).optional(),
  })), async (c) => {
    const co = await myCompany(c.get('db'), c.get('user')!.id);
    const { apiKey, webhookSecret } = c.req.valid('json');
    if (webhookSecret && !/^whsec_[A-Za-z0-9_-]{8,}$/.test(webhookSecret)) throw new AppError(400, 'invalid', 'Le secret du webhook commence par « whsec_ »');
    const client = c.get('orzMake')(apiKey);
    if (!client) throw new AppError(503, 'payments_unavailable', 'Le paiement en ligne est momentanément indisponible');
    // Contrôle de la clé : un lien inexistant doit répondre « introuvable » (clé valide) ; 401/403 = clé refusée par ORZAYAH.
    try { await client.getPaymentLink('bm-verification'); }
    catch (e) {
      if (e instanceof OrzayahError && (e.status === 401 || e.status === 403)) throw new AppError(400, 'invalid_key', 'Clé API refusée par ORZAYAH : vérifiez-la (elle doit avoir la permission de créer des liens de paiement)');
      throw new AppError(503, 'payments_unavailable', 'ORZAYAH est injoignable pour le moment, réessayez dans un instant');
    }
    await c.get('db').update(companies).set({
      orzApiKeyEnc: encryptSecret(apiKey), orzConnectedAt: new Date(),
      ...(webhookSecret ? { orzWebhookSecretEnc: encryptSecret(webhookSecret) } : {}),
    }).where(eq(companies.id, co.id));
    return c.json({ ok: true });
  })
  /** Déconnexion : impossible tant que des paiements en ligne sont en attente (ils seraient perdus de vue). */
  .delete('/payments-setup', async (c) => {
    const db = c.get('db');
    const co = await myCompany(db, c.get('user')!.id);
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(payments).where(and(eq(payments.companyId, co.id), eq(payments.orzScope, 'merchant'), eq(payments.status, 'pending')));
    if (n > 0) throw conflict('payments_pending', `${n} paiement(s) en ligne sont en cours : attendez qu'ils se terminent avant de déconnecter votre compte`);
    await db.update(companies).set({ orzApiKeyEnc: null, orzWebhookSecretEnc: null, orzConnectedAt: null }).where(eq(companies.id, co.id));
    return c.json({ ok: true });
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
