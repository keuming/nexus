/**
 * Routeur tRPC — Business Developers (BDev)
 *
 * Procédures publiques :
 *   - register        : créer un compte BDev (génère bdId 7 chars)
 *   - login           : authentification par loginPhone + PIN → JWT BDev
 *   - getProfile      : profil du BDev connecté
 *   - getMyCompanies  : liste des compagnies recrutées par le BDev
 *   - getMyStats      : statistiques globales du BDev
 *   - getCompanyStats : CA + crédits d'une compagnie spécifique par période
 *
 * Procédures admin (CSN) :
 *   - admin.list           : liste tous les BDevs avec stats
 *   - admin.getDetail      : détail d'un BDev + ses compagnies
 *   - admin.updateStatus   : activer / suspendre un BDev
 *   - admin.getGlobalStats : stats globales pour le dashboard admin
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { businessDevelopers, transportCompanies, companyCredits, creditTransactions } from "../../drizzle/schema";
import { eq, and, gte, lte, sql, desc, isNotNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { TRPCError } from "@trpc/server";
import { ENV } from "../_core/env";

async function getBdevSecretKey() {
  return new TextEncoder().encode(ENV.cookieSecret + "_bdev");
}

async function signBdevToken(payload: { bdId: string; id: number }): Promise<string> {
  const key = await getBdevSecretKey();
  return new SignJWT({ ...payload, type: "bdev" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

async function verifyBdevToken(token: string): Promise<{ bdId: string; id: number } | null> {
  try {
    const key = await getBdevSecretKey();
    const { payload } = await jwtVerify(token, key);
    if (payload.type !== "bdev") return null;
    return { bdId: payload.bdId as string, id: payload.id as number };
  } catch {
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Génère un ID BDev unique de 7 caractères : BD + 5 chiffres */
function generateBdId(): string {
  const digits = Math.floor(10000 + Math.random() * 90000).toString();
  return `BD${digits}`;
}

