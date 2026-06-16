import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { cashierTransactions } from "../../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { getDb } from "../db";

export const cashierRouter = router({
  // Créer une transaction d'encaissement
  createTransaction: protectedProcedure
    .input(
      z.object({
        transactionType: z.enum(["ticket", "shipment", "service", "other"]),
        referenceId: z.number().optional(),
        referenceType: z.string().optional(),
        amount: z.string(),
        currency: z.string().default("XOF"),
        paymentMethod: z.enum(["cash", "card", "mobile_money", "check", "transfer"]),
        companyId: z.number().optional(),
        stationId: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Générer le numéro de reçu
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const result = await db.insert(cashierTransactions).values({
        transactionType: input.transactionType,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        amount: input.amount,
        currency: input.currency,
        paymentMethod: input.paymentMethod,
        status: "completed",
        cashierId: ctx.user?.id ? parseInt(ctx.user.id.toString()) : undefined,
        companyId: input.companyId,
        stationId: input.stationId,
        receiptNumber,
        ticketGenerated: false,
        notes: input.notes,
      });

      return { receiptNumber, ...result };
    }),

  // Récupérer toutes les transactions
  listTransactions: protectedProcedure
    .input(
      z.object({
        companyId: z.number().optional(),
        stationId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [];
      if (input.companyId) conditions.push(eq(cashierTransactions.companyId, input.companyId));
      if (input.stationId) conditions.push(eq(cashierTransactions.stationId, input.stationId));
      if (input.startDate) conditions.push(gte(cashierTransactions.createdAt, input.startDate));
      if (input.endDate) conditions.push(lte(cashierTransactions.createdAt, input.endDate));

      const transactions = await db
        .select()
        .from(cashierTransactions)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(cashierTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return transactions;
    }),

  // Récupérer le total des encaissements par période
  getTotalByPeriod: protectedProcedure
    .input(
      z.object({
        companyId: z.number().optional(),
        stationId: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { total: 0, count: 0 };

      const conditions = [
        gte(cashierTransactions.createdAt, input.startDate),
        lte(cashierTransactions.createdAt, input.endDate),
        eq(cashierTransactions.status, "completed"),
      ];

      if (input.companyId) conditions.push(eq(cashierTransactions.companyId, input.companyId));
      if (input.stationId) conditions.push(eq(cashierTransactions.stationId, input.stationId));

      const transactions = await db
        .select()
        .from(cashierTransactions)
        .where(and(...conditions));

      const total = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      return { total, count: transactions.length };
    }),

  // Mettre à jour le statut d'une transaction
  updateTransactionStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "completed", "cancelled"]),
        ticketGenerated: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .update(cashierTransactions)
        .set({
          status: input.status,
          ticketGenerated: input.ticketGenerated,
        })
        .where(eq(cashierTransactions.id, input.id));

      return result;
    }),

  // Récupérer une transaction par ID
  getTransaction: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const transaction = await db
        .select()
        .from(cashierTransactions)
        .where(eq(cashierTransactions.id, input.id));

      return transaction[0] || null;
    }),

  // Récupérer les transactions par numéro de reçu
  getByReceiptNumber: publicProcedure
    .input(z.object({ receiptNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const transaction = await db
        .select()
        .from(cashierTransactions)
        .where(eq(cashierTransactions.receiptNumber, input.receiptNumber));

      return transaction[0] || null;
    }),
});
