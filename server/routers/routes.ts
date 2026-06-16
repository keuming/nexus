import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { routes } from "../../drizzle/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import { getDb } from "../db";

export const routesRouter = router({
  // Créer une nouvelle ligne de départ
  createRoute: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Le nom de la ligne est requis"),
        departureCity: z.string().min(1, "La ville de départ est requise"),
        arrivalCity: z.string().min(1, "La ville d'arrivée est requise"),
        distance: z.number().optional(),
        estimatedDuration: z.number().optional(),
        basePrice: z.string().min(1, "Le prix de base est requis"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(routes).values({
        name: input.name,
        departureCity: input.departureCity,
        arrivalCity: input.arrivalCity,
        distance: input.distance || 0,
        estimatedDuration: input.estimatedDuration || 0,
        basePrice: input.basePrice,
        currency: "XOF",
        isActive: true,
        description: input.description,
        createdBy: ctx.user?.id ? parseInt(ctx.user.id.toString()) : undefined,
      });
      return result;
    }),

  // Récupérer toutes les lignes
  listRoutes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const allRoutes = await db
      .select()
      .from(routes)
      .orderBy(desc(routes.createdAt));
    return allRoutes;
  }),

  // Récupérer les lignes actives
  listActiveRoutes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const activeRoutes = await db
      .select()
      .from(routes)
      .where(eq(routes.isActive, true))
      .orderBy(routes.name);
    return activeRoutes;
  }),

  // Récupérer une ligne par ID
  getRoute: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const route = await db
        .select()
        .from(routes)
        .where(eq(routes.id, input.id));
      return route[0] || null;
    }),

  // Mettre à jour une ligne
  updateRoute: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        departureCity: z.string().optional(),
        arrivalCity: z.string().optional(),
        distance: z.number().optional(),
        estimatedDuration: z.number().optional(),
        basePrice: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updateData } = input;
      const result = await db
        .update(routes)
        .set(updateData)
        .where(eq(routes.id, id));
      return result;
    }),

  // Supprimer une ligne
  deleteRoute: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.delete(routes).where(eq(routes.id, input.id));
      return result;
    }),

  // Basculer le statut actif/inactif
  toggleRouteStatus: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .update(routes)
        .set({ isActive: input.isActive })
        .where(eq(routes.id, input.id));
      return result;
    }),
});
