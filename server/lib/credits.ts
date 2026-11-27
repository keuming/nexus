import { randomUUID } from 'node:crypto';
import { and, asc, eq, isNotNull, lt, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { bookings, companies, creditLedger, creditPurchases, offers, payments } from '../db/schema.js';
import { config } from '../config.js';
import { CREDIT_PRICE_FCFA, LOCK_MINUTES } from '../../shared/constants.js';
import { notify, notifyBookingConfirmed } from './notify.js';
import { OrzayahError, type OrzOp, type OrzResolver, type OrzayahClient } from './orzayah.js';
import { applyLink, closePayment, linkInput } from './payments.js';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export interface CreditCtx { db: Db; orzFor: OrzResolver; appUrl: string }

async function rows<T>(db: Db | Tx, q: ReturnType<typeof sql>): Promise<T[]> {
  const r = (await (db as Db).execute(q)) as unknown as { rows?: T[] } | T[];
  return Array.isArray(r) ? r : (r.rows ?? []);
}

/** Adresse publique de l'application (pour les liens de retour de paiement). */
export function appUrlOf(c: { req: { header: (n: string) => string | undefined; url: string } }): string {
  const u = new URL(c.req.url);
  return (config().APP_URL ?? `${(c.req.header('x-forwarded-proto') ?? u.protocol.replace(':', '')).split(',')[0]}://${c.req.header('x-forwarded-host') ?? c.req.header('host') ?? u.host}`).replace(/\/$/, '');
}

export const lockUntil = () => new Date(Date.now() + LOCK_MINUTES * 60_000);

/** Alerte au partenaire : une commande l'attend, SANS aucun détail (ni client, ni article, ni montant). */
export async function notifyLockedOrder(db: Db, bookingId: string, companyId: string): Promise<void> {
  const [co] = await db.select({ ownerId: companies.ownerId }).from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!co) return;
  await notify(db, [{
    userId: co.ownerId, kind: 'order_locked', refId: bookingId, link: '/company',
    title: 'Nouvelle commande en attente : achetez du crédit',
    body: `Vous n'avez plus de crédit. Les détails de cette commande s'affichent dès que vous achetez du crédit. Sans achat dans l'heure, elle sera attribuée à une autre boutique.`,
  }]);
}

/** Débite 1 crédit et déverrouille la commande (atomique). `false` si le crédit manque encore. */
async function unlock(tx: Tx, bookingId: string): Promise<boolean> {
  const [b] = await tx.select().from(bookings).where(and(eq(bookings.id, bookingId), isNotNull(bookings.creditLockUntil), eq(bookings.status, 'pending_payment'))).for('update');
  if (!b) return false;
  const [co] = await tx.update(companies).set({ credits: sql`${companies.credits} - 1` })
    .where(and(eq(companies.id, b.companyId), eq(companies.status, 'active'), sql`${companies.credits} >= 1`)).returning({ id: companies.id });
  if (!co) return false;
  await tx.update(bookings).set({ creditLockUntil: null, updatedAt: new Date() }).where(eq(bookings.id, b.id));
  await tx.insert(creditLedger).values({ companyId: b.companyId, delta: -1, reason: 'booking', bookingId: b.id });
  return true;
}

