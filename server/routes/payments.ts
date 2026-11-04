import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { v } from '../lib/validate.js';
import { payments } from '../db/schema.js';
import { notFound } from '../lib/errors.js';
import { publicPayment, sweepExpired, syncPayment } from '../lib/payments.js';
import { requireRole, type Env } from '../middleware/auth.js';

export const paymentRoutes = new Hono<Env>()
  .use(requireRole('customer', 'owner', 'admin'))
  /** Suivi d'un paiement : relit l'état chez ORZAYAH (pas de webhook) puis renvoie la vue publique. */
  .get('/:id', v('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = c.get('user')!;
    const db = c.get('db');
    const ctx = { db, orz: c.get('orz') };
    const [p] = await db.select().from(payments).where(eq(payments.id, c.req.valid('param').id)).limit(1);
    if (!p || (p.userId !== user.id && user.role !== 'admin')) throw notFound('Paiement');
    let fresh = await syncPayment(ctx, p);
    try { await sweepExpired(ctx, 2); } catch (e) { console.error('[sweep]', e); }
    fresh = (await db.select().from(payments).where(eq(payments.id, p.id)).limit(1))[0]!;
    return c.json({ payment: publicPayment(fresh) });
  });
