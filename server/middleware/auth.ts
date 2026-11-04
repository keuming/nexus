import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import type { Db } from '../db/client.js';
import { readSession, type Role, type SessionUser } from '../lib/auth.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import { COOKIE_NAME } from '../../shared/constants.js';

import type { OrzayahClient } from '../lib/orzayah.js';
export type Env = { Variables: { db: Db; user: SessionUser | null; orz: OrzayahClient | null } };

/** Décode le cookie de session ; n'échoue jamais (user = null si absent/invalide). */
export const session = createMiddleware<Env>(async (c, next) => {
  const token = getCookie(c, COOKIE_NAME);
  c.set('user', token ? await readSession(token) : null);
  await next();
});

export const requireRole = (...roles: Role[]) =>
  createMiddleware<Env & { Variables: { user: SessionUser } }>(async (c, next) => {
    const u = c.get('user');
    if (!u) throw unauthorized();
    if (!roles.includes(u.role)) throw forbidden();
    await next();
  });

/**
 * Défense CSRF en plus de SameSite=Lax. Les navigateurs modernes envoient `Sec-Fetch-Site` (fiable, non falsifiable par une page) ;
 * à défaut on compare l'hôte de l'en-tête Origin à celui de la requête.
 */
export const sameOrigin = createMiddleware<Env>(async (c, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const site = c.req.header('sec-fetch-site');
    const origin = c.req.header('origin');
    if (site) {
      if (site !== 'same-origin' && site !== 'none') throw forbidden('Origine non autorisée');
    } else if (origin) {
      const host = c.req.header('x-forwarded-host') ?? c.req.header('host');
      if (new URL(origin).host !== host) throw forbidden('Origine non autorisée');
    }
  }
  await next();
});
