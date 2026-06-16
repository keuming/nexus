// @ts-nocheck
/**
 * Management Modules Router
 * Simplified procedures for Finance, Embarquement (Boarding), and Manifeste (Manifest)
 */

import { z } from "zod";
import { eq, and, gte, lte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  transportTickets,
  transportShipments,
  transportCharges,
  transportDepartures,
  transportCompanies,
  transportBusLines,
} from "../../drizzle/schema";
import { desc } from "drizzle-orm";

// ─── FINANCE MODULE ────────────────────────────────────────────────────────────

/**
 * Finance module: Encaissement (cash collection), décaissement (cash disbursement), historique
 */
export const financeRouter = router({
  /**
   * Get daily cash summary for a company
   */
  getDailySummary: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      date: z.date().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const targetDate = input.date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get tickets sold today (encaissement)
      const ticketsToday = await db
        .select()
        .from(transportTickets)
        .where(
          and(
            eq(transportTickets.companyId, input.companyId),
            gte(transportTickets.createdAt, startOfDay),
            lte(transportTickets.createdAt, endOfDay),
            eq(transportTickets.cashStatus, "encaisse")
          )
        );

      // Get shipments cashed today
      const shipmentsToday = await db
        .select()
        .from(transportShipments)
        .where(
          and(
            eq(transportShipments.companyId, input.companyId),
            gte(transportShipments.createdAt, startOfDay),
            lte(transportShipments.createdAt, endOfDay),
            eq(transportShipments.cashStatus, "encaisse")
          )
        );

      // Get charges (décaissement) today
      const chargesToday = await db
        .select()
        .from(transportCharges)
        .where(
          and(
            eq(transportCharges.companyId, input.companyId),
            gte(transportCharges.chargeDate, typeof startOfDay === "string" ? startOfDay : (startOfDay as Date).toISOString().split("T")[0]),
            lte(transportCharges.chargeDate, typeof endOfDay === "string" ? endOfDay : (endOfDay as Date).toISOString().split("T")[0])
          )
        );

      const ticketsRevenue = ticketsToday.reduce((sum, t) => sum + (Number(t.priceXOF) || 0), 0);
      const shipmentsRevenue = shipmentsToday.reduce((sum, s) => sum + (Number(s.priceXOF) || 0), 0);
      const totalCharges = chargesToday.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

      return {
        date: targetDate.toISOString().split("T")[0],
        encaissementBillets: ticketsRevenue,
        encaissementExpeditions: shipmentsRevenue,
        totalEncaissement: ticketsRevenue + shipmentsRevenue,
        decaissement: totalCharges,
        soldeNet: ticketsRevenue + shipmentsRevenue - totalCharges,
        ticketsCount: ticketsToday.length,
        shipmentsCount: shipmentsToday.length,
        chargesCount: chargesToday.length,
      };
    }),

  /**
   * Get monthly cash summary
   */
  getMonthlySummary: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      month: z.string(), // YYYY-MM
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [year, month] = input.month.split("-").map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      const ticketsMonth = await db
        .select()
        .from(transportTickets)
        .where(
          and(
            eq(transportTickets.companyId, input.companyId),
            gte(transportTickets.createdAt, startOfMonth),
            lte(transportTickets.createdAt, endOfMonth),
            eq(transportTickets.cashStatus, "encaisse")
          )
        );

      const shipmentsMonth = await db
        .select()
        .from(transportShipments)
        .where(
          and(
            eq(transportShipments.companyId, input.companyId),
            gte(transportShipments.createdAt, startOfMonth),
            lte(transportShipments.createdAt, endOfMonth),
            eq(transportShipments.cashStatus, "encaisse")
          )
        );

      const chargesMonth = await db
        .select()
        .from(transportCharges)
        .where(
          and(
            eq(transportCharges.companyId, input.companyId),
            gte(transportCharges.chargeDate, typeof startOfMonth === "string" ? startOfMonth : (startOfMonth as Date).toISOString().split("T")[0]),
            lte(transportCharges.chargeDate, typeof endOfMonth === "string" ? endOfMonth : (endOfMonth as Date).toISOString().split("T")[0])
          )
        );

      const ticketsRevenue = ticketsMonth.reduce((sum, t) => sum + (Number(t.priceXOF) || 0), 0);
      const shipmentsRevenue = shipmentsMonth.reduce((sum, s) => sum + (Number(s.priceXOF) || 0), 0);
      const totalCharges = chargesMonth.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

      return {
        month: input.month,
        encaissementBillets: ticketsRevenue,
        encaissementExpeditions: shipmentsRevenue,
        totalEncaissement: ticketsRevenue + shipmentsRevenue,
        decaissement: totalCharges,
        soldeNet: ticketsRevenue + shipmentsRevenue - totalCharges,
        ticketsCount: ticketsMonth.length,
        shipmentsCount: shipmentsMonth.length,
        chargesCount: chargesMonth.length,
      };
    }),

  /**
   * Create a charge (décaissement)
   */
  createCharge: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      category: z.enum(["carburant", "maintenance", "salaire", "frais_divers"]),
      description: z.string(),
      amount: z.string(),
      station: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      await db.insert(transportCharges).values({
        companyId: input.companyId,
        category: input.category,
        description: input.description,
        amount: input.amount,
        station: input.station,
        chargeDate: new Date().toISOString().split("T")[0],
        createdAt: new Date(),
      });

      return { success: true };
    }),

  /**
   * Get charges history for a company
   */
  getChargesHistory: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const startDate = input.startDate || new Date(new Date().setDate(new Date().getDate() - 30));
      const endDate = input.endDate || new Date();

      return db
        .select()
        .from(transportCharges)
        .where(
          and(
            eq(transportCharges.companyId, input.companyId),
            gte(transportCharges.chargeDate, typeof startDate === "string" ? startDate : (startDate as Date).toISOString().split("T")[0]),
            lte(transportCharges.chargeDate, typeof endDate === "string" ? endDate : (endDate as Date).toISOString().split("T")[0])
          )
        )
        .orderBy(desc(transportCharges.chargeDate));
    }),
});

