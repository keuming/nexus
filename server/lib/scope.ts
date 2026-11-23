import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import { adminAudit, users } from '../db/schema.js';
import { forbidden, unauthorized } from './errors.js';
import type { Env } from '../middleware/auth.js';

/**
 * Périmètre de l'administrateur : `null` = administrateur général (tous les pays), sinon le code du seul pays qu'il gère.
 * Refuse un compte suspendu (même avec une session encore valide) et journalise toute action d'écriture (audit).
 */
export const adminScope = createMiddleware<Env>(async (c, next) => {
  const u = c.get('user');
  let name = '';
  if (c.get('adminCountry') === undefined) {
    const [r] = u ? await c.get('db').select({ ac: users.adminCountry, off: users.disabledAt, name: users.name }).from(users).where(eq(users.id, u.id)).limit(1) : [];
    if (u && (!r || r.off)) throw unauthorized();
    c.set('adminCountry', r?.ac ?? null);
    name = r?.name ?? '';
  }
  await next();
  if (u && c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    try {
      await c.get('db').insert(adminAudit).values({ userId: u.id, userName: name, country: c.get('adminCountry') ?? null, method: c.req.method, path: c.req.path.slice(0, 200), status: c.res.status });
    } catch { /* le journal ne doit jamais bloquer l'action */ }
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ctx = { get: (key: any) => any };
/** Pays à appliquer : celui de l'administrateur pays (imposé), sinon celui demandé. */
export function scopeCountry(c: Ctx, requested?: string): string | undefined {
  const a = c.get('adminCountry');
  if (!a) return requested;
  if (requested && requested !== a) throw forbidden('Pays hors de votre périmètre');
  return a;
}
/** Refuse l'accès à une donnée d'un autre pays. */
export function assertCountry(c: Ctx, country: string | null | undefined) {
  const a = c.get('adminCountry');
  if (a && country !== a) throw forbidden('Pays hors de votre périmètre');
}
/** Réservé à l'administrateur général. */
export const generalOnly = createMiddleware<Env>(async (c, next) => {
  if (c.get('adminCountry')) throw forbidden('Réservé à l’administrateur général');
  await next();
});
