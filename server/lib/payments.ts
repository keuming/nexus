import { and, eq, inArray, isNull, lt, or, gt, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { bookings, companies, creditLedger, offers, payments } from '../db/schema.js';
import { notifyAdmins, notifyBookingConfirmed } from './notify.js';
import { OrzayahError, type OrzayahClient, type OrzOp } from './orzayah.js';

export type PaymentRow = typeof payments.$inferSelect;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export interface PayCtx { db: Db; orz: OrzayahClient | null }

const FAILED = new Set(['FAILED', 'CANCELLED', 'EXPIRED']);
const POLL_MIN_MS = 3000;     // l'API ORZAYAH limite à 120 requêtes/min par IP : on espace les relectures
const NOT_INITIATED_MS = 120_000;

/** Ce que le client est autorisé à voir d'un paiement (numéro masqué, aucune donnée interne). */
export const publicPayment = (p: PaymentRow) => ({
  id: p.id, bookingId: p.bookingId, status: p.status, amountFcfa: p.amountFcfa, operator: p.operator,
  account: `•••${p.accountNumber.slice(-3)}`, failureReason: p.failureReason,
  nextAction: (p.nextAction ?? null) as { type?: string; message?: string; url?: string } | null,
  expiresAt: p.expiresAt, paidAt: p.paidAt,
});

/** Annule la réservation : libère les places et rend le crédit au fournisseur. Idempotent. */
async function releaseHold(tx: Tx, bookingId: string): Promise<boolean> {
  const [b] = await tx.update(bookings).set({ status: 'cancelled' })
    .where(and(eq(bookings.id, bookingId), inArray(bookings.status, ['pending_payment', 'confirmed']))).returning();
  if (!b) return false;
  await tx.update(offers).set({ booked: sql`${offers.booked} - ${b.seats}` }).where(eq(offers.id, b.offerId));
  await tx.update(companies).set({ credits: sql`${companies.credits} + 1` }).where(eq(companies.id, b.companyId));
  await tx.insert(creditLedger).values({ companyId: b.companyId, delta: 1, reason: 'refund', bookingId: b.id });
  return true;
}

/** Paiement reçu après expiration locale : on rétablit la réservation si c'est encore possible, sinon remboursement à faire. */
async function reinstate(tx: Tx, p: PaymentRow, meta: Partial<PaymentRow>) {
  const [b] = await tx.select().from(bookings).where(eq(bookings.id, p.bookingId)).for('update');
  let ok = false;
  if (b) {
    const [o] = await tx.update(offers).set({ booked: sql`${offers.booked} + ${b.seats}` })
      .where(and(eq(offers.id, b.offerId), sql`${offers.booked} + ${b.seats} <= ${offers.capacity}`)).returning({ id: offers.id });
    if (o) {
      const [co] = await tx.update(companies).set({ credits: sql`${companies.credits} - 1` })
        .where(and(eq(companies.id, b.companyId), eq(companies.status, 'active'), sql`${companies.credits} >= 1`)).returning({ id: companies.id });
      if (co) ok = true;
      else await tx.update(offers).set({ booked: sql`${offers.booked} - ${b.seats}` }).where(eq(offers.id, b.offerId));
    }
  }
  if (!ok || !b) { await tx.update(payments).set({ ...meta, status: 'needs_refund', failureReason: 'Paiement reçu après expiration : places indisponibles, remboursement à effectuer' }).where(eq(payments.id, p.id)); return; }
  await tx.update(bookings).set({ status: 'confirmed' }).where(eq(bookings.id, b.id));
  await tx.insert(creditLedger).values({ companyId: b.companyId, delta: -1, reason: 'booking', bookingId: b.id });
  await tx.update(payments).set({ ...meta, status: 'paid', paidAt: new Date(), failureReason: null }).where(eq(payments.id, p.id));
}

/** Applique l'état renvoyé par ORZAYAH. Idempotent : rejouer le même état ne change rien. */
export async function applyOrzOp(db: Db, paymentId: string, op: OrzOp): Promise<void> {
  let before = '';
  await db.transaction(async (tx) => {
    const [p] = await tx.select().from(payments).where(eq(payments.id, paymentId)).for('update');
    if (!p) return;
    before = p.status;
    const meta = { orzRef: op.id || p.orzRef, orzStatus: op.status, nextAction: op.nextAction, feeCentimes: op.feeAmount == null ? p.feeCentimes : Number(op.feeAmount), lastCheckedAt: new Date() };
    const set = (v: Partial<PaymentRow>) => tx.update(payments).set({ ...meta, ...v }).where(eq(payments.id, p.id));

    if (op.status === 'SUCCESS') {
      if (p.status === 'pending') {
        await set({ status: 'paid', paidAt: new Date(), failureReason: null });
        await tx.update(bookings).set({ status: 'confirmed' }).where(and(eq(bookings.id, p.bookingId), eq(bookings.status, 'pending_payment')));
        return;
      }
      if (p.status === 'expired') return reinstate(tx, p, meta);
    } else if (FAILED.has(op.status)) {
      if (p.status === 'pending') { await releaseHold(tx, p.bookingId); return void (await set({ status: 'failed', failureReason: op.failureReason ?? 'Paiement refusé ou annulé' })); }
      if (p.status === 'expired') return void (await set({ status: 'failed', failureReason: op.failureReason ?? p.failureReason }));
    } else if (op.status === 'REFUNDED' && p.status === 'paid') {
      await releaseHold(tx, p.bookingId);
      return void (await set({ status: 'refunded' }));
    }
    await set({});
  });
  // Alertes après validation de la transaction (idempotentes : une seule alerte par réservation).
  if (before === 'pending' || before === 'expired') {
    const [after] = await db.select({ status: payments.status, bookingId: payments.bookingId, amount: payments.amountFcfa }).from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (after?.status === 'paid') await notifyBookingConfirmed(db, after.bookingId);
    else if (after?.status === 'needs_refund') await notifyAdmins(db, { kind: 'needs_refund', refId: paymentId, title: 'Remboursement à effectuer', body: `Paiement de ${new Intl.NumberFormat('fr-FR').format(after.amount)} FCFA reçu après expiration, places indisponibles.`, link: '/admin' });
  }
}

/** Abandon définitif (refus de la requête par ORZAYAH) ou local (délai dépassé / jamais initié). */
export async function closePayment(db: Db, paymentId: string, kind: 'failed' | 'expired', reason: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [p] = await tx.update(payments).set({ status: kind, failureReason: reason, lastCheckedAt: new Date() })
      .where(and(eq(payments.id, paymentId), eq(payments.status, 'pending'))).returning();
    if (p) await releaseHold(tx, p.bookingId);
  });
}