// ─── EMBARQUEMENT (BOARDING) MODULE ────────────────────────────────────────────

/**
 * Embarquement module: Passenger boarding management
 */
export const embarquementRouter = router({
  /**
   * Get boarding status for a departure
   */
  getBoardingStatus: protectedProcedure
    .input(z.object({
      departureId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const departure = await db
        .select()
        .from(transportDepartures)
        .where(eq(transportDepartures.id, input.departureId))
        .limit(1);

      if (!departure[0]) return null;

      // Get bus line info for cities
      const busLine = await db
        .select()
        .from(transportBusLines)
        .where(eq(transportBusLines.id, departure[0].busLineId))
        .limit(1);

      const tickets = await db
        .select()
        .from(transportTickets)
        .where(eq(transportTickets.departureId, input.departureId));

      const boarded = tickets.filter((t) => t.boardingStatus === "embarque").length;
      const notBoarded = tickets.filter((t) => t.boardingStatus === "non_embarque").length;

      return {
        departureId: input.departureId,
        departureCity: busLine?.[0]?.departureCity || "—",
        arrivalCity: busLine?.[0]?.arrivalCity || "—",
        departureDate: departure[0].departureDate,
        departureTime: departure[0].departureTime,
        status: departure[0].status,
        totalTickets: tickets.length,
        boarded,
        notBoarded,
        boardingPercentage: tickets.length > 0 ? Math.round((boarded / tickets.length) * 100) : 0,
      };
    }),

  /**
   * Get list of passengers for boarding
   */
  getPassengersList: protectedProcedure
    .input(z.object({
      departureId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select({
          id: transportTickets.id,
          ticketNumber: transportTickets.ticketNumber,
          firstName: transportTickets.firstName,
          lastName: transportTickets.lastName,
          seatNumber: transportTickets.seatNumber,
          boardingStatus: transportTickets.boardingStatus,
          idType: transportTickets.idType,
          idNumber: transportTickets.idNumber,
          nationality: transportTickets.nationality,
        })
        .from(transportTickets)
        .where(eq(transportTickets.departureId, input.departureId))
        .orderBy(transportTickets.seatNumber);
    }),

  /**
   * Update boarding status for a ticket
   */
  updateBoardingStatus: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      boardingStatus: z.enum(["embarque", "non_embarque"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      await db
        .update(transportTickets)
        .set({ boardingStatus: input.boardingStatus, updatedAt: new Date() })
        .where(eq(transportTickets.id, input.ticketId));

      return { success: true };
    }),
});

// ─── MANIFESTE (MANIFEST) MODULE ──────────────────────────────────────────────

/**
 * Manifeste module: Passenger manifest for a departure
 */
export const manifesteRouter = router({
  /**
   * Get complete manifest for a departure
   */
  getManifest: protectedProcedure
    .input(z.object({
      departureId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const departure = await db
        .select()
        .from(transportDepartures)
        .where(eq(transportDepartures.id, input.departureId))
        .limit(1);

      if (!departure[0]) return null;

      // Get bus line info for cities
      const busLine = await db
        .select()
        .from(transportBusLines)
        .where(eq(transportBusLines.id, departure[0].busLineId))
        .limit(1);

      const passengers = await db
        .select({
          id: transportTickets.id,
          ticketNumber: transportTickets.ticketNumber,
          seatNumber: transportTickets.seatNumber,
          firstName: transportTickets.firstName,
          lastName: transportTickets.lastName,
          phone: transportTickets.phone,
          idType: transportTickets.idType,
          idNumber: transportTickets.idNumber,
          gender: transportTickets.gender,
          nationality: transportTickets.nationality,
          dropOffCity: transportTickets.dropOffCity,
          boardingStatus: transportTickets.boardingStatus,
        })
        .from(transportTickets)
        .where(eq(transportTickets.departureId, input.departureId))
        .orderBy(transportTickets.seatNumber);

      return {
        departure: {
          id: departure[0].id,
          departureCity: busLine?.[0]?.departureCity || "—",
          arrivalCity: busLine?.[0]?.arrivalCity || "—",
          departureDate: departure[0].departureDate,
          departureTime: departure[0].departureTime,
          driverName: departure[0].driverName,
          status: departure[0].status,
        },
        passengers,
        totalPassengers: passengers.length,
        maleCount: passengers.filter((p) => p.gender === "M").length,
        femaleCount: passengers.filter((p) => p.gender === "F").length,
        boardedCount: passengers.filter((p) => p.boardingStatus === "embarque").length,
      };
    }),

  /**
   * Export manifest as PDF-ready data
   */
  getManifestForPrint: protectedProcedure
    .input(z.object({
      departureId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const departure = await db
        .select()
        .from(transportDepartures)
        .where(eq(transportDepartures.id, input.departureId))
        .limit(1);

      if (!departure[0]) return null;

      // Get bus line info for cities
      const busLine = await db
        .select()
        .from(transportBusLines)
        .where(eq(transportBusLines.id, departure[0].busLineId))
        .limit(1);

      const company = await db
        .select()
        .from(transportCompanies)
        .where(eq(transportCompanies.id, departure[0].companyId))
        .limit(1);

      const passengers = await db
        .select({
          seatNumber: transportTickets.seatNumber,
          firstName: transportTickets.firstName,
          lastName: transportTickets.lastName,
          idType: transportTickets.idType,
          idNumber: transportTickets.idNumber,
          nationality: transportTickets.nationality,
          dropOffCity: transportTickets.dropOffCity,
        })
        .from(transportTickets)
        .where(eq(transportTickets.departureId, input.departureId))
        .orderBy(transportTickets.seatNumber);

      return {
        company: company?.[0]?.companyName || "Transport Company",
        departure: {
          departureCity: busLine?.[0]?.departureCity || "—",
          arrivalCity: busLine?.[0]?.arrivalCity || "—",
          departureDate: departure[0].departureDate,
          departureTime: departure[0].departureTime,
          driverName: departure[0].driverName,
        },
        passengers,
        generatedAt: new Date().toISOString(),
      };
    }),
});

// ─── EXPORT COMBINED ROUTER ───────────────────────────────────────────────────

export const managementModulesRouter = router({
  finance: financeRouter,
  embarquement: embarquementRouter,
  manifeste: manifesteRouter,
});
