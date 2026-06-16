/**
 * billing.ts — Gestion financière et encaissement des crédits HUB_RESA
 *
 * Fonctionnalités :
 *  - Créer une demande d'achat de crédits (compagnie sélectionnée, montant)
 *  - Générer des liens de paiement Stripe et Hub2
 *  - Confirmer le paiement et ajouter les crédits au compte
 *  - Consulter le solde de crédits en temps réel
 *  - Historique des transactions de crédits
 *  - Dashboard HUB_RESA : affichage du solde encaissé
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  creditPurchases,
  creditTransactions,
  companyCredits,
  transportCompanies,
} from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

// Constante : coût unitaire d'un crédit en FCFA
const CREDIT_COST_FCFA = 125;

export const billingRouter = {
  // ── PUBLIC : créer une demande d'achat de crédits ────────────────────────────
  createCreditPurchase: publicProcedure
    .input(
      z.object({
        companyId: z.number().int().positive(),
        amountFcfa: z.number().positive(), // montant en FCFA
        paymentMethod: z.enum(["stripe", "hub2_mobile_money", "bank_transfer", "cash"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Vérifier que la compagnie existe
      const company = await db
        .select()
        .from(transportCompanies)
        .where(eq(transportCompanies.id, input.companyId))
        .then((r) => r[0]);

      if (!company) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Compagnie non trouvée",
        });
      }

      // Calculer le nombre de crédits à accorder
      const creditsGranted = Math.floor(input.amountFcfa / CREDIT_COST_FCFA);
      if (creditsGranted === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Le montant minimum est ${CREDIT_COST_FCFA} FCFA (1 crédit)`,
        });
      }

      // Générer une référence unique
      const reference = `CP-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

      // Créer l'enregistrement de purchase
      const purchase = await db
        .insert(creditPurchases)
        .values({
          companyId: input.companyId,
          amountLocal: input.amountFcfa.toString(),
          creditsGranted,
          paymentMethod: input.paymentMethod,
          paymentStatus: "pending",
          currency: "XOF",
          reference,
        })
        .$returningId();

      // Générer le lien de paiement selon la méthode
      let paymentLink = "";
      let stripePaymentIntentId = "";
      let hub2PaymentUrl = "";

      if (input.paymentMethod === "stripe") {
        // TODO: Intégrer Stripe pour générer un PaymentIntent
        stripePaymentIntentId = `pi_${crypto.randomBytes(16).toString("hex")}`;
        paymentLink = `https://stripe.com/pay/${stripePaymentIntentId}`;
      } else if (input.paymentMethod === "hub2_mobile_money") {
        // TODO: Intégrer Hub2 pour générer un lien de paiement
        hub2PaymentUrl = `https://hub2.example.com/pay/${reference}`;
        paymentLink = hub2PaymentUrl;
      }

      // Mettre à jour avec les infos de paiement
      await db
        .update(creditPurchases)
        .set({
          paymentLink,
          stripePaymentIntentId,
          hub2PaymentUrl,
        })
        .where(eq(creditPurchases.id, purchase[0].id));

      return {
        purchaseId: purchase[0].id,
        reference,
        amountFcfa: input.amountFcfa,
        creditsGranted,
        paymentLink,
        paymentMethod: input.paymentMethod,
      };
    }),

  // ── ADMIN : confirmer le paiement et ajouter les crédits ──────────────────────
  confirmCreditPayment: protectedProcedure
    .input(
      z.object({
        purchaseId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Récupérer l'achat
      const purchase = await db
        .select()
        .from(creditPurchases)
        .where(eq(creditPurchases.id, input.purchaseId))
        .then((r) => r[0]);

      if (!purchase) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Achat de crédits non trouvé",
        });
      }

      if (purchase.paymentStatus !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Le paiement a déjà le statut: ${purchase.paymentStatus}`,
        });
      }

      // Récupérer le solde actuel de la compagnie
      let companyCredit = await db
        .select()
        .from(companyCredits)
        .where(eq(companyCredits.companyId, purchase.companyId))
        .then((r) => r[0]);

      if (!companyCredit) {
        // Créer un nouveau solde si n'existe pas
        await db.insert(companyCredits).values({
          companyId: purchase.companyId,
          balance: 0,
          countryCode: "CI",
          currency: "XOF",
          pointPriceLocal: "125.00",
        });

        companyCredit = await db
          .select()
          .from(companyCredits)
          .where(eq(companyCredits.companyId, purchase.companyId))
          .then((r) => r[0]);
      }

      const balanceBefore = companyCredit?.balance ?? 0;
      const balanceAfter = balanceBefore + purchase.creditsGranted;

      // Mettre à jour le solde
      await db
        .update(companyCredits)
        .set({
          balance: balanceAfter,
          updatedAt: new Date(),
        })
        .where(eq(companyCredits.companyId, purchase.companyId));

      // Enregistrer la transaction
      await db.insert(creditTransactions).values({
        companyId: purchase.companyId,
        type: "credit",
        points: purchase.creditsGranted,
        amountLocal: purchase.amountLocal,
        description: `Achat de ${purchase.creditsGranted} crédits`,
        refType: "purchase",
        refId: purchase.reference,
        balanceBefore,
        balanceAfter,
        reference: purchase.reference,
      });

      // Mettre à jour le statut du paiement
      await db
        .update(creditPurchases)
        .set({
          paymentStatus: "completed",
          completedAt: new Date(),
        })
        .where(eq(creditPurchases.id, input.purchaseId));

      return {
        success: true,
        purchaseId: input.purchaseId,
        creditsAdded: purchase.creditsGranted,
        newBalance: balanceAfter,
      };
    }),

  // ── PUBLIC : obtenir le solde de crédits d'une compagnie ──────────────────────
  getCompanyCredits: publicProcedure
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      let companyCredit = await db
        .select()
        .from(companyCredits)
        .where(eq(companyCredits.companyId, input.companyId))
        .then((r) => r[0]);

      if (!companyCredit) {
        // Créer un nouveau solde si n'existe pas
        await db.insert(companyCredits).values({
          companyId: input.companyId,
          balance: 0,
          countryCode: "CI",
          currency: "XOF",
          pointPriceLocal: "125.00",
        });

        companyCredit = await db
          .select()
          .from(companyCredits)
          .where(eq(companyCredits.companyId, input.companyId))
          .then((r) => r[0]);
      }

      return {
        companyId: input.companyId,
        balance: companyCredit?.balance ?? 0,
        currency: companyCredit?.currency ?? "XOF",
        pointPrice: companyCredit?.pointPriceLocal ?? "125.00",
        equivalentFcfa: ((companyCredit?.balance ?? 0) * 125).toString(),
      };
    }),

  // ── PUBLIC : historique des achats de crédits d'une compagnie ────────────────
  getCreditPurchaseHistory: publicProcedure
    .input(
      z.object({
        companyId: z.number().int().positive(),
        limit: z.number().int().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const purchases = await db
        .select()
        .from(creditPurchases)
        .where(eq(creditPurchases.companyId, input.companyId))
        .orderBy(desc(creditPurchases.createdAt))
        .limit(input.limit);

      return purchases.map((p) => ({
        id: p.id,
        reference: p.reference,
        amountFcfa: parseFloat(p.amountLocal),
        creditsGranted: p.creditsGranted,
        paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentStatus,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
      }));
    }),

  // ── ADMIN : toutes les transactions de crédits (pour le dashboard HUB_RESA) ────────
  getAllCreditTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const transactions = await db
        .select()
        .from(creditTransactions)
        .orderBy(desc(creditTransactions.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return transactions.map((t) => ({
        id: t.id,
        companyId: t.companyId,
        type: t.type,
        points: t.points,
        amountFcfa: t.amountLocal ? parseFloat(t.amountLocal) : null,
        description: t.description,
        balanceBefore: t.balanceBefore,
        balanceAfter: t.balanceAfter,
        reference: t.reference,
        createdAt: t.createdAt,
      }));
    }),

  // ── ADMIN : toutes les demandes de crédit (pour la page de gestion) ──────────
  getAllCreditPurchases: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const purchases = await db
      .select()
      .from(creditPurchases)
      .orderBy(desc(creditPurchases.createdAt));

    return purchases.map((p) => ({
      id: p.id,
      reference: p.reference,
      companyId: p.companyId,
      amountFcfa: parseFloat(p.amountLocal),
      creditsGranted: p.creditsGranted,
      paymentMethod: p.paymentMethod,
      paymentStatus: p.paymentStatus,
      paymentLink: p.stripePaymentIntentId || p.hub2PaymentUrl || "",
      createdAt: p.createdAt,
      completedAt: p.completedAt,
    }));
  }),

  // ── ADMIN : statistiques de crédits (pour le dashboard HUB_RESA) ───────────────────
  getCreditStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Total des crédits distribués
    const allCredits = await db.select().from(companyCredits);
    const totalCreditsDistributed = allCredits.reduce((sum, c) => sum + c.balance, 0);

    // Total des achats complétés
    const completedPurchases = await db
      .select()
      .from(creditPurchases)
      .where(eq(creditPurchases.paymentStatus, "completed"));

    const totalAmountEncashed = completedPurchases.reduce(
      (sum, p) => sum + parseFloat(p.amountLocal),
      0
    );

    // Nombre de compagnies avec crédits
    const companiesWithCredits = allCredits.filter((c) => c.balance > 0).length;

    return {
      totalCreditsDistributed,
      totalAmountEncashed,
      companiesWithCredits,
      totalCompanies: allCredits.length,
      averageCreditsPerCompany:
        allCredits.length > 0
          ? Math.round(totalCreditsDistributed / allCredits.length)
          : 0,
    };
  }),
};
