import { Hono, type Context } from 'hono';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { config } from '../config.js';
import { bookings, companies, payments } from '../db/schema.js';
import { decryptSecret } from '../lib/secrets.js';
import { syncPayment } from '../lib/payments.js';
import { appUrlOf, syncPurchase } from '../lib/credits.js';
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

/** Traitement commun : signature déjà vérifiée par l'appelant. `companyId` restreint la recherche au marchand concerné. */
async function handle(c: Context<Env>, raw: string, companyId: string | null) {
  let evt: any;
  try { evt = JSON.parse(raw); } catch { return c.json({ error: { code: 'invalid', message: 'JSON invalide' } }, 400); }
  const type = c.req.header('x-orzayah-event') ?? evt?.type;
  if (type !== 'payment.succeeded') return c.json({ ok: true });
  const slug = String(evt?.data?.slug ?? '');
  if (!slug) return c.json({ ok: true });
  const db = c.get('db');
  const scoped = companyId ? and(eq(payments.orzRef, slug), eq(payments.companyId, companyId), eq(payments.orzScope, 'merchant')) : and(eq(payments.orzRef, slug), eq(payments.orzScope, 'platform'));
  let [p] = await db.select().from(payments).where(scoped).limit(1);
  if (!p && typeof evt?.data?.externalReference === 'string') {
    // Course possible : webhook reçu avant l'enregistrement du slug. On retrouve le paiement par la référence de réservation.
    const own = companyId ? and(eq(bookings.reference, evt.data.externalReference), eq(payments.companyId, companyId), eq(payments.orzScope, 'merchant')) : and(eq(bookings.reference, evt.data.externalReference), eq(payments.orzScope, 'platform'));
    [p] = await db.select({ pay: payments }).from(payments).innerJoin(bookings, eq(bookings.id, payments.bookingId)).where(own).limit(1).then((r) => r.map((x) => x.pay));
  }
  // Inconnu : 503 pour qu'ORZAYAH réessaie (course) ; connu : relecture chez ORZAYAH + application idempotente (déjà payé = sans effet).
  if (!p && !companyId) {
    // Achat de crédit (référence « CR-<id> ») : relecture chez ORZAYAH puis crédit idempotent.
    const ref = String(evt?.data?.externalReference ?? '');
    const orz = c.get('orz');
    if (orz && /^CR-[0-9a-f-]{36}$/i.test(ref)) {
      await syncPurchase({ db, orzFor: c.get('orzFor'), appUrl: appUrlOf(c) }, orz, ref.slice(3));
      return c.json({ ok: true });
    }
  }
  if (!p) return c.json({ error: { code: 'unknown_payment', message: 'Paiement inconnu' } }, 503);
  await syncPayment({ db, orzFor: c.get('orzFor') }, p, true);
  return c.json({ ok: true });
}

/** Webhooks ORZAYAH (publics, authentifiés par signature). Le corps n'est jamais cru : on relit le lien chez ORZAYAH. */
export const orzayahRoutes = new Hono<Env>()
  // Ancien compte BackMarket (paiements créés avant le paiement direct aux marchands).
  .post('/webhook', async (c) => {
    const secret = config().ORZAYAH_WEBHOOK_SECRET;
    if (!secret) return c.json({ error: { code: 'not_configured', message: 'Webhook non configuré' } }, 503);
    const raw = await c.req.text();
    if (!verifySignature(c.req.header('x-orzayah-signature') ?? '', raw, secret)) return c.json({ error: { code: 'bad_signature', message: 'Signature invalide' } }, 400);
    return handle(c, raw, null);
  })
  // Compte ORZAYAH d'un marchand : signé avec le secret de webhook propre à ce marchand.
  .post('/webhook/:companyId', async (c) => {
    const companyId = c.req.param('companyId');
    if (!/^[0-9a-f-]{36}$/i.test(companyId)) return c.json({ error: { code: 'not_found', message: 'Inconnu' } }, 404);
    const [co] = await c.get('db').select({ enc: companies.orzWebhookSecretEnc }).from(companies).where(eq(companies.id, companyId)).limit(1);
    if (!co?.enc) return c.json({ error: { code: 'not_configured', message: 'Webhook non configuré' } }, 503);
    let secret: string;
    try { secret = decryptSecret(co.enc); } catch { return c.json({ error: { code: 'not_configured', message: 'Webhook non configuré' } }, 503); }
    const raw = await c.req.text();
    if (!verifySignature(c.req.header('x-orzayah-signature') ?? '', raw, secret)) return c.json({ error: { code: 'bad_signature', message: 'Signature invalide' } }, 400);
    return handle(c, raw, companyId);
  });