// ── Sous-routeur admin ────────────────────────────────────────────────────────
const adminRouter = router({
  /** Liste tous les BDevs avec nombre de compagnies et CA total */
  list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

    const bdevs = await db.select().from(businessDevelopers).orderBy(desc(businessDevelopers.createdAt));

    // Pour chaque BDev, compter les compagnies et calculer le CA
    const result = await Promise.all(
      bdevs.map(async (bdev: typeof businessDevelopers.$inferSelect) => {
        const companies = await db.select({
            id: transportCompanies.id,
            companyName: transportCompanies.companyName,
            activityType: transportCompanies.activityType,
            status: transportCompanies.status,
            createdAt: transportCompanies.createdAt,
          })
          .from(transportCompanies)
          .where(eq(transportCompanies.bdId, bdev.bdId));

        // CA total = somme des amountLocal des creditTransactions de type "credit" pour les compagnies recrutées
        let totalRevenue = 0;
        let totalCredits = 0;
        for (const company of companies) {
          const stats = await db.select({
              totalAmount: sql<number>`COALESCE(SUM(CAST(${creditTransactions.amountLocal} AS DECIMAL(12,2))), 0)`,
              totalCredits: sql<number>`COALESCE(SUM(${creditTransactions.points}), 0)`,
            })
            .from(creditTransactions)
            .where(
              and(
                eq(creditTransactions.companyId, company.id),
                eq(creditTransactions.type, "credit")
              )
            );
          totalRevenue += Number(stats[0]?.totalAmount ?? 0);
          totalCredits += Number(stats[0]?.totalCredits ?? 0);
        }

        const commissionRate = Number(bdev.commissionRate ?? 5);
        const totalCommission = (totalRevenue * commissionRate) / 100;
        return {
          ...bdev,
          pinHash: undefined, // ne jamais exposer le hash
          commissionRate,
          companiesCount: companies.length,
          totalRevenue,
          totalCredits,
          totalCommission,
          companies,
        };
      })
    );

    return result;
  }),

  /** Détail d'un BDev avec ses compagnies et stats par compagnie */
  getDetail: protectedProcedure
    .input(z.object({ bdId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

      const [bdev] = await db.select()
        .from(businessDevelopers)
        .where(eq(businessDevelopers.bdId, input.bdId));

      if (!bdev) throw new TRPCError({ code: "NOT_FOUND", message: "BDev introuvable" });

      const companies = await db.select()
        .from(transportCompanies)
        .where(eq(transportCompanies.bdId, input.bdId))
        .orderBy(desc(transportCompanies.createdAt));

      const companiesWithStats = await Promise.all(
        companies.map(async (company: { id: number; companyName: string; activityType: string; status: string; createdAt: Date }) => {
          const credits = await db.select({ balance: companyCredits.balance })
            .from(companyCredits)
            .where(eq(companyCredits.companyId, company.id));

          const revenueStats = await db.select({
              totalAmount: sql<number>`COALESCE(SUM(CAST(${creditTransactions.amountLocal} AS DECIMAL(12,2))), 0)`,
              totalCredits: sql<number>`COALESCE(SUM(${creditTransactions.points}), 0)`,
            })
            .from(creditTransactions)
            .where(
              and(
                eq(creditTransactions.companyId, company.id),
                eq(creditTransactions.type, "credit")
              )
            );

          return {
            ...company,
            creditBalance: credits[0]?.balance ?? 0,
            totalRevenue: Number(revenueStats[0]?.totalAmount ?? 0),
            totalCredits: Number(revenueStats[0]?.totalCredits ?? 0),
          };
        })
      );

      return { ...bdev, pinHash: undefined, companies: companiesWithStats };
    }),

  /** Activer ou suspendre un BDev */
  updateStatus: protectedProcedure
    .input(z.object({
      bdId: z.string(),
      status: z.enum(["active", "suspended", "pending"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await db.update(businessDevelopers)
        .set({ status: input.status })
        .where(eq(businessDevelopers.bdId, input.bdId));
      return { success: true };
    }),

  /** Modifier le taux de commission d'un BDev */
  updateCommissionRate: protectedProcedure
    .input(z.object({
      bdId: z.string(),
      commissionRate: z.number().min(0).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      await db.update(businessDevelopers)
        .set({ commissionRate: input.commissionRate.toFixed(2) })
        .where(eq(businessDevelopers.bdId, input.bdId));
      return { success: true };
    }),

  /** Stats globales pour le widget dashboard admin */
  getGlobalStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

    const [counts] = await db.select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`SUM(CASE WHEN ${businessDevelopers.status} = 'active' THEN 1 ELSE 0 END)`,
        pending: sql<number>`SUM(CASE WHEN ${businessDevelopers.status} = 'pending' THEN 1 ELSE 0 END)`,
      })
      .from(businessDevelopers);

    const [companiesWithBdev] = await db.select({ count: sql<number>`COUNT(*)` })
      .from(transportCompanies)
      .where(isNotNull(transportCompanies.bdId));

    const [revenueTotal] = await db.select({
        total: sql<number>`COALESCE(SUM(CAST(${creditTransactions.amountLocal} AS DECIMAL(12,2))), 0)`,
      })
      .from(creditTransactions)
      .where(eq(creditTransactions.type, "credit"));

    return {
      totalBdevs: Number(counts?.total ?? 0),
      activeBdevs: Number(counts?.active ?? 0),
      pendingBdevs: Number(counts?.pending ?? 0),
      companiesRecruited: Number(companiesWithBdev?.count ?? 0),
      totalRevenue: Number(revenueTotal?.total ?? 0),
    };
  }),
});

