import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { stops } from "../../drizzle/schema";
import { eq, desc, asc } from "drizzle-orm";
import { getDb } from "../db";

export const stopsRouter = router({
  // Créer un nouvel arrêt
  createStop: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Le nom de l'arrêt est requis"),
        city: z.string().min(1, "La ville est requise"),
        address: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(stops).values({
        name: input.name,
        city: input.city,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        description: input.description,
        isActive: true,
        createdBy: ctx.user?.id ? parseInt(ctx.user.id.toString()) : undefined,
      });
      return result;
    }),

  // Récupérer tous les arrêts
  listStops: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const allStops = await db
      .select()
      .from(stops)
      .orderBy(desc(stops.createdAt));
    return allStops;
  }),

  // Récupérer les arrêts actifs
  listActiveStops: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const activeStops = await db
      .select()
      .from(stops)
      .where(eq(stops.isActive, true))
      .orderBy(asc(stops.city), asc(stops.name));
    return activeStops;
  }),

  // Récupérer les arrêts par ville
  getStopsByCity: publicProcedure
    .input(z.object({ city: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const cityStops = await db
        .select()
        .from(stops)
        .where(eq(stops.city, input.city));
      return cityStops;
    }),

  // Récupérer un arrêt par ID
  getStop: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const stop = await db
        .select()
        .from(stops)
        .where(eq(stops.id, input.id));
      return stop[0] || null;
    }),

  // Mettre à jour un arrêt
  updateStop: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        city: z.string().optional(),
        address: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updateData } = input;
      const result = await db
        .update(stops)
        .set(updateData)
        .where(eq(stops.id, id));
      return result;
    }),

  // Supprimer un arrêt
  deleteStop: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .delete(stops)
        .where(eq(stops.id, input.id));
      return result;
    }),

  // Basculer le statut d'un arrêt
  toggleStopStatus: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .update(stops)
        .set({ isActive: input.isActive })
        .where(eq(stops.id, input.id));
      return result;
    }),
});