const load = async (db: Db, id: string) => (await db.select().from(payments).where(eq(payments.id, id)).limit(1))[0]!;

/** Relit l'état chez ORZAYAH (GET /transactions/{clé}) et l'applique. Tolérant aux pannes : en cas de doute, on ne change rien. */
export async function syncPayment(ctx: PayCtx, p: PaymentRow, force = false): Promise<PaymentRow> {
  const { db, orz } = ctx;
  if (!orz || (p.status !== 'pending' && p.status !== 'expired')) return p;
  if (!force && p.lastCheckedAt && Date.now() - p.lastCheckedAt.getTime() < POLL_MIN_MS) return p;
  try {
    let op = await orz.getTransaction(p.idempotencyKey);
    if (!op && p.status === 'pending') {
      if (Date.now() - p.createdAt.getTime() > NOT_INITIATED_MS) { await closePayment(db, p.id, 'expired', 'Paiement non initié chez ORZAYAH'); return load(db, p.id); }
      // Jamais reçu par ORZAYAH (coupure au moment de la création) : rejouer avec la MÊME clé est sans risque.
      op = await orz.createDeposit({ operator: p.operator as 'ORANGE', accountNumber: p.accountNumber, amountCentimes: p.amountFcfa * 100, idempotencyKey: p.idempotencyKey });
    }
    if (op) await applyOrzOp(db, p.id, op);
    else await db.update(payments).set({ lastCheckedAt: new Date() }).where(eq(payments.id, p.id));
  } catch (e) {
    if (e instanceof OrzayahError && e.definitive && p.status === 'pending') await closePayment(db, p.id, 'failed', e.message);
    else await db.update(payments).set({ lastCheckedAt: new Date() }).where(eq(payments.id, p.id));
  }
  return load(db, p.id);
}

/**
 * Nettoyage « paresseux » (pas de cron) : expire les paiements dont le délai est dépassé après une dernière vérification chez
 * ORZAYAH, et recontrôle les paiements expirés des dernières 48 h (un paiement tardif peut encore aboutir).
 */
export async function sweepExpired(ctx: PayCtx, limit = 5): Promise<void> {
  const now = new Date();
  const late = await ctx.db.select().from(payments).where(and(eq(payments.status, 'pending'), lt(payments.expiresAt, now))).limit(limit);
  for (const p of late) {
    const fresh = await syncPayment(ctx, p, true);
    if (fresh.status === 'pending') await closePayment(ctx.db, p.id, 'expired', 'Délai de paiement dépassé');
  }
  if (!ctx.orz) return;
  const recheck = await ctx.db.select().from(payments).where(and(
    eq(payments.status, 'expired'), gt(payments.createdAt, new Date(Date.now() - 48 * 3600_000)),
    or(isNull(payments.lastCheckedAt), lt(payments.lastCheckedAt, new Date(Date.now() - 60_000))))).limit(Math.max(1, limit - late.length));
  for (const p of recheck) await syncPayment(ctx, p, true);
}