/** Suite d'une commande déverrouillée : paiement en ligne (lien ORZAYAH du marchand) ou confirmation immédiate. */
export async function proceed(ctx: CreditCtx, bookingId: string): Promise<void> {
  const { db } = ctx;
  const [b] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!b || b.status !== 'pending_payment' || b.creditLockUntil) return;
  const total = (b.unitPriceFcfa ?? 0) * b.seats;
  if (!(total > 0 && b.payMethod === 'digital')) {
    await db.update(bookings).set({ status: 'confirmed', updatedAt: new Date() }).where(and(eq(bookings.id, b.id), eq(bookings.status, 'pending_payment')));
    await notifyBookingConfirmed(db, b.id);
    await notify(db, [{ userId: b.userId, kind: 'order_assigned', refId: b.id, link: `/reservation/${b.id}`, title: 'Votre commande est confirmée', body: `Un prestataire a pris en charge votre commande ${b.reference}.` }]);
    return;
  }
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(payments).where(eq(payments.bookingId, b.id));
  if (n > 0) return;
  const orz = await ctx.orzFor(b.companyId, 'merchant');
  const paymentId = randomUUID();
  await db.insert(payments).values({
    id: paymentId, orzScope: 'merchant', bookingId: b.id, companyId: b.companyId, userId: b.userId, amountFcfa: total,
    idempotencyKey: `bm-${paymentId}`, returnUrl: `${ctx.appUrl}/reservation/${b.id}`, expiresAt: new Date(Date.now() + config().HOLD_MINUTES * 60_000),
  });
  await notify(db, [{ userId: b.userId, kind: 'order_assigned', refId: b.id, link: `/reservation/${b.id}`, title: 'Payez votre commande pour la confirmer', body: `Un prestataire a pris en charge votre commande ${b.reference}. Finalisez le paiement.` }]);
  if (!orz) { await closePayment(db, paymentId, 'failed', 'Paiement en ligne indisponible chez ce prestataire'); return; }
  try {
    const [row] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    await applyLink(db, paymentId, await orz.createPaymentLink(await linkInput(db, row!)));
  } catch (e) {
    if (e instanceof OrzayahError && e.definitive) await closePayment(db, paymentId, 'failed', e.message);
    else console.error('[orzayah] createPaymentLink incertain (commande attribuée)', e instanceof Error ? e.message : e);
  }
}

/** Après un achat de crédit : déverrouille les commandes en attente de cette boutique (les plus anciennes d'abord) tant qu'il reste du crédit. */
export async function unlockForCompany(ctx: CreditCtx, companyId: string): Promise<number> {
  const pending = await ctx.db.select({ id: bookings.id }).from(bookings)
    .where(and(eq(bookings.companyId, companyId), isNotNull(bookings.creditLockUntil), eq(bookings.status, 'pending_payment'))).orderBy(asc(bookings.createdAt)).limit(50);
  let done = 0;
  for (const p of pending) {
    const ok = await ctx.db.transaction((tx) => unlock(tx, p.id));
    if (!ok) break;
    done++;
    await proceed(ctx, p.id);
  }
  return done;
}

interface Candidate { offerId: string; companyId: string; price: number }

/** Autre boutique « avec la même marchandise » : même activité, mêmes lieux, même créneau (±24 h), prix ≤ prix convenu, crédit et places disponibles. */
async function candidates(tx: Tx, b: typeof bookings.$inferSelect): Promise<Candidate[]> {
  const [o] = await tx.select().from(offers).where(eq(offers.id, b.offerId)).limit(1);
  const [co] = await tx.select({ activity: companies.activity }).from(companies).where(eq(companies.id, b.companyId)).limit(1);
  if (!o || !co) return [];
  const price = b.unitPriceFcfa ?? o.priceFcfa;
  const paid = price * b.seats > 0 && b.payMethod === 'digital';
  const tried = [...b.triedCompanyIds, b.companyId];
  const stop = b.stop ?? null;
  const r = await rows<{ offerId: string; companyId: string; price: number }>(tx, sql`
    select o2.id as "offerId", o2.company_id as "companyId", o2.price_fcfa as price
    from offers o2 join companies c2 on c2.id = o2.company_id
    where o2.active and c2.status = 'active' and c2.credits >= 1
      and c2.activity = ${co.activity}
      and not (c2.id = any(array[${sql.join(tried.map((x) => sql`${x}`), sql`, `)}]::uuid[]))
      and o2.country = ${o.country} and o2.city = ${o.city}
      and o2.dest_country is not distinct from ${o.destCountry ?? null}::text and o2.dest_city is not distinct from ${o.destCity ?? null}::text
      and o2.price_fcfa <= ${price}
      and o2.capacity - o2.booked >= ${b.seats}
      and abs(extract(epoch from (o2.starts_at - ${o.startsAt.toISOString()}::timestamptz))) <= 86400
      and ${paid ? sql`c2.orz_api_key_enc is not null` : sql`true`}
      and ${b.payMethod === 'cash' && price > 0 ? sql`o2.allow_cash` : sql`true`}
      and ((cardinality(o2.stops) = 0 and ${stop}::text is null) or exists (select 1 from unnest(o2.stops) s where lower(s) = lower(${stop}::text)))
    order by o2.price_fcfa desc, o2.starts_at asc limit 5`);
  return r.map((x) => ({ offerId: x.offerId, companyId: x.companyId, price: Number(x.price) }));
}

