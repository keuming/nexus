/**
 * Photos router — gestion de la bibliothèque photos par compagnie
 * Procédures : uploadPhoto, listPhotos, deletePhoto, listCompaniesWithPhotos, getCompanyGallery
 */
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { companyPhotos, transportCompanies } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

// Middleware : vérifie que l'utilisateur a une compagnie active
const companyProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  const company = await db
    .select()
    .from(transportCompanies)
    .where(eq(transportCompanies.userId, ctx.user.id))
    .limit(1)
    .then((r) => r[0]);
  if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Aucune compagnie associée" });
  if (company.status !== "active")
    throw new TRPCError({ code: "FORBIDDEN", message: "Compte compagnie non activé" });
  return next({ ctx: { ...ctx, company } });
});

// ─── Router ───────────────────────────────────────────────────────────────────
export const photosRouter = router({
  // Upload une photo (base64 → S3 → DB)
  uploadPhoto: companyProcedure
    .input(
      z.object({
        base64: z.string().min(10), // data:image/...;base64,...
        mimeType: z.string().regex(/^image\/(jpeg|png|webp|gif)$/),
        caption: z.string().max(300).default(""),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Décoder le base64
      const base64Data = input.base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Limiter à 5 Mo
      if (buffer.byteLength > 5 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image trop lourde (max 5 Mo)" });
      }

      const ext = input.mimeType.split("/")[1];
      const fileKey = `company-photos/${ctx.company.id}/${randomSuffix()}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      // Compter les photos existantes pour l'ordre
      const existing = await db
        .select({ id: companyPhotos.id })
        .from(companyPhotos)
        .where(eq(companyPhotos.companyId, ctx.company.id));

      const [photo] = await db
        .insert(companyPhotos)
        .values({
          companyId: ctx.company.id,
          url,
          fileKey,
          caption: input.caption,
          sortOrder: existing.length,
        })
        .$returningId();

      return { id: photo.id, url, caption: input.caption };
    }),

  // Lister les photos d'une compagnie (dashboard — protégé)
  listMyPhotos: companyProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(companyPhotos)
      .where(eq(companyPhotos.companyId, ctx.company.id))
      .orderBy(asc(companyPhotos.sortOrder), asc(companyPhotos.createdAt));
  }),

  // Mettre à jour la légende d'une photo
  updateCaption: companyProcedure
    .input(z.object({ photoId: z.number(), caption: z.string().max(300) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const photo = await db
        .select()
        .from(companyPhotos)
        .where(
          and(eq(companyPhotos.id, input.photoId), eq(companyPhotos.companyId, ctx.company.id))
        )
        .limit(1)
        .then((r) => r[0]);
      if (!photo) throw new TRPCError({ code: "NOT_FOUND" });
      await db
        .update(companyPhotos)
        .set({ caption: input.caption })
        .where(eq(companyPhotos.id, input.photoId));
      return { success: true };
    }),

  // Supprimer une photo
  deletePhoto: companyProcedure
    .input(z.object({ photoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const photo = await db
        .select()
        .from(companyPhotos)
        .where(
          and(eq(companyPhotos.id, input.photoId), eq(companyPhotos.companyId, ctx.company.id))
        )
        .limit(1)
        .then((r) => r[0]);
      if (!photo) throw new TRPCError({ code: "NOT_FOUND" });
      await db.delete(companyPhotos).where(eq(companyPhotos.id, input.photoId));
      return { success: true };
    }),

  // Réordonner les photos (drag-and-drop)
  reorderPhotos: companyProcedure
    .input(z.object({ orderedIds: z.array(z.number()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Vérifier que toutes les photos appartiennent bien à cette compagnie
      const existing = await db
        .select({ id: companyPhotos.id })
        .from(companyPhotos)
        .where(eq(companyPhotos.companyId, ctx.company.id));
      const ownedIds = new Set(existing.map((p) => p.id));
      for (const id of input.orderedIds) {
        if (!ownedIds.has(id)) throw new TRPCError({ code: "FORBIDDEN", message: "Photo non autorisée" });
      }
      // Mettre à jour sortOrder pour chaque photo
      await Promise.all(
        input.orderedIds.map((id, index) =>
          db!.update(companyPhotos).set({ sortOrder: index }).where(eq(companyPhotos.id, id))
        )
      );
      return { success: true };
    }),

  // ─── PUBLIC ────────────────────────────────────────────────────────────────

  // Liste des compagnies actives avec au moins 1 photo (pour la page Bibliothèque)
  listCompaniesWithPhotos: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    // Toutes les compagnies actives
    const companies = await db
      .select({
        id: transportCompanies.id,
        companyName: transportCompanies.companyName,
        activityType: transportCompanies.activityType,
        logoUrl: transportCompanies.logoUrl,
        countryId: transportCompanies.countryId,
        cityId: transportCompanies.cityId,
      })
      .from(transportCompanies)
      .where(eq(transportCompanies.status, "active"))
      .orderBy(asc(transportCompanies.companyName));

    // Pour chaque compagnie, compter les photos
    const photoCounts = await db
      .select({ companyId: companyPhotos.companyId })
      .from(companyPhotos);

    const countMap = new Map<number, number>();
    for (const p of photoCounts) {
      countMap.set(p.companyId, (countMap.get(p.companyId) ?? 0) + 1);
    }

    // Retourner toutes les compagnies actives (même sans photos, pour afficher le logo)
    return companies.map((c) => ({
      ...c,
      photoCount: countMap.get(c.id) ?? 0,
    }));
  }),

  // Galerie publique d'une compagnie (par slug ou id)
  getCompanyGallery: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { company: null, photos: [] };

      const company = await db
        .select({
        id: transportCompanies.id,
        companyName: transportCompanies.companyName,
        activityType: transportCompanies.activityType,
        logoUrl: transportCompanies.logoUrl,
        countryId: transportCompanies.countryId,
        cityId: transportCompanies.cityId,
      })
      .from(transportCompanies)
      .where(
        and(
          eq(transportCompanies.id, input.companyId),
          eq(transportCompanies.status, "active")
        )
      )
        .limit(1)
        .then((r) => r[0] ?? null);

      if (!company) return { company: null, photos: [] };

      const photos = await db
        .select()
        .from(companyPhotos)
        .where(eq(companyPhotos.companyId, input.companyId))
        .orderBy(asc(companyPhotos.sortOrder), asc(companyPhotos.createdAt));

      return { company, photos };
    }),

  // Récupérer les détails d'une compagnie (pour page de partage)
  getCompanyById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const company = await db
        .select({
          id: transportCompanies.id,
          companyName: transportCompanies.companyName,
          activityType: transportCompanies.activityType,
          logoUrl: transportCompanies.logoUrl,
          galleryImageUrl: transportCompanies.galleryImageUrl,
          description: transportCompanies.description,
          phone: transportCompanies.phone,
          email: transportCompanies.email,
          address: transportCompanies.address,
        })
        .from(transportCompanies)
        .where(
          and(
            eq(transportCompanies.id, input.id),
            eq(transportCompanies.status, "active")
          )
        )
        .limit(1)
        .then((r) => r[0] ?? null);

      return company;
    }),

  // Première photo d'une compagnie (pour bannière dans le répertoire)
  getFirstPhoto: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const photo = await db
        .select({ url: companyPhotos.url, caption: companyPhotos.caption })
        .from(companyPhotos)
        .where(eq(companyPhotos.companyId, input.companyId))
        .orderBy(asc(companyPhotos.sortOrder), asc(companyPhotos.createdAt))
        .limit(1)
        .then((r) => r[0] ?? null);
      return photo;
    }),

  // Photos récentes de compagnies actives ou en attente (pour le carrousel page d'accueil)
  recentPublic: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(30).default(12) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      // Jointure pour prendre les compagnies actives ET en attente
      const rows = await db
        .select({
          id: companyPhotos.id,
          url: companyPhotos.url,
          caption: companyPhotos.caption,
          companyId: companyPhotos.companyId,
          companyName: transportCompanies.companyName,
          logoUrl: transportCompanies.logoUrl,
        })
        .from(companyPhotos)
        .innerJoin(transportCompanies, eq(companyPhotos.companyId, transportCompanies.id))
        .where(inArray(transportCompanies.status, ["active", "pending"]))
        .orderBy(desc(companyPhotos.createdAt))
        .limit(input?.limit ?? 12);
      return rows;
    }),

  // Compagnies pour le carrousel (avec ou sans photos) — affiche logos + noms
  companiesForCarousel: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    // Retourner TOUTES les compagnies (sans filtre de statut)
    const companies = await db
      .select({
        id: transportCompanies.id,
        companyName: transportCompanies.companyName,
        logoUrl: transportCompanies.logoUrl,
        galleryImageUrl: transportCompanies.galleryImageUrl,
        description: transportCompanies.description,
        status: transportCompanies.status,
        activityType: transportCompanies.activityType,
      })
      .from(transportCompanies)
      .orderBy(desc(transportCompanies.createdAt))
      .limit(50);
    console.log('[companiesForCarousel] Retournant', companies.length, 'compagnies');
    return companies;
  }),

  // Premières photos de plusieurs compagnies en une seule requête (batch pour le répertoire)
  getBannerPhotos: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};
    // Récupérer la photo avec le plus petit sortOrder par compagnie
    const photos = await db
      .select({
        companyId: companyPhotos.companyId,
        url: companyPhotos.url,
        caption: companyPhotos.caption,
        sortOrder: companyPhotos.sortOrder,
      })
      .from(companyPhotos)
      .orderBy(asc(companyPhotos.sortOrder), asc(companyPhotos.createdAt));
    // Garder uniquement la première photo par compagnie
    const bannerMap: Record<number, { url: string; caption: string | null }> = {};
    for (const p of photos) {
      if (!(p.companyId in bannerMap)) {
        bannerMap[p.companyId] = { url: p.url, caption: p.caption ?? null };
      }
    }
    return bannerMap;
  }),

  // Upload une image de galerie pour remplacer le logo dans le carrousel
  uploadGalleryImage: companyProcedure
    .input(
      z.object({
        base64: z.string().min(10), // data:image/...;base64,...
        mimeType: z.string().regex(/^image\/(jpeg|png|webp)$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Decoder le base64
      const base64Data = input.base64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Limiter a 5 Mo
      if (buffer.byteLength > 5 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image trop lourde (max 5 Mo)" });
      }

      const ext = input.mimeType.split("/")[1];
      const fileKey = `gallery-images/${ctx.company.id}/${randomSuffix()}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      return { url };
    }),
});
