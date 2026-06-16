import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users, transportCompanies, transportTrips, transportBusLines } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getAllBilling,
  getAllCompanies,
  getBillingByCompany,
  getBusLinesByCompany,
  getBusesByCompany,
  getBookingsByCompany,
  getChargesByCompany,
  getCompanyById,
  getCompanyByUserId,
  getCompaniesByUserId,
  getCsnDashboardStats,
  getCompanyDashboardStats,
  getDepartureById,
  getDeparturesByCompany,
  getOccupiedSeatsByDeparture,
  getOccupiedSeatsByTrip,
  getPublicTripsByCompany,
  getPublicTripsByCountry,
  getRouteFaresByCompany,
  getShipmentsByCompany,
  getStaffByCompany,
  getStationsByCompany,
  getTicketsByCompany,
  getTicketsByDeparture,
  getTripsByCompany,
  generateMonthlyBilling,
  updateBillingStatus,
  updateBookingStatus,
  updateDepartureStatus,
  updateShipmentStatus,
  updateTicketStatus,
  upsertBus,
  upsertBusLine,
  upsertCompany,
  upsertDeparture,
  upsertRouteFare,
  upsertStaff,
  upsertStation,
  upsertTrip,
  validateCompany,
  createBooking,
  createCharge,
  createShipment,
  createTicket,
  deleteBus,
  deleteBusLine,
  trackShipment,
  verifyTicketByNumber,
  getCompaniesByCountry,
  searchPublicTrips,
  createPublicBooking,
  getAllActiveCompanies,
  getAllCreditsStats,
  getGalleryByCompany,
  addGalleryImage,
  deleteGalleryImage,
  getReviewsByCompany,
  createCompanyReview,
  getAverageRating,
  getCompanyCredits,
  addCredits,
  getCreditTransactions,
  getCountryCurrency,
  createCreditRequest,
  getAllCreditRequests,
  getCreditRequestsByCompany,
  confirmCreditRequestPayment,
  rejectCreditRequest,
  autoValidateMobileMoneyPayment,
  saveHub2PaymentIntent,
  adminCreditCompany,
  getTrendingData,
  getCompaniesDetailedStats,
  updateCompanyAdmin,
  suspendCompany,
  reactivateCompany,
  deleteCompanyById,
} from "../transport-db";
import {
  createHub2PaymentIntent,
  attemptHub2Payment,
  getHub2PaymentIntentStatus,
  generateHub2PurchaseRef,
  HUB2_PROVIDERS,
} from "../services/hub2";
import { notifyOwner } from "../_core/notification";

// NEXUS admin check — the owner (OWNER_OPEN_ID) is the NEXUS admin
const csnProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé à l'administrateur NEXUS" });
  }
  return next({ ctx });
});

// Company-scoped procedure — user must have an active company
const companyProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const company = await getCompanyByUserId(ctx.user.id);
  if (!company) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Aucune compagnie associée à ce compte" });
  }
  if (company.status !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Votre compte compagnie n'est pas encore activé" });
  }
  return next({ ctx: { ...ctx, company } });
});