type Outcome = 'unlocked' | 'reassigned' | 'cancelled' | 'skipped';

/** Traite une commande dont le délai est dépassé : déverrouillage si du crédit est arrivé, sinon attribution à une autre boutique, sinon annulation. */
async function expireOne(ctx: CreditCtx, id: string): Promise<Outcome> {
  const res = await ctx.db.transaction(async (tx): Promise<{ out: Outcome; from?: typeof bookings.$inferSelect; to?: string }> => {
    const [b] = await tx.select().from(bookings).where(and(eq(bookings.id, id), isNotNull(bookings.creditLockUntil), lt(bookings.creditLockUntil, new Date()), eq(bookings.status, 'pending_payment'))).for('update');
    if (!b) return { out: 'skipped' };
    if (await unlock(tx, id)) return { out: 'unlocked' };
    for (const cand of await candidates(tx, b)) {
      const [seat] = await tx.update(offers).set({ booked: sql`${offers.booked} + ${b.seats}` })
        .where(and(eq(offers.id, cand.offerId), eq(offers.active, true), sql`${offers.booked} + ${b.seats} <= ${offers.capacity}`)).returning({ id: offers.id });
      if (!seat) continue;
      const [pay] = await tx.update(companies).set({ credits: sql`${companies.credits} - 1` })
        .where(and(eq(companies.id, cand.companyId), eq(companies.status, 'active'), sql`${companies.credits} >= 1`)).returning({ id: companies.id });
      if (!pay) { await tx.update(offers).set({ booked: sql`${offers.booked} - ${b.seats}` }).where(eq(offers.id, cand.offerId)); continue; }
      await tx.update(offers).set({ booked: sql`${offers.booked} - ${b.seats}` }).where(eq(offers.id, b.offerId));
      await tx.update(bookings).set({ offerId: cand.offerId, companyId: cand.companyId, unitPriceFcfa: cand.price, creditLockUntil: null, triedCompanyIds: [...b.triedCompanyIds, b.companyId], updatedAt: new Date() }).where(eq(bookings.id, b.id));
      await tx.insert(creditLedger).values({ companyId: cand.companyId, delta: -1, reason: 'booking', bookingId: b.id });
      return { out: 'reassigned', from: b, to: cand.companyId };
    }
    await tx.update(bookings).set({ status: 'cancelled', creditLockUntil: null, cancelledBy: 'system', cancelReason: "Aucun prestataire disponible n'a pu prendre cette commande", updatedAt: new Date() }).where(eq(bookings.id, b.id));
    await tx.update(offers).set({ booked: sql`${offers.booked} - ${b.seats}` }).where(eq(offers.id, b.offerId));
    return { out: 'cancelled', from: b };
  });
  const b = res.from;
  if (res.out === 'unlocked') await proceed(ctx, id);
  else if (res.out === 'reassigned' && b) {
    const [old] = await ctx.db.select({ ownerId: companies.ownerId }).from(companies).where(eq(companies.id, b.companyId)).limit(1);
    if (old) await notify(ctx.db, [{ userId: old.ownerId, kind: 'order_reassigned', refId: b.id, link: '/company', title: 'Une commande a été attribuée à une autre boutique', body: "Le délai d'une heure est dépassé et vous n'aviez pas de crédit. Achetez du crédit pour ne plus perdre de commandes." }]);
    await proceed(ctx, id);
  } else if (res.out === 'cancelled' && b) {
    const [old] = await ctx.db.select({ ownerId: companies.ownerId }).from(companies).where(eq(companies.id, b.companyId)).limit(1);
    await notify(ctx.db, [
      { userId: b.userId, kind: 'order_unassigned', refId: b.id, link: `/reservation/${b.id}`, title: 'Commande non attribuée', body: `Aucun prestataire n'a pu prendre votre commande ${b.reference}. Aucun paiement n'a été demandé.` },
      ...(old ? [{ userId: old.ownerId, kind: 'order_reassigned', refId: b.id, link: '/company', title: 'Une commande a expiré faute de crédit', body: "Le délai d'une heure est dépassé et vous n'aviez pas de crédit." }] : []),
    ]);
  }
  return res.out;
}

