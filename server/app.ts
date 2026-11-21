import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { sql } from 'drizzle-orm';
import type { Db } from './db/client.js';
import { AppError } from './lib/errors.js';
import { sameOrigin, session, type Env } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { adsRoutes, favoriteRoutes, reviewRoutes } from './routes/engage.js';
import { catalogRoutes } from './routes/catalog.js';
import { bookingRoutes } from './routes/bookings.js';
import { companyRoutes } from './routes/company.js';
import { adminRoutes } from './routes/admin.js';
import { paymentRoutes } from './routes/payments.js';
import { orzayahRoutes } from './routes/orzayah.js';
import { notificationRoutes } from './routes/notifications.js';
import { defaultOrzayah, HttpOrzayah, type OrzayahClient, type OrzResolver } from './lib/orzayah.js';
import { decryptSecret } from './lib/secrets.js';
import { config } from './config.js';
import { companies } from './db/schema.js';
import { eq } from 'drizzle-orm';

/** `getDb` est injecté : pg Pool en production, PGlite dans les tests. */
export function createApp(getDb: () => Db, deps: { orzayah?: OrzayahClient | null } = {}) {
  const app = new Hono<Env>().basePath('/api');

  app.use('*', secureHeaders());
  app.use('*', async (c, next) => {
    const db = getDb();
    const platform = deps.orzayah !== undefined ? deps.orzayah : defaultOrzayah();
    const orzFor: OrzResolver = async (companyId, scope) => {
      if (scope !== 'merchant') return platform;
      const [co] = await db.select({ enc: companies.orzApiKeyEnc }).from(companies).where(eq(companies.id, companyId)).limit(1);
      if (!co?.enc) return null;
      // Tests : le faux ORZAYAH injecté joue le rôle du compte du marchand.
      if (deps.orzayah !== undefined) return deps.orzayah;
      try { return new HttpOrzayah(decryptSecret(co.enc), config().ORZAYAH_API_URL); } catch { return null; }
    };
    c.set('db', db); c.set('orz', platform); c.set('orzFor', orzFor);
    c.set('orzMake', (apiKey: string) => (deps.orzayah !== undefined ? deps.orzayah : new HttpOrzayah(apiKey, config().ORZAYAH_API_URL)));
    await next();
  });
  app.use('*', sameOrigin);
  app.use('*', session);

  app.onError((err, c) => {
    if (err instanceof AppError) return c.json({ error: { code: err.code, message: err.message } }, err.status);
    if (err instanceof HTTPException) return c.json({ error: { code: 'http_error', message: err.message } }, err.status);
    if (err instanceof ZodError) return c.json({ error: { code: 'invalid', message: err.issues[0]?.message ?? 'Requête invalide' } }, 400);
    console.error('[unhandled]', err);
    return c.json({ error: { code: 'internal', message: 'Erreur interne' } }, 500);
  });
  app.notFound((c) => c.json({ error: { code: 'not_found', message: 'Route inconnue' } }, 404));

  // Les erreurs de validation zod-validator sont renvoyées en 400 par défaut ; on uniformise le format.
  return app
    .get('/health', (c) => c.json({ ok: true }))
    // Diagnostic : teste la connexion à la base ; ne renvoie qu'un code d'erreur (jamais de détails sensibles).
    .get('/health/db', async (c) => {
      try {
        await c.get('db').execute(sql`select 1`);
        return c.json({ ok: true });
      } catch (e) {
        const code = (e as { cause?: { code?: string } }).cause?.code ?? 'unknown';
        return c.json({ ok: false, code }, 503);
      }
    })
    .route('/auth', authRoutes)
    .route('/offers', catalogRoutes)
    .route('/ads', adsRoutes)
    .route('/favorites', favoriteRoutes)
    .route('/reviews', reviewRoutes)
    .route('/bookings', bookingRoutes)
    .route('/payments', paymentRoutes)
    .route('/orzayah', orzayahRoutes)
    .route('/notifications', notificationRoutes)
    .route('/company', companyRoutes)
    .route('/admin', adminRoutes);
}
export type AppType = ReturnType<typeof createApp>;
