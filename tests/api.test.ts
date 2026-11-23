import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { shareRoutes } from '../server/routes/share.js';
import { resetConfig } from '../server/config.js';
import { eq } from 'drizzle-orm';
import { Client, FakeOrz, makeApp } from './helpers.js';
import { bookings, companies, offers, payments, users } from '../server/db/schema.js';
import { hashPassword } from '../server/lib/auth.js';
import { OrzayahError } from '../server/lib/orzayah.js';

const geo = { address: 'Cocody, Rue des Jardins', latitude: 5.3599, longitude: -3.9899 };
let ctx: Awaited<ReturnType<typeof makeApp>>;
/** Informations obligatoires d'une réservation (contact, passager, conditions acceptées). */
const BK = { contact: { name: 'Kouamé Client', phone: '+225 07 00 00 00 00', email: 'client@x.test' }, guests: ['Passager Test'], acceptTerms: true as const };
const future = () => new Date(Date.now() + 86400_000).toISOString();

beforeEach(async () => { ctx = await makeApp(); });

async function register(role: 'customer' | 'owner', email: string) {
  const c = new Client(ctx.app);
  const r = await c.post('/auth/register', { email, password: 'password123', name: 'Test User', role });
  expect(r.status).toBe(201);
  return c;
}
async function admin() {
  await ctx.db.insert(users).values({ email: 'admin@backmarket.test', name: 'Admin', role: 'admin', passwordHash: await hashPassword('adminpass123') });
  const c = new Client(ctx.app);
  expect((await c.post('/auth/login', { email: 'admin@backmarket.test', password: 'adminpass123' })).status).toBe(200);
  return c;
}
/** Entreprise active avec `credits` crédits et une offre de `capacity` places. */
async function setup(credits: number, capacity: number, priceFcfa = 0) {
  const owner = await register('owner', 'owner@x.test');
  const co = (await owner.post('/company', { name: 'Bus Abidjan', activity: 'transport', country: 'CI', city: 'Abidjan', serviceCities: ['Bouaké'], phone: '+225 07 00 00 00 00', ...geo })).json.company;
  const adm = await admin();
  await adm.post(`/admin/companies/${co.id}/review`, { decision: 'approve' });
  if (credits) await adm.post(`/admin/companies/${co.id}/credits`, { credits });
  await owner.put('/company/payments-setup', { apiKey: 'test-key-0123456789' }); // relie le compte ORZAYAH (sans effet si ORZAYAH n'est pas simulé)
  const offer = (await owner.post('/company/offers', { title: 'Abidjan → Bouaké', country: 'CI', city: 'Abidjan', destCountry: 'CI', destCity: 'Bouaké', stops: [], priceFcfa, capacity, startsAt: future() })).json.offer;
  return { owner, adm, co, offer };
}

describe('auth', () => {
  it('inscrit, lit la session, déconnecte', async () => {
    const c = await register('customer', 'a@x.test');
    expect((await c.get('/auth/me')).json.user.email).toBe('a@x.test');
    await c.post('/auth/logout');
    expect((await c.get('/auth/me')).status).toBe(401);
  });
  it('refuse un email dupliqué (insensible à la casse) et un mauvais mot de passe', async () => {
    await register('customer', 'a@x.test');
    const c = new Client(ctx.app);
    expect((await c.post('/auth/register', { email: 'A@X.test', password: 'password123', name: 'Bob' })).status).toBe(409);
    expect((await c.post('/auth/login', { email: 'a@x.test', password: 'wrong-password' })).status).toBe(401);
    expect((await c.post('/auth/login', { email: 'nobody@x.test', password: 'wrong-password' })).status).toBe(401);
  });
  it("ne permet pas de s'inscrire admin", async () => {
    const c = new Client(ctx.app);
    expect((await c.post('/auth/register', { email: 'e@x.test', password: 'password123', name: 'Eve', role: 'admin' })).status).toBe(400);
  });
  it('valide les entrées', async () => {
    const c = new Client(ctx.app);
    expect((await c.post('/auth/register', { email: 'bad', password: '1', name: 'x' })).status).toBe(400);
  });
});

describe('autorisations', () => {
  it('protège les routes par rôle', async () => {
    const anon = new Client(ctx.app);
    expect((await anon.get('/bookings/mine')).status).toBe(401);
    const cust = await register('customer', 'c@x.test');
    expect((await cust.get('/company')).status).toBe(403);
    expect((await cust.get('/admin/stats')).status).toBe(403);
  });
  it('rejette une écriture cross-origin', async () => {
    const res = await ctx.app.request('http://localhost/api/auth/login', {
      method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.test' }, body: '{}',
    });
    expect(res.status).toBe(403);
    const cross = await ctx.app.request('http://localhost/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'cross-site' }, body: '{}' });
    expect(cross.status).toBe(403);
    const same = await ctx.app.request('http://localhost/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: '{"email":"a@b.co","password":"x"}' });
    expect(same.status).toBe(401); // passe le contrôle CSRF, échoue sur les identifiants
  });
});

describe('réservations', () => {
  it('flux complet : validation admin → catalogue → réservation → crédit débité → annulation remboursée', async () => {
    const owner = await register('owner', 'o@x.test');
    const co = (await owner.post('/company', { name: 'Resto', activity: 'restauration', country: 'CI', city: 'Abidjan', phone: '+225 07 00 00 00 00', ...geo })).json.company;
    expect(co.status).toBe('pending');
    await owner.post('/company/offers', { destCountry: 'CI', destCity: 'Bouaké', title: 'Dîner', country: 'CI', city: 'Abidjan', priceFcfa: 0, capacity: 5, startsAt: future() });
    const anon = new Client(ctx.app);
    expect((await anon.get('/offers')).json.offers).toHaveLength(0); // entreprise non validée

    const adm = await admin();
    await adm.post(`/admin/companies/${co.id}/review`, { decision: 'approve' });
    const top = await adm.post(`/admin/companies/${co.id}/credits`, { credits: 10 });
    expect(top.json.amountFcfa).toBe(1250);

    const offerId = (await anon.get('/offers?activity=restauration')).json.offers[0].id;
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, guests: Array(2).fill('Passager Test'), offerId, seats: 2 });
    expect(r.status).toBe(201);

    const [after] = await ctx.db.select().from(companies).where(eq(companies.id, co.id));
    expect(after.credits).toBe(9);
    expect((await anon.get(`/offers/${offerId}`)).json.offer.remaining).toBe(3);
    expect((await owner.get('/company/ledger')).json.ledger.map((l: any) => l.delta).sort()).toEqual([-1, 10]);

    expect((await cust.post(`/bookings/${r.json.booking.id}/cancel`)).status).toBe(200);
    expect((await cust.post(`/bookings/${r.json.booking.id}/cancel`)).status).toBe(404); // idempotence
    const [refunded] = await ctx.db.select().from(companies).where(eq(companies.id, co.id));
    expect(refunded.credits).toBe(10);
    expect((await anon.get(`/offers/${offerId}`)).json.offer.remaining).toBe(5);
  });

  it('ne survend jamais, même en concurrence', async () => {
    const { offer } = await setup(10, 1);
    const [a, b] = [await register('customer', 'a@x.test'), await register('customer', 'b@x.test')];
    const rs = await Promise.all([a.post('/bookings', { ...BK, offerId: offer.id }), b.post('/bookings', { ...BK, offerId: offer.id })]);
    expect(rs.map((r) => r.status).sort()).toEqual([201, 409]);
    const [o] = await ctx.db.select().from(offers).where(eq(offers.id, offer.id));
    expect(o.booked).toBe(1);
  });

  it('annule tout (rollback) si l\'entreprise n\'a plus de crédits', async () => {
    const { offer, co } = await setup(0, 5);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id });
    expect(r.status).toBe(409);
    const [o] = await ctx.db.select().from(offers).where(eq(offers.id, offer.id));
    expect(o.booked).toBe(0); // la place n'a pas été consommée
    const [c] = await ctx.db.select().from(companies).where(eq(companies.id, co.id));
    expect(c.credits).toBe(0);
  });

  it('refuse une offre inexistante ou une entreprise suspendue', async () => {
    const { offer, adm, co } = await setup(5, 5);
    const cust = await register('customer', 'c@x.test');
    expect((await cust.post('/bookings', { ...BK, offerId: '00000000-0000-4000-8000-000000000000' })).status).toBe(404);
    await adm.post(`/admin/companies/${co.id}/status`, { status: 'suspended' });
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id })).status).toBe(409);
  });

  it("isole les données : un propriétaire ne voit que ses réservations", async () => {
    const { owner, offer } = await setup(5, 5);
    const cust = await register('customer', 'c@x.test');
    await cust.post('/bookings', { ...BK, offerId: offer.id });
    expect((await owner.get('/company/bookings')).json.bookings).toHaveLength(1);
    const other = await register('owner', 'o2@x.test');
    await other.post('/company', { name: 'Autre', activity: 'hotel', country: 'SN', city: 'Dakar', phone: '+225 07 00 00 00 00', ...geo });
    expect((await other.get('/company/bookings')).json.bookings).toHaveLength(0);
    expect((await other.patch(`/company/offers/${offer.id}`, { active: false })).status).toBe(404);
  });
});

describe('santé', () => {
  it('health/db confirme la connexion', async () => {
    const r = await new Client(ctx.app).get('/health/db');
    expect(r.status).toBe(200);
  });
});

describe('pays, villes et arrêts', () => {
  async function transportOffer() {
    const owner = await register('owner', 'o@x.test');
    const co = (await owner.post('/company', { name: 'Express', activity: 'transport', country: 'CI', city: 'Abidjan', serviceCities: ['Bouaké', 'bouaké', 'Korhogo'], phone: '+225 07 00 00 00 00', ...geo })).json.company;
    expect(co.serviceCities).toEqual(['Bouaké', 'Korhogo']); // dédoublonnage insensible à la casse
    const adm = await admin();
    await adm.post(`/admin/companies/${co.id}/review`, { decision: 'approve' });
    await adm.post(`/admin/companies/${co.id}/credits`, { credits: 5 });
    const offer = (await owner.post('/company/offers', {
      title: 'Abidjan → Ouagadougou', country: 'BF', city: 'Abidjan', destCountry: 'BF', destCity: 'Ouagadougou', stops: ['Gare de Ouaga Nord', 'Bobo-Dioulasso'], priceFcfa: 0, capacity: 30, startsAt: future(),
    })).json.offer;
    return { owner, offer };
  }

  it('filtre le catalogue par pays et par ville ou arrêt', async () => {
    await transportOffer();
    const anon = new Client(ctx.app);
    // « country » = pays de navigation du visiteur : on voit les offres des marchands de ce pays (le marchand de test est en CI).
    expect((await anon.get('/offers?country=CI')).json.offers).toHaveLength(1);
    expect((await anon.get('/offers?country=BF')).json.offers).toHaveLength(0);
    expect((await anon.get('/offers?country=CI&city=bobo-dioulasso')).json.offers).toHaveLength(1);
    expect((await anon.get('/offers?city=bobo')).json.offers).toHaveLength(1); // recherche partielle
    expect((await anon.get('/offers?city=%25')).json.offers).toHaveLength(0); // « % » est littéral
    expect((await anon.get('/offers?city=Abidjan')).json.offers).toHaveLength(1);
    expect((await anon.get('/offers?city=Dakar')).json.offers).toHaveLength(0);
    expect((await anon.get('/offers?country=XX')).status).toBe(400);
  });

  it("exige un arrêt valide quand l'offre en propose", async () => {
    const { offer } = await transportOffer();
    const cust = await register('customer', 'c@x.test');
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id })).status).toBe(400);
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id, stop: 'Ailleurs' })).status).toBe(400);
    const ok = await cust.post('/bookings', { ...BK, offerId: offer.id, stop: 'bobo-dioulasso' });
    expect(ok.status).toBe(201);
    expect(ok.json.booking.stop).toBe('Bobo-Dioulasso');
    expect((await cust.get('/bookings/mine')).json.bookings[0].stop).toBe('Bobo-Dioulasso');
  });

  it('refuse un pays inconnu à la création', async () => {
    const owner = await register('owner', 'o@x.test');
    expect((await owner.post('/company', { name: 'X', activity: 'hotel', country: 'ZZ', city: 'Nulle part', phone: '+225 07 00 00 00 00', ...geo })).status).toBe(400);
  });
});