/** Nettoyage « paresseux » (pas de cron) : traite les commandes verrouillées dont le délai est dépassé. */
export async function sweepLocked(ctx: CreditCtx, limit = 5): Promise<void> {
  const due = await ctx.db.select({ id: bookings.id }).from(bookings)
    .where(and(isNotNull(bookings.creditLockUntil), lt(bookings.creditLockUntil, new Date()), eq(bookings.status, 'pending_payment'))).orderBy(asc(bookings.creditLockUntil)).limit(limit);
  for (const d of due) {
    try { await expireOne(ctx, d.id); } catch (e) { console.error('[locked]', e instanceof Error ? e.message : e); }
  }
}

/* ───────────── Achat de crédit en ligne (ORZAYAH) ───────────── */

export const purchaseAmount = (credits: number) => credits * CREDIT_PRICE_FCFA;

/** Crée l'achat et le lien de paiement ORZAYAH. Renvoie l'adresse de la page de paiement. */
export async function startPurchase(ctx: CreditCtx, orz: OrzayahClient, companyId: string, credits: number): Promise<{ id: string; payUrl: string | null }> {
  const id = randomUUID();
  const amount = purchaseAmount(credits);
  await ctx.db.insert(creditPurchases).values({ id, companyId, credits, amountFcfa: amount, idempotencyKey: `cr-${id}` });
  try {
    const op = await orz.createPaymentLink({ amountCentimes: amount * 100, description: `Achat de ${credits} credits BackMarket`, idempotencyKey: `cr-${id}`, externalReference: `CR-${id}`, returnUrl: `${ctx.appUrl}/company?credits=${id}` });
    await ctx.db.update(creditPurchases).set({ orzRef: op.id || null, payUrl: op.url }).where(eq(creditPurchases.id, id));
    return { id, payUrl: op.url };
  } catch (e) {
    await ctx.db.update(creditPurchases).set({ status: 'failed' }).where(eq(creditPurchases.id, id));
    throw e;
  }
}

const FAILED = new Set(['FAILED', 'CANCELLED', 'EXPIRED']);

/** Relit le lien chez ORZAYAH (source de vérité) et crédite le solde une seule fois (idempotent). Renvoie le statut. */
export async function syncPurchase(ctx: CreditCtx, orz: OrzayahClient, purchaseId: string, companyId?: string): Promise<string> {
  const [p] = await ctx.db.select().from(creditPurchases).where(companyId ? and(eq(creditPurchases.id, purchaseId), eq(creditPurchases.companyId, companyId)) : eq(creditPurchases.id, purchaseId)).limit(1);
  if (!p) return 'unknown';
  if (p.status !== 'pending' || !p.orzRef) return p.status;
  let op: OrzOp | null;
  try { op = await orz.getPaymentLink(p.orzRef); } catch { return p.status; }
  if (!op) return p.status;
  if (op.status === 'SUCCESS') {
    if (op.amount != null && op.amount !== p.amountFcfa * 100) return 'amount_mismatch';
    const credited = await ctx.db.transaction(async (tx) => {
      const [u] = await tx.update(creditPurchases).set({ status: 'paid', paidAt: new Date() }).where(and(eq(creditPurchases.id, p.id), eq(creditPurchases.status, 'pending'))).returning({ id: creditPurchases.id });
      if (!u) return false;
      await tx.update(companies).set({ credits: sql`${companies.credits} + ${p.credits}` }).where(eq(companies.id, p.companyId));
      await tx.insert(creditLedger).values({ companyId: p.companyId, delta: p.credits, reason: 'topup' });
      return true;
    });
    if (credited) await unlockForCompany(ctx, p.companyId);
    return 'paid';
  }
  if (FAILED.has(op.status)) { await ctx.db.update(creditPurchases).set({ status: op.status === 'EXPIRED' ? 'expired' : 'failed' }).where(and(eq(creditPurchases.id, p.id), eq(creditPurchases.status, 'pending'))); return 'failed'; }
  return p.status;
}
