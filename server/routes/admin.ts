import { Hono } from 'hono';
import { v } from '../lib/validate.js';
import { z } from 'zod';
import { and, count, desc, eq, inArray, sql } from 'drizzle-orm';
import { bookings, companies, creditLedger, payments, users } from '../db/schema.js';
import { conflict, notFound } from '../lib/errors.js';
import { requireRole, type Env } from '../middleware/auth.js';
import { CREDIT_PRICE_FCFA } from '../../shared/constants.js';

const id = z.object({ id: z.string().uuid() });

export const adminRoutes = new Hono<Env>()
  .use(requireRole('admin'))
  .get('/stats', async (c) => {
    const db = c.get('db');
    const [[u], [co], [b], [p], [nr]] = await Promise.all([
      db.select({ n: count() }).from(users),
      db.select({ n: count() }).from(companies),
      db.select({ n: count() }).from(bookings),
      db.select({ n: count() }).from(companies).where(eq(companies.status, 'pending')),
      db.select({ n: count() }).from(payments).where(eq(payments.status, 'needs_refund')),
    ]);
    return c.json({ users: u.n, companies: co.n, bookings: b.n, pending: p.n, needsRefund: nr.n });
  })
  /** Derniers paiements (les « remboursement à faire » en premier). */
  .get('/payments', async (c) => {
    const rows = await c.get('db')
      .select({ id: payments.id, status: payments.status, amountFcfa: payments.amountFcfa, operator: payments.operator, orzRef: payments.orzRef, failureReason: payments.failureReason, createdAt: payments.createdAt, paidAt: payments.paidAt, reversedAt: payments.reversedAt, companyName: companies.name, customerName: users.name })
      .from(payments)
      .innerJoin(companies, eq(companies.id, payments.companyId))
      .innerJoin(users, eq(users.id, payments.userId))
      .orderBy(sql`(${payments.status} = 'needs_refund') desc`, desc(payments.createdAt)).limit(200);
    return c.json({ payments: rows });
  })
  /** Sommes encaissées par NEXUS et à reverser à chaque fournisseur (paiements « paid » non encore reversés). */
  .get('/payouts', async (c) => {
    const rows = await c.get('db')
      .select({ companyId: payments.companyId, companyName: companies.name, count: count(), totalFcfa: sql<number>`sum(${payments.amountFcfa})::int` })
      .from(payments)
      .innerJoin(companies, eq(companies.id, payments.companyId))
      .where(and(eq(payments.status, 'paid'), sql`${payments.reversedAt} is null`))
      .groupBy(payments.companyId, companies.name)
      .orderBy(desc(sql`sum(${payments.amountFcfa})`));
    return c.json({ payouts: rows });
  })
  /** Marque les paiements encaissés comme reversés (le virement est fait hors plateforme). */
  .post('/companies/:id/payouts', v('param', id), async (c) => {
    const rows = await c.get('db').update(payments).set({ reversedAt: new Date() })
      .where(and(eq(payments.companyId, c.req.valid('param').id), eq(payments.status, 'paid'), sql`${payments.reversedAt} is null`))
      .returning({ amount: payments.amountFcfa });
    return c.json({ count: rows.length, totalFcfa: rows.reduce((a, r) => a + r.amount, 0) });
  })
  .get('/companies', v('query', z.object({ status: z.enum(['pending', 'active', 'suspended', 'rejected']).optional() })), async (c) => {
    const { status } = c.req.valid('query');
    const rows = await c.get('db')
      .select({ id: companies.id, name: companies.name, activity: companies.activity, country: companies.country, city: companies.city, serviceCities: companies.serviceCities, phone: companies.phone, rccm: companies.rccm, reviewNote: companies.reviewNote, reviewedAt: companies.reviewedAt, ownerName: users.name, ownerPhone: users.phone, address: companies.address, latitude: companies.latitude, longitude: companies.longitude, companyEmail: companies.email, managerTitle: companies.managerTitle, status: companies.status, credits: companies.credits, createdAt: companies.createdAt, ownerEmail: users.email })
      .from(companies).innerJoin(users, eq(users.id, companies.ownerId))
      .where(status ? eq(companies.status, status) : undefined)
      .orderBy(desc(companies.createdAt)).limit(200);
    return c.json({ companies: rows });
  })
  /**
   * Décision sur une demande fournisseur. Approuver : demande en attente ou refusée → active.
   * Refuser : demande en attente uniquement, motif obligatoire (affiché au fournisseur).
   */
  .post('/companies/:id/review', v('param', id), v('json', z.object({ decision: z.enum(['approve', 'reject']), note: z.string().trim().max(500).default('') })
    .refine((d) => d.decision === 'approve' || d.note.length >= 5, { message: 'Indiquez le motif du refus (5 caractères minimum)', path: ['note'] })), async (c) => {
    const { decision, note } = c.req.valid('json');
    const approve = decision === 'approve';
    const [co] = await c.get('db').update(companies)
      .set({ status: approve ? 'active' : 'rejected', reviewNote: note, reviewedAt: new Date(), reviewedBy: c.get('user')!.id })
      .where(and(eq(companies.id, c.req.valid('param').id), inArray(companies.status, approve ? ['pending', 'rejected'] : ['pending'])))
      .returning();
    if (!co) {
      const [exists] = await c.get('db').select({ id: companies.id }).from(companies).where(eq(companies.id, c.req.valid('param').id)).limit(1);
      if (!exists) throw notFound('Entreprise');
      throw conflict('invalid_state', "Cette demande a déjà été traitée ou n'est plus dans un état valide");
    }
    return c.json({ company: co });
  })
  /** Suspension / réactivation d'une entreprise déjà validée (ne contourne pas la validation). */
  .post('/companies/:id/status', v('param', id), v('json', z.object({ status: z.enum(['active', 'suspended']) })), async (c) => {
    const [co] = await c.get('db').update(companies).set({ status: c.req.valid('json').status })
      .where(and(eq(companies.id, c.req.valid('param').id), inArray(companies.status, ['active', 'suspended']))).returning();
    if (!co) {
      const [exists] = await c.get('db').select({ id: companies.id }).from(companies).where(eq(companies.id, c.req.valid('param').id)).limit(1);
      if (!exists) throw notFound('Entreprise');
      throw conflict('invalid_state', "Cette entreprise doit d'abord être validée");
    }
    return c.json({ company: co });
  })
  /** Recharge de crédits (après paiement hors-ligne / mobile money). 1 crédit = 125 FCFA. */
  .post('/companies/:id/credits', v('param', id), v('json', z.object({ credits: z.number().int().min(1).max(100_000) })), async (c) => {
    const { credits } = c.req.valid('json');
    const co = await c.get('db').transaction(async (tx) => {
      const [row] = await tx.update(companies).set({ credits: sql`${companies.credits} + ${credits}` }).where(eq(companies.id, c.req.valid('param').id)).returning();
      if (!row) throw notFound('Entreprise');
      await tx.insert(creditLedger).values({ companyId: row.id, delta: credits, reason: 'topup' });
      return row;
    });
    return c.json({ company: co, amountFcfa: credits * CREDIT_PRICE_FCFA });
  });