// ── Routeur principal BDev ────────────────────────────────────────────────────
export const businessDevRouter = router({
  admin: adminRouter,

  /** Créer un compte BDev */
  register: publicProcedure
    .input(z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      contact: z.string().optional(),
      email: z.string().email(),
      whatsapp: z.string().optional(),
      countryCode: z.string().default("+225"),
      loginPhone: z.string().min(6), // numéro sans indicatif
      pin: z.string().length(4).regex(/^\d{4}$/, "Le PIN doit être 4 chiffres"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      // Vérifier unicité email et loginPhone
      const fullLoginPhone = `${input.countryCode}${input.loginPhone}`;

      const [existingEmail] = await db.select({ id: businessDevelopers.id })
        .from(businessDevelopers)
        .where(eq(businessDevelopers.email, input.email));
      if (existingEmail) throw new TRPCError({ code: "CONFLICT", message: "Cet email est déjà utilisé" });

      const [existingPhone] = await db.select({ id: businessDevelopers.id })
        .from(businessDevelopers)
        .where(eq(businessDevelopers.loginPhone, fullLoginPhone));
      if (existingPhone) throw new TRPCError({ code: "CONFLICT", message: "Ce numéro est déjà utilisé" });

      // Générer un bdId unique
      let bdId = generateBdId();
      let attempts = 0;
      while (attempts < 10) {
        const [existing] = await db.select({ id: businessDevelopers.id })
          .from(businessDevelopers)
          .where(eq(businessDevelopers.bdId, bdId));
        if (!existing) break;
        bdId = generateBdId();
        attempts++;
      }

      // Hasher le PIN
      const pinHash = await bcrypt.hash(input.pin, 10);

      await db.insert(businessDevelopers).values({
        bdId,
        firstName: input.firstName,
        lastName: input.lastName,
        contact: input.contact,
        email: input.email,
        whatsapp: input.whatsapp,
        countryCode: input.countryCode,
        loginPhone: fullLoginPhone,
        pinHash,
        status: "pending",
      });

      return { success: true, bdId, message: "Compte créé avec succès. En attente de validation par l'administrateur." };
    }),

  /** Connexion BDev par loginPhone + PIN */
  login: publicProcedure
    .input(z.object({
      countryCode: z.string().default("+225"),
      loginPhone: z.string().min(6),
      pin: z.string().length(4),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      const fullLoginPhone = `${input.countryCode}${input.loginPhone}`;

      const [bdev] = await db.select()
        .from(businessDevelopers)
        .where(eq(businessDevelopers.loginPhone, fullLoginPhone));

      if (!bdev) throw new TRPCError({ code: "UNAUTHORIZED", message: "Identifiants incorrects" });
      if (bdev.status === "suspended") throw new TRPCError({ code: "FORBIDDEN", message: "Votre compte est suspendu. Contactez l'administration." });
      if (bdev.status === "pending") throw new TRPCError({ code: "FORBIDDEN", message: "Votre compte est en attente de validation." });

      const pinValid = await bcrypt.compare(input.pin, bdev.pinHash);
      if (!pinValid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Code PIN incorrect" });

      // Mettre à jour lastLoginAt
      await db.update(businessDevelopers)
        .set({ lastLoginAt: new Date() })
        .where(eq(businessDevelopers.id, bdev.id));

      // Générer un JWT BDev
      const token = await signBdevToken({ bdId: bdev.bdId, id: bdev.id });

      return {
        token,
        bdev: {
          id: bdev.id,
          bdId: bdev.bdId,
          firstName: bdev.firstName,
          lastName: bdev.lastName,
          email: bdev.email,
          status: bdev.status,
        },
      };
    }),

  /** Profil du BDev connecté (token dans header) */
  getProfile: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      const payload = await verifyBdevToken(input.token);
      if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token invalide" });

      const [bdev] = await db.select()
        .from(businessDevelopers)
        .where(eq(businessDevelopers.id, payload.id));

      if (!bdev) throw new TRPCError({ code: "NOT_FOUND" });
      const { pinHash: _, ...safe } = bdev;
      return safe;
    }),

  /** Liste des compagnies recrutées par le BDev connecté */
  getMyCompanies: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      const payload = await verifyBdevToken(input.token);
      if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token invalide" });

      const [bdev] = await db.select({ bdId: businessDevelopers.bdId, status: businessDevelopers.status })
        .from(businessDevelopers)
        .where(eq(businessDevelopers.id, payload.id));

      if (!bdev) throw new TRPCError({ code: "NOT_FOUND" });
      if (bdev.status !== "active") throw new TRPCError({ code: "FORBIDDEN", message: "Compte inactif" });

      const companies = await db.select({
          id: transportCompanies.id,
          companyName: transportCompanies.companyName,
          activityType: transportCompanies.activityType,
          status: transportCompanies.status,
          createdAt: transportCompanies.createdAt,
        })
        .from(transportCompanies)
        .where(eq(transportCompanies.bdId, bdev.bdId))
        .orderBy(desc(transportCompanies.createdAt));

      return companies;
    }),

  /** Stats globales du BDev : CA, crédits, nombre de compagnies */
  getMyStats: publicProcedure
    .input(z.object({
      token: z.string(),
      startDate: z.string().optional(), // ISO date string
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      const payload = await verifyBdevToken(input.token);
      if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token invalide" });

      const [bdev] = await db.select({ bdId: businessDevelopers.bdId, status: businessDevelopers.status })
        .from(businessDevelopers)
        .where(eq(businessDevelopers.id, payload.id));

      if (!bdev || bdev.status !== "active") throw new TRPCError({ code: "FORBIDDEN" });

      const companies = await db.select({ id: transportCompanies.id, companyName: transportCompanies.companyName, activityType: transportCompanies.activityType, status: transportCompanies.status, createdAt: transportCompanies.createdAt })
        .from(transportCompanies)
        .where(eq(transportCompanies.bdId, bdev.bdId));

      const companyIds = companies.map((c: { id: number }) => c.id);

      // Stats par compagnie avec filtrage optionnel par période
      const companiesWithStats = await Promise.all(
        companies.map(async (company: { id: number; companyName: string; activityType: string; status: string; createdAt: Date }) => {
          const conditions = [
            eq(creditTransactions.companyId, company.id),
            eq(creditTransactions.type, "credit"),
          ];
          if (input.startDate) conditions.push(gte(creditTransactions.createdAt, new Date(input.startDate)));
          if (input.endDate) conditions.push(lte(creditTransactions.createdAt, new Date(input.endDate)));

          const [stats] = await db.select({
              totalAmount: sql<number>`COALESCE(SUM(CAST(${creditTransactions.amountLocal} AS DECIMAL(12,2))), 0)`,
              totalCredits: sql<number>`COALESCE(SUM(${creditTransactions.points}), 0)`,
            })
            .from(creditTransactions)
            .where(and(...conditions));

          const [creditBalance] = await db.select({ balance: companyCredits.balance })
            .from(companyCredits)
            .where(eq(companyCredits.companyId, company.id));

          return {
            ...company,
            totalRevenue: Number(stats?.totalAmount ?? 0),
            totalCredits: Number(stats?.totalCredits ?? 0),
            creditBalance: creditBalance?.balance ?? 0,
          };
        })
      );

      const totalRevenue = companiesWithStats.reduce((s: number, c: { totalRevenue: number }) => s + c.totalRevenue, 0);
      const totalCredits = companiesWithStats.reduce((s: number, c: { totalCredits: number }) => s + c.totalCredits, 0);

      // Récupérer le taux de commission du BDev
      const [bdevFull] = await db.select({ commissionRate: businessDevelopers.commissionRate })
        .from(businessDevelopers)
        .where(eq(businessDevelopers.id, payload.id));
      const commissionRate = Number(bdevFull?.commissionRate ?? 5);
      const totalCommission = (totalRevenue * commissionRate) / 100;

      return {
        companiesCount: companies.length,
        totalRevenue,
        totalCredits,
        commissionRate,
        totalCommission,
        companies: companiesWithStats,
      };
    }),

  /** Statistiques des parrainages réussis */
  getReferralStats: publicProcedure
    .input(z.object({
      token: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      const payload = await verifyBdevToken(input.token);
      if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token invalide" });

      const [bdev] = await db.select({ bdId: businessDevelopers.bdId, status: businessDevelopers.status })
        .from(businessDevelopers)
        .where(eq(businessDevelopers.id, payload.id));

      if (!bdev || bdev.status !== "active") throw new TRPCError({ code: "FORBIDDEN" });

      // Récupérer toutes les compagnies recrutées par ce BDev
      const conditions = [eq(transportCompanies.bdId, bdev.bdId)];
      if (input.startDate) conditions.push(gte(transportCompanies.createdAt, new Date(input.startDate)));
      if (input.endDate) conditions.push(lte(transportCompanies.createdAt, new Date(input.endDate)));

      const companies = await db.select({
          id: transportCompanies.id,
          companyName: transportCompanies.companyName,
          activityType: transportCompanies.activityType,
          status: transportCompanies.status,
          createdAt: transportCompanies.createdAt,
        })
        .from(transportCompanies)
        .where(and(...conditions))
        .orderBy(desc(transportCompanies.createdAt));

      // Compter les compagnies par statut
      const activeCompanies = companies.filter((c: { status: string }) => c.status === "active").length;
      const pendingCompanies = companies.filter((c: { status: string }) => c.status === "pending").length;
      const rejectedCompanies = companies.filter((c: { status: string }) => c.status === "rejected").length;

      // Calculer le CA total et les crédits des compagnies actives
      const activeCompanyIds = companies
        .filter((c: { status: string }) => c.status === "active")
        .map((c: { id: number }) => c.id);

      let totalActiveRevenue = 0;
      let totalActiveCredits = 0;

      if (activeCompanyIds.length > 0) {
        const [revStats] = await db.select({
            totalRevenue: sql<number>`COALESCE(SUM(CAST(${creditTransactions.amountLocal} AS DECIMAL(12,2))), 0)`,
            totalCredits: sql<number>`COALESCE(SUM(${creditTransactions.points}), 0)`,
          })
          .from(creditTransactions)
          .where(
            and(
              sql`${creditTransactions.companyId} IN (${sql.raw(activeCompanyIds.join(","))})`  ,
              eq(creditTransactions.type, "credit"),
              input.startDate ? gte(creditTransactions.createdAt, new Date(input.startDate)) : undefined,
              input.endDate ? lte(creditTransactions.createdAt, new Date(input.endDate)) : undefined
            )
          );
        totalActiveRevenue = Number(revStats?.totalRevenue ?? 0);
        totalActiveCredits = Number(revStats?.totalCredits ?? 0);
      }

      // Récupérer le taux de commission
      const [bdevFull] = await db.select({ commissionRate: businessDevelopers.commissionRate })
        .from(businessDevelopers)
        .where(eq(businessDevelopers.id, payload.id));
      const commissionRate = Number(bdevFull?.commissionRate ?? 5);

      return {
        totalReferred: companies.length,
        activeCompanies,
        pendingCompanies,
        rejectedCompanies,
        totalActiveRevenue,
        totalActiveCredits,
        commissionFromReferrals: (totalActiveRevenue * commissionRate) / 100,
        commissionRate,
        companies: companies.map((c: any) => ({
          ...c,
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        })),
      };
    }),

  /** Vérifier si un bdId existe (pour le formulaire d'inscription compagnie) */
  checkBdId: publicProcedure
    .input(z.object({ bdId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
      const [bdev] = await db.select({ bdId: businessDevelopers.bdId, firstName: businessDevelopers.firstName, lastName: businessDevelopers.lastName, status: businessDevelopers.status })
        .from(businessDevelopers)
        .where(eq(businessDevelopers.bdId, input.bdId.toUpperCase()));

      if (!bdev) return { valid: false, bdev: null };
      return { valid: true, bdev: { bdId: bdev.bdId, name: `${bdev.firstName} ${bdev.lastName}`, status: bdev.status } };
    }),
});
