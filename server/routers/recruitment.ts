/**
 * recruitment.ts — Gestion du programme de recrutement des commerciaux
 *
 * Procédures publiques : submit (candidature)
 * Procédures admin : list, updateStatus, addNote, delete
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { commercialCandidates } from "../../drizzle/schema";
import { desc, eq, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const educationLevels = ["brevet", "bac", "bac+2", "bac+3", "bac+4", "bac+5", "doctorat", "autre"] as const;
const languages = ["francais", "espagnol", "anglais"] as const;
const statuses = ["nouveau", "contacte", "entretien", "retenu", "rejete"] as const;
const experienceLevels = ["aucune", "moins_1an", "1_3ans", "3_5ans", "plus_5ans"] as const;
const targetSectors = ["transport", "restauration", "hotel", "boutique", "agence_voyage", "tous"] as const;

const candidateSchema = z.object({
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  phone: z.string().min(8).max(50),
  email: z.string().email().max(320),
  country: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  educationLevel: z.enum(educationLevels),
  language: z.enum(languages),
  // Nouveaux champs enrichis
  experience: z.enum(experienceLevels).optional(),
  targetSector: z.enum(targetSectors).optional(),
  motivation: z.string().max(2000).optional(),
  cvUrl: z.string().url().max(1000).optional(),
  cvKey: z.string().max(500).optional(),
  coverLetterUrl: z.string().url().max(1000).optional(),
  coverLetterKey: z.string().max(500).optional(),
});

export const recruitmentRouter = {
  // ── PUBLIC : soumettre une candidature ──────────────────────────────────────
  submit: publicProcedure
    .input(candidateSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });

      await db.insert(commercialCandidates).values({
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        country: input.country,
        city: input.city,
        educationLevel: input.educationLevel,
        language: input.language,
        experience: input.experience,
        targetSector: input.targetSector,
        motivation: input.motivation,
        cvUrl: input.cvUrl,
        cvKey: input.cvKey,
        coverLetterUrl: input.coverLetterUrl,
        coverLetterKey: input.coverLetterKey,
        status: "nouveau",
      });

      // Notification au propriétaire HUB_RESA
      try {
        const { notifyOwner } = await import("../_core/notification");
        await notifyOwner({
          title: `🎯 Nouvelle candidature BD — ${input.firstName} ${input.lastName}`,
          content: `Pays : ${input.country} | Ville : ${input.city}\nNiveau : ${input.educationLevel} | Expérience : ${input.experience ?? "non précisée"}\nSecteur cible : ${input.targetSector ?? "tous"}\nEmail : ${input.email} | Tél : ${input.phone}\nCV joint : ${input.cvUrl ? "Oui" : "Non"} | LM jointe : ${input.coverLetterUrl ? "Oui" : "Non"}`,
        });
      } catch (_) { /* notification non bloquante */ }

      return { success: true };
    }),

  // ── ADMIN : liste des candidats ─────────────────────────────────────────────
  list: protectedProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum([...statuses, "all"]).default("all"),
    }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return [];

      let query = db.select().from(commercialCandidates).$dynamic();

      if (input?.status && input.status !== "all") {
        query = query.where(eq(commercialCandidates.status, input.status));
      }

      const rows = await query.orderBy(desc(commercialCandidates.createdAt));

      if (input?.search) {
        const s = input.search.toLowerCase();
        return rows.filter(
          (r) =>
            r.firstName.toLowerCase().includes(s) ||
            r.lastName.toLowerCase().includes(s) ||
            r.email.toLowerCase().includes(s) ||
            r.phone.includes(s) ||
            r.city.toLowerCase().includes(s) ||
            r.country.toLowerCase().includes(s)
        );
      }
      return rows;
    }),

  // ── ADMIN : mettre à jour le statut ────────────────────────────────────────
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(statuses),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(commercialCandidates)
        .set({ status: input.status })
        .where(eq(commercialCandidates.id, input.id));
      return { success: true };
    }),

  // ── ADMIN : ajouter une note ────────────────────────────────────────────────
  addNote: protectedProcedure
    .input(z.object({ id: z.number(), notes: z.string().max(2000) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(commercialCandidates)
        .set({ notes: input.notes })
        .where(eq(commercialCandidates.id, input.id));
      return { success: true };
    }),

  // ── ADMIN : supprimer un candidat ───────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(commercialCandidates).where(eq(commercialCandidates.id, input.id));
      return { success: true };
    }),

  // ── ADMIN : statistiques rapides ───────────────────────────────────────────
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return { total: 0, nouveau: 0, contacte: 0, entretien: 0, retenu: 0, rejete: 0 };

    const rows = await db.select().from(commercialCandidates);
    return {
      total: rows.length,
      nouveau: rows.filter((r) => r.status === "nouveau").length,
      contacte: rows.filter((r) => r.status === "contacte").length,
      entretien: rows.filter((r) => r.status === "entretien").length,
      retenu: rows.filter((r) => r.status === "retenu").length,
      rejete: rows.filter((r) => r.status === "rejete").length,
    };
  }),
};