describe('validation des demandes fournisseur', () => {
  const body = { name: 'Trans Sahel', activity: 'transport', country: 'ML', city: 'Bamako', phone: '+223 70 00 00 00', rccm: 'ML-BKO-2026-B-1234', ...geo };

  it('exige un téléphone valide', async () => {
    const owner = await register('owner', 'o@x.test');
    expect((await owner.post('/company', { ...body, phone: 'abc' })).status).toBe(400);
    expect((await owner.post('/company', { ...body, phone: undefined })).status).toBe(400);
  });

  it('approuve une demande en attente et enregistre la décision', async () => {
    const owner = await register('owner', 'o@x.test');
    const co = (await owner.post('/company', body)).json.company;
    const adm = await admin();
    const list = (await adm.get('/admin/companies?status=pending')).json.companies;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ phone: '+223 70 00 00 00', rccm: 'ML-BKO-2026-B-1234', ownerEmail: 'o@x.test' });
    expect((await adm.get('/admin/stats')).json.pending).toBe(1);
    const r = await adm.post(`/admin/companies/${co.id}/review`, { decision: 'approve', note: 'Dossier conforme' });
    expect(r.json.company).toMatchObject({ status: 'active', reviewNote: 'Dossier conforme' });
    expect(r.json.company.reviewedAt).toBeTruthy();
    expect((await adm.get('/admin/stats')).json.pending).toBe(0);
    expect((await adm.post(`/admin/companies/${co.id}/review`, { decision: 'reject', note: 'trop tard maintenant' })).status).toBe(409);
  });

  it('exige un motif de refus, que le fournisseur voit puis peut corriger et renvoyer', async () => {
    const owner = await register('owner', 'o@x.test');
    const co = (await owner.post('/company', body)).json.company;
    const adm = await admin();
    expect((await adm.post(`/admin/companies/${co.id}/review`, { decision: 'reject' })).status).toBe(400);
    expect((await adm.post(`/admin/companies/${co.id}/review`, { decision: 'reject', note: 'RCCM illisible' })).status).toBe(200);
    const mine = (await owner.get('/company')).json.company;
    expect(mine).toMatchObject({ status: 'rejected', reviewNote: 'RCCM illisible' });

    expect((await owner.post('/company/resubmit', { ...body, rccm: 'ML-BKO-2026-B-9999' })).json.company).toMatchObject({ status: 'pending', rccm: 'ML-BKO-2026-B-9999' });
    expect((await owner.post('/company/resubmit', body)).status).toBe(409); // plus refusée
    expect((await adm.post(`/admin/companies/${co.id}/review`, { decision: 'approve' })).json.company.status).toBe('active');
  });

  it('suspension impossible tant que la demande n\'est pas validée ; réservé aux admins', async () => {
    const owner = await register('owner', 'o@x.test');
    const co = (await owner.post('/company', body)).json.company;
    const adm = await admin();
    expect((await adm.post(`/admin/companies/${co.id}/status`, { status: 'active' })).status).toBe(409); // pas de contournement
    expect((await owner.post(`/admin/companies/${co.id}/review`, { decision: 'approve' })).status).toBe(403);
    expect((await adm.post('/admin/companies/00000000-0000-4000-8000-000000000000/review', { decision: 'approve' })).status).toBe(404);
  });
});

describe('souscription entreprise', () => {
  const company = { name: 'Trans Sahel', activity: 'transport', country: 'ML', city: 'Bamako', address: 'Hamdallaye ACI 2000', latitude: 12.6392, longitude: -8.0029, phone: '+223 70 00 00 00', email: 'contact@transsahel.test', rccm: 'ML-BKO-2026-B-1234', serviceCities: ['Sikasso'] };
  const manager = { name: 'Awa Traoré', title: 'Gérante', phone: '+223 66 00 00 00', email: 'awa@transsahel.test', password: 'password123' };

  it('crée le gérant et la demande en une fois, et connecte le gérant', async () => {
    const c = new Client(ctx.app);
    const r = await c.post('/auth/register-company', { manager, company });
    expect(r.status).toBe(201);
    expect(r.json.user.role).toBe('owner');
    const mine = (await c.get('/company')).json.company;
    expect(mine).toMatchObject({ name: 'Trans Sahel', status: 'pending', managerTitle: 'Gérante', latitude: 12.6392, longitude: -8.0029, address: 'Hamdallaye ACI 2000' });

    const adm = await admin();
    const row = (await adm.get('/admin/companies?status=pending')).json.companies[0];
    expect(row).toMatchObject({ ownerName: 'Awa Traoré', ownerPhone: '+223 66 00 00 00', managerTitle: 'Gérante', companyEmail: 'contact@transsahel.test', latitude: 12.6392 });
  });

  it('ne crée rien si l\'e-mail du gérant existe déjà (transaction)', async () => {
    await register('customer', 'awa@transsahel.test');
    const r = await new Client(ctx.app).post('/auth/register-company', { manager, company });
    expect(r.status).toBe(409);
    expect((await ctx.db.select().from(companies)).length).toBe(0);
  });

  it('refuse des coordonnées invalides, un type de service inconnu ou un gérant incomplet', async () => {
    const c = new Client(ctx.app);
    expect((await c.post('/auth/register-company', { manager, company: { ...company, latitude: 120 } })).status).toBe(400);
    expect((await c.post('/auth/register-company', { manager, company: { ...company, longitude: undefined } })).status).toBe(400);
    expect((await c.post('/auth/register-company', { manager, company: { ...company, activity: 'banque' } })).status).toBe(400);
    expect((await c.post('/auth/register-company', { manager: { ...manager, title: '' }, company })).status).toBe(400);
    expect((await c.post('/auth/register-company', { manager: { ...manager, phone: 'abc' }, company })).status).toBe(400);
  });
});

describe('paiement ORZAYAH', () => {
  let orz: FakeOrz;
  beforeEach(async () => { orz = new FakeOrz(); ctx = await makeApp(orz); });
  const state = async (offerId: string, coId: string) => {
    const [o] = await ctx.db.select().from(offers).where(eq(offers.id, offerId));
    const [c] = await ctx.db.select().from(companies).where(eq(companies.id, coId));
    return { booked: o.booked, credits: c.credits };
  };
  const key = (paymentId: string) => `bm-${paymentId}`;
  /** Suivi client en contournant l'espacement de 3 s entre deux relectures ORZAYAH. */
  const poll = async (c: Client, pid: string) => { await ctx.db.update(payments).set({ lastCheckedAt: null }).where(eq(payments.id, pid)); return c.get(`/payments/${pid}`); };

  it('refuse un mode de paiement inconnu et ne crée aucun lien', async () => {
    const { offer } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id, payMode: 'paypal' })).status).toBe(400);
    expect(orz.links).toHaveLength(0);
  });

  it("refuse le paiement en ligne sans bloquer de places quand le marchand n'a pas relié son compte ORZAYAH", async () => {
    ctx = await makeApp(null);
    const { offer, co } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id });
    expect(r.status).toBe(400);
    expect(r.json.error.code).toBe('online_not_available');
    expect(await state(offer.id, co.id)).toEqual({ booked: 0, credits: 5 });
  });

  it('paiement réussi : bloque, puis confirme à SUCCESS (idempotent)', async () => {
    const { offer, co, owner, adm } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, guests: Array(2).fill('Passager Test'), offerId: offer.id, seats: 2 });
    expect(r.status).toBe(201);
    expect(r.json.booking.status).toBe('pending_payment');
    expect(r.json.payment.status).toBe('pending');
    expect(r.json.payment.payUrl).toMatch(/^https:\/\/pay\.orzayah\.test\/p\//);
    expect(orz.links[0]).toMatchObject({ amountCentimes: 5000 * 2 * 100, externalReference: r.json.booking.reference, returnUrl: `http://localhost/reservation/${r.json.booking.id}` });
    expect(orz.links[0].description.length).toBeGreaterThanOrEqual(3);
    expect(await state(offer.id, co.id)).toEqual({ booked: 2, credits: 4 });

    const pid = r.json.payment.id;
    orz.set(key(pid), 'SUCCESS');
    const s1 = await poll(cust, pid);
    expect(s1.json.payment.status).toBe('paid');
    await ctx.db.update(payments).set({ lastCheckedAt: null });
    expect((await poll(cust, pid)).json.payment.status).toBe('paid');
    expect((await cust.get('/bookings/mine')).json.bookings[0]).toMatchObject({ status: 'confirmed', paymentStatus: 'paid' });
    expect(await state(offer.id, co.id)).toEqual({ booked: 2, credits: 4 }); // rien n'a bougé au 2e passage
    expect((await owner.get('/company/bookings')).json.bookings[0].paymentStatus).toBe('paid');
    // Paiement direct : l'argent est allé sur le compte ORZAYAH du marchand, BackMarket n'a rien à reverser.
    expect((await adm.get('/admin/payouts')).json.payouts).toHaveLength(0);
    expect((await adm.post(`/admin/companies/${co.id}/payouts`)).json).toMatchObject({ count: 0, totalFcfa: 0 });
    expect((await adm.get('/admin/payouts')).json.payouts).toHaveLength(0);
  });

  it('paiement échoué : libère les places et rend le crédit', async () => {
    const { offer, co } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id });
    orz.set(key(r.json.payment.id), 'FAILED', 'Solde insuffisant');
    const s = await poll(cust, r.json.payment.id);
    expect(s.json.payment).toMatchObject({ status: 'failed', failureReason: 'Solde insuffisant' });
    expect(await state(offer.id, co.id)).toEqual({ booked: 0, credits: 5 });
    expect((await cust.get('/bookings/mine')).json.bookings[0].status).toBe('cancelled');
  });

  it('refus définitif à la création (400) : réservation annulée', async () => {
    const { offer, co } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    orz.failNext = new OrzayahError(400, 'Numéro invalide', true);
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id });
    expect(r.status).toBe(400);
    expect(await state(offer.id, co.id)).toEqual({ booked: 0, credits: 5 });
  });

  it('erreur réseau à la création : reste en attente, puis rejoue avec la MÊME clé', async () => {
    const { offer } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    orz.lostNext = true;
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id });
    expect(r.status).toBe(201);
    expect(r.json.payment.status).toBe('pending');
    expect(orz.ops.size).toBe(0);
    expect(r.json.payment.payUrl).toBeNull();
    const s = await poll(cust, r.json.payment.id);
    expect(s.json.payment.status).toBe('pending');
    expect(s.json.payment.payUrl).toMatch(/^https:\/\//);
    expect(orz.links).toHaveLength(2);
    expect(orz.links[1].idempotencyKey).toBe(orz.links[0].idempotencyKey);
    expect(orz.ops.size).toBe(1);
  });

  it('délai dépassé : expire et libère ; un paiement tardif réactive la réservation', async () => {
    const { offer, co } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id });
    const pid = r.json.payment.id;
    await ctx.db.update(payments).set({ expiresAt: new Date(Date.now() - 1000), lastCheckedAt: null });
    expect((await poll(cust, pid)).json.payment.status).toBe('expired');
    expect(await state(offer.id, co.id)).toEqual({ booked: 0, credits: 5 });
    orz.set(key(pid), 'SUCCESS');
    await ctx.db.update(payments).set({ lastCheckedAt: null });
    expect((await poll(cust, pid)).json.payment.status).toBe('paid');
    expect(await state(offer.id, co.id)).toEqual({ booked: 1, credits: 4 });
    expect((await cust.get('/bookings/mine')).json.bookings[0].status).toBe('confirmed');
  });

  it('paiement tardif sans place disponible : remboursement à faire', async () => {
    const { offer, adm } = await setup(5, 1, 5000);
    const a = await register('customer', 'a@x.test');
    const b = await register('customer', 'b@x.test');
    const ra = await a.post('/bookings', { ...BK, offerId: offer.id });
    await ctx.db.update(payments).set({ expiresAt: new Date(Date.now() - 1000), lastCheckedAt: null });
    await poll(a, ra.json.payment.id); // expire, libère la place
    expect((await b.post('/bookings', { ...BK, offerId: offer.id })).status).toBe(201); // la place est reprise
    orz.set(key(ra.json.payment.id), 'SUCCESS');
    await ctx.db.update(payments).set({ lastCheckedAt: null }).where(eq(payments.id, ra.json.payment.id));
    expect((await poll(a, ra.json.payment.id)).json.payment.status).toBe('needs_refund');
    expect((await adm.get('/admin/stats')).json.needsRefund).toBe(1);
    expect((await adm.get('/admin/payments')).json.payments[0].status).toBe('needs_refund');
  });

  it('offre gratuite : confirmée sans paiement ; réservation payée non annulable', async () => {
    const free = await setup(5, 5, 0);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: free.offer.id });
    expect(r.json.booking.status).toBe('confirmed');
    expect(r.json.payment).toBeNull();
    expect(orz.links).toHaveLength(0);

    const paidOffer = (await free.owner.post('/company/offers', { destCountry: 'CI', destCity: 'Bouaké', title: 'Payant', country: 'CI', city: 'Abidjan', priceFcfa: 3000, capacity: 5, startsAt: future() })).json.offer;
    const p = await cust.post('/bookings', { ...BK, offerId: paidOffer.id });
    orz.set(key(p.json.payment.id), 'SUCCESS');
    await poll(cust, p.json.payment.id);
    expect((await cust.post(`/bookings/${p.json.booking.id}/cancel`)).status).toBe(409);
    expect((await cust.post(`/bookings/${r.json.booking.id}/cancel`)).status).toBe(200);
  });

  it("protège le suivi : seul le client (ou l'admin) voit son paiement", async () => {
    const { offer, adm } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    const other = await register('customer', 'd@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id });
    expect((await poll(other, r.json.payment.id)).status).toBe(404);
    expect((await new Client(ctx.app).get(`/payments/${r.json.payment.id}`)).status).toBe(401);
    expect((await poll(adm, r.json.payment.id)).status).toBe(200);
    expect((await cust.get('/admin/payments')).status).toBe(403);
  });

  it('limite les réservations en attente de paiement par client', async () => {
    const { offer } = await setup(10, 10, 5000);
    const cust = await register('customer', 'c@x.test');
    for (let i = 0; i < 3; i++) expect((await cust.post('/bookings', { ...BK, offerId: offer.id })).status).toBe(201);
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id })).status).toBe(429);
  });
});

