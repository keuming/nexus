import { beforeEach, describe, expect, it } from 'vitest';
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
  const offer = (await owner.post('/company/offers', { title: 'Abidjan → Bouaké', country: 'CI', city: 'Abidjan', stops: [], priceFcfa, capacity, startsAt: future() })).json.offer;
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
    await owner.post('/company/offers', { title: 'Dîner', country: 'CI', city: 'Abidjan', priceFcfa: 0, capacity: 5, startsAt: future() });
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
      title: 'Abidjan → Ouagadougou', country: 'BF', city: 'Abidjan', stops: ['Gare de Ouaga Nord', 'Bobo-Dioulasso'], priceFcfa: 0, capacity: 30, startsAt: future(),
    })).json.offer;
    return { owner, offer };
  }

  it('filtre le catalogue par pays et par ville ou arrêt', async () => {
    await transportOffer();
    const anon = new Client(ctx.app);
    expect((await anon.get('/offers?country=BF')).json.offers).toHaveLength(1);
    expect((await anon.get('/offers?country=CI')).json.offers).toHaveLength(0);
    expect((await anon.get('/offers?country=BF&city=bobo-dioulasso')).json.offers).toHaveLength(1);
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
  const pay = { operator: 'ORANGE', accountNumber: '07 07 07 07 07' };
  let orz: FakeOrz;
  beforeEach(async () => { orz = new FakeOrz(); ctx = await makeApp(orz); });
  const state = async (offerId: string, coId: string) => {
    const [o] = await ctx.db.select().from(offers).where(eq(offers.id, offerId));
    const [c] = await ctx.db.select().from(companies).where(eq(companies.id, coId));
    return { booked: o.booked, credits: c.credits };
  };
  const key = (paymentId: string) => `nx-${paymentId}`;
  /** Suivi client en contournant l'espacement de 3 s entre deux relectures ORZAYAH. */
  const poll = async (c: Client, pid: string) => { await ctx.db.update(payments).set({ lastCheckedAt: null }).where(eq(payments.id, pid)); return c.get(`/payments/${pid}`); };

  it('exige un moyen de paiement pour une offre payante', async () => {
    const { offer } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id })).status).toBe(400);
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id, payment: { operator: 'ORANGE', accountNumber: '12' } })).status).toBe(400);
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id, payment: { operator: 'PAYPAL', accountNumber: '0707070707' } })).status).toBe(400);
    expect(orz.deposits).toHaveLength(0);
  });

  it("répond 503 sans bloquer de places quand ORZAYAH n'est pas configuré", async () => {
    ctx = await makeApp(null);
    const { offer, co } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id, payment: pay })).status).toBe(503);
    expect(await state(offer.id, co.id)).toEqual({ booked: 0, credits: 5 });
  });

  it('paiement réussi : bloque, puis confirme à SUCCESS (idempotent)', async () => {
    const { offer, co, owner, adm } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, guests: Array(2).fill('Passager Test'), offerId: offer.id, seats: 2, payment: pay });
    expect(r.status).toBe(201);
    expect(r.json.booking.status).toBe('pending_payment');
    expect(r.json.payment.status).toBe('pending');
    expect(r.json.payment.account).toBe('•••707'); // numéro masqué
    expect(JSON.stringify(r.json)).not.toContain('0707070707');
    expect(orz.deposits[0]).toMatchObject({ operator: 'ORANGE', accountNumber: '0707070707', amountCentimes: 5000 * 2 * 100 });
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
    expect((await adm.get('/admin/payouts')).json.payouts[0]).toMatchObject({ totalFcfa: 10000 });
    expect((await adm.post(`/admin/companies/${co.id}/payouts`)).json).toMatchObject({ count: 1, totalFcfa: 10000 });
    expect((await adm.get('/admin/payouts')).json.payouts).toHaveLength(0);
  });

  it('paiement échoué : libère les places et rend le crédit', async () => {
    const { offer, co } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id, payment: pay });
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
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id, payment: pay });
    expect(r.status).toBe(400);
    expect(await state(offer.id, co.id)).toEqual({ booked: 0, credits: 5 });
  });

  it('erreur réseau à la création : reste en attente, puis rejoue avec la MÊME clé', async () => {
    const { offer } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    orz.lostNext = true;
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id, payment: pay });
    expect(r.status).toBe(201);
    expect(r.json.payment.status).toBe('pending');
    expect(orz.ops.size).toBe(0);
    const s = await poll(cust, r.json.payment.id);
    expect(s.json.payment.status).toBe('pending');
    expect(orz.deposits).toHaveLength(2);
    expect(orz.deposits[1].idempotencyKey).toBe(orz.deposits[0].idempotencyKey);
    expect(orz.ops.size).toBe(1);
  });

  it('délai dépassé : expire et libère ; un paiement tardif réactive la réservation', async () => {
    const { offer, co } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id, payment: pay });
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
    const ra = await a.post('/bookings', { ...BK, offerId: offer.id, payment: pay });
    await ctx.db.update(payments).set({ expiresAt: new Date(Date.now() - 1000), lastCheckedAt: null });
    await poll(a, ra.json.payment.id); // expire, libère la place
    expect((await b.post('/bookings', { ...BK, offerId: offer.id, payment: pay })).status).toBe(201); // la place est reprise
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
    expect(orz.deposits).toHaveLength(0);

    const paidOffer = (await free.owner.post('/company/offers', { title: 'Payant', country: 'CI', city: 'Abidjan', priceFcfa: 3000, capacity: 5, startsAt: future() })).json.offer;
    const p = await cust.post('/bookings', { ...BK, offerId: paidOffer.id, payment: pay });
    orz.set(key(p.json.payment.id), 'SUCCESS');
    await poll(cust, p.json.payment.id);
    expect((await cust.post(`/bookings/${p.json.booking.id}/cancel`)).status).toBe(409);
    expect((await cust.post(`/bookings/${r.json.booking.id}/cancel`)).status).toBe(200);
  });

  it("protège le suivi : seul le client (ou l'admin) voit son paiement", async () => {
    const { offer, adm } = await setup(5, 5, 5000);
    const cust = await register('customer', 'c@x.test');
    const other = await register('customer', 'd@x.test');
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id, payment: pay });
    expect((await poll(other, r.json.payment.id)).status).toBe(404);
    expect((await new Client(ctx.app).get(`/payments/${r.json.payment.id}`)).status).toBe(401);
    expect((await poll(adm, r.json.payment.id)).status).toBe(200);
    expect((await cust.get('/admin/payments')).status).toBe(403);
  });

  it('limite les réservations en attente de paiement par client', async () => {
    const { offer } = await setup(10, 10, 5000);
    const cust = await register('customer', 'c@x.test');
    for (let i = 0; i < 3; i++) expect((await cust.post('/bookings', { ...BK, offerId: offer.id, payment: pay })).status).toBe(201);
    expect((await cust.post('/bookings', { ...BK, offerId: offer.id, payment: pay })).status).toBe(429);
  });
});

