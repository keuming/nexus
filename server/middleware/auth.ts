import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import type { Db } from '../db/client.js';
import { readSession, type Role, type SessionUser } from '../lib/auth.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import { COOKIE_NAME } from '../../shared/constants.js';

export type Env = { Variables: { db: Db; user: SessionUser | null } };

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

/** Défense CSRF en plus de SameSite=Lax : refuse les écritures dont l'Origin ne correspond pas à l'hôte. */
export const sameOrigin = createMiddleware<Env>(async (c, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const origin = c.req.header('origin');
    if (origin && new URL(origin).host !== new URL(c.req.url).host && new URL(origin).host !== c.req.header('host')) {
      throw forbidden('Origine non autorisée');
    }
  }
  await next();
});
