import { Hono } from 'hono';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { sql } from 'drizzle-orm';
import type { Db } from './db/client.js';
import { AppError } from './lib/errors.js';
import { sameOrigin, session, type Env } from './middleware/auth.js';
import { authRoutes } from './routes/auth.js';
import { catalogRoutes } from './routes/catalog.js';
import { bookingRoutes } from './routes/bookings.js';
import { companyRoutes } from './routes/company.js';
import { adminRoutes } from './routes/admin.js';
import { paymentRoutes } from './routes/payments.js';
import { notificationRoutes } from './routes/notifications.js';
import { defaultOrzayah, type OrzayahClient } from './lib/orzayah.js';

/** `getDb` est injecté : pg Pool en production, PGlite dans les tests. */
export function createApp(getDb: () => Db, deps: { orzayah?: OrzayahClient | null } = {}) {
  const app = new Hono<Env>().basePath('/api');

  app.use('*', secureHeaders());
  app.use('*', async (c, next) => { c.set('db', getDb()); c.set('orz', deps.orzayah !== undefined ? deps.orzayah : defaultOrzayah()); await next(); });
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
    .route('/bookings', bookingRoutes)
    .route('/payments', paymentRoutes)
    .route('/notifications', notificationRoutes)
    .route('/company', companyRoutes)
    .route('/admin', adminRoutes);
}
export type AppType = ReturnType<typeof createApp>;
