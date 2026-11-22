import { notifyAdmins } from '../lib/notify.js';
import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { companies, users } from '../db/schema.js';
import { companyInput, phoneField } from '../lib/schemas.js';
import { randomUUID, randomBytes } from 'node:crypto';
import { hashPassword, signSession, verifyPassword } from '../lib/auth.js';
import { AppError, conflict, unauthorized } from '../lib/errors.js';
import type { Env } from '../middleware/auth.js';
import { COOKIE_NAME, SESSION_DAYS } from '../../shared/constants.js';

const GUEST_DOMAIN = '@invite.backmarket.invalid';
const cred = {
  email: z.string().trim().toLowerCase().email().max(200).refine((e) => !e.endsWith(GUEST_DOMAIN), 'Adresse e-mail invalide'),
  password: z.string().min(8, '8 caractères minimum').max(200),
};

const cookieOpts = () => ({
  httpOnly: true,
  sameSite: 'Lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_DAYS * 86400,
});

/** Compte « invité » : créé pour réserver sans inscription. Son e-mail est fictif (jamais utilisable pour se connecter). */
const publicUser = (u: typeof users.$inferSelect) => ({ id: u.id, email: u.email.endsWith(GUEST_DOMAIN) ? '' : u.email, name: u.name, role: u.role, adminCountry: u.adminCountry, guest: u.email.endsWith(GUEST_DOMAIN) });

// Hash factice généré à la volée : égalise le temps de réponse quand l'email est inconnu (anti-énumération).
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword('backmarket-dummy-password'));

export const authRoutes = new Hono<Env>()
  .post(
    '/register',
    v('json', z.object({ ...cred, name: z.string().trim().min(2).max(100), role: z.enum(['customer', 'owner']).default('customer') })),
    async (c) => {
      const b = c.req.valid('json');
      const db = c.get('db');
      const exists = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${b.email}`).limit(1);
      if (exists.length) throw conflict('email_taken', 'Cet email est déjà utilisé');
      const [u] = await db.insert(users).values({ email: b.email, name: b.name, role: b.role, passwordHash: await hashPassword(b.password) }).returning();
      setCookie(c, COOKIE_NAME, await signSession({ id: u.id, role: u.role }), cookieOpts());
      return c.json({ user: publicUser(u) }, 201);
    },
  )
  /**
   * Souscription d'une entreprise : crée le compte du gérant et la demande d'ouverture (en attente de validation)
   * en une seule transaction — rien n'est créé si l'une des deux étapes échoue.
   */
  .post(
    '/register-company',
    v('json', z.object({
      manager: z.object({ ...cred, name: z.string().trim().min(2).max(100), title: z.string().trim().min(2).max(80), phone: phoneField }),
      company: companyInput,
    })),
    async (c) => {
      const { manager, company } = c.req.valid('json');
      const user = await c.get('db').transaction(async (tx) => {
        const exists = await tx.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${manager.email}`).limit(1);
        if (exists.length) throw conflict('email_taken', 'Cet email est déjà utilisé');
        const [u] = await tx.insert(users).values({ email: manager.email, name: manager.name, phone: manager.phone, role: 'owner', passwordHash: await hashPassword(manager.password) }).returning();
        const [co] = await tx.insert(companies).values({ ...company, managerTitle: manager.title, ownerId: u.id }).returning({ id: companies.id });
        return { ...u, companyId: co.id };
      });
      await notifyAdmins(c.get('db'), { kind: 'company_request', refId: user.companyId, title: `Nouvelle demande partenaire : ${company.name}`, body: `${manager.name} (${manager.title}) · ${company.city}`, link: '/admin' }, company.country);
      setCookie(c, COOKIE_NAME, await signSession({ id: user.id, role: user.role }), cookieOpts());
      return c.json({ user: publicUser(user) }, 201);
    },
  )
  /** Réserver sans créer de compte : session d'invité (le client pourra créer son compte plus tard, depuis sa confirmation). */
  .post('/guest', v('json', z.object({ name: z.string().trim().min(2).max(100) })), async (c) => {
    const s = c.get('user');
    const db = c.get('db');
    if (s) {
      const [cur] = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
      if (cur) return c.json({ user: publicUser(cur) });
    }
    const [u] = await db.insert(users).values({ email: `invite-${randomUUID()}${GUEST_DOMAIN}`, name: c.req.valid('json').name, role: 'customer', passwordHash: await hashPassword(randomBytes(24).toString('hex')) }).returning();
    setCookie(c, COOKIE_NAME, await signSession({ id: u.id, role: u.role }), cookieOpts());
    return c.json({ user: publicUser(u) }, 201);
  })
  /** Transforme le compte invité en vrai compte (e-mail + mot de passe) : les réservations déjà faites sont conservées. */
  .post('/upgrade', v('json', z.object({ ...cred })), async (c) => {
    const s = c.get('user');
    if (!s) throw unauthorized();
    const db = c.get('db');
    const b = c.req.valid('json');
    const [cur] = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
    if (!cur) throw unauthorized();
    if (!cur.email.endsWith(GUEST_DOMAIN)) throw conflict('not_guest', 'Ce compte est déjà un compte complet');
    const exists = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${b.email}`).limit(1);
    if (exists.length) throw conflict('email_taken', 'Cet email est déjà utilisé : connectez-vous avec ce compte');
    const [u] = await db.update(users).set({ email: b.email, passwordHash: await hashPassword(b.password) }).where(eq(users.id, cur.id)).returning();
    return c.json({ user: publicUser(u) });
  })
  .post('/login', v('json', z.object({ email: cred.email, password: z.string().min(1).max(200) })), async (c) => {
    const { email, password } = c.req.valid('json');
    const [u] = await c.get('db').select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
    const ok = await verifyPassword(password, u?.passwordHash ?? (await getDummyHash()));
    if (!u || !ok) throw new AppError(401, 'bad_credentials', 'Email ou mot de passe incorrect');
    setCookie(c, COOKIE_NAME, await signSession({ id: u.id, role: u.role }), cookieOpts());
    return c.json({ user: publicUser(u) });
  })
  .post('/logout', (c) => {
    deleteCookie(c, COOKIE_NAME, { ...cookieOpts(), path: '/' });
    return c.json({ ok: true });
  })
  .get('/me', async (c) => {
    const s = c.get('user');
    if (!s) throw unauthorized();
    const [u] = await c.get('db').select().from(users).where(eq(users.id, s.id)).limit(1);
    if (!u) throw unauthorized();
    return c.json({ user: publicUser(u) });
  });
