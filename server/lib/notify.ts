import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { bookings, companies, notifications, offers, payments, users } from '../db/schema.js';
import { config } from '../config.js';

export interface NewNotification { userId: string; kind: string; title: string; body?: string; link?: string; refId?: string }

/** Envoi e-mail via Resend (texte brut). Ne lève jamais : une alerte ratée ne doit pas casser une réservation. */
export async function sendMail(to: string, subject: string, text: string) {
  const { RESEND_API_KEY: key, MAIL_FROM: from } = config();
  if (!key || !from) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (e) { console.error('[mail]', e instanceof Error ? e.message : e); }
}

/** Crée les alertes (idempotent grâce à l'index unique user+kind+objet) puis envoie les e-mails des nouvelles. Ne lève jamais. */
export async function notify(db: Db, items: NewNotification[]): Promise<void> {
  try {
    if (!items.length) return;
    const rows = await db.insert(notifications)
      .values(items.map((i) => ({ userId: i.userId, kind: i.kind, title: i.title.slice(0, 200), body: (i.body ?? '').slice(0, 500), link: i.link ?? null, refId: i.refId ?? null })))
      .onConflictDoNothing().returning({ userId: notifications.userId, title: notifications.title, body: notifications.body });
    if (!rows.length || !config().RESEND_API_KEY) return;
    const emails = new Map((await db.select({ id: users.id, email: users.email }).from(users)).map((u) => [u.id, u.email]));
    await Promise.allSettled(rows.map((r) => { const to = emails.get(r.userId); return to ? sendMail(to, r.title, `${r.body}\n\nOuvrez NEXUS pour le détail.`) : undefined; }));
  } catch (e) { console.error('[notify]', e instanceof Error ? e.message : e); }
}

export const adminIds = async (db: Db) => (await db.select({ id: users.id }).from(users).where(eq(users.role, 'admin'))).map((u) => u.id);

/** Réservation confirmée (gratuite ou payée) : alerte le fournisseur et le back-office. */
export async function notifyBookingConfirmed(db: Db, bookingId: string): Promise<void> {
  try {
    const [r] = await db.select({
      seats: bookings.seats, stop: bookings.stop, offerTitle: offers.title, companyName: companies.name, ownerId: companies.ownerId,
      customer: sql<string>`coalesce(${bookings.contactName}, ${users.name})`, phone: bookings.contactPhone, email: bookings.contactEmail, ref: bookings.reference, startsAt: offers.startsAt, amount: payments.amountFcfa,
    }).from(bookings)
      .innerJoin(offers, eq(offers.id, bookings.offerId))
      .innerJoin(companies, eq(companies.id, bookings.companyId))
      .innerJoin(users, eq(users.id, bookings.userId))
      .leftJoin(payments, and(eq(payments.bookingId, bookings.id), eq(payments.status, 'paid')))
      .where(and(eq(bookings.id, bookingId), eq(bookings.status, 'confirmed'))).limit(1);
    if (!r) return;
    const detail = `${r.ref} · ${r.customer}${r.phone ? ` (${r.phone})` : ''} · ${r.seats} place(s)${r.stop ? ` · arrêt : ${r.stop}` : ''} · ${r.amount ? `payé ${new Intl.NumberFormat('fr-FR').format(r.amount)} FCFA` : 'gratuit'}`;
    if (r.email) await sendMail(r.email, `Réservation confirmée ${r.ref} : ${r.offerTitle}`,
      `Bonjour ${r.customer},\n\nVotre réservation ${r.ref} chez ${r.companyName} est confirmée.\n${r.offerTitle} · ${new Date(r.startsAt).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}\n${r.seats} place(s)${r.stop ? ` · arrêt : ${r.stop}` : ''} · ${r.amount ? `payé ${new Intl.NumberFormat('fr-FR').format(r.amount)} FCFA` : 'gratuit'}\n\nPrésentez la référence ${r.ref} au prestataire. Reçu disponible dans « Mes réservations » sur NEXUS.`);
    await notify(db, [
      { userId: r.ownerId, kind: 'booking', refId: bookingId, title: `Nouvelle réservation : ${r.offerTitle}`, body: detail, link: '/company' },
      ...(await adminIds(db)).map((id) => ({ userId: id, kind: 'booking', refId: bookingId, title: `Réservation chez ${r.companyName} : ${r.offerTitle}`, body: detail, link: '/admin' })),
    ]);
  } catch (e) { console.error('[notify]', e instanceof Error ? e.message : e); }
}

export async function notifyAdmins(db: Db, n: Omit<NewNotification, 'userId'>): Promise<void> {
  try { await notify(db, (await adminIds(db)).map((userId) => ({ ...n, userId }))); } catch (e) { console.error('[notify]', e instanceof Error ? e.message : e); }
}
