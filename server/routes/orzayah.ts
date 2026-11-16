import { Hono } from 'hono';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { config } from '../config.js';
import { bookings, payments } from '../db/schema.js';
import { syncPayment } from '../lib/payments.js';
import type { Env } from '../middleware/auth.js';

const TOLERANCE_S = 300;

/** Vérifie `t=<unix>,v1=<hex>` : HMAC-SHA256 de `${t}.${corps brut}`, horodatage ≤ 5 min, comparaison en temps constant. */
export function verifySignature(header: string, raw: string, secret: string, nowMs = Date.now()): boolean {
  const parts = Object.fromEntries(header.split(',').map((x) => { const i = x.indexOf('='); return [x.slice(0, i).trim(), x.slice(i + 1).trim()]; }));
  const t = Number(parts.t);
  const sig = String(parts.v1 ?? '');
  if (!Number.isFinite(t) || !/^[0-9a-f]{64}$/i.test(sig)) return false;
  if (Math.abs(nowMs / 1000 - t) > TOLERANCE_S) return false;
  const expected = createHmac('sha256', secret).update(`${t}.${raw}`).digest();
  return timingSafeEqual(expected, Buffer.from(sig, 'hex'));
}

/** Webhook ORZAYAH (public, authentifié par signature). Le corps n'est jamais cru : on relit le lien chez ORZAYAH. */
export const orzayahRoutes = new Hono<Env>()
  .post('/webhook', async (c) => {
    const secret = config().ORZAYAH_WEBHOOK_SECRET;
    if (!secret) return c.json({ error: { code: 'not_configured', message: 'Webhook non configuré' } }, 503);
    const raw = await c.req.text();
    if (!verifySignature(c.req.header('x-orzayah-signature') ?? '', raw, secret)) return c.json({ error: { code: 'bad_signature', message: 'Signature invalide' } }, 400);
    let evt: any;
    try { evt = JSON.parse(raw); } catch { return c.json({ error: { code: 'invalid', message: 'JSON invalide' } }, 400); }
    const type = c.req.header('x-orzayah-event') ?? evt?.type;
    if (type !== 'payment.succeeded') return c.json({ ok: true });
    const slug = String(evt?.data?.slug ?? '');
    if (!slug) return c.json({ ok: true });
    const db = c.get('db');
    let [p] = await db.select().from(payments).where(eq(payments.orzRef, slug)).limit(1);
    if (!p && typeof evt?.data?.externalReference === 'string') {
      // Course possible : webhook reçu avant l'enregistrement du slug. On retrouve le paiement par la référence de réservation.
      [p] = await db.select({ pay: payments }).from(payments).innerJoin(bookings, eq(bookings.id, payments.bookingId)).where(eq(bookings.reference, evt.data.externalReference)).limit(1).then((r) => r.map((x) => x.pay));
    }
    // Inconnu : 503 pour qu'ORZAYAH réessaie (course) ; connu : relecture chez ORZAYAH + application idempotente (déjà payé = sans effet).
    if (!p) return c.json({ error: { code: 'unknown_payment', message: 'Paiement inconnu' } }, 503);
    await syncPayment({ db, orz: c.get('orz') }, p, true);
    return c.json({ ok: true });
  });
