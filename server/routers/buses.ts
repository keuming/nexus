import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { buses } from "../../drizzle/schema";
import { eq, desc, asc } from "drizzle-orm";
import { getDb } from "../db";

export const busesRouter = router({
  // Créer un nouveau bus
  createBus: protectedProcedure
    .input(
      z.object({
        licensePlate: z.string().min(1, "La plaque d'immatriculation est requise"),
        model: z.string().min(1, "Le modèle est requis"),
        capacity: z.number().min(1, "La capacité doit être au moins 1"),
        companyId: z.number().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(buses).values({
        licensePlate: input.licensePlate,
        model: input.model,
        capacity: input.capacity,
        companyId: input.companyId,
        description: input.description,
        isActive: true,
        createdBy: ctx.user?.id ? parseInt(ctx.user.id.toString()) : undefined,
      });
      return result;
    }),

  // Récupérer tous les bus
  listBuses: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const allBuses = await db
      .select()
      .from(buses)
      .orderBy(desc(buses.createdAt));
    return allBuses;
  }),

  // Récupérer les bus actifs
  listActiveBuses: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    const activeBuses = await db
      .select()
      .from(buses)
      .where(eq(buses.isActive, true))
      .orderBy(asc(buses.model));
    return activeBuses;
  }),

  // Récupérer un bus par ID
  getBus: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const bus = await db
        .select()
        .from(buses)
        .where(eq(buses.id, input.id));
      return bus[0] || null;
    }),

  // Mettre à jour un bus
  updateBus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        licensePlate: z.string().optional(),
        model: z.string().optional(),
        capacity: z.number().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updateData } = input;
      const result = await db
        .update(buses)
        .set(updateData)
        .where(eq(buses.id, id));
      return result;
    }),

  // Supprimer un bus
  deleteBus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .delete(buses)
        .where(eq(buses.id, input.id));
      return result;
    }),

  // Basculer le statut d'un bus
  toggleBusStatus: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .update(buses)
        .set({ isActive: input.isActive })
        .where(eq(buses.id, input.id));
      return result;
    }),
});