describe('photos des offres', () => {
  // JPEG minimal valide (en-tête FF D8 FF)
  const jpeg = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 0xff, 0xd9]).toString('base64');
  it('enregistre jusqu\'à 4 photos, les sert publiquement et refuse le reste', async () => {
    const { owner } = await setup(5, 5, 0);
    const base = { title: 'Avec photos', country: 'CI', city: 'Abidjan', priceFcfa: 0, capacity: 5, startsAt: future() };
    expect((await owner.post('/company/offers', { ...base, photos: [jpeg, jpeg, jpeg, jpeg, jpeg] })).status).toBe(400);
    expect((await owner.post('/company/offers', { ...base, photos: ['data:image/png;base64,AAAA'] })).status).toBe(400);
    const fake = 'data:image/jpeg;base64,' + Buffer.from('<script>alert(1)</script>').toString('base64');
    expect((await owner.post('/company/offers', { ...base, photos: [fake] })).status).toBe(400);
    const r = await owner.post('/company/offers', { ...base, photos: [jpeg, jpeg, jpeg, jpeg] });
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
      expect((await owner.post('/company/offers', { ...base, photos: [bad] })).status).toBe(400);
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/nexus/offers/a.jpg';
    const r = await owner.post('/company/offers', { ...base, photos: [url + '?x=1'] });
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
    const r = await cust.post('/bookings', { ...BK, offerId: offer.id, payment: { operator: 'ORANGE', accountNumber: '0707070707' } });
    expect((await owner.get('/notifications')).json.notifications.filter((n: any) => n.kind === 'booking')).toHaveLength(0);
    orz.set(`nx-${r.json.payment.id}`, 'SUCCESS');
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
  const body = (extra = {}) => ({ title: 'Poulet braisé', description: 'Servi avec attiéké', country: 'CI', city: 'Abidjan', priceFcfa: 0, capacity: 10, startsAt: future(), ...extra });

  it('modifie une offre : champs, capacité protégée, date future, photos conservées/remplacées/retirées', async () => {
    const { owner } = await setup(5, 5, 0);
    const o = (await owner.post('/company/offers', body({ photos: [jpeg, jpeg] }))).json.offer;
    expect((await owner.patch(`/company/offers/${o.id}`, { active: false })).json.offer.photoCount).toBe(2); // désactiver ne touche pas aux photos
    const r = await owner.patch(`/company/offers/${o.id}`, { title: 'Poulet DG', priceFcfa: 4500, capacity: 12 });
    expect(r.json.offer).toMatchObject({ title: 'Poulet DG', priceFcfa: 4500, capacity: 12, description: 'Servi avec attiéké', active: false });
    expect((await owner.patch(`/company/offers/${o.id}`, { startsAt: new Date(Date.now() - 3600_000).toISOString() })).status).toBe(400);
    expect((await owner.patch(`/company/offers/${o.id}`, { startsAt: o.startsAt })).status).toBe(200); // date inchangée acceptée

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

  it('liste les moyens de paiement ORZAYAH', async () => {
    ctx = await makeApp(new FakeOrz());
    const cust = await register('customer', 'c@x.test');
    const r = (await cust.get('/payments/methods')).json;
    expect(r.available).toBe(true);
    expect(r.methods.map((m: any) => m.id)).toEqual(['ORANGE', 'MTN', 'MOOV', 'WAVE']);
    ctx = await makeApp(null);
    const c2 = await register('customer', 'e@x.test');
    expect((await c2.get('/payments/methods')).json.available).toBe(false);
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
});