export const transportRouter = router({
  // ─── PUBLIC ──────────────────────────────────────────────────────────────────
  public: router({
    // List all active companies
    companies: publicProcedure.query(() => getAllCompanies().then((c) => c.filter((x) => x.status === "active"))),
    // List all companies (alias for ActivityCarousel)
    listCompanies: publicProcedure.query(() => getAllCompanies().then((c) => c.filter((x) => x.status === "active"))),
    // Get company profile by id
    company: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getCompanyById(input.id)),
    // List trips by company (for public booking page)
    tripsByCompany: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(({ input }) => getPublicTripsByCompany(input.companyId)),
    // List trips by country (for home search)
    tripsByCountry: publicProcedure
      .input(z.object({ countryId: z.number() }))
      .query(({ input }) => getPublicTripsByCountry(input.countryId)),
    // Get occupied seats for a trip
    occupiedSeatsTrip: publicProcedure
      .input(z.object({ tripId: z.number() }))
      .query(({ input }) => getOccupiedSeatsByTrip(input.tripId)),
    // Book a seat online
    book: publicProcedure
      .input(
        z.object({
          companyId: z.number(),
          tripId: z.number(),
          seatNumber: z.number(),
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          priceXOF: z.string().optional(),
        })
      )
      .mutation(({ input }) => createBooking(input.companyId, input)),
    // Track a shipment
    trackShipment: publicProcedure
      .input(z.object({ trackingNumber: z.string() }))
      .query(({ input }) => trackShipment(input.trackingNumber)),
    // Verify a ticket
    verifyTicket: publicProcedure
      .input(z.object({ ticketNumber: z.string() }))
      .query(({ input }) => verifyTicketByNumber(input.ticketNumber)),
    // List companies by country (for public search)
    // Directory: all active companies
    directory: publicProcedure.query(() => getAllActiveCompanies()),
    // Gallery: public
    gallery: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(({ input }) => getGalleryByCompany(input.companyId)),
    // Gallery: add image (company protected)
    addGalleryImage: protectedProcedure
      .input(z.object({ imageUrl: z.string(), caption: z.string().optional(), displayOrder: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const company = await getCompanyByUserId(ctx.user.id);
        if (!company) throw new Error("Compagnie introuvable");
        return addGalleryImage({ ...input, companyId: company.id });
      }),
    // Gallery: delete image (company protected)
    deleteGalleryImage: protectedProcedure
      .input(z.object({ imageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const company = await getCompanyByUserId(ctx.user.id);
        if (!company) throw new Error("Compagnie introuvable");
        return deleteGalleryImage(input.imageId, company.id);
      }),
    // Reviews: public list
    reviews: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(({ input }) => getReviewsByCompany(input.companyId)),
    // Reviews: average rating
    averageRating: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .query(({ input }) => getAverageRating(input.companyId)),
    // Reviews: create (public)
    createReview: publicProcedure
      .input(z.object({
        companyId: z.number(),
        authorName: z.string().min(2),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
        activityType: z.string().default("transport"),
      }))
      .mutation(({ input }) => createCompanyReview(input)),
    companiesByCountry: publicProcedure
      .input(z.object({ countryId: z.number() }))
      .query(({ input }) => getCompaniesByCountry(input.countryId)),
    // Search trips with filters (for public search page)
    searchDepartures: publicProcedure
      .input(
        z.object({
          countryId: z.number().optional(),
          companyId: z.number().optional(),
          departureCity: z.string().optional(),
          arrivalCity: z.string().optional(),
          date: z.string().optional(),
        })
      )
      .query(({ input }) => searchPublicTrips(input)),
    // Get occupied seats for a trip (public)
    occupiedSeats: publicProcedure
      .input(z.object({ departureId: z.number() }))
      .query(({ input }) => getOccupiedSeatsByTrip(input.departureId)),
    // Public booking with passenger details
    bookPublic: publicProcedure
      .input(
        z.object({
          tripId: z.number(),
          seatNumber: z.number(),
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          idType: z.string().optional(),
          idNumber: z.string().optional(),
          gender: z.string().optional(),
          nationality: z.string().optional(),
        })
      )
      .mutation(({ input }) => createPublicBooking({ ...input, companyId: 0 })),
  }),

  // ─── COMPANY REGISTRATION ────────────────────────────────────────────────────
  register: protectedProcedure
    .input(
      z.object({
        companyName: z.string().min(2),
        managerName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        countryId: z.number().optional(),
        cityId: z.number().optional(),
        description: z.string().optional(),
        activityType: z.enum(["transport", "restauration", "expedition", "hotel", "boutique", "agence_voyage", "residence_meuble", "loisirs", "location_vente"]).optional(),
        bdId: z.string().optional(), // ID du Business Développeur recruteur
      })
    )
    .mutation(({ ctx, input }) => {
      // Toujours créer une nouvelle compagnie (pas de companyId = insert)
      return upsertCompany(ctx.user.id, input);
    }),

  // ─── MY COMPANY (première compagnie) ─────────────────────────────────────────────────────────────
  myCompany: protectedProcedure.query(({ ctx }) => getCompanyByUserId(ctx.user.id)),

  // ─── TOUTES MES COMPAGNIES ─────────────────────────────────────────────────────────────
  myCompanies: protectedProcedure.query(({ ctx }) => getCompaniesByUserId(ctx.user.id)),

  // ─── COMPANY DASHBOARD ───────────────────────────────────────────────────────
  company: router({
    // Update company profile
    update: companyProcedure
      .input(
        z.object({
          companyName: z.string().min(2).optional(),
          managerName: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          address: z.string().optional(),
          countryId: z.number().optional(),
          cityId: z.number().optional(),
          logoUrl: z.string().optional(),
          description: z.string().optional(),
          printHeaderText: z.string().optional(),
          printFooterText: z.string().optional(),
          primaryColor: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => upsertCompany(ctx.user.id, input as any, ctx.company.id)),

    // Upload logo
    uploadLogo: companyProcedure
      .input(z.object({ fileName: z.string(), fileData: z.string(), mimeType: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("../storage");
        const buffer = Buffer.from(input.fileData, "base64");
        const key = `company-logos/${ctx.company.id}-${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await upsertCompany(ctx.user.id, { companyName: ctx.company.companyName, logoUrl: url }, ctx.company.id);
        return { url };
      }),

    // Dashboard stats
    stats: companyProcedure.query(({ ctx }) => getCompanyDashboardStats(ctx.company.id)),

    // ─── BUS LINES
    busLines: router({
      list: companyProcedure.query(({ ctx }) => getBusLinesByCompany(ctx.company.id)),
      upsert: companyProcedure
        .input(
          z.object({
            id: z.number().optional(),
            departureCity: z.string().min(1),
            arrivalCity: z.string().min(1),
            departureCountryId: z.number().optional(),
            arrivalCountryId: z.number().optional(),
            lineType: z.enum(["national", "international"]).optional(),
            distance: z.number().optional(),
            estimatedDuration: z.number().optional(),
          })
        )
        .mutation(({ ctx, input }) => upsertBusLine(ctx.company.id, input)),
      delete: companyProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ ctx, input }) => deleteBusLine(ctx.company.id, input.id)),
    }),

    // ─── BUSES
    buses: router({
      list: companyProcedure.query(({ ctx }) => getBusesByCompany(ctx.company.id)),
      upsert: companyProcedure
        .input(
          z.object({
            id: z.number().optional(),
            registration: z.string().min(1),
            model: z.string().optional(),
            capacity: z.number().min(1),
            status: z.enum(["disponible", "en_service", "maintenance"]).optional(),
          })
        )
        .mutation(({ ctx, input }) => upsertBus(ctx.company.id, input)),
      delete: companyProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ ctx, input }) => deleteBus(ctx.company.id, input.id)),
    }),

    // ─── TRIPS (Voyages publics réservables)
    trips: router({
      list: companyProcedure.query(({ ctx }) => getTripsByCompany(ctx.company.id)),
      upsert: companyProcedure
        .input(
          z.object({
            id: z.number().optional(),
            busLineId: z.number(),
            departureDate: z.string(),
            departureTime: z.string(),
            priceXOF: z.string().optional(),
            priceGHS: z.string().optional(),
            totalSeats: z.number().min(1),
            active: z.boolean().optional(),
          })
        )
        .mutation(({ ctx, input }) => upsertTrip(ctx.company.id, input)),
    }),

    // ─── DEPARTURES (Départs opérationnels)
    departures: router({
      list: companyProcedure.query(({ ctx }) => getDeparturesByCompany(ctx.company.id)),
      get: companyProcedure
        .input(z.object({ id: z.number() }))
        .query(({ ctx, input }) => getDepartureById(input.id, ctx.company.id)),
      upsert: companyProcedure
        .input(
          z.object({
            id: z.number().optional(),
            busLineId: z.number(),
            busId: z.number().optional(),
            tripId: z.number().optional(),
            departureDate: z.string(),
            departureTime: z.string(),
            driverName: z.string().optional(),
            status: z.enum(["programme", "embarquement", "en_route", "arrive", "annule"]).optional(),
            notes: z.string().optional(),
          })
        )
        .mutation(({ ctx, input }) => upsertDeparture(ctx.company.id, input)),
      updateStatus: companyProcedure
        .input(
          z.object({
            id: z.number(),
            status: z.enum(["programme", "embarquement", "en_route", "arrive", "annule"]),
          })
        )
        .mutation(({ ctx, input }) => updateDepartureStatus(ctx.company.id, input.id, input.status)),
      occupiedSeats: companyProcedure
        .input(z.object({ departureId: z.number() }))
        .query(({ input }) => getOccupiedSeatsByDeparture(input.departureId)),
    }),

    // ─── TICKETS (Billets guichet)
    tickets: router({
      list: companyProcedure
        .input(z.object({ limit: z.number().optional() }))
        .query(({ ctx, input }) => getTicketsByCompany(ctx.company.id, input.limit)),
      byDeparture: companyProcedure
        .input(z.object({ departureId: z.number() }))
        .query(({ ctx, input }) => getTicketsByDeparture(ctx.company.id, input.departureId)),
      create: companyProcedure
        .input(
          z.object({
            departureId: z.number(),
            seatNumber: z.number(),
            firstName: z.string().min(1),
            lastName: z.string().min(1),
            phone: z.string().optional(),
            idType: z.enum(["cni", "passeport", "carte_consulaire", "carte_resident", "laissez_passer"]).optional(),
            idNumber: z.string().optional(),
            gender: z.enum(["M", "F"]).optional(),
            nationality: z.string().optional(),
            dropOffCity: z.string().optional(),
            priceXOF: z.string().optional(),
            paymentMethod: z.enum(["cash", "mobile_money", "virement"]).optional(),
          })
        )
        .mutation(({ ctx, input }) => createTicket(ctx.company.id, { ...input, soldBy: ctx.user.id })),
      updateStatus: companyProcedure
        .input(
          z.object({
            ticketId: z.number(),
            ticketStatus: z.enum(["actif", "utilise", "annule"]).optional(),
            cashStatus: z.enum(["en_attente", "encaisse"]).optional(),
            boardingStatus: z.enum(["non_embarque", "embarque"]).optional(),
          })
        )
        .mutation(({ ctx, input }) => {
          const { ticketId, ...updates } = input;
          return updateTicketStatus(ctx.company.id, ticketId, updates);
        }),
    }),

    // ─── BOOKINGS (Réservations en ligne)
    bookings: router({
      list: companyProcedure
        .input(z.object({ limit: z.number().optional() }))
        .query(({ ctx, input }) => getBookingsByCompany(ctx.company.id, input.limit)),
      updateStatus: companyProcedure
        .input(
          z.object({
            bookingId: z.number(),
            status: z.enum(["en_attente", "confirme", "annule"]),
          })
        )
        .mutation(({ ctx, input }) => updateBookingStatus(ctx.company.id, input.bookingId, input.status)),
    }),

    // ─── SHIPMENTS (Expéditions)
    shipments: router({
      list: companyProcedure
        .input(z.object({ limit: z.number().optional() }))
        .query(({ ctx, input }) => getShipmentsByCompany(ctx.company.id, input.limit)),
      create: companyProcedure
        .input(
          z.object({
            senderName: z.string().min(1),
            senderPhone: z.string().optional(),
            senderCity: z.string().optional(),
            receiverName: z.string().min(1),
            receiverPhone: z.string().optional(),
            receiverCity: z.string().optional(),
            description: z.string().optional(),
            weight: z.string().optional(),
            priceXOF: z.string().optional(),
            photoUrl: z.string().optional(),
            photoKey: z.string().optional(),
          })
        )
        .mutation(({ ctx, input }) =>
          createShipment(ctx.company.id, { ...input, registeredBy: ctx.user.id })
        ),
      updateStatus: companyProcedure
        .input(
          z.object({
            shipmentId: z.number(),
            status: z.enum(["enregistre", "en_transit", "arrive", "livre"]),
            cashStatus: z.enum(["en_attente", "encaisse"]).optional(),
          })
        )
        .mutation(({ ctx, input }) =>
          updateShipmentStatus(ctx.company.id, input.shipmentId, input.status, input.cashStatus)
        ),
    }),

    // ─── STAFF
    staff: router({
      list: companyProcedure.query(({ ctx }) => getStaffByCompany(ctx.company.id)),
      upsert: companyProcedure
        .input(
          z.object({
            id: z.number().optional(),
            firstName: z.string().min(1),
            lastName: z.string().min(1),
            phone: z.string().optional(),
            role: z.enum(["chauffeur", "agent_billetterie", "agent_expedition", "caissier", "superviseur", "directeur"]),
            station: z.string().optional(),
            active: z.boolean().optional(),
          })
        )
        .mutation(({ ctx, input }) => upsertStaff(ctx.company.id, input)),
    }),

    // ─── STATIONS
    stations: router({
      list: companyProcedure.query(({ ctx }) => getStationsByCompany(ctx.company.id)),
      upsert: companyProcedure
        .input(
          z.object({
            id: z.number().optional(),
            name: z.string().min(1),
            city: z.string().min(1),
            countryId: z.number().optional(),
            address: z.string().optional(),
          })
        )
        .mutation(({ ctx, input }) => upsertStation(ctx.company.id, input)),
    }),

    // ─── CHARGES
    charges: router({
      list: companyProcedure.query(({ ctx }) => getChargesByCompany(ctx.company.id)),
      create: companyProcedure
        .input(
          z.object({
            category: z.enum(["carburant", "maintenance", "salaire", "frais_divers"]),
            description: z.string().optional(),
            amount: z.string(),
            station: z.string().optional(),
            chargeDate: z.string(),
          })
        )
        .mutation(({ ctx, input }) => createCharge(ctx.company.id, input)),
    }),

    // ─── CREATE TEST TRIPS
    createTestTrips: publicProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false, error: "Erreur de connexion" };
        
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 86400000);
        
        // Récupérer les busLines de la compagnie
        // Récupérer les busLines via Drizzle ORM
        const busLinesResult = await db.select().from(transportBusLines).where(eq(transportBusLines.companyId, input.companyId)).limit(3);
        const busLines = busLinesResult;
        
        if (busLines.length === 0) {
          return { success: false, error: "Aucune ligne de bus trouvée" };
        }
        
        // Créer 5 trips
        const trips = [];
        for (let i = 0; i < 5; i++) {
          const busLine = busLines[i % busLines.length];
          const tripDate = new Date(tomorrow.getTime() + i * 86400000);
          
          trips.push({
            companyId: input.companyId,
            busLineId: busLine.id,
            departureDate: tripDate,
            departureTime: `${8 + (i % 4)}:00`,
            priceXOF: String(15000 + i * 2000),
            totalSeats: 50,
            active: true
          });
        }
        
        await db.insert(transportTrips).values(trips);
        return { success: true, message: "5 trips créés" };
      }),

    // ─── ROUTE FARES
    fares: router({
      list: companyProcedure.query(({ ctx }) => getRouteFaresByCompany(ctx.company.id)),
      upsert: companyProcedure
        .input(
          z.object({
            id: z.number().optional(),
            busLineId: z.number(),
            fromCity: z.string().min(1),
            toCity: z.string().min(1),
            priceXOF: z.string().optional(),
            priceGHS: z.string().optional(),
          })
        )
        .mutation(({ ctx, input }) => upsertRouteFare(ctx.company.id, input)),
    }),

    // ─── BILLING (company view)
    billing: companyProcedure.query(({ ctx }) => getBillingByCompany(ctx.company.id)),
  }),

  // ─── NEXUS ADMIN ───────────────────────────────────────────────────────────────
  csn: router({
    // Global stats
    stats: csnProcedure.query(() => getCsnDashboardStats()),
    // List all companies
    companies: csnProcedure.query(() => getAllCompanies()),
    // Validate or reject a company
    validateCompany: csnProcedure
      .input(
        z.object({
          companyId: z.number(),
          action: z.enum(["active", "rejected"]),
          rejectionReason: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        validateCompany(input.companyId, ctx.user.id, input.action, input.rejectionReason)
      ),
    // Update company info (admin)
    updateCompany: csnProcedure
      .input(
        z.object({
          companyId: z.number(),
          companyName: z.string().min(2).optional(),
          managerName: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional(),
          address: z.string().optional(),
          activityType: z.enum(["transport", "restauration", "expedition", "hotel", "boutique", "agence_voyage", "residence_meuble", "loisirs", "location_vente"]).optional(),
        })
      )
      .mutation(({ input }) => updateCompanyAdmin(input.companyId, input)),
    // Set gallery image for a company
    setGalleryImage: csnProcedure
      .input(
        z.object({
          companyId: z.number(),
          galleryImageUrl: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return;
        await db
          .update(transportCompanies)
          .set({ galleryImageUrl: input.galleryImageUrl, updatedAt: new Date() })
          .where(eq(transportCompanies.id, input.companyId));
      }),
    // Suspend a company
    suspendCompany: csnProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(({ input }) => suspendCompany(input.companyId)),
    // Reactivate a suspended company
    reactivateCompany: csnProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(({ input }) => reactivateCompany(input.companyId)),
    // Delete a company
    deleteCompany: csnProcedure
      .input(z.object({ companyId: z.number() }))
      .mutation(({ input }) => deleteCompanyById(input.companyId)),
    // All billing
    billing: csnProcedure.query(() => getAllBilling()),
    // Generate monthly billing for a company
    generateBilling: csnProcedure
      .input(z.object({ companyId: z.number(), period: z.string() }))
      .mutation(({ input }) => generateMonthlyBilling(input.companyId, input.period)),
    // Update billing status
    updateBillingStatus: csnProcedure
      .input(
        z.object({
          billingId: z.number(),
          status: z.enum(["en_attente", "facture", "paye"]),
        })
      )
      .mutation(({ input }) => updateBillingStatus(input.billingId, input.status)),
    // Credits overview for NEXUS (all companies) — enriched stats
    allCredits: csnProcedure.query(() => getAllCreditsStats()),
    // Transactions d'une compagnie (pour l'historique détaillé dans le dashboard NEXUS)
    companyTransactions: csnProcedure
      .input(z.object({ companyId: z.number(), limit: z.number().optional() }))
      .query(({ input }) => getCreditTransactions(input.companyId, input.limit ?? 100)),
    // Trending data (30 jours)
    trending: csnProcedure
      .input(z.object({ days: z.number().optional() }))
      .query(({ input }) => getTrendingData(input?.days ?? 30)),
    // Companies detailed stats
    companiesStats: csnProcedure.query(() => getCompaniesDetailedStats()),
    // Rapport journalier — déclenchable manuellement depuis le dashboard NEXUS
    dailyReport: csnProcedure.mutation(async () => {
      const stats = await getCsnDashboardStats();
      const creditsStats = await getAllCreditsStats();
      const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const s = stats as any;
      const totalRevenue = ((s.pendingBillingXOF ?? s.totalRevenue ?? 0)).toLocaleString();
      const totalCreditsCA = creditsStats.reduce((sum: number, c: any) => sum + (parseFloat(c.totalSpentLocal ?? "0") || 0), 0);
      const zeroBalance = creditsStats.filter((c: any) => (c.balance ?? 0) <= 0).length;
      const content = [
        `📅 Rapport journalier NEXUS — ${today}`,
        ``,
        `🚌 Transport`,
        `  • Compagnies actives : ${s.activeCompanies ?? s.totalCompanies ?? 0}`,
        `  • Billets vendus aujourd'hui : ${s.ticketsToday ?? 0}`,
        `  • Expéditions aujourd'hui : ${s.shipmentsToday ?? 0}`,
        `  • Facturation en attente : ${totalRevenue} XOF`,
        ``,
        `🍽️ Restauration`,
        `  • Commandes en ligne aujourd'hui : ${s.ordersToday ?? 0}`,
        ``,
        `💳 Crédits NEXUS`,
        `  • Compagnies avec crédits : ${creditsStats.length}`,
        `  • CA crédits encaissé : ${totalCreditsCA.toLocaleString()} XOF`,
        `  • Compagnies à solde zéro : ${zeroBalance}`,
        ``,
        `— Envoyé par NEXUS`,
      ].join("\n");
      await notifyOwner({ title: `Rapport journalier NEXUS — ${today}`, content });
      return { success: true, today };
    }),
  }),

  // --- CREDITS NEXUS -------------------------------------------------------
  credits: router({
    // Get current balance
    getBalance: companyProcedure.query(async ({ ctx }) => {
      const credits = await getCompanyCredits(ctx.company.id);
      const cc = getCountryCurrency(credits?.countryCode ?? "CI");
      return {
        balance: credits?.balance ?? 0,
        currency: cc.currency,
        symbol: cc.symbol,
        pointPriceLocal: cc.rate,
        countryCode: credits?.countryCode ?? "CI",
      };
    }),
    // Get transaction history
    getHistory: companyProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getCreditTransactions(ctx.company.id, input.limit ?? 50);
      }),
    // Buy credits (simulation paiement mobile)
    buyCredits: companyProcedure
      .input(
        z.object({
          points: z.number().min(1).max(10000),
          paymentMethod: z.enum(["wave", "orange_money", "mtn_money", "moov_money", "especes"]),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const credits = await getCompanyCredits(ctx.company.id);
        const cc = getCountryCurrency(credits?.countryCode ?? "CI");
        const amountLocal = input.points * cc.rate;
        const newBalance = await addCredits(
          ctx.company.id,
          input.points,
          amountLocal,
          `Achat de ${input.points} point(s) via ${input.paymentMethod} — ${amountLocal.toLocaleString()} ${cc.symbol}`
        );
        return { success: true, newBalance, amountLocal, currency: cc.symbol };
      }),
    // Update country for currency conversion
    updateCountry: companyProcedure
      .input(z.object({ countryCode: z.string().length(2) }))
      .mutation(async ({ ctx, input }) => {
        const cc = getCountryCurrency(input.countryCode);
        const { getDb } = await import("../db");
        const { companyCredits } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(companyCredits)
          .set({ countryCode: input.countryCode, currency: cc.currency, pointPriceLocal: String(cc.rate) })
          .where(eq(companyCredits.companyId, ctx.company.id));
        return { success: true };
      }),

    // ─── CREDIT REQUESTS (demandes d'achat de crédits) ─────────────────────────
    // Compagnie soumet une demande de crédit
    requestCredit: companyProcedure
      .input(
        z.object({
          points: z.number().min(1).max(50000),
          paymentMethod: z.enum(["mobile_money", "bank_transfer", "cash"]),
          paymentPhone: z.string().optional(),
          paymentOperator: z.enum(["orange_money", "mtn_momo", "moov_money", "wave", "other"]).optional(),
          paymentRef: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const credits = await getCompanyCredits(ctx.company.id);
        const cc = getCountryCurrency(credits?.countryCode ?? "CI");
        const amountLocal = input.points * cc.rate;
        const id = await createCreditRequest({
          companyId: ctx.company.id,
          points: input.points,
          amountLocal,
          currency: cc.currency,
          paymentMethod: input.paymentMethod,
          paymentPhone: input.paymentPhone,
          paymentOperator: input.paymentOperator,
          paymentRef: input.paymentRef,
          notes: input.notes,
        });
        return { success: true, requestId: id, amountLocal, currency: cc.symbol };
      }),

    // Compagnie consulte ses demandes
    myRequests: companyProcedure.query(({ ctx }) => getCreditRequestsByCompany(ctx.company.id)),

    // NEXUS — liste toutes les demandes
    allRequests: csnProcedure
      .input(z.object({ status: z.string().optional() }))
      .query(({ input }) => getAllCreditRequests(input.status)),

    // NEXUS — valider le paiement et créditer automatiquement
    confirmPayment: csnProcedure
      .input(
        z.object({
          requestId: z.number(),
          validatedBy: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        confirmCreditRequestPayment(input.requestId, input.validatedBy ?? ctx.user.email ?? "NEXUS")
      ),

    // NEXUS — rejeter une demande
    rejectRequest: csnProcedure
      .input(
        z.object({
          requestId: z.number(),
          reason: z.string().min(5),
        })
      )
      .mutation(({ ctx, input }) =>
        rejectCreditRequest(input.requestId, ctx.user.email ?? "NEXUS", input.reason)
      ),

    // Hub2 — Étape 1 : Créer une intention de paiement
    initHub2Payment: companyProcedure
      .input(
        z.object({
          requestId: z.number(),
          providerKey: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const provider = HUB2_PROVIDERS[input.providerKey];
        if (!provider) throw new TRPCError({ code: "BAD_REQUEST", message: `Opérateur inconnu: ${input.providerKey}` });
        const requests = await getCreditRequestsByCompany(ctx.company.id);
        const req = requests.find((r: any) => r.id === input.requestId);
        if (!req) throw new TRPCError({ code: "NOT_FOUND", message: "Demande introuvable" });
        if (req.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette demande n'est plus en attente" });
        const purchaseRef = generateHub2PurchaseRef(input.requestId);
        const result = await createHub2PaymentIntent({
          amount: Math.round(Number(req.amountLocal)),
          currency: req.currency ?? "XOF",
          customerReference: String(ctx.company.id),
          purchaseReference: purchaseRef,
        });
        if (!result.success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
        await saveHub2PaymentIntent(input.requestId, result.intent.id, purchaseRef, result.intent.token);
        return { success: true, intentId: result.intent.id, token: result.intent.token, purchaseRef, amount: result.intent.amount, currency: result.intent.currency, provider };
      }),
    // Hub2 — Étape 2 : Tenter le paiement Mobile Money
    attemptHub2Payment: companyProcedure
      .input(z.object({ intentId: z.string(), token: z.string(), providerKey: z.string(), msisdn: z.string().min(8) }))
      .mutation(async ({ input }) => {
        const provider = HUB2_PROVIDERS[input.providerKey];
        if (!provider) throw new TRPCError({ code: "BAD_REQUEST", message: `Opérateur inconnu: ${input.providerKey}` });
        const result = await attemptHub2Payment({ intentId: input.intentId, token: input.token, country: provider.country, provider: provider.provider, msisdn: input.msisdn });
        if (!result.success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
        return { success: true, status: result.intent.status, nextAction: result.intent.payments?.[0]?.nextAction ?? null };
      }),
    // Hub2 — Vérifier le statut d'une intention de paiement
    checkHub2Status: companyProcedure
      .input(z.object({ intentId: z.string() }))
      .query(async ({ input }) => {
        const result = await getHub2PaymentIntentStatus(input.intentId);
        if (!result.success) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: result.error });
        return { status: result.intent.status, payments: result.intent.payments };
      }),
    // Webhook Mobile Money — validation automatique dès paiement confirmé
    mobileMoneyWebhook: publicProcedure
      .input(
        z.object({
          requestId: z.number(),
          paymentRef: z.string(),
          operator: z.string(),
          secret: z.string(), // clé secrète pour sécuriser le webhook
        })
      )
      .mutation(async ({ input }) => {
        // Vérification de la clé secrète webhook
        const WEBHOOK_SECRET = process.env.MOBILE_MONEY_WEBHOOK_SECRET ?? "nexus_mm_secret_2024";
        if (input.secret !== WEBHOOK_SECRET) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Clé webhook invalide" });
        }
        return autoValidateMobileMoneyPayment(input.requestId, input.paymentRef, input.operator);
      }),
    // Crédit manuel par l'admin NEXUS (protégé par PIN de confirmation)
    adminCreditCompany: csnProcedure
      .input(
        z.object({
          companyId: z.number(),
          points: z.number().min(1).max(100000),
          motif: z.string().min(3).max(200),
          reference: z.string().max(100).optional(),
          confirmPin: z.string().min(4).max(6),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
        // Récupérer l'utilisateur admin avec son PIN
        const [adminUser] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        if (!adminUser) throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
        // Vérifier si le compte est verrouillé
        if (adminUser.confirmPinLockedUntil && adminUser.confirmPinLockedUntil > new Date()) {
          const minutesLeft = Math.ceil((adminUser.confirmPinLockedUntil.getTime() - Date.now()) / 60000);
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Compte verrouillé. Réessayez dans ${minutesLeft} minute(s).` });
        }
        // Vérifier que le PIN a été défini
        if (!adminUser.confirmPinHash) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aucun PIN de confirmation défini. Veuillez d'abord définir votre PIN dans les paramètres." });
        }
        // Vérifier le PIN
        const pinValid = await bcrypt.compare(input.confirmPin, adminUser.confirmPinHash);
        if (!pinValid) {
          const newAttempts = (adminUser.confirmPinAttempts ?? 0) + 1;
          const lockedUntil = newAttempts >= 3 ? new Date(Date.now() + 15 * 60 * 1000) : null;
          await db.update(users).set({
            confirmPinAttempts: newAttempts,
            confirmPinLockedUntil: lockedUntil ?? undefined,
          }).where(eq(users.id, ctx.user.id));
          const remaining = Math.max(0, 3 - newAttempts);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: remaining > 0
              ? `PIN incorrect. ${remaining} tentative(s) restante(s) avant verrouillage.`
              : "PIN incorrect. Compte verrouillé pour 15 minutes.",
          });
        }
        // PIN correct — réinitialiser les tentatives
        await db.update(users).set({ confirmPinAttempts: 0, confirmPinLockedUntil: null }).where(eq(users.id, ctx.user.id));
        return adminCreditCompany(
          input.companyId,
          input.points,
          input.motif,
          input.reference ?? null,
          ctx.user.email ?? "admin"
        );
      }),
    // Définir ou changer le PIN de confirmation admin
    setConfirmPin: csnProcedure
      .input(z.object({ pin: z.string().min(4).max(6).regex(/^\d+$/, "Le PIN doit contenir uniquement des chiffres") }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de données indisponible" });
        const pinHash = await bcrypt.hash(input.pin, 10);
        await db.update(users).set({
          confirmPinHash: pinHash,
          confirmPinAttempts: 0,
          confirmPinLockedUntil: null,
        }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
    // Vérifier si un PIN est défini pour l'admin connecté
    hasPinDefined: csnProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return { hasPinDefined: false, isLocked: false };
        const [adminUser] = await db.select({
          confirmPinHash: users.confirmPinHash,
          confirmPinLockedUntil: users.confirmPinLockedUntil,
          confirmPinAttempts: users.confirmPinAttempts,
        }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
        if (!adminUser) return { hasPinDefined: false, isLocked: false };
        const isLocked = !!(adminUser.confirmPinLockedUntil && adminUser.confirmPinLockedUntil > new Date());
        const lockedUntil = isLocked ? adminUser.confirmPinLockedUntil : null;
        return {
          hasPinDefined: !!adminUser.confirmPinHash,
          isLocked,
          lockedUntil,
          attempts: adminUser.confirmPinAttempts ?? 0,
        };
      }),
  }),
});