describe('photos des offres', () => {
  // JPEG minimal valide (en-tête FF D8 FF)
  const jpeg = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]).toString('base64');
  it('enregistre jusqu\'à 4 photos, les sert publiquement et refuse le reste', async () => {
    const { owner } = await setup(5, 5, 0);
    const base = { title: 'Avec photos', country: 'CI', city: 'Abidjan', priceFcfa: 0, capacity: 5, startsAt: future() };
    expect((await owner.post('/company/offers', { destCountry: 'CI', destCity: 'Bouaké', ...base, photos: [jpeg, jpeg, jpeg, jpeg, jpeg] })).status).toBe(400);
    expect((await owner.post('/company/offers', { destCountry: 'CI', destCity: 'Bouaké', ...base, photos: ['data:image/png;base64,AAAA'] })).status).toBe(400);
    const fake = 'data:image/jpeg;base64,' + Buffer.from('<script>alert(1)</script>').toString('base64');
    expect((await owner.post('/company/offers', { destCountry: 'CI', destCity: 'Bouaké', ...base, photos: [fake] })).status).toBe(400);
    const r = await owner.post('/company/offers', { destCountry: 'CI', destCity: 'Bouaké', ...base, photos: [jpeg, jpeg, jpeg, jpeg] });
    expect(r.status).toBe(201);
    expect(r.json.offer.photoCount).toBe(4);
    const anon = new Client(ctx.app);
    const list = (await anon.get('/offers')).json.offers.find((o: any) => o.id === r.json.offer.id);
    expect(list.photoCount).toBe(4);
    const img = await ctx.app.request(`http://localhost/api/offers/${r.json.offer.id}/photos/3`);
    expect(img.status).toBe(200);
    expect(img.headers.get('content-type')).toBe('image/jpeg');
    expect(new Uint8Array(await img.arrayBuffer())[0]).toBe(0xff);
    expect((await ctx.app.request(`http://localhost/api/offers/${r.json.offer.id}/photos/4`)).status).toBe(400);
    await owner.patch(`/company/offers/${r.json.offer.id}`, { active: false });
    expect((await ctx.app.request(`http://localhost/api/offers/${r.json.offer.id}/photos/0`)).status).toBe(404); // hors catalogue
    expect((await owner.get('/company/offers')).json.offers.find((o: any) => o.id === r.json.offer.id).photoCount).toBe(4);
  });

  it('accepte uniquement les URL Cloudinary de notre compte et redirige vers une version optimisée', async () => {
    const { owner } = await setup(5, 5, 0);
    expect((await owner.get('/company/upload-config')).json.cloudinary).toEqual({ cloudName: 'demo', preset: 'nexus_offers' });
    const base = { title: 'Cloud', country: 'CI', city: 'Abidjan', priceFcfa: 0, capacity: 5, startsAt: future() };
    for (const bad of ['https://evil.test/demo/image/upload/a.jpg', 'https://res.cloudinary.com/autre/image/upload/v1/a.jpg', 'https://res.cloudinary.com/demo/raw/upload/a.js', 'http://res.cloudinary.com/demo/image/upload/a.jpg', 'https://u:p@res.cloudinary.com/demo/image/upload/a.jpg'])
      expect((await owner.post('/company/offers', { destCountry: 'CI', destCity: 'Bouaké', ...base, photos: [bad] })).status).toBe(400);
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/nexus/offers/a.jpg';
    const r = await owner.post('/company/offers', { destCountry: 'CI', destCity: 'Bouaké', ...base, photos: [url + '?x=1'] });
    expect(r.status).toBe(201);
    const res = await ctx.app.request(`http://localhost/api/offers/${r.json.offer.id}/photos/0`);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_900,c_limit/v1/nexus/offers/a.jpg');
  });
});

describe('alertes', () => {
  it('alerte le fournisseur et le back-office à la réservation (gratuite) et à l\'annulation', async () => {
    const { owner, adm, offer } = await setup(5, 5, 0);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, guests: Array(2).fill('Passager Test'), offerId: offer.id, seats: 2 });
    const o = (await owner.get('/notifications')).json;
    expect(o.unread).toBe(1);
    expect(o.notifications[0]).toMatchObject({ kind: 'booking', title: expect.stringContaining('Nouvelle réservation'), link: '/company' });
    expect(o.notifications[0].body).toContain('2 place(s)');
    const a = (await adm.get('/notifications')).json;
    expect(a.notifications.some((n: any) => n.kind === 'booking')).toBe(true);
    expect((await cust.get('/notifications')).json.notifications).toHaveLength(0); // le client n'est pas alerté de sa propre réservation
    await cust.post(`/bookings/${r.json.booking.id}/cancel`);
    expect((await owner.get('/notifications')).json.notifications.map((n: any) => n.kind)).toContain('booking_cancelled');
    // marquer comme lu
    expect((await owner.post('/notifications/read', {})).status).toBe(200);
    expect((await owner.get('/notifications')).json.unread).toBe(0);
    expect((await new Client(ctx.app).get('/notifications')).status).toBe(401);
  });

  it('réservation payante : alerte seulement une fois le paiement reçu, une seule fois', async () => {
    const orz = new FakeOrz(); ctx = await makeApp(orz);
    const { owner, offer } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id });
    expect((await owner.get('/notifications')).json.notifications.filter((n: any) => n.kind === 'booking')).toHaveLength(0);
    orz.set(`bm-${r.json.payment.id}`, 'SUCCESS');
    for (let i = 0; i < 2; i++) { await ctx.db.update(payments).set({ lastCheckedAt: null }); await cust.get(`/payments/${r.json.payment.id}`); }
    const n = (await owner.get('/notifications')).json.notifications.filter((x: any) => x.kind === 'booking');
    expect(n).toHaveLength(1);
    expect(n[0].body).toContain('payé');
  });

  it('chaque utilisateur ne voit que ses alertes', async () => {
    const { adm, offer } = await setup(5, 5, 0);
    const cust = await register('customer', 'c@x.test');
    await cust.post('/bookings', { ...BK, offerId: offer.id });
    const other = await register('owner', 'o2@x.test');
    expect((await other.get('/notifications')).json.notifications).toHaveLength(0);
    expect((await adm.get('/notifications')).json.unread).toBeGreaterThan(0);
  });

  it('alerte le back-office à chaque nouvelle demande partenaire', async () => {
    const adm = await admin();
    const c = new Client(ctx.app);
    const r = await c.post('/auth/register-company', {
      manager: { email: 'g@x.test', password: 'password123', name: 'Awa Traoré', title: 'Gérante', phone: '+225 07 00 00 00 00' },
      company: { name: 'Chez Awa', activity: 'restauration', country: 'CI', city: 'Abidjan', phone: '+225 07 00 00 00 00', ...geo },
    });
    expect(r.status).toBe(201);
    const n = (await adm.get('/notifications')).json.notifications;
    expect(n[0]).toMatchObject({ kind: 'company_request', title: expect.stringContaining('Chez Awa'), link: '/admin' });
  });
});

describe('gestion des offres (modifier, dupliquer, désactiver, supprimer)', () => {
  const jpeg = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]).toString('base64');
  const body = (extra = {}) => ({ title: 'Poulet braisé', description: 'Servi avec attiéké', country: 'CI', city: 'Abidjan', destCountry: 'CI', destCity: 'Bouaké', priceFcfa: 0, capacity: 10, startsAt: future(), ...extra });

  it('modifie une offre : champs, capacité protégée, disponibilité, photos conservées/remplacées/retirées', async () => {
    const { owner } = await setup(5, 5, 0);
    const o = (await owner.post('/company/offers', body({ photos: [jpeg, jpeg] }))).json.offer;
    expect((await owner.patch(`/company/offers/${o.id}`, { active: false })).json.offer.photoCount).toBe(2); // désactiver ne touche pas aux photos
    const r = await owner.patch(`/company/offers/${o.id}`, { title: 'Poulet DG', priceFcfa: 4500, capacity: 12 });
    expect(r.json.offer).toMatchObject({ title: 'Poulet DG', priceFcfa: 4500, capacity: 12, description: 'Servi avec attiéké', active: false });
    // la date d'ajout est automatique : elle n'est pas modifiable et ne limite pas l'affichage
    const added = (await owner.patch(`/company/offers/${o.id}`, { startsAt: '2001-01-01T00:00:00.000Z', active: true })).json.offer;
    expect(added.active).toBe(true);
    expect(added.startsAt).toBe(o.startsAt);
    // photos : garder la 2e, ajouter une nouvelle
    expect((await owner.patch(`/company/offers/${o.id}`, { photos: ['keep:1', jpeg] })).json.offer.photoCount).toBe(2);
    expect((await owner.patch(`/company/offers/${o.id}`, { photos: ['keep:3'] })).status).toBe(400);
    expect((await owner.patch(`/company/offers/${o.id}`, { photos: [] })).json.offer.photoCount).toBe(0);
  });

  it('refuse de réduire la capacité sous les places déjà réservées', async () => {
    const { owner } = await setup(5, 5, 0);
    const o = (await owner.post('/company/offers', body())).json.offer;
    const cust = await register('customer', 'c@x.test');
    await cust.post('/bookings', { ...BK, guests: Array(3).fill('Passager Test'), offerId: o.id, seats: 3 });
    expect((await owner.patch(`/company/offers/${o.id}`, { capacity: 2 })).status).toBe(409);
    expect((await owner.patch(`/company/offers/${o.id}`, { capacity: 3 })).status).toBe(200);
  });

  it('supprime une offre sans réservation, refuse sinon (désactiver à la place)', async () => {
    const { owner } = await setup(5, 5, 0);
    const free = (await owner.post('/company/offers', body({ photos: [jpeg] }))).json.offer;
    expect((await owner.delete(`/company/offers/${free.id}`)).status).toBe(200);
    expect((await owner.get('/company/offers')).json.offers.find((x: any) => x.id === free.id)).toBeUndefined();

    const used = (await owner.post('/company/offers', body())).json.offer;
    const cust = await register('customer', 'c@x.test');
    const b = await cust.post('/bookings', { ...BK, offerId: used.id });
    expect((await owner.delete(`/company/offers/${used.id}`)).status).toBe(409);
    await cust.post(`/bookings/${b.json.booking.id}/cancel`);
    expect((await owner.delete(`/company/offers/${used.id}`)).status).toBe(409); // l'historique (même annulé) est conservé
    expect((await owner.patch(`/company/offers/${used.id}`, { active: false })).status).toBe(200);
  });

  it('isole les offres entre entreprises (modifier, supprimer, photos)', async () => {
    const { owner } = await setup(5, 5, 0);
    const o = (await owner.post('/company/offers', body({ photos: [jpeg] }))).json.offer;
    const other = await register('owner', 'o2@x.test');
    await other.post('/company', { name: 'Autre', activity: 'hotel', country: 'SN', city: 'Dakar', phone: '+225 07 00 00 00 00', ...geo });
    expect((await other.patch(`/company/offers/${o.id}`, { title: 'Piraté' })).status).toBe(404);
    expect((await other.delete(`/company/offers/${o.id}`)).status).toBe(404);
    expect((await other.get(`/company/offers/${o.id}/photos/0`)).status).toBe(404);
    expect((await owner.get(`/company/offers/${o.id}/photos/0`)).status).toBe(200); // visible même désactivée
    await owner.patch(`/company/offers/${o.id}`, { active: false });
    expect((await owner.get(`/company/offers/${o.id}/photos/0`)).status).toBe(200);
  });
});

describe('référentiel pays et villes', () => {
  it('couvre les pays demandés avec leurs principales villes', async () => {
    const { COUNTRIES, citiesOf, countryName } = await import('../shared/geo.js');
    for (const [code, ville] of [['CI', 'Abidjan'], ['GN', 'Conakry'], ['ML', 'Bamako'], ['BF', 'Ouagadougou'], ['TG', 'Lomé'], ['NE', 'Niamey'], ['BJ', 'Cotonou'], ['TD', "N'Djamena"], ['GH', 'Accra'], ['LR', 'Monrovia'], ['SN', 'Dakar']])
      expect(citiesOf(code)[0], code).toBe(ville);
    expect(countryName('GN')).toBe('Guinée-Conakry');
    for (const c of COUNTRIES) expect(new Set(c.cities).size, c.code).toBe(c.cities.length); // pas de doublons
    const owner = await register('owner', 'o@x.test');
    const r = await owner.post('/company', { name: 'Taxi Monrovia', activity: 'transport', country: 'LR', city: 'Monrovia', phone: '+231 77 000 0000', ...geo });
    expect(r.status).toBe(201); // Liberia accepté par l'API
  });
});



