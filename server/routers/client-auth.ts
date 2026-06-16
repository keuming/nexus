import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { clients } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";

// Hash password with bcrypt-like approach (simplified for demo)
async function hashPassword(password: string): Promise<string> {
  return crypto.createHash("sha256").update(password + "salt").digest("hex");
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = crypto.createHash("sha256").update(password + "salt").digest("hex");
  return computed === hash;
}

export const clientAuthRouter = {
  // ── SIGNUP ───────────────────────────────────────────────────────────────────
  signup: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        phone: z.string().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Vérifier que l'email n'existe pas
      const existing = await db
        .select()
        .from(clients)
        .where(eq(clients.email, input.email));

      if (existing.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cet email est déjà utilisé",
        });
      }

      // Hasher le mot de passe
      const passwordHash = await hashPassword(input.password);

      // Créer le client
      await db.insert(clients).values({
        name: input.name,
        email: input.email,
        passwordHash,
        phone: input.phone,
        country: input.country,
        city: input.city,
        isActive: true,
      });

      return {
        success: true,
        message: "Compte créé avec succès",
      };
    }),

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Chercher le client
      const clientList = await db
        .select()
        .from(clients)
        .where(eq(clients.email, input.email));

      if (clientList.length === 0) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect",
        });
      }

      const client = clientList[0];

      // Vérifier que le compte est actif
      if (!client.isActive) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ce compte a été désactivé",
        });
      }

      // Vérifier le mot de passe
      const isValid = await verifyPassword(input.password, client.passwordHash || "");
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Email ou mot de passe incorrect",
        });
      }

      // Mettre à jour lastLoginAt
      await db
        .update(clients)
        .set({ lastLoginAt: new Date() })
        .where(eq(clients.id, client.id));

      return {
        id: client.id,
        email: client.email,
        name: client.name || "",
        message: "Connexion réussie",
      };
    }),

  // ── GET PROFILE ──────────────────────────────────────────────────────────────
  getProfile: publicProcedure.query(async (): Promise<{
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    country: string | null;
    city: string | null;
    createdAt: Date;
    lastLoginAt: Date | null;
  } | null> => {
    // This would normally get the current user from context
    // For now, return null - should be implemented with proper auth context
    return null;
  }),

  // ── GET BOOKINGS ─────────────────────────────────────────────────────────────
  getBookings: publicProcedure.query(async (): Promise<Array<{
    id: number;
    service: string;
    companyName: string;
    status: string;
    cost: number;
    bookingDate: Date;
  }>> => {
    // This would normally get bookings for the current user
    return [];
  }),

  // ── UPDATE PROFILE ───────────────────────────────────────────────────────────
  updateProfile: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        country: z.string().optional(),
        city: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // This would normally update the current user's profile
      return { success: true, message: "Profil mis à jour" };
    }),

  // ── CHANGE PASSWORD ──────────────────────────────────────────────────────────
  changePassword: publicProcedure
    .input(
      z.object({
        oldPassword: z.string(),
        newPassword: z.string().min(6),
      })
    )
    .mutation(async ({ input }) => {
      // This would normally change the current user's password
      return { success: true, message: "Mot de passe changé avec succès" };
    }),

  // ── LOGOUT ───────────────────────────────────────────────────────────────────
  logout: publicProcedure.mutation(async () => {
    return { success: true, message: "Déconnecté" };
  }),

  // ── LIST CLIENTS (Admin) ─────────────────────────────────────────────────────
  listClients: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const allClients = await db.select().from(clients);
    return allClients;
  }),

  // ── TOGGLE CLIENT STATUS (Admin) ─────────────────────────────────────────────
  toggleClientStatus: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(clients)
        .set({ isActive: input.isActive })
        .where(eq(clients.id, Number(input.clientId)));

      return { success: true };
    }),

  // ── GET CLIENT BOOKINGS (Admin) ──────────────────────────────────────────────
  getClientBookings: publicProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }): Promise<Array<{
      id: number;
      service: string;
      companyName: string;
      status: string;
      cost: number;
      bookingDate: Date;
    }>> => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Return empty array for now - would need proper bookings table
      return [];
    }),
};
