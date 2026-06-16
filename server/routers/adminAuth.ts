/**
 * adminAuth.ts
 * Authentification admin général (email + mot de passe) — distinct de l'OAuth compagnie.
 * Cookie : admin_session (httpOnly, séparé de app_session_id)
 * Inclut : login, logout, me, gestion des profils admin, journal des connexions,
 *          promotion/rétrogradation des utilisateurs OAuth.
 */
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";
import { eq, desc, ne } from "drizzle-orm";
import { adminCredentials, adminLoginLogs, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { ENV } from "../_core/env";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, router } from "../_core/trpc";

const ADMIN_COOKIE = "admin_session";
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

async function getSecretKey() {
  return new TextEncoder().encode(ENV.cookieSecret + "_admin");
}

async function signAdminToken(payload: { adminId: number; email: string }) {
  const key = await getSecretKey();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(key);
}

async function verifyAdminToken(token: string) {
  try {
    const key = await getSecretKey();
    const { payload } = await jwtVerify(token, key);
    return payload as { adminId: number; email: string };
  } catch {
    return null;
  }
}

/** Middleware interne : vérifie le cookie admin et retourne l'admin courant */
async function requireAdmin(ctx: { req: { headers: { cookie?: string } } }) {
  const cookies = ctx.req.headers.cookie ?? "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  if (!match) throw new TRPCError({ code: "UNAUTHORIZED", message: "Non connecté" });

  const payload = await verifyAdminToken(decodeURIComponent(match[1]));
  if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Session expirée" });

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

  const [admin] = await db
    .select()
    .from(adminCredentials)
    .where(eq(adminCredentials.id, payload.adminId))
    .limit(1);

  if (!admin || !admin.isActive) throw new TRPCError({ code: "UNAUTHORIZED", message: "Compte désactivé" });
  return { admin, db };
}

