import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { Client, makeApp } from './helpers.js';
import { companies, offers, users } from '../server/db/schema.js';
import { hashPassword } from '../server/lib/auth.js';

let ctx: Awaited<ReturnType<typeof makeApp>>;
const future = () => new Date(Date.now() + 86400_000).toISOString();

beforeEach(async () => { ctx = await makeApp(); });

async function register(role: 'customer' | 'owner', email: string) {
  const c = new Client(ctx.app);
  const r = await c.post('/auth/register', { email, password: 'password123', name: 'Test User', role });
  expect(r.status).toBe(201);
  return c;
}
async function admin() {
  await ctx.db.insert(users).values({ email: 'admin@nexus.test', name: 'Admin', role: 'admin', passwordHash: await hashPassword('adminpass123') });
  const c = new Client(ctx.app);
  expect((await c.post('/auth/login', { email: 'admin@nexus.test', password: 'adminpass123' })).status).toBe(200);
  return c;
}
/** Entreprise active avec `credits` crédits et une offre de `capacity` places. */
async function setup(credits: number, capacity: number) {
  const owner = await register('owner', 'owner@x.test');
  const co = (await owner.post('/company', { name: 'Bus Abidjan', activity: 'transport', city: 'Abidjan' })).json.company;
  const adm = await admin();
  await adm.post(`/admin/companies/${co.id}/status`, { status: 'active' });
  if (credits) await adm.post(`/admin/companies/${co.id}/credits`, { credits });
  const offer = (await owner.post('/company/offers', { title: 'Abidjan → Bouaké', priceFcfa: 5000, capacity, startsAt: future() })).json.offer;
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
  });
});

describe('réservations', () => {
  it('flux complet : validation admin → catalogue → réservation → crédit débité → annulation remboursée', async () => {
    const owner = await register('owner', 'o@x.test');
    const co = (await owner.post('/company', { name: 'Resto', activity: 'restauration', city: 'Abidjan' })).json.company;
    expect(co.status).toBe('pending');
    await owner.post('/company/offers', { title: 'Dîner', priceFcfa: 8000, capacity: 5, startsAt: future() });
    const anon = new Client(ctx.app);
    expect((await anon.get('/offers')).json.offers).toHaveLength(0); // entreprise non validée

    const adm = await admin();
    await adm.post(`/admin/companies/${co.id}/status`, { status: 'active' });
    const top = await adm.post(`/admin/companies/${co.id}/credits`, { credits: 10 });
    expect(top.json.amountFcfa).toBe(1250);

    const offerId = (await anon.get('/offers?activity=restauration')).json.offers[0].id;
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { offerId, seats: 2 });
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
    const rs = await Promise.all([a.post('/bookings', { offerId: offer.id }), b.post('/bookings', { offerId: offer.id })]);
    expect(rs.map((r) => r.status).sort()).toEqual([201, 409]);
    const [o] = await ctx.db.select().from(offers).where(eq(offers.id, offer.id));
    expect(o.booked).toBe(1);
  });

  it('annule tout (rollback) si l\'entreprise n\'a plus de crédits', async () => {
    const { offer, co } = await setup(0, 5);
    const cust = await register('customer', 'c@x.test');
    const r = await cust.post('/bookings', { offerId: offer.id });
    expect(r.status).toBe(409);
    const [o] = await ctx.db.select().from(offers).where(eq(offers.id, offer.id));
    expect(o.booked).toBe(0); // la place n'a pas été consommée
    const [c] = await ctx.db.select().from(companies).where(eq(companies.id, co.id));
    expect(c.credits).toBe(0);
  });

  it('refuse une offre inexistante ou une entreprise suspendue', async () => {
    const { offer, adm, co } = await setup(5, 5);
    const cust = await register('customer', 'c@x.test');
    expect((await cust.post('/bookings', { offerId: '00000000-0000-4000-8000-000000000000' })).status).toBe(404);
    await adm.post(`/admin/companies/${co.id}/status`, { status: 'suspended' });
    expect((await cust.post('/bookings', { offerId: offer.id })).status).toBe(409);
  });

  it("isole les données : un propriétaire ne voit que ses réservations", async () => {
    const { owner, offer } = await setup(5, 5);
    const cust = await register('customer', 'c@x.test');
    await cust.post('/bookings', { offerId: offer.id });
    expect((await owner.get('/company/bookings')).json.bookings).toHaveLength(1);
    const other = await register('owner', 'o2@x.test');
    await other.post('/company', { name: 'Autre', activity: 'hotel', city: 'Dakar' });
    expect((await other.get('/company/bookings')).json.bookings).toHaveLength(0);
    expect((await other.patch(`/company/offers/${offer.id}`, { active: false })).status).toBe(404);
  });
});
