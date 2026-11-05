import { notifyAdmins } from '../lib/notify.js';
import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { companies, users } from '../db/schema.js';
import { companyInput, phoneField } from '../lib/schemas.js';
import { hashPassword, signSession, verifyPassword } from '../lib/auth.js';
import { AppError, conflict, unauthorized } from '../lib/errors.js';
import type { Env } from '../middleware/auth.js';
import { COOKIE_NAME, SESSION_DAYS } from '../../shared/constants.js';

const cred = {
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8, '8 caractères minimum').max(200),
};

const cookieOpts = () => ({
  httpOnly: true,
  sameSite: 'Lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_DAYS * 86400,
});

const publicUser = (u: typeof users.$inferSelect) => ({ id: u.id, email: u.email, name: u.name, role: u.role });

// Hash factice généré à la volée : égalise le temps de réponse quand l'email est inconnu (anti-énumération).
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword('nexus-dummy-password'));

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
      await notifyAdmins(c.get('db'), { kind: 'company_request', refId: user.companyId, title: `Nouvelle demande partenaire : ${company.name}`, body: `${manager.name} (${manager.title}) · ${company.city}`, link: '/admin' });
      setCookie(c, COOKIE_NAME, await signSession({ id: user.id, role: user.role }), cookieOpts());
      return c.json({ user: publicUser(user) }, 201);
    },
  )
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