describe('parcours de réservation : informations du réservant', () => {
  it('exige contact, conditions acceptées et noms des passagers (transport), et enregistre tout', async () => {
    const { owner, offer } = await setup(5, 5, 0);
    const cust = await register('customer', 'c@x.test');
    const { contact, guests } = BK;
    expect((await cust.post('/bookings', { offerId: offer.id, guests })).status).toBe(400); // pas de contact
    expect((await cust.post('/bookings', { offerId: offer.id, contact, guests })).status).toBe(400); // conditions non acceptées
    expect((await cust.post('/bookings', { offerId: offer.id, contact: { ...contact, email: 'pas-un-email' }, guests, acceptTerms: true })).status).toBe(400);
    expect((await cust.post('/bookings', { offerId: offer.id, contact, acceptTerms: true })).status).toBe(400); // transport : nom du passager requis
    expect((await cust.post('/bookings', { offerId: offer.id, contact, guests: ['A B', 'C D'], acceptTerms: true })).status).toBe(400); // 2 noms pour 1 place
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id, note: 'Siège côté fenêtre' });
    expect(r.status).toBe(201);
    expect(r.json.booking.reference).toMatch(/^NX-[0-9A-F]{8}$/);
    const d = (await cust.get(`/bookings/${r.json.booking.id}`)).json.booking;
    expect(d).toMatchObject({ reference: r.json.booking.reference, contactName: 'Kouamé Client', contactEmail: 'client@x.test', guests: ['Passager Test'], note: 'Siège côté fenêtre', status: 'confirmed' });
    // le fournisseur voit les coordonnées du client
    const row = (await owner.get('/company/bookings')).json.bookings[0];
    expect(row).toMatchObject({ customerName: 'Kouamé Client', contactPhone: '+225 07 00 00 00 00', reference: d.reference });
    // la confirmation n'est visible que de son auteur
    const other = await register('customer', 'd@x.test');
    expect((await other.get(`/bookings/${r.json.booking.id}`)).status).toBe(404);
  });

  it('indique si le paiement en ligne est disponible', async () => {
    ctx = await makeApp(new FakeOrz());
    const { owner, offer } = await setup(5, 5, 5000);
    expect((await owner.get('/offers/' + offer.id)).json.offer.canPayOnline).toBe(true);
    await owner.delete('/company/payments-setup');
    expect((await owner.get('/offers/' + offer.id)).json.offer.canPayOnline).toBe(false);
  });

  it("planifie l'affichage : type d'activité, offre, fenêtre de dates", async () => {
    ctx = await makeApp(null);
    const { adm, offer } = await setup(5, 5);
    const anon = new Client(ctx.app);
    expect((await anon.get('/offers')).json.offers).toHaveLength(1);
    expect((await anon.get('/offers/activities')).json.activities).toContain('transport');
    expect((await anon.get('/offers?activity=transport,hotel')).json.offers).toHaveLength(1);
    expect((await anon.get('/offers?activity=hotel,mode')).json.offers).toHaveLength(0);
    expect((await anon.get('/offers?activity=inconnu')).status).toBe(400);
    // masquer le type
    expect((await adm.put('/admin/display/activities/transport', { visible: false, showFrom: null, showUntil: null })).status).toBe(200);
    expect((await anon.get('/offers')).json.offers).toHaveLength(0);
    expect((await anon.get('/offers/activities')).json.activities).not.toContain('transport');
    // ré-afficher, puis masquer l'offre seule
    await adm.put('/admin/display/activities/transport', { visible: true, showFrom: null, showUntil: null });
    expect((await anon.get('/offers')).json.offers).toHaveLength(1);
    await adm.patch(`/admin/display/offers/${offer.id}`, { hidden: true, showFrom: null, showUntil: null });
    expect((await anon.get('/offers')).json.offers).toHaveLength(0);
    // planification future : pas encore affichée ; passée : plus affichée
    const t = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();
    await adm.patch(`/admin/display/offers/${offer.id}`, { hidden: false, showFrom: t(1), showUntil: null });
    expect((await anon.get('/offers')).json.offers).toHaveLength(0);
    await adm.patch(`/admin/display/offers/${offer.id}`, { hidden: false, showFrom: t(-1), showUntil: t(1) });
    expect((await anon.get('/offers')).json.offers).toHaveLength(1);
    const list = (await adm.get('/admin/display')).json;
    expect(list.activities.length).toBeGreaterThan(10);
    expect(list.offers).toHaveLength(1);
  });

  it("transport : pays et ville d'arrivée obligatoires, filtrables, renvoyés au catalogue", async () => {
    ctx = await makeApp(null);
    const owner = await register('owner', 'o2@x.test');
    const co = (await owner.post('/company', { name: 'Bus', activity: 'transport', country: 'CI', city: 'Abidjan', phone: '+225 07 00 00 00 00', ...geo })).json.company;
    const adm = await admin();
    await adm.post(`/admin/companies/${co.id}/review`, { decision: 'approve' });
    const base = { title: 'Abidjan → Conakry', country: 'CI', city: 'Abidjan', priceFcfa: 30000, capacity: 20, startsAt: future() };
    expect((await owner.post('/company/offers', base)).status).toBe(400); // arrivée manquante
    expect((await owner.post('/company/offers', { ...base, destCountry: 'GN', destCity: 'Conakry' })).status).toBe(201);
    const anon = new Client(ctx.app);
    const hit = (await anon.get('/offers?activity=transport&country=CI&city=Abidjan&destCountry=GN&destCity=Conakry')).json.offers;
    expect(hit).toHaveLength(1);
    expect(hit[0]).toMatchObject({ destCountry: 'GN', destCity: 'Conakry' });
    expect((await anon.get('/offers?destCountry=SN')).json.offers).toHaveLength(0);
    expect((await anon.get('/offers?destCity=cona')).json.offers).toHaveLength(1);
  });

  it("services : arrivée obligatoire pour colis et billets, catégories validées, filtres de recherche", async () => {
    ctx = await makeApp(null);
    const adm = await admin();
    const mk = async (email: string, activity: string) => {
      const owner = await register('owner', email);
      const co = (await owner.post('/company', { name: activity, activity, country: 'CI', city: 'Abidjan', phone: '+225 07 00 00 00 00', ...geo })).json.company;
      await adm.post(`/admin/companies/${co.id}/review`, { decision: 'approve' });
      return owner;
    };
    const base = { country: 'CI', city: 'Abidjan', priceFcfa: 5000, capacity: 10, startsAt: future() };
    const exp = await mk('e1@x.test', 'expedition');
    expect((await exp.post('/company/offers', { ...base, title: 'Colis Abidjan → Bouaké', category: 'Petit colis (< 5 kg)' })).status).toBe(400);
    expect((await exp.post('/company/offers', { ...base, title: 'Colis', destCountry: 'CI', destCity: 'Bouaké', category: 'Inconnu' })).status).toBe(400);
    expect((await exp.post('/company/offers', { ...base, title: 'Colis Abidjan → Bouaké', destCountry: 'CI', destCity: 'Bouaké', category: 'Petit colis (< 5 kg)' })).status).toBe(201);
    const hotel = await mk('h1@x.test', 'hotel');
    expect((await hotel.post('/company/offers', { ...base, title: 'Chambre standard', priceFcfa: 25000, capacity: 4, category: 'Standard' })).status).toBe(201);
    await hotel.post('/company/offers', { ...base, title: 'Suite', priceFcfa: 90000, capacity: 2, category: 'Suite' });
    const resto = await mk('r1@x.test', 'restauration');
    await resto.post('/company/offers', { ...base, title: 'Attiéké poisson', priceFcfa: 3000, category: 'Ivoirienne' });
    expect((await resto.post('/company/offers', { ...base, title: 'X', category: 'Standard' })).status).toBe(400); // catégorie d'un autre service

    const anon = new Client(ctx.app);
    const n = async (qs: string) => (await anon.get(`/offers?${qs}`)).json.offers.length;
    expect(await n('activity=expedition&destCity=Bouak&category=' + encodeURIComponent('Petit colis (< 5 kg)'))).toBe(1);
    expect(await n('activity=expedition&category=Express')).toBe(0);
    expect(await n('activity=hotel&maxPrice=30000')).toBe(1);
    expect(await n('activity=hotel&guests=3')).toBe(1);   // seule la chambre à 4 places convient
    expect(await n('activity=hotel&category=Suite&maxPrice=100000')).toBe(1);
    expect(await n('activity=restauration&category=Ivoirienne')).toBe(1);
  });
});

describe('profil partenaire', () => {
  it('modifie nom, téléphone, e-mail ; refuse un logo hors Cloudinary ; le nom est repris au catalogue', async () => {
    const { owner } = await setup(5, 5, 0);
    const anon = new Client(ctx.app);
    const base = { name: 'Chez Anicette', phone: '+225 07 00 00 00 00', email: 'Contact@Anicette.CI', logoUrl: null };
    const r = await owner.patch('/company/profile', base);
    expect(r.status).toBe(200);
    expect(r.json.company).toMatchObject({ name: 'Chez Anicette', phone: '+225 07 00 00 00 00', email: 'contact@anicette.ci', logoUrl: null });
    expect((await owner.get('/company')).json.company.name).toBe('Chez Anicette');
    expect((await owner.patch('/company/profile', { ...base, logoUrl: 'https://evil.example.com/x.png' })).status).toBe(400);
    expect((await owner.patch('/company/profile', { ...base, logoUrl: 'http://res.cloudinary.com/x/image/upload/a.png' })).status).toBe(400);
    expect((await owner.patch('/company/profile', { ...base, name: 'A' })).status).toBe(400);
    expect((await owner.patch('/company/profile', { ...base, phone: 'abc' })).status).toBe(400);
    expect((await owner.patch('/company/profile', { ...base, email: '' })).json.company.email).toBe('');
    expect((await anon.get('/offers')).json.offers[0].companyName).toBe('Chez Anicette');
    expect((await anon.patch('/company/profile', base)).status).toBe(401);
  });
});

describe('disponibilité sans date', () => {
  it("l'offre reste visible tant que le stock n'est pas épuisé, quelle que soit la date d'ajout", async () => {
    const { owner } = await setup(5, 5, 0);
    const anon = new Client(ctx.app);
    const base = { title: 'Poulet braisé', country: 'CI', city: 'Abidjan', destCountry: 'CI', destCity: 'Bouaké', priceFcfa: 0, capacity: 2 };
    const o = (await owner.post('/company/offers', base)).json.offer;
    expect(new Date(o.startsAt).getTime()).toBeLessThanOrEqual(Date.now());
    const ids = async () => (await anon.get('/offers')).json.offers.map((x: any) => x.id);
    expect(await ids()).toContain(o.id);
    const off = (await owner.post('/company/offers', { ...base, title: 'Indisponible', active: false })).json.offer;
    expect(await ids()).not.toContain(off.id);
    expect((await owner.patch(`/company/offers/${off.id}`, { active: true })).status).toBe(200);
    expect(await ids()).toContain(off.id);
    const cust = await register('customer', 'dispo@x.test');
    expect((await cust.post('/bookings', { ...BK, guests: ['Passager Un', 'Passager Deux'], offerId: o.id, seats: 2 })).status).toBe(201);
    expect(await ids()).not.toContain(o.id); // stock épuisé
  });
});

describe('paiement à la livraison', () => {
  it('confirme tout de suite sans paiement en ligne, garde le montant dû, reste annulable', async () => {
    const { owner, co } = await setup(5, 5, 3000);
    const offers = (await owner.get('/company/offers')).json.offers;
    const offerId = offers[0].id;
    const cust = await register('customer', 'cod@x.test');
    // sans mode : le paiement en ligne est le défaut (ici le marchand n'a pas relié ORZAYAH → refusé)
    expect((await cust.post('/bookings', { ...BK, offerId })).status).toBe(400);
    const r = await cust.post('/bookings', { ...BK, offerId, seats: 1, payMode: 'cash' });
    expect(r.status).toBe(201);
    expect(r.json.payment).toBeNull();
    expect(r.json.booking).toMatchObject({ status: 'confirmed', payMethod: 'cash' });
    const mine = (await cust.get('/bookings/mine')).json.bookings[0];
    expect(mine).toMatchObject({ payMethod: 'cash', priceFcfa: 3000, status: 'confirmed' });
    const [after] = await ctx.db.select().from(companies).where(eq(companies.id, co.id));
    expect(after.credits).toBe(4);
    const row = (await owner.get('/company/bookings')).json.bookings[0];
    expect(row).toMatchObject({ payMethod: 'cash', dueFcfa: 3000 });
    expect((await cust.post(`/bookings/${r.json.booking.id}/cancel`)).status).toBe(200);
    const [back] = await ctx.db.select().from(companies).where(eq(companies.id, co.id));
    expect(back.credits).toBe(5);
  });
});

describe('réservation avec ou sans compte', () => {
  it('invité : réserve sans inscription, puis transforme sa session en vrai compte', async () => {
    const { owner } = await setup(5, 5, 3000);
    const offerId = (await owner.get('/company/offers')).json.offers[0].id;
    const g = new Client(ctx.app);
    const r = await g.post('/auth/guest', { name: 'Client Invité' });
    expect(r.status).toBe(201);
    expect(r.json.user).toMatchObject({ role: 'customer', guest: true, email: '' });
    const b = await g.post('/bookings', { ...BK, offerId, payMode: 'cash' });
    expect(b.status).toBe(201);
    expect((await g.get('/auth/me')).json.user.guest).toBe(true);
    // un e-mail déjà pris est refusé ; une adresse fictive d'invité aussi
    await register('customer', 'pris@x.test');
    expect((await g.post('/auth/upgrade', { email: 'pris@x.test', password: 'motdepasse1' })).status).toBe(409);
    expect((await new Client(ctx.app).post('/auth/register', { email: 'x@invite.backmarket.invalid', name: 'Pirate', password: 'motdepasse1' })).status).toBe(400);
    const up = await g.post('/auth/upgrade', { email: 'nouveau@x.test', password: 'motdepasse1' });
    expect(up.status).toBe(200);
    expect(up.json.user).toMatchObject({ guest: false, email: 'nouveau@x.test' });
    expect((await g.post('/auth/upgrade', { email: 'autre@x.test', password: 'motdepasse1' })).status).toBe(409); // déjà complet
    // la réservation est conservée et le compte fonctionne au login
    expect((await g.get('/bookings/mine')).json.bookings).toHaveLength(1);
    const again = new Client(ctx.app);
    expect((await again.post('/auth/login', { email: 'nouveau@x.test', password: 'motdepasse1' })).status).toBe(200);
    expect((await again.get('/bookings/mine')).json.bookings).toHaveLength(1);
  });
});