export const adminAuthRouter = router({
  // ─── Connexion admin par email + mot de passe ───────────────────────────────
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [admin] = await db
        .select()
        .from(adminCredentials)
        .where(eq(adminCredentials.email, input.email.toLowerCase().trim()))
        .limit(1);

      const ipAddress = (ctx.req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim()
        ?? ctx.req.socket?.remoteAddress
        ?? "unknown";
      const userAgent = (ctx.req.headers["user-agent"] as string | undefined) ?? "";

      if (!admin || !admin.isActive) {
        // Log tentative échouée si l'admin existe
        if (admin) {
          await db.insert(adminLoginLogs).values({
            adminId: admin.id,
            email: admin.email,
            displayName: admin.displayName,
            ipAddress,
            userAgent,
            success: false,
          });
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });
      }

      const valid = await bcrypt.compare(input.password, admin.passwordHash);
      if (!valid) {
        await db.insert(adminLoginLogs).values({
          adminId: admin.id,
          email: admin.email,
          displayName: admin.displayName,
          ipAddress,
          userAgent,
          success: false,
        });
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });
      }

      // Mettre à jour lastLoginAt et enregistrer le log
      await db.update(adminCredentials).set({ lastLoginAt: new Date() }).where(eq(adminCredentials.id, admin.id));
      await db.insert(adminLoginLogs).values({
        adminId: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        ipAddress,
        userAgent,
        success: true,
      });

      const token = await signAdminToken({ adminId: admin.id, email: admin.email });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(ADMIN_COOKIE, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return {
        success: true,
        admin: { id: admin.id, email: admin.email, displayName: admin.displayName },
      };
    }),

  // ─── Vérifier si l'admin est connecté ──────────────────────────────────────
  me: publicProcedure.query(async ({ ctx }) => {
    const cookies = ctx.req.headers.cookie ?? "";
    const match = cookies.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
    if (!match) return null;

    const payload = await verifyAdminToken(decodeURIComponent(match[1]));
    if (!payload) return null;

    const db = await getDb();
    if (!db) return null;

    const [admin] = await db
      .select({ id: adminCredentials.id, email: adminCredentials.email, displayName: adminCredentials.displayName, isActive: adminCredentials.isActive })
      .from(adminCredentials)
      .where(eq(adminCredentials.id, payload.adminId))
      .limit(1);

    if (!admin || !admin.isActive) return null;
    return admin;
  }),

  // ─── Déconnexion admin ──────────────────────────────────────────────────────
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(ADMIN_COOKIE, { ...cookieOptions });
    return { success: true };
  }),

  // ─── Liste des profils admin ────────────────────────────────────────────────
  listAdmins: publicProcedure.query(async ({ ctx }) => {
    const { db } = await requireAdmin(ctx);
    return db
      .select({ id: adminCredentials.id, email: adminCredentials.email, displayName: adminCredentials.displayName, isActive: adminCredentials.isActive, lastLoginAt: adminCredentials.lastLoginAt, createdAt: adminCredentials.createdAt })
      .from(adminCredentials)
      .orderBy(desc(adminCredentials.createdAt));
  }),

  // ─── Ajouter un profil admin ────────────────────────────────────────────────
  addAdmin: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(4), displayName: z.string().min(2) }))
    .mutation(async ({ input, ctx }) => {
      const { db } = await requireAdmin(ctx);
      const passwordHash = await bcrypt.hash(input.password, 12);
      await db.insert(adminCredentials).values({
        email: input.email.toLowerCase().trim(),
        passwordHash,
        displayName: input.displayName,
        isActive: true,
      });
      return { success: true };
    }),

  // ─── Activer / Désactiver un profil admin ───────────────────────────────────
  toggleAdmin: publicProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const { admin, db } = await requireAdmin(ctx);
      if (admin.id === input.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Impossible de se désactiver soi-même" });
      await db.update(adminCredentials).set({ isActive: input.isActive }).where(eq(adminCredentials.id, input.id));
      return { success: true };
    }),

  // ─── Modifier le mot de passe d'un admin ───────────────────────────────────
  changePassword: publicProcedure
    .input(z.object({ id: z.number(), newPassword: z.string().min(4) }))
    .mutation(async ({ input, ctx }) => {
      const { db } = await requireAdmin(ctx);
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await db.update(adminCredentials).set({ passwordHash }).where(eq(adminCredentials.id, input.id));
      return { success: true };
    }),

  // ─── Supprimer un profil admin ──────────────────────────────────────────────
  deleteAdmin: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { admin, db } = await requireAdmin(ctx);
      if (admin.id === input.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Impossible de se supprimer soi-même" });
      await db.delete(adminCredentials).where(eq(adminCredentials.id, input.id));
      return { success: true };
    }),

  // ─── Journal des connexions ─────────────────────────────────────────────────
  loginLogs: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(100) }).optional())
    .query(async ({ input, ctx }) => {
      const { db } = await requireAdmin(ctx);
      return db
        .select()
        .from(adminLoginLogs)
        .orderBy(desc(adminLoginLogs.createdAt))
        .limit(input?.limit ?? 100);
    }),

  // ─── Liste des utilisateurs OAuth (pour promotion) ─────────────────────────
  listUsers: publicProcedure.query(async ({ ctx }) => {
    const { db } = await requireAdmin(ctx);
    return db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn })
      .from(users)
      .orderBy(desc(users.lastSignedIn));
  }),

  // ─── Promouvoir un utilisateur OAuth en admin ───────────────────────────────
  promoteUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { db } = await requireAdmin(ctx);
      await db.update(users).set({ role: "admin" }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ─── Rétrograder un utilisateur OAuth en user ──────────────────────────────
  demoteUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { db } = await requireAdmin(ctx);
      await db.update(users).set({ role: "user" }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ─── Bootstrap : Promouvoir un utilisateur par email (sans authentification) ──
  // Procédure publique pour promouvoir le premier administrateur
  bootstrapPromoteUserByEmail: publicProcedure
    .input(z.object({ email: z.string().email(), bootstrapSecret: z.string() }))
    .mutation(async ({ input }) => {
      // Vérifier le secret de bootstrap
      const bootstrapSecret = process.env.BOOTSTRAP_SECRET || "hub-resa-bootstrap-2026";
      if (input.bootstrapSecret !== bootstrapSecret) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Secret de bootstrap invalide" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Chercher l'utilisateur par email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email.toLowerCase().trim()))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Utilisateur avec l'email ${input.email} non trouvé` });
      }

      // Promouvoir en admin
      await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));

      return { success: true, message: `L'utilisateur ${input.email} a été promu en administrateur` };
    }),
});
