import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { transportStations } from "../../drizzle/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import { getDb } from "../db";

export const stationsRouter = router({
  // Créer une nouvelle gare
  createStation: protectedProcedure
    .input(
      z.object({
        companyId: z.number(),
        name: z.string().min(1, "Le nom de la gare est requis"),
        city: z.string().min(1, "La ville est requise"),
        countryId: z.number().optional(),
        address: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(transportStations).values({
        companyId: input.companyId,
        name: input.name,
        city: input.city,
        countryId: input.countryId,
        address: input.address,
        active: true,
      });
      return result;
    }),

  // Récupérer toutes les gares d'une compagnie
  listStations: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const stations = await db
        .select()
        .from(transportStations)
        .where(eq(transportStations.companyId, input.companyId))
        .orderBy(desc(transportStations.createdAt));
      return stations;
    }),

  // Récupérer les gares actives d'une compagnie
  listActiveStations: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const stations = await db
        .select()
        .from(transportStations)
        .where(
          sql`${transportStations.companyId} = ${input.companyId} AND ${transportStations.active} = true`
        )
        .orderBy(transportStations.name);
      return stations;
    }),

  // Récupérer une gare par ID
  getStation: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const station = await db
        .select()
        .from(transportStations)
        .where(eq(transportStations.id, input.id));
      return station[0] || null;
    }),

  // Mettre à jour une gare
  updateStation: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        city: z.string().optional(),
        countryId: z.number().optional(),
        address: z.string().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updateData } = input;
      const result = await db
        .update(transportStations)
        .set(updateData)
        .where(eq(transportStations.id, id));
      return result;
    }),

  // Supprimer une gare
  deleteStation: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .delete(transportStations)
        .where(eq(transportStations.id, input.id));
      return result;
    }),

  // Basculer le statut actif/inactif
  toggleStationStatus: protectedProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .update(transportStations)
        .set({ active: input.active })
        .where(eq(transportStations.id, input.id));
      return result;
    }),
});