describe('paiement à la livraison autorisé par offre', () => {
  it("le fournisseur peut l'interdire : la réservation à la livraison est alors refusée", async () => {
    const { owner } = await setup(5, 5, 3000);
    const anon = new Client(ctx.app);
    const offer = (await owner.get('/company/offers')).json.offers[0];
    expect(offer.allowCash).toBe(true);
    expect((await anon.get(`/offers/${offer.id}`)).json.offer.allowCash).toBe(true);
    const cust = await register('customer', 'nocash@x.test');
    expect((await owner.patch(`/company/offers/${offer.id}`, { allowCash: false })).json.offer.allowCash).toBe(false);
    expect((await anon.get(`/offers/${offer.id}`)).json.offer.allowCash).toBe(false);
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id, payMode: 'cash' });
    expect(r.status).toBe(400);
    expect(r.json.error.code).toBe('cash_not_allowed');
    expect((await owner.patch(`/company/offers/${offer.id}`, { allowCash: true })).status).toBe(200);
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id, payMode: 'cash' })).status).toBe(201);
    // une modification sans ce champ ne le réinitialise pas
    await owner.patch(`/company/offers/${offer.id}`, { allowCash: false });
    expect((await owner.patch(`/company/offers/${offer.id}`, { title: 'Nouveau titre' })).json.offer.allowCash).toBe(false);
  });
});


describe('compte ORZAYAH du marchand (paiement direct)', () => {
  it('relie, vérifie et chiffre la clé ; ne la renvoie jamais ; déconnexion refusée tant qu\'un paiement est en cours', async () => {
    const orz = new FakeOrz(); ctx = await makeApp(orz);
    const { owner, co, offer } = await setup(5, 5, 5000);
    const r0 = (await owner.get('/company/payments-setup')).json;
    expect(r0.connected).toBe(true); // setup() relie déjà un compte de test
    await owner.delete('/company/payments-setup');
    const st = (await owner.get('/company/payments-setup')).json;
    expect(st).toMatchObject({ connected: false, webhookConfigured: false });
    expect(st.webhookUrl).toContain(`/api/orzayah/webhook/${co.id}`);
    expect((await owner.put('/company/payments-setup', { apiKey: 'court' })).status).toBe(400);
    expect((await owner.put('/company/payments-setup', { apiKey: 'test-key-0123456789', webhookSecret: 'pas-un-secret' })).status).toBe(400);
    expect((await owner.put('/company/payments-setup', { apiKey: 'test-key-0123456789', webhookSecret: 'whsec_abcdef123456' })).status).toBe(200);
    const [row] = await ctx.db.select().from(companies).where(eq(companies.id, co.id));
    expect(row.orzApiKeyEnc).toMatch(/^v1\./);
    expect(row.orzApiKeyEnc).not.toContain('test-key');
    expect(JSON.stringify((await owner.get('/company/payments-setup')).json)).not.toContain('test-key');
    expect(JSON.stringify((await owner.get('/company')).json)).not.toContain(row.orzApiKeyEnc!);
    const cust = await register('customer', 'c@x.test');
    const b = await cust.post('/bookings', { ...BK, offerId: offer.id });
    expect(b.status).toBe(201);
    expect((await owner.delete('/company/payments-setup')).status).toBe(409); // paiement en attente
    expect((await ctx.db.select().from(payments))[0].orzScope).toBe('merchant');
  });

  it('refuse une clé rejetée par ORZAYAH', async () => {
    const orz = new FakeOrz(); ctx = await makeApp(orz);
    const { owner } = await setup(5, 5, 5000);
    orz.rejectKey = true;
    const r = await owner.put('/company/payments-setup', { apiKey: 'mauvaise-cle-0123456789' });
    expect(r.status).toBe(400);
    expect(r.json.error.code).toBe('invalid_key');
  });

  it('un client ne peut payer en ligne que chez un marchand relié ; le paiement à la livraison reste possible', async () => {
    ctx = await makeApp(new FakeOrz());
    const { owner, offer } = await setup(5, 5, 5000);
    await owner.delete('/company/payments-setup');
    const cust = await register('customer', 'c@x.test');
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id, payMode: 'digital' })).json.error.code).toBe('online_not_available');
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id, payMode: 'cash' })).status).toBe(201);
  });
});

describe('webhook ORZAYAH', () => {
  const SECRET = 'whsec_test_secret';
  let orz: FakeOrz;
  const sign = (raw: string, t = Math.floor(Date.now() / 1000), secret = SECRET) => `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex')}`;
  let hookPath = '/webhook';
  const hook = (raw: string, headers: Record<string, string>) => ctx.app.request(`http://localhost/api/orzayah${hookPath}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: raw });
  const evt = (slug: string, ref: string) => JSON.stringify({ id: 'evt_1', type: 'payment.succeeded', data: { slug, externalReference: ref, amount: '500000' } });
  beforeEach(async () => { process.env.ORZAYAH_WEBHOOK_SECRET = SECRET; resetConfig(); orz = new FakeOrz(); ctx = await makeApp(orz); });
  afterEach(() => { delete process.env.ORZAYAH_WEBHOOK_SECRET; resetConfig(); });

  const connectHook = async (owner: Client, co: { id: string }) => {
    expect((await owner.put('/company/payments-setup', { apiKey: 'test-key-0123456789', webhookSecret: SECRET })).status).toBe(200);
    hookPath = `/webhook/${co.id}`;
  };
  const booked = async () => {
    const { offer, owner, co } = await setup(5, 5, 5000);
    await connectHook(owner, co);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id });
    return { cust, r, slug: orz.ops.get(`bm-${r.json.payment.id}`)!.id };
  };

  it('payment.succeeded signé : relit le lien chez ORZAYAH puis confirme (idempotent)', async () => {
    const { cust, r, slug } = await booked();
    orz.set(`bm-${r.json.payment.id}`, 'SUCCESS');
    const raw = evt(slug, r.json.booking.reference);
    expect((await hook(raw, { 'x-orzayah-event': 'payment.succeeded', 'x-orzayah-signature': sign(raw) })).status).toBe(200);
    expect((await hook(raw, { 'x-orzayah-event': 'payment.succeeded', 'x-orzayah-signature': sign(raw) })).status).toBe(200);
    expect((await cust.get('/bookings/mine')).json.bookings[0]).toMatchObject({ status: 'confirmed', paymentStatus: 'paid' });
  });

  it("ne croit pas le webhook : lien non payé chez ORZAYAH = rien ne change", async () => {
    const { cust, r, slug } = await booked();
    const raw = evt(slug, r.json.booking.reference);
    expect((await hook(raw, { 'x-orzayah-event': 'payment.succeeded', 'x-orzayah-signature': sign(raw) })).status).toBe(200);
    expect((await cust.get('/bookings/mine')).json.bookings[0].status).toBe('pending_payment');
  });

  it('rejette signature fausse, secret erroné, horodatage trop ancien et absence de signature', async () => {
    const { r, slug } = await booked();
    const raw = evt(slug, r.json.booking.reference);
    const h = (sig: string) => ({ 'x-orzayah-event': 'payment.succeeded', 'x-orzayah-signature': sig });
    expect((await hook(raw, h(sign(raw, undefined, 'whsec_autre')))).status).toBe(400);
    expect((await hook(raw, h(sign(raw, Math.floor(Date.now() / 1000) - 600)))).status).toBe(400);
    expect((await hook(raw + ' ', h(sign(raw)))).status).toBe(400); // corps modifié
    expect((await hook(raw, {})).status).toBe(400);
  });

  it('webhook.test répond 200 ; paiement inconnu → 503 pour un nouvel essai ; sans secret → 503', async () => {
    const t = JSON.stringify({ type: 'webhook.test', data: {} });
    const s0 = await setup(5, 5, 5000);
    hookPath = `/webhook/${s0.co.id}`;
    expect((await hook(t, { 'x-orzayah-event': 'webhook.test', 'x-orzayah-signature': sign(t) })).status).toBe(503); // secret de webhook pas encore enregistré
    await connectHook(s0.owner, s0.co);
    expect((await hook(t, { 'x-orzayah-event': 'webhook.test', 'x-orzayah-signature': sign(t) })).status).toBe(200);
    const u = evt('INCONNU1', 'NX-ZZZZZZZZ');
    expect((await hook(u, { 'x-orzayah-event': 'payment.succeeded', 'x-orzayah-signature': sign(u) })).status).toBe(503);
    hookPath = '/webhook/00000000-0000-4000-8000-000000000000';
    expect((await hook(t, { 'x-orzayah-signature': sign(t) })).status).toBe(503); // marchand inconnu
  });

  it('montant payé différent : pas de confirmation, alerte administrateur', async () => {
    const { offer, adm, owner, co } = await setup(5, 5, 5000);
    await connectHook(owner, co);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id });
    const k = `bm-${r.json.payment.id}`;
    orz.ops.set(k, { ...orz.ops.get(k)!, status: 'SUCCESS', amount: 100 });
    await ctx.db.update(payments).set({ lastCheckedAt: null });
    await cust.get(`/payments/${r.json.payment.id}`);
    expect((await cust.get('/bookings/mine')).json.bookings[0].status).toBe('pending_payment');
    expect((await adm.get('/notifications')).json.notifications.some((n: any) => n.kind === 'amount_mismatch')).toBe(true);
  });
});


describe('aperçu de partage (WhatsApp, Facebook…)', () => {
  const page = async (id: string) => {
    const app = shareRoutes(() => ctx.db);
    const res = await app.request(`https://www.backmarket-ci.com/offre/${id}`, { headers: { host: 'www.backmarket-ci.com' } });
    return { status: res.status, html: await res.text() };
  };

  it("une offre visible a son titre, son prix, son lieu et son lien dans l'aperçu (HTML échappé)", async () => {
    const { owner } = await setup(5, 5, 7500);
    const o = (await owner.post('/company/offers', { destCountry: 'CI', destCity: 'Bouaké', title: 'Abidjan <script>x</script> Bouaké', description: 'Départ "7h"', country: 'CI', city: 'Abidjan', priceFcfa: 7500, capacity: 5 })).json.offer;
    const r = await page(o.id);
    expect(r.status).toBe(200);
    expect(r.html).toContain('property="og:title"');
    expect(r.html).toContain('7 500 FCFA');
    expect(r.html).toContain('Abidjan → Bouaké');
    expect(r.html).toContain(`https://www.backmarket-ci.com/offre/${o.id}`);
    expect(r.html).toContain('og:image');
    expect(r.html).not.toContain('<script>x');
  });

  it('une offre inconnue ou masquée retombe sur la présentation du site, sans fuite', async () => {
    const { owner, offer } = await setup(5, 5, 5000);
    await owner.patch(`/company/offers/${offer.id}`, { active: false });
    for (const id of [offer.id, '11111111-1111-1111-1111-111111111111', 'pas-un-id']) {
      const r = await page(id);
      expect(r.status).toBe(200);
      expect(r.html).toContain('BackMarket : vendez ou réservez');
      expect(r.html).toContain('/og.jpg');
    }
  });
});

describe('gestion des commandes par le fournisseur', () => {
  const cashBooking = async (price = 3000) => {
    const s = await setup(5, 5, price);
    const cust = await register('customer', 'cl@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: s.offer.id, seats: 1, payMode: 'cash' });
    expect(r.status).toBe(201);
    return { ...s, cust, id: r.json.booking.id as string };
  };
  const kinds = async (c: Client) => (await c.get('/notifications')).json.notifications.map((n: any) => n.kind);

  it("fait avancer l'étape, prévient le client à « acceptée » et « prête » (une fois), l'historique reste visible", async () => {
    const { owner, cust, id } = await cashBooking();
    expect((await owner.get('/company/bookings')).json.bookings[0].fulfillment).toBe('new');
    expect((await owner.post(`/company/bookings/${id}/status`, { fulfillment: 'accepted' })).status).toBe(200);
    expect((await owner.post(`/company/bookings/${id}/status`, { fulfillment: 'preparing' })).status).toBe(200);
    expect((await owner.post(`/company/bookings/${id}/status`, { fulfillment: 'ready' })).status).toBe(200);
    expect((await owner.post(`/company/bookings/${id}/status`, { fulfillment: 'preparing' })).status).toBe(200); // correction d'erreur
    expect((await owner.post(`/company/bookings/${id}/status`, { fulfillment: 'ready' })).status).toBe(200);
    expect((await owner.post(`/company/bookings/${id}/status`, { fulfillment: 'completed' })).status).toBe(200);
    expect((await owner.post(`/company/bookings/${id}/status`, { fulfillment: 'inconnu' })).status).toBe(400);
    const k = await kinds(cust);
    expect(k.filter((x: string) => x === 'booking_accepted')).toHaveLength(1);
    expect(k.filter((x: string) => x === 'booking_ready')).toHaveLength(1);
    expect((await cust.get('/bookings/mine')).json.bookings[0].fulfillment).toBe('completed');
    expect((await cust.get(`/bookings/${id}`)).json.booking.fulfillment).toBe('completed');
  });

  it("isole les fournisseurs : un autre partenaire ne peut ni modifier, ni annoter, ni annuler", async () => {
    const { id } = await cashBooking();
    const other = await register('owner', 'other@x.test');
    await other.post('/company', { name: 'Autre', activity: 'transport', country: 'CI', city: 'Abidjan', serviceCities: [], phone: '+225 07 00 00 00 01', ...geo });
    expect((await other.post(`/company/bookings/${id}/status`, { fulfillment: 'accepted' })).status).not.toBe(200);
    expect((await other.patch(`/company/bookings/${id}/note`, { note: 'x' })).status).toBe(404);
    expect((await other.post(`/company/bookings/${id}/cancel`, { reason: 'Test motif' })).status).not.toBe(200);
    expect((await other.get('/company/bookings')).json.bookings).toHaveLength(0); // ne voit pas les commandes d'autrui
  });

  it("suit l'encaissement du paiement à la livraison (réservations à la livraison uniquement)", async () => {
    const { owner, id } = await cashBooking();
    expect((await owner.post(`/company/bookings/${id}/cash`, { collected: true })).status).toBe(200);
    expect((await owner.get('/company/bookings')).json.bookings[0].cashCollectedAt).toBeTruthy();
    expect((await owner.post(`/company/bookings/${id}/cash`, { collected: false })).status).toBe(200);
    expect((await owner.get('/company/bookings')).json.bookings[0].cashCollectedAt).toBeNull();
    const fo = (await owner.post('/company/offers', { title: 'Gratuit', country: 'CI', city: 'Abidjan', destCountry: 'CI', destCity: 'Bouaké', priceFcfa: 0, capacity: 3 })).json.offer;
    const cust2 = await register('customer', 'cl2@x.test');
    const fb = await cust2.post('/bookings', { ...BK, offerId: fo.id, payMode: 'cash' });
    expect(fb.status).toBe(201);
    expect((await owner.post(`/company/bookings/${fb.json.booking.id}/cash`, { collected: true })).status).toBe(409);
  });

  it("règles de fin de parcours : Livrée encaisse le cash, plus d'annulation après livraison ou encaissement, client bloqué en cours de préparation", async () => {
    const a = await cashBooking();
    expect((await a.owner.post(`/company/bookings/${a.id}/status`, { fulfillment: 'preparing' })).status).toBe(200);
    expect((await a.cust.post(`/bookings/${a.id}/cancel`)).status).toBe(409); // en préparation : le client passe par le fournisseur
    expect((await a.owner.post(`/company/bookings/${a.id}/status`, { fulfillment: 'completed' })).status).toBe(200);
    expect((await a.owner.get('/company/bookings')).json.bookings[0].cashCollectedAt).toBeTruthy(); // livrée = encaissée
    expect((await a.owner.post(`/company/bookings/${a.id}/cancel`, { reason: 'Test motif' })).status).toBe(409);
  });

  it("refuse l'annulation d'une commande déjà encaissée tant que la mention n'est pas retirée", async () => {
    const b = await cashBooking();
    expect((await b.owner.post(`/company/bookings/${b.id}/cash`, { collected: true })).status).toBe(200);
    expect((await b.owner.post(`/company/bookings/${b.id}/cancel`, { reason: 'Test motif' })).status).toBe(409);
    expect((await b.owner.post(`/company/bookings/${b.id}/cash`, { collected: false })).status).toBe(200);
    expect((await b.owner.post(`/company/bookings/${b.id}/cancel`, { reason: 'Test motif' })).status).toBe(200);
  });

  it("fige le prix à la réservation : un changement de prix ultérieur ne modifie pas le montant à encaisser", async () => {
    const { owner, cust, id, offer } = await cashBooking(3000);
    expect((await owner.patch(`/company/offers/${offer.id}`, { priceFcfa: 9000 })).status).toBe(200);
    expect((await owner.get('/company/bookings')).json.bookings[0].dueFcfa).toBe(3000);
    expect((await cust.get(`/bookings/${id}`)).json.booking.priceFcfa).toBe(3000);
  });

  it('enregistre une note interne, jamais visible du client', async () => {
    const { owner, cust, id } = await cashBooking();
    expect((await owner.patch(`/company/bookings/${id}/note`, { note: 'Client rappelé, livrer demain 10 h' })).status).toBe(200);
    expect((await owner.get('/company/bookings')).json.bookings[0].merchantNote).toBe('Client rappelé, livrer demain 10 h');
    expect(JSON.stringify((await cust.get(`/bookings/${id}`)).json)).not.toContain('Client rappelé');
    expect(JSON.stringify((await cust.get('/bookings/mine')).json)).not.toContain('Client rappelé');
    expect((await owner.patch(`/company/bookings/${id}/note`, { note: 'x'.repeat(501) })).status).toBe(400);
  });

  it("annule avec motif : rend la place et le crédit, prévient le client ; motif obligatoire ; pas de double annulation", async () => {
    const { owner, cust, id, offer, co } = await cashBooking();
    expect((await owner.post(`/company/bookings/${id}/cancel`, { reason: '' })).status).toBe(400);
    const r = await owner.post(`/company/bookings/${id}/cancel`, { reason: 'Rupture de stock / indisponible' });
    expect(r.status).toBe(200);
    expect(r.json.refundDue).toBe(false);
    const [o] = await ctx.db.select().from(offers).where(eq(offers.id, offer.id));
    const [c] = await ctx.db.select().from(companies).where(eq(companies.id, co.id));
    expect({ booked: o.booked, credits: c.credits }).toEqual({ booked: 0, credits: 5 });
    const b = (await cust.get(`/bookings/${id}`)).json.booking;
    expect(b).toMatchObject({ status: 'cancelled', cancelledBy: 'merchant', cancelReason: 'Rupture de stock / indisponible' });
    const n = (await cust.get('/notifications')).json.notifications.find((x: any) => x.kind === 'booking_cancelled_merchant');
    expect(n.body).toContain('Rupture de stock');
    expect((await owner.post(`/company/bookings/${id}/cancel`, { reason: 'Encore une fois' })).status).toBe(409);
    expect((await owner.post(`/company/bookings/${id}/status`, { fulfillment: 'accepted' })).status).toBe(409);
  });

  it("annulation d'une réservation payée en ligne : remboursement à effectuer, alerte administrateur", async () => {
    const orz = new FakeOrz(); ctx = await makeApp(orz);
    const { owner, adm, offer } = await setup(5, 5, 5000);
    const cust = await register('customer', 'cl@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id });
    expect((await owner.post(`/company/bookings/${r.json.booking.id}/cancel`, { reason: 'Test motif' })).status).toBe(409); // paiement en attente : actionnable seulement après paiement
    orz.set(`bm-${r.json.payment.id}`, 'SUCCESS');
    await ctx.db.update(payments).set({ lastCheckedAt: null });
    await cust.get(`/payments/${r.json.payment.id}`);
    const c = await owner.post(`/company/bookings/${r.json.booking.id}/cancel`, { reason: 'Rupture de stock / indisponible' });
    expect(c.status).toBe(200);
    expect(c.json.refundDue).toBe(true);
    expect((await adm.get('/admin/payments')).json.payments[0].status).toBe('needs_refund');
    expect((await adm.get('/admin/stats')).json.needsRefund).toBe(1);
    // L'argent est chez le marchand : c'est à lui de rembourser, pas d'alerte au back-office.
    expect((await adm.get('/notifications')).json.notifications.some((n: any) => n.kind === 'needs_refund')).toBe(false);
  });
});

describe('isolation des commandes entre partenaires (audit)', () => {
  const partner = async (email: string, name: string, country = 'CI') => {
    const o = await register('owner', email);
    const co = (await o.post('/company', { name, activity: 'transport', country, city: 'Ville', serviceCities: [], phone: '+225 07 00 00 00 00', ...geo })).json.company;
    const adm = await admin().catch(async () => { const c = new Client(ctx.app); await c.post('/auth/login', { email: 'admin@backmarket.test', password: 'adminpass123' }); return c; });
    await adm.post(`/admin/companies/${co.id}/review`, { decision: 'approve' });
    await adm.post(`/admin/companies/${co.id}/credits`, { credits: 10 });
    const offer = (await o.post('/company/offers', { title: `Offre ${name}`, country, city: 'Ville', destCountry: country, destCity: 'Autre', priceFcfa: 1000, capacity: 5 })).json.offer;
    return { o, co, offer };
  };

  it('une commande n\'apparaît que chez le partenaire concerné ; l\'autre ne peut ni la voir ni agir dessus', async () => {
    const a = await partner('a@x.test', 'Alpha');
    const b = await partner('b@x.test', 'Beta');
    const cust = await register('customer', 'cl@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: a.offer.id, payMode: 'cash' });
    expect(r.status).toBe(201);
    const id = r.json.booking.id;
    expect((await a.o.get('/company/bookings')).json.bookings.map((x: any) => x.id)).toEqual([id]);
    expect((await b.o.get('/company/bookings')).json.bookings).toHaveLength(0);
    expect((await b.o.post(`/company/bookings/${id}/status`, { fulfillment: 'accepted' })).status).toBe(409);
    expect((await b.o.post(`/company/bookings/${id}/cash`, { collected: true })).status).toBe(409);
    expect((await b.o.patch(`/company/bookings/${id}/note`, { note: 'intrus' })).status).toBe(404);
    expect((await b.o.post(`/company/bookings/${id}/cancel`, { reason: 'Intrusion' })).status).toBe(409);
    expect((await b.o.get('/company/ledger')).json.ledger.some((l: any) => l.bookingId === id)).toBe(false);
    // notifications : seul le propriétaire concerné est alerté
    expect((await a.o.get('/notifications')).json.notifications.some((n: any) => n.kind === 'booking')).toBe(true);
    expect((await b.o.get('/notifications')).json.notifications.some((n: any) => n.kind === 'booking')).toBe(false);
    // la commande n'a pas bougé
    expect((await a.o.get('/company/bookings')).json.bookings[0]).toMatchObject({ fulfillment: 'new', merchantNote: '', status: 'confirmed' });
    // un autre client ne la voit pas non plus
    const other = await register('customer', 'autre@x.test');
    expect((await other.get(`/bookings/${id}`)).status).toBe(404);
    expect((await other.get('/bookings/mine')).json.bookings).toHaveLength(0);
  });
});

describe('pays du marchand, portée nationale / internationale', () => {
  const geoHeader = (country?: string): RequestInit => ({ headers: country ? { 'x-vercel-ip-country': country } : {} });
  const list = async (query = '', country?: string) => {
    const res = await ctx.app.request(`http://localhost/api/offers${query}`, geoHeader(country));
    return res.json() as Promise<{ offers: { title: string; scope: string }[]; market: string | null; marketSource: string }>;
  };
  const world = async () => {
    const adm = await admin();
    const mk = async (email: string, name: string, country: string, scopes: string[]) => {
      const o = await register('owner', email);
      const co = (await o.post('/company', { name, activity: 'restauration', country, city: 'Capitale', serviceCities: [], phone: '+225 07 00 00 00 00', scopes, ...geo })).json.company;
      await adm.post(`/admin/companies/${co.id}/review`, { decision: 'approve' });
      return { o, co };
    };
    const ci = await mk('ci@x.test', 'Resto CI', 'CI', ['national', 'international']);
    const sn = await mk('sn@x.test', 'Resto SN', 'SN', ['national']);
    const post = (o: Client, title: string, extra: object = {}, country = 'CI') => o.post('/company/offers', { title, country, city: 'Capitale', priceFcfa: 1000, capacity: 5, ...extra });
    await post(ci.o, 'Plat CI national');
    await post(ci.o, 'Plat CI mondial', { scope: 'international', canShipInternational: true });
    await post(sn.o, 'Plat SN national', {}, 'SN');
    return { ci, sn, adm, post };
  };

  it("n'affiche que les articles des marchands du pays du visiteur, plus les articles internationaux", async () => {
    await world();
    const titles = (r: { offers: { title: string }[] }) => r.offers.map((o) => o.title).sort();
    expect(titles(await list('', 'CI'))).toEqual(['Plat CI mondial', 'Plat CI national']);
    expect(titles(await list('', 'SN'))).toEqual(['Plat CI mondial', 'Plat SN national']);
    expect(titles(await list('', 'FR'))).toEqual(['Plat CI mondial']); // hors Afrique : international seulement
    const r = await list('', 'CI');
    expect(r).toMatchObject({ market: 'CI', marketSource: 'detected' });
    // le visiteur peut changer de pays de navigation (paramètre explicite prioritaire sur la détection)
    const chosen = await list('?country=SN', 'CI');
    expect(titles(chosen)).toEqual(['Plat CI mondial', 'Plat SN national']);
    expect(chosen.marketSource).toBe('chosen');
    // sans géolocalisation (développement) : aucun filtre pays
    const none = await list('');
    expect(none.market).toBeNull();
    expect(none.offers).toHaveLength(3);
  });

  it("valide la portée : article international seulement si capacité cochée ET marchand international", async () => {
    const { ci, sn, post } = await world();
    expect((await post(ci.o, 'Plat X', { scope: 'international', canShipInternational: false })).status).toBe(400);
    expect((await post(sn.o, 'Plat Y', { scope: 'international', canShipInternational: true }, 'SN')).status).toBe(400); // marchand national seulement
    expect((await post(ci.o, 'Plat Z', { scope: 'international', canShipInternational: true })).status).toBe(201);
    const mine = (await ci.o.get('/company/offers')).json.offers;
    expect(mine.find((o: any) => o.title === 'Plat CI national')).toMatchObject({ scope: 'national', canShipInternational: false });
  });

  it("exige au moins une portée à la création du marchand et accepte les 54 pays africains", async () => {
    const o = await register('owner', 'p@x.test');
    const base = { name: 'Test', activity: 'restauration', city: 'Ville', serviceCities: [], phone: '+225 07 00 00 00 00', ...geo };
    expect((await o.post('/company', { ...base, country: 'CI', scopes: [] })).status).toBe(400);
    const { COUNTRIES } = await import('../shared/geo.js');
    expect(COUNTRIES).toHaveLength(54);
    const za = await o.post('/company', { ...base, country: 'ZA', scopes: ['international', 'national', 'national'] });
    expect(za.json.company).toMatchObject({ country: 'ZA', scopes: ['international', 'national'] });
    const o2 = await register('owner', 'q@x.test');
    expect((await o2.post('/company', { ...base, country: 'CI' })).json.company.scopes).toEqual(['national']); // défaut
  });

  it('retirer une portée utilisée par des articles est refusé', async () => {
    const { ci } = await world();
    const r = await ci.o.patch('/company/profile', { name: 'Resto CI', phone: '+225 07 00 00 00 00', email: '', logoUrl: null, scopes: ['national'] });
    expect(r.status).toBe(409);
    expect((await ci.o.patch('/company/profile', { name: 'Resto CI', phone: '+225 07 00 00 00 00', email: '', logoUrl: null, scopes: ['national', 'international'] })).status).toBe(200);
  });
});

describe('boutique du marchand (catalogue individuel)', () => {
  it("la vitrine d'un marchand ne contient que ses articles, visible depuis n'importe quel pays, masquée si inactive", async () => {
    const a = await setup(5, 5, 1000); // Bus Abidjan (CI)
    const b = await register('owner', 'b2@x.test');
    const cb = (await b.post('/company', { name: 'Autre Boutique', activity: 'transport', country: 'SN', city: 'Dakar', serviceCities: [], phone: '+225 07 00 00 00 00', ...geo })).json.company;
    await a.adm.post(`/admin/companies/${cb.id}/review`, { decision: 'approve' });
    await b.post('/company/offers', { title: 'Dakar → Thiès', country: 'SN', city: 'Dakar', destCountry: 'SN', destCity: 'Thiès', priceFcfa: 2000, capacity: 5 });
    const anon = new Client(ctx.app);
    const sa = (await anon.get(`/offers/companies/${a.co.id}`)).json;
    expect(sa.company).toMatchObject({ id: a.co.id, name: 'Bus Abidjan', country: 'CI' });
    expect(sa.offers.map((o: any) => o.title)).toEqual(['Abidjan → Bouaké']);
    const sb = (await anon.get(`/offers/companies/${cb.id}`)).json;
    expect(sb.offers.map((o: any) => o.title)).toEqual(['Dakar → Thiès']);
    // ne fuit ni les autres marchands ni de données internes
    expect(JSON.stringify(sa)).not.toContain('Dakar');
    expect(JSON.stringify(sa)).not.toContain('credits');
    // offre désactivée : absente de la vitrine ; marchand inconnu ou non validé : 404
    await a.owner.patch(`/company/offers/${a.offer.id}`, { active: false });
    expect((await anon.get(`/offers/companies/${a.co.id}`)).json.offers).toHaveLength(0);
    expect((await anon.get('/offers/companies/11111111-1111-1111-1111-111111111111')).status).toBe(404);
  });

  it("l'aperçu de partage d'une boutique affiche le nom du marchand (HTML échappé), sinon retombe sur le site", async () => {
    const { co } = await setup(5, 5, 1000);
    const app = shareRoutes(() => ctx.db);
    const r = await app.request(`https://www.backmarket-ci.com/boutique/${co.id}`, { headers: { host: 'www.backmarket-ci.com' } });
    const html = await r.text();
    expect(html).toContain('Bus Abidjan : commandez et réservez en ligne');
    expect(html).toContain(`https://www.backmarket-ci.com/boutique/${co.id}`);
    const none = await (await app.request('https://www.backmarket-ci.com/boutique/pas-un-id', { headers: { host: 'www.backmarket-ci.com' } })).text();
    expect(none).toContain('BackMarket : vendez ou réservez');
  });
});

describe('back-office complet (KPI, partenaires, paiements, à la une, publicités, avis, favoris)', () => {
  const cashBooking = async (price = 5000) => {
    const s = await setup(5, 5, price);
    const cust = await register('customer', 'cl@x.test');
    const r = await cust.post('/bookings', { ...BK, guests: ['Passager A', 'Passager B'], offerId: s.offer.id, seats: 2, payMode: 'cash' });
    expect(r.status).toBe(201);
    return { ...s, cust, id: r.json.booking.id as string };
  };

  it('réservé aux administrateurs', async () => {
    const owner = await register('owner', 'o@x.test');
    expect((await new Client(ctx.app).get('/admin/kpis')).status).toBe(401);
    for (const p of ['/admin/kpis', '/admin/partners', '/admin/partner-payments', '/admin/featured', '/admin/ads', '/admin/reviews']) expect((await owner.get(p)).status).toBe(403);
    expect((await owner.post('/admin/ads', { advertiser: 'X', title: 'Titre', linkUrl: 'https://x.test' })).status).toBe(403);
  });

  it('KPI : ventes au prix figé, filtre par pays de création, ventilation par pays', async () => {
    const { adm, owner, offer } = await cashBooking(5000);
    await owner.patch(`/company/offers/${offer.id}`, { priceFcfa: 9000 }); // sans effet sur la vente déjà faite
    const k = (await adm.get('/admin/kpis?days=30')).json;
    expect(k.current).toMatchObject({ bookings: 1, gmv: 10000, cash: 10000, completed: 0 });
    expect(k.totals).toMatchObject({ partners_active: 1, offers_active: 1, customers: 1 });
    expect(k.series).toHaveLength(30);
    expect(k.series.reduce((a: number, d: any) => a + d.gmv, 0)).toBe(10000);
    expect(k.topPartners[0]).toMatchObject({ name: 'Bus Abidjan', gmv: 10000 });
    expect(k.byCountry.find((r: any) => r.country === 'CI')).toMatchObject({ shops: 1, bookings: 1, gmv: 10000 });
    expect((await adm.get('/admin/kpis?country=BJ')).json.current).toMatchObject({ bookings: 0, gmv: 0 });
    expect((await adm.get('/admin/kpis?country=CI')).json.current.gmv).toBe(10000);
  });

  it('boutiques par pays de création : liste, filtres, chiffres', async () => {
    const { adm } = await cashBooking();
    const all = (await adm.get('/admin/partners')).json;
    expect(all.partners).toHaveLength(1);
    expect(all.partners[0]).toMatchObject({ name: 'Bus Abidjan', country: 'CI', status: 'active', offersActive: 1, bookings: 1, gmv: 10000 });
    expect(all.countries).toEqual([{ country: 'CI', total: 1, active: 1, pending: 0 }]);
    expect((await adm.get('/admin/partners?country=BJ')).json.partners).toHaveLength(0);
    expect((await adm.get('/admin/partners?q=abidjan')).json.partners).toHaveLength(1);
    expect((await adm.get('/admin/partners?status=pending')).json.partners).toHaveLength(0);
  });

  it('paiements partenaires : à la livraison dû puis encaissé, rappel ORZAYAH limité à 1 par jour', async () => {
    const { adm, owner, co, id } = await cashBooking();
    let r = (await adm.get('/admin/partner-payments')).json;
    expect(r.partners[0]).toMatchObject({ name: 'Bus Abidjan', cashDue: 10000, cashCollected: 0 });
    expect(r.totals).toMatchObject({ cashDue: 10000, cashCollected: 0 });
    await owner.post(`/company/bookings/${id}/cash`, { collected: true });
    r = (await adm.get('/admin/partner-payments')).json;
    expect(r.partners[0]).toMatchObject({ cashDue: 0, cashCollected: 10000 });
    const orzOk = r.partners[0].orzConnected;
    if (!orzOk) {
      expect(r.totals.notConnected).toBe(1);
      expect((await adm.post(`/admin/partners/${co.id}/remind-orzayah`)).status).toBe(200);
      expect((await adm.post(`/admin/partners/${co.id}/remind-orzayah`)).status).toBe(409);
      expect((await owner.get('/notifications')).json.notifications.some((n: any) => n.kind === 'connect_orzayah')).toBe(true);
    }
  });

  it('à la une : pays ciblés, dates, retrait ; seules les offres visibles apparaissent', async () => {
    const { adm, offer } = await cashBooking();
    const pub = new Client(ctx.app);
    expect((await pub.get('/offers/featured?country=CI')).json.offers).toHaveLength(0);
    expect((await adm.put(`/admin/featured/${offer.id}`, { countries: ['CI'], rank: 1 })).status).toBe(200);
    expect((await pub.get('/offers/featured?country=CI')).json.offers.map((o: any) => o.id)).toEqual([offer.id]);
    await adm.put(`/admin/featured/${offer.id}`, { countries: ['BJ'] });
    expect((await pub.get('/offers/featured?country=CI')).json.offers).toHaveLength(0); // ciblée sur un autre pays
    await adm.put(`/admin/featured/${offer.id}`, { countries: [], endsAt: new Date(Date.now() - 3600_000).toISOString() });
    expect((await pub.get('/offers/featured?country=CI')).json.offers).toHaveLength(0); // expirée
    expect((await adm.put(`/admin/featured/${offer.id}`, { startsAt: future(), endsAt: new Date(Date.now() + 1000).toISOString() })).status).toBe(400);
    await adm.put(`/admin/featured/${offer.id}`, { countries: [] });
    expect((await pub.get('/offers/featured?country=CI')).json.offers).toHaveLength(1);
    expect((await adm.get('/admin/featured')).json.featured[0]).toMatchObject({ offerId: offer.id, live: true });
    expect((await adm.get('/admin/offer-search?q=bou')).json.offers[0]).toMatchObject({ id: offer.id, featured: true });
    expect((await adm.put(`/admin/featured/${offer.id}`, {})).status).toBe(200);
    expect((await adm.delete(`/admin/featured/${offer.id}`)).status).toBe(200);
    expect((await pub.get('/offers/featured?country=CI')).json.offers).toHaveLength(0);
  });

  it('publicités : ciblage par pays, fenêtre de dates, pause, compteurs, liens et images contrôlés', async () => {
    const { adm } = await setup(0, 5, 0);
    const pub = new Client(ctx.app);
    const mk = async (b: Record<string, unknown>) => (await adm.post('/admin/ads', { advertiser: 'gaRAN', title: 'gaRAN, le registre IMEI', linkUrl: 'https://garan.solutions', ...b }));
    const ci = await mk({ countries: ['CI'] });
    expect(ci.status).toBe(201);
    const all = await mk({ title: 'Pour tous les pays', countries: [] });
    const past = await mk({ title: 'Terminée', endsAt: new Date(Date.now() - 1000).toISOString(), startsAt: new Date(Date.now() - 86400_000).toISOString() });
    expect(past.status).toBe(201);
    const titles = async (q: string) => (await pub.get(`/ads${q}`)).json.ads.map((a: any) => a.title).sort();
    expect(await titles('?country=CI')).toEqual(['Pour tous les pays', 'gaRAN, le registre IMEI']);
    expect(await titles('?country=BJ')).toEqual(['Pour tous les pays']);
    expect(await titles('')).toEqual(['Pour tous les pays']); // pays inconnu : jamais de pub ciblée
    await adm.patch(`/admin/ads/${all.json.ad.id}`, { active: false });
    expect(await titles('?country=BJ')).toEqual([]);
    await pub.post(`/ads/${ci.json.ad.id}/view`, {}); await pub.post(`/ads/${ci.json.ad.id}/view`, {}); await pub.post(`/ads/${ci.json.ad.id}/click`, {});
    const row = (await adm.get('/admin/ads')).json.ads.find((a: any) => a.id === ci.json.ad.id);
    expect(row).toMatchObject({ views: 2, clicks: 1, live: true });
    expect((await adm.get('/admin/ads')).json.ads.find((a: any) => a.id === past.json.ad.id).live).toBe(false);
    expect((await mk({ linkUrl: 'javascript:alert(1)' })).status).toBe(400);
    expect((await mk({ linkUrl: 'http://x.test' })).status).toBe(400);
    expect((await mk({ linkUrl: '/boutique/abc' })).status).toBe(201);
    expect((await mk({ imageUrl: 'https://evil.test/x.png' })).status).toBe(400);
    expect((await mk({ startsAt: future(), endsAt: new Date(Date.now() - 1000).toISOString() })).status).toBe(400);
    expect((await adm.delete(`/admin/ads/${ci.json.ad.id}`)).status).toBe(200);
    expect(await titles('?country=CI')).toEqual(['gaRAN, le registre IMEI']); // il ne reste que la publicité « /boutique/abc » (tous pays)
  });

  it('avis : seulement après livraison, un par commande, prénom seul, modération admin', async () => {
    const { adm, owner, cust, id, offer } = await cashBooking();
    expect((await cust.post('/reviews', { bookingId: id, rating: 5, comment: 'Top' })).status).toBe(409); // pas encore livrée
    await owner.post(`/company/bookings/${id}/status`, { fulfillment: 'completed' });
    const other = await register('customer', 'autre@x.test');
    expect((await other.post('/reviews', { bookingId: id, rating: 1 })).status).toBe(404); // pas sa commande
    expect((await cust.post('/reviews', { bookingId: id, rating: 6 })).status).toBe(400);
    expect((await cust.post('/reviews', { bookingId: id, rating: 5, comment: 'Service impeccable' })).status).toBe(201);
    expect((await cust.post('/reviews', { bookingId: id, rating: 4 })).status).toBe(409);
    const pub = new Client(ctx.app);
    const list = (await pub.get(`/offers/${offer.id}/reviews`)).json.reviews;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ rating: 5, comment: 'Service impeccable', name: 'Test' });
    expect((await pub.get(`/offers/${offer.id}`)).json.offer).toMatchObject({ ratingAvg: 5, ratingCount: 1 });
    expect((await cust.get('/bookings/mine')).json.bookings[0].myRating).toBe(5);
    expect((await adm.get('/admin/kpis')).json.totals).toMatchObject({ rating_count: 1, rating_avg: 5 });
    const rid = (await adm.get('/admin/reviews')).json.reviews[0].id;
    expect((await adm.post(`/admin/reviews/${rid}/status`, { status: 'hidden' })).status).toBe(200);
    expect((await pub.get(`/offers/${offer.id}/reviews`)).json.reviews).toHaveLength(0);
    expect((await pub.get(`/offers/${offer.id}`)).json.offer.ratingCount).toBe(0);
  });

  it('favoris : ajout, retrait, liste des offres visibles, connexion requise', async () => {
    const { offer } = await setup(5, 5, 1000);
    expect((await new Client(ctx.app).put(`/favorites/${offer.id}`, {})).status).toBe(401);
    const cust = await register('customer', 'f@x.test');
    expect((await cust.put(`/favorites/${offer.id}`, {})).status).toBe(200);
    expect((await cust.put(`/favorites/${offer.id}`, {})).status).toBe(200); // idempotent
    expect((await cust.get('/favorites/ids')).json.ids).toEqual([offer.id]);
    expect((await cust.get('/favorites')).json.offers.map((o: any) => o.id)).toEqual([offer.id]);
    expect((await cust.put('/favorites/00000000-0000-4000-8000-000000000000', {})).status).toBe(404);
    expect((await cust.delete(`/favorites/${offer.id}`)).status).toBe(200);
    expect((await cust.get('/favorites')).json.offers).toHaveLength(0);
  });
});

describe('administrateurs pays (périmètre par pays)', () => {
  async function twoCountries() {
    const { adm, offer: ciOffer, co: ciCo } = await setup(5, 5, 1000);
    const o2 = await register('owner', 'benin@x.test');
    const bjCo = (await o2.post('/company', { name: 'Taxi Cotonou', activity: 'transport', country: 'BJ', city: 'Cotonou', serviceCities: ['Porto-Novo'], phone: '+229 01 00 00 00', ...geo })).json.company;
    await adm.post(`/admin/companies/${bjCo.id}/review`, { decision: 'approve' });
    const bjOffer = (await o2.post('/company/offers', { title: 'Cotonou → Porto-Novo', country: 'BJ', city: 'Cotonou', destCountry: 'BJ', destCity: 'Porto-Novo', stops: [], priceFcfa: 1000, capacity: 5, startsAt: future() })).json.offer;
    const mk = await adm.post('/admin/admins', { name: 'Admin CI', email: 'admin.ci@x.test', password: 'password123', country: 'CI', phone: '+225 07 00 00 00 00', orzAccount: 'ORZ-CI-0001' });
    expect(mk.status).toBe(201);
    const ci = new Client(ctx.app);
    expect((await ci.post('/auth/login', { email: 'admin.ci@x.test', password: 'password123' })).status).toBe(200);
    return { adm, ci, ciOffer, bjOffer, ciCo, bjCo };
  }

  it("crée, liste et supprime des administrateurs pays ; réservé à l'administrateur général", async () => {
    const { adm, ci } = await twoCountries();
    expect((await ci.get('/auth/me')).json.user).toMatchObject({ role: 'admin', adminCountry: 'CI' });
    expect((await adm.get('/auth/me')).json.user.adminCountry).toBeNull();
    const list = (await adm.get('/admin/admins')).json.admins;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ email: 'admin.ci@x.test', country: 'CI' });
    expect((await adm.post('/admin/admins', { name: 'Doublon', email: 'ADMIN.CI@x.test', password: 'password123', country: 'BJ', phone: '+229 01 00 00 00', orzAccount: 'ORZ-BJ-1' })).status).toBe(409);
    expect((await ci.get('/admin/admins')).status).toBe(403);
    expect((await ci.post('/admin/admins', { name: 'X Y', email: 'z@x.test', password: 'password123', country: 'BJ', phone: '+229 01 00 00 00', orzAccount: 'ORZ-BJ-1' })).status).toBe(403);
    expect((await adm.post(`/admin/admins/${list[0].id}/password`, { password: 'newpassword123' })).status).toBe(200);
    expect((await new Client(ctx.app).post('/auth/login', { email: 'admin.ci@x.test', password: 'newpassword123' })).status).toBe(200);
    expect((await adm.delete(`/admin/admins/${list[0].id}`)).status).toBe(200);
    expect((await adm.get('/admin/admins')).json.admins).toHaveLength(0);
  });

  it('détail, modification, suspension (session coupée), réactivation et journal d\'audit', async () => {
    const { adm, ci, ciCo } = await twoCountries();
    const id = (await adm.get('/admin/admins')).json.admins[0].id;
    expect((await ci.post(`/admin/companies/${ciCo.id}/credits`, { credits: 2 })).status).toBe(200);
    const d = (await adm.get(`/admin/admins/${id}`)).json;
    expect(d.admin).toMatchObject({ email: 'admin.ci@x.test', country: 'CI', disabledAt: null, phone: '+225 07 00 00 00 00', orzAccount: 'ORZ-CI-0001' });
    expect((await adm.post('/admin/admins', { name: 'Sans Tel', email: 'q@x.test', password: 'password123', country: 'BJ' })).status).toBe(400);
    expect((await adm.patch(`/admin/admins/${id}`, { phone: '+225 05 11 22 33 44', orzAccount: 'ORZ-CI-0002' })).status).toBe(200);
    expect((await adm.get(`/admin/admins/${id}`)).json.admin).toMatchObject({ phone: '+225 05 11 22 33 44', orzAccount: 'ORZ-CI-0002' });
    expect(d.admin.lastLoginAt).toBeTruthy();
    expect(d.stats.shops_active).toBe(1);
    expect(d.stats.actions_total).toBeGreaterThanOrEqual(1);
    expect(d.recent.some((r: any) => r.path.includes('/credits'))).toBe(true);
    expect(JSON.stringify(d.recent)).not.toContain('password');
    expect((await ci.get(`/admin/admins/${id}`)).status).toBe(403);
    expect((await adm.patch(`/admin/admins/${id}`, { name: 'Nouveau Nom', country: 'BJ' })).status).toBe(200);
    expect((await adm.get('/admin/admins')).json.admins[0]).toMatchObject({ name: 'Nouveau Nom', country: 'BJ' });
    expect((await adm.patch(`/admin/admins/${id}`, { email: 'benin@x.test' })).status).toBe(409);
    expect((await ci.patch(`/admin/admins/${id}`, { disabled: true })).status).toBe(403);
    expect((await adm.patch(`/admin/admins/${id}`, { disabled: true })).status).toBe(200);
    expect((await ci.get('/admin/kpis')).status).toBe(401);
    const blocked = await new Client(ctx.app).post('/auth/login', { email: 'admin.ci@x.test', password: 'password123' });
    expect(blocked.status).toBe(403);
    expect((await adm.patch(`/admin/admins/${id}`, { disabled: false })).status).toBe(200);
    expect((await new Client(ctx.app).post('/auth/login', { email: 'admin.ci@x.test', password: 'password123' })).status).toBe(200);
    const audit = (await adm.get('/admin/audit')).json.audit;
    expect(audit.length).toBeGreaterThan(0);
    expect(audit.some((r: any) => r.method === 'PATCH' && r.path.includes('/admins/'))).toBe(true);
    expect((await ci.get('/admin/audit')).status).toBe(403);
  });

  it("suivi d'activité par pays : états, alertes, réservé à l'administrateur général", async () => {
    const { adm, ci } = await twoCountries();
    const { countries } = (await adm.get('/admin/countries-activity')).json;
    const byc = Object.fromEntries(countries.map((c: any) => [c.country, c]));
    expect(byc.CI).toMatchObject({ shopsActive: 1, offersLive: 1, adminsEnabled: 1 });
    expect(byc.CI.alerts).not.toContain('no_admin');
    expect(byc.BJ).toMatchObject({ shopsActive: 1, adminsEnabled: 0 });
    expect(byc.BJ.alerts).toContain('no_admin');
    expect(['active', 'quiet']).toContain(byc.CI.state);
    expect((await ci.get('/admin/countries-activity')).status).toBe(403);
  });

  it('un administrateur pays ne voit que son pays (KPI, boutiques, paiements, avis, stats)', async () => {
    const { adm, ci } = await twoCountries();
    const all = (await adm.get('/admin/partners')).json.partners;
    expect(all).toHaveLength(2);
    const mine = (await ci.get('/admin/partners')).json;
    expect(mine.partners.map((p: any) => p.country)).toEqual(['CI']);
    expect(mine.countries.map((c: any) => c.country)).toEqual(['CI']);
    expect((await ci.get('/admin/partners?country=BJ')).status).toBe(403);
    const k = (await ci.get('/admin/kpis')).json;
    expect(k.country).toBe('CI');
    expect(k.byCountry.map((r: any) => r.country)).toEqual(['CI']);
    expect(k.totals.partners_active).toBe(1);
    expect((await ci.get('/admin/kpis?country=BJ')).status).toBe(403);
    expect((await ci.get('/admin/kpis?country=CI')).status).toBe(200);
    expect((await adm.get('/admin/kpis')).json.totals.partners_active).toBe(2);
    expect((await ci.get('/admin/partner-payments?country=BJ')).status).toBe(403);
    expect((await ci.get('/admin/partner-payments')).json.partners.map((p: any) => p.country)).toEqual(['CI']);
    expect((await ci.get('/admin/companies')).json.companies.map((c: any) => c.country)).toEqual(['CI']);
    expect((await ci.get('/admin/stats')).json.companies).toBe(1);
    expect((await adm.get('/admin/stats')).json.companies).toBe(2);
  });

  it("un administrateur pays ne peut pas agir sur une boutique d'un autre pays", async () => {
    const { ci, ciCo, bjCo } = await twoCountries();
    expect((await ci.post(`/admin/companies/${bjCo.id}/status`, { status: 'suspended' })).status).toBe(403);
    expect((await ci.post(`/admin/companies/${bjCo.id}/credits`, { credits: 5 })).status).toBe(403);
    expect((await ci.post(`/admin/companies/${bjCo.id}/review`, { decision: 'approve' })).status).toBe(403);
    expect((await ci.post(`/admin/partners/${bjCo.id}/remind-orzayah`)).status).toBe(403);
    expect((await ci.post(`/admin/companies/${ciCo.id}/credits`, { credits: 5 })).status).toBe(200);
    expect((await ci.post(`/admin/companies/${ciCo.id}/status`, { status: 'suspended' })).status).toBe(200);
  });

  it('publicités et mises en avant : cantonnées au pays de l\'administrateur pays', async () => {
    const { adm, ci, ciOffer, bjOffer } = await twoCountries();
    // Création : le pays est imposé, quoi qu'il demande.
    const mine = (await ci.post('/admin/ads', { advertiser: 'Pub CI', title: 'Offre locale', linkUrl: 'https://x.test', countries: ['BJ', 'SN'] })).json.ad;
    expect(mine.countries).toEqual(['CI']);
    const general = (await adm.post('/admin/ads', { advertiser: 'gaRAN', title: 'Toute l\'Afrique', linkUrl: 'https://x.test', countries: [] })).json.ad;
    const bj = (await adm.post('/admin/ads', { advertiser: 'Pub BJ', title: 'Offre Bénin', linkUrl: 'https://x.test', countries: ['BJ'] })).json.ad;
    expect((await ci.get('/admin/ads')).json.ads.map((a: any) => a.id)).toEqual([mine.id]);
    expect((await adm.get('/admin/ads')).json.ads).toHaveLength(3);
    expect((await ci.patch(`/admin/ads/${bj.id}`, { title: 'Piraté' })).status).toBe(403);
    expect((await ci.patch(`/admin/ads/${general.id}`, { title: 'Piraté' })).status).toBe(403);
    expect((await ci.patch(`/admin/ads/${mine.id}`, { title: 'Offre locale 2', countries: ['BJ'] })).json.ad.countries).toEqual(['CI']);
    await ci.delete(`/admin/ads/${bj.id}`); // sans effet sur une publicité d'un autre pays
    expect((await adm.get('/admin/ads')).json.ads).toHaveLength(3);
    expect((await ci.delete(`/admin/ads/${mine.id}`)).status).toBe(200);
    // Mise en avant
    expect((await ci.put(`/admin/featured/${bjOffer.id}`, {})).status).toBe(403);
    expect((await ci.put(`/admin/featured/${ciOffer.id}`, { countries: ['BJ'] })).status).toBe(200);
    expect((await adm.get('/admin/featured')).json.featured[0].countries).toEqual(['CI']);
    expect((await ci.get('/admin/offer-search?q=ab')).json.offers.every((o: any) => o.companyCountry === 'CI')).toBe(true);
    await adm.put(`/admin/featured/${bjOffer.id}`, {});
    expect((await ci.get('/admin/featured')).json.featured.map((f: any) => f.offerId)).toEqual([ciOffer.id]);
    expect((await ci.delete(`/admin/featured/${bjOffer.id}`)).status).toBe(403);
  });

  it("l'affichage global du site reste réservé à l'administrateur général", async () => {
    const { adm, ci } = await twoCountries();
    expect((await ci.get('/admin/display')).status).toBe(403);
    expect((await adm.get('/admin/display')).status).toBe(200);
  });

  it("les alertes d'un pays vont à son administrateur pays et aux généraux, pas aux autres pays", async () => {
    const { adm, ci, bjCo } = await twoCountries();
    const bj = new Client(ctx.app);
    await adm.post('/admin/admins', { name: 'Admin BJ', email: 'admin.bj@x.test', password: 'password123', country: 'BJ', phone: '+229 01 00 00 00', orzAccount: 'ORZ-BJ-1' });
    await bj.post('/auth/login', { email: 'admin.bj@x.test', password: 'password123' });
    const o3 = await register('owner', 'togo@x.test');
    await o3.post('/company', { name: 'Taxi Lomé', activity: 'transport', country: 'TG', city: 'Lomé', serviceCities: [], phone: '+228 90 00 00 00', ...geo });
    const has = async (c: Client) => (await c.get('/notifications')).json.notifications.some((n: any) => n.kind === 'company_request' && String(n.title).includes('Lomé'));
    expect(await has(adm)).toBe(true);
    expect(await has(ci)).toBe(false);
    expect(await has(bj)).toBe(false);
    void bjCo;
  });
});
