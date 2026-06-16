import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { transportRouter } from "./routers/transport";
import { menuRouter } from "./routers/menu";
import { teamRouter } from "./routers/team";
import { photosRouter } from "./routers/photos";
import { recruitmentRouter } from "./routers/recruitment";
import { chatbotRouter } from "./routers/chatbot";
import { adminAuthRouter } from "./routers/adminAuth";
import { billingRouter } from "./routers/billing";
import { managementModulesRouter } from "./routers/management-modules";
import { carouselRouter } from "./routers/carousel";
import { searchFavoritesRouter } from "./routers/search-favorites";
import { routesRouter } from "./routers/routes";
import { busesRouter } from "./routers/buses";
import { stopsRouter } from "./routers/stops";
import { stationsRouter } from "./routers/stations";
import { cashierRouter } from "./routers/cashier";
import { clientAuthRouter } from "./routers/client-auth";
import { businessDevRouter } from "./routers/businessDev";
import { leisureRouter } from "./routers/loisirs";
import { rentalSalesRouter } from "./routers/rental-sales";
import { gasRouter } from "./routers/gas";
import { shopRouter } from "./routers/shop";
import { supplierDashboardRouter } from "./routers/supplier-dashboard";
import {
  getHotelSettings, updateHotelSettings,
  getRoomTypes, createRoomType, updateRoomType, deleteRoomType,
  getRooms, getRoomById, createRoom, updateRoom, deleteRoom,
  getClients, getClientById, createClient, updateClient, deleteClient, getClientReservations,
  getReservations, getReservationById, createReservation, updateReservation,
  getServices, createService, updateService, deleteService,
  getReservationServices, addReservationService,
  getPayments, createPayment,
  getInvoices, createInvoice, updateInvoice,
  getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee,
  getHousekeepingTasks, createHousekeepingTask, updateHousekeepingTask,
  getInventoryCategories, getInventoryItems, createInventoryItem, updateInventoryItem, addInventoryMovement,
  getDashboardStats, getMonthlyRevenue,
  getCaisseSummary, getCaisseTransactions, createCaisseTransaction,
  getCountries, getCitiesByCountry, seedCountriesAndCities,
  getHotelProfiles, getHotelProfileByUserId, getHotelProfileById, upsertHotelProfile,
  getPublicRoomsByHotelUserId,
  getReviewsByHotel, getHotelRatingSummary, createReview, approveReview, deleteReview, getAllReviewsForAdmin,
  getOffersByHotel, getActiveOffersByHotel, createOffer, updateOffer, deleteOffer,
  getPhotosByRoom, updatePhotoCaption, reorderPhotos, deleteRoomPhoto,
  getAvailableRoomsByDates,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  businessDev: businessDevRouter,
  carousel: carouselRouter,
  search: searchFavoritesRouter,
  gas: gasRouter,
  shop: shopRouter,
  supplierDashboard: supplierDashboardRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── HOTEL SETTINGS ────────────────────────────────────────────────────────
  hotel: router({
    getSettings: publicProcedure.query(() => getHotelSettings()),
    updateSettings: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        stars: z.number().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        currency: z.string().optional(),
        checkInTime: z.string().optional(),
        checkOutTime: z.string().optional(),
      }))
      .mutation(({ input }) => updateHotelSettings(input)),
  }),

  // ─── ROOM TYPES ────────────────────────────────────────────────────────────
  roomTypes: router({
    list: publicProcedure.query(() => getRoomTypes()),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        basePrice: z.string(),
        capacity: z.number().optional(),
        amenities: z.string().optional(),
      }))
      .mutation(({ input }) => createRoomType(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        basePrice: z.string().optional(),
        capacity: z.number().optional(),
        amenities: z.string().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => updateRoomType(id, data)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteRoomType(input.id)),
  }),

  // ─── ROOMS ─────────────────────────────────────────────────────────────────
  rooms: router({
    list: publicProcedure.query(() => getRooms()),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getRoomById(input.id)),
    create: protectedProcedure
      .input(z.object({
        number: z.string(),
        floor: z.number().optional(),
        roomTypeId: z.number(),
        status: z.enum(["libre", "occupee", "maintenance", "reservee", "nettoyage"]).optional(),
        priceOverride: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input }) => createRoom(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        number: z.string().optional(),
        floor: z.number().optional(),
        roomTypeId: z.number().optional(),
        status: z.enum(["libre", "occupee", "maintenance", "reservee", "nettoyage"]).optional(),
        priceOverride: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => updateRoom(id, data)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteRoom(input.id)),
  }),

  // ─── CLIENTS ───────────────────────────────────────────────────────────────
  clients: router({
    list: publicProcedure.input(z.object({ search: z.string().optional() })).query(({ input }) => getClients(input.search)),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getClientById(input.id)),
    getReservations: publicProcedure.input(z.object({ clientId: z.number() })).query(({ input }) => getClientReservations(input.clientId)),
    create: protectedProcedure
      .input(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        nationality: z.string().optional(),
        idType: z.enum(["passeport", "cni", "permis", "autre"]).optional(),
        idNumber: z.string().optional(),
        address: z.string().optional(),
        preferences: z.string().optional(),
        vip: z.boolean().optional(),
      }))
      .mutation(({ input }) => createClient({ ...input, name: `${input.firstName} ${input.lastName}`.trim() })),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        nationality: z.string().optional(),
        idType: z.enum(["passeport", "cni", "permis", "autre"]).optional(),
        idNumber: z.string().optional(),
        address: z.string().optional(),
        preferences: z.string().optional(),
        vip: z.boolean().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => updateClient(id, data)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteClient(input.id)),
  }),

  // ─── RESERVATIONS ──────────────────────────────────────────────────────────
  reservations: router({
    list: publicProcedure
      .input(z.object({ status: z.string().optional(), search: z.string().optional() }).optional())
      .query(({ input }) => getReservations(input)),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getReservationById(input.id)),
    create: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        roomId: z.number(),
        checkInDate: z.string(),
        checkOutDate: z.string(),
        adults: z.number().optional(),
        children: z.number().optional(),
        status: z.enum(["en_attente", "confirmee", "checkin", "checkout", "annulee", "no_show"]).optional(),
        totalAmount: z.string().optional(),
        source: z.enum(["direct", "booking", "expedia", "airbnb", "phone", "walk_in"]).optional(),
        notes: z.string().optional(),
        createdBy: z.number().optional(),
      }))
      .mutation(({ input }) => createReservation(input as any)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number().optional(),
        roomId: z.number().optional(),
        checkInDate: z.string().optional(),
        checkOutDate: z.string().optional(),
        actualCheckIn: z.date().optional(),
        actualCheckOut: z.date().optional(),
        adults: z.number().optional(),
        children: z.number().optional(),
        status: z.enum(["en_attente", "confirmee", "checkin", "checkout", "annulee", "no_show"]).optional(),
        totalAmount: z.string().optional(),
        paidAmount: z.string().optional(),
        source: z.enum(["direct", "booking", "expedia", "airbnb", "phone", "walk_in"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => updateReservation(id, data as any)),
    // ─── Confirmation / Refus ───────────────────────────────────────────────
    getPending: protectedProcedure.query(() =>
      getReservations({ status: "en_attente" })
    ),
    confirm: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await updateReservation(input.id, {
          status: "confirmee",
          confirmedAt: new Date(),
          refusalReason: null as any,
          refusedAt: null as any,
        } as any);
        return { success: true };
      }),
    refuse: protectedProcedure
      .input(z.object({ id: z.number(), reason: z.string().min(1) }))
      .mutation(async ({ input }) => {
        await updateReservation(input.id, {
          status: "annulee",
          refusalReason: input.reason,
          refusedAt: new Date(),
        } as any);
        return { success: true };
      }),
    getServices: publicProcedure.input(z.object({ reservationId: z.number() })).query(({ input }) => getReservationServices(input.reservationId)),
    addService: protectedProcedure
      .input(z.object({
        reservationId: z.number(),
        serviceId: z.number(),
        quantity: z.number(),
        unitPrice: z.string(),
        totalPrice: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(({ input }) => addReservationService(input)),
  }),

  // ─── SERVICES ──────────────────────────────────────────────────────────────
  services: router({
    list: publicProcedure.query(() => getServices()),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        category: z.enum(["restaurant", "spa", "blanchisserie", "transport", "minibar", "autre"]).optional(),
        price: z.string(),
        unit: z.string().optional(),
        description: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(({ input }) => createService(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.enum(["restaurant", "spa", "blanchisserie", "transport", "minibar", "autre"]).optional(),
        price: z.string().optional(),
        unit: z.string().optional(),
        description: z.string().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => updateService(id, data)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteService(input.id)),
  }),

  // ─── CAISSE / PAYMENTS ─────────────────────────────────────────────────────
  caisse: router({
    getSummary: publicProcedure.input(z.object({ period: z.string().optional() }).optional()).query(({ input }) => getCaisseSummary(input?.period)),
    getTransactions: publicProcedure.input(z.object({ period: z.string().optional() }).optional()).query(({ input }) => getCaisseTransactions(input?.period)),
    createTransaction: protectedProcedure
      .input(z.object({
        type: z.enum(["encaissement", "decaissement"]),
        amount: z.string(),
        method: z.enum(["especes", "carte", "virement", "mobile", "cheque"]).optional(),
        description: z.string().optional(),
        reservationId: z.number().optional(),
      }))
      .mutation(({ input }) => createCaisseTransaction(input)),
    getPayments: publicProcedure.input(z.object({ reservationId: z.number().optional() }).optional()).query(({ input }) => getPayments(input?.reservationId)),
    createPayment: protectedProcedure
      .input(z.object({
        reservationId: z.number().optional(),
        invoiceId: z.number().optional(),
        clientId: z.number(),
        amount: z.string(),
        method: z.enum(["especes", "carte", "virement", "mobile_money", "cheque"]).optional(),
        reference: z.string().optional(),
        status: z.enum(["en_attente", "complete", "rembourse", "echec"]).optional(),
        notes: z.string().optional(),
        createdBy: z.number().optional(),
      }))
      .mutation(({ input }) => createPayment(input)),
    getInvoices: publicProcedure.query(() => getInvoices()),
    createInvoice: protectedProcedure
      .input(z.object({
        reservationId: z.number().optional(),
        clientId: z.number(),
        amount: z.string(),
        taxAmount: z.string().optional(),
        totalAmount: z.string(),
        status: z.enum(["brouillon", "emise", "payee", "annulee"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input }) => createInvoice(input)),
    updateInvoice: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["brouillon", "emise", "payee", "annulee"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => updateInvoice(id, data)),
  }),

  // ─── EMPLOYEES ─────────────────────────────────────────────────────────────
  employees: router({
    list: publicProcedure.query(() => getEmployees()),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getEmployeeById(input.id)),
    create: protectedProcedure
      .input(z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        role: z.enum(["admin", "manager", "receptionniste", "housekeeping", "restauration", "maintenance"]),
        department: z.string().optional(),
        hireDate: z.string().optional(),
        salary: z.string().optional(),
        status: z.enum(["actif", "conge", "inactif"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input }) => createEmployee(input as any)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        role: z.enum(["admin", "manager", "receptionniste", "housekeeping", "restauration", "maintenance"]).optional(),
        department: z.string().optional(),
        hireDate: z.string().optional(),
        salary: z.string().optional(),
        status: z.enum(["actif", "conge", "inactif"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => updateEmployee(id, data as any)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteEmployee(input.id)),
  }),

  // ─── HOUSEKEEPING ──────────────────────────────────────────────────────────
  housekeeping: router({
    list: publicProcedure
      .input(z.object({ status: z.string().optional(), assignedTo: z.number().optional() }).optional())
      .query(({ input }) => getHousekeepingTasks(input)),
    create: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        assignedTo: z.number().optional(),
        type: z.enum(["nettoyage", "recouche", "depart", "inspection", "maintenance"]).optional(),
        status: z.enum(["en_attente", "en_cours", "termine", "verifie"]).optional(),
        priority: z.enum(["basse", "normale", "haute", "urgente"]).optional(),
        scheduledAt: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input }) => createHousekeepingTask(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        assignedTo: z.number().optional(),
        type: z.enum(["nettoyage", "recouche", "depart", "inspection", "maintenance"]).optional(),
        status: z.enum(["en_attente", "en_cours", "termine", "verifie"]).optional(),
        priority: z.enum(["basse", "normale", "haute", "urgente"]).optional(),
        scheduledAt: z.date().optional(),
        startedAt: z.date().optional(),
        completedAt: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => updateHousekeepingTask(id, data)),
  }),

  // ─── INVENTORY ─────────────────────────────────────────────────────────────
  inventory: router({
    getCategories: publicProcedure.query(() => getInventoryCategories()),
    list: publicProcedure.query(() => getInventoryItems()),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        categoryId: z.number().optional(),
        unit: z.string().optional(),
        currentStock: z.string().optional(),
        minStock: z.string().optional(),
        maxStock: z.string().optional(),
        unitCost: z.string().optional(),
        supplier: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(({ input }) => createInventoryItem(input)),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        categoryId: z.number().optional(),
        unit: z.string().optional(),
        currentStock: z.string().optional(),
        minStock: z.string().optional(),
        maxStock: z.string().optional(),
        unitCost: z.string().optional(),
        supplier: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(({ input: { id, ...data } }) => updateInventoryItem(id, data)),
    addMovement: protectedProcedure
      .input(z.object({
        itemId: z.number(),
        type: z.enum(["entree", "sortie", "ajustement"]),
        quantity: z.string(),
        reason: z.string().optional(),
        createdBy: z.number().optional(),
      }))
      .mutation(({ input }) => addInventoryMovement(input)),
  }),

  // ─── DASHBOARD / ANALYTICS ───────────────────────────────────────────────────────
  dashboard: router({
    getStats: publicProcedure.query(() => getDashboardStats()),
    getMonthlyRevenue: publicProcedure
      .input(z.object({ year: z.number() }))
      .query(({ input }) => getMonthlyRevenue(input.year)),
  }),

  // ─── PUBLIC : COUNTRIES & CITIES ───────────────────────────────────────────────
  geo: router({
    countries: publicProcedure.query(async () => {
      await seedCountriesAndCities();
      return getCountries();
    }),
    cities: publicProcedure
      .input(z.object({ countryId: z.number() }))
      .query(({ input }) => getCitiesByCountry(input.countryId)),
  }),

  // ─── PUBLIC : HOTEL PROFILES ───────────────────────────────────────────────────────
  publicHotels: router({
    search: publicProcedure
      .input(z.object({
        countryId: z.number().optional(),
        cityId: z.number().optional(),
        type: z.enum(["hotel", "restaurant"]).optional(),
        maxPrice: z.number().positive().optional(),
      }))
      .query(({ input }) => getHotelProfiles(input)),
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getHotelProfileById(input.id)),
    getRooms: publicProcedure
      .input(z.object({ hotelId: z.number() }))
      .query(async ({ input }) => {
        const profile = await getHotelProfileById(input.hotelId);
        if (!profile) return [];
        const [rooms, offers] = await Promise.all([
          getPublicRoomsByHotelUserId(profile.userId),
          getActiveOffersByHotel(input.hotelId),
        ]);
        // Attach active offers to each room
        return rooms.map((room) => ({ ...room, activeOffers: offers }));
      }),
    getAvailableRooms: publicProcedure
      .input(z.object({
        hotelId: z.number(),
        checkIn: z.string(), // ISO date string YYYY-MM-DD
        checkOut: z.string(),
      }))
      .query(async ({ input }) => {
        const profile = await getHotelProfileById(input.hotelId);
        if (!profile) return [];
        const [rooms, offers] = await Promise.all([
          getAvailableRoomsByDates(profile.userId, input.checkIn, input.checkOut),
          getActiveOffersByHotel(input.hotelId),
        ]);
        return rooms.map((room) => ({ ...room, activeOffers: offers }));
      }),
    myProfile: protectedProcedure.query(({ ctx }) => getHotelProfileByUserId(ctx.user.id)),
    upsert: protectedProcedure
      .input(z.object({
        hotelName: z.string().min(1),
        managerName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        countryId: z.number().optional(),
        cityId: z.number().optional(),
        type: z.enum(["hotel", "restaurant"]).optional(),
        stars: z.number().min(1).max(5).optional(),
        logoUrl: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => upsertHotelProfile(ctx.user.id, input)),
    uploadLogo: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.fileData, "base64");
        const key = `hotel-logos/${ctx.user.id}-${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await upsertHotelProfile(ctx.user.id, { logoUrl: url });
        return { url };
      }),
  }),
  reviews: router({
    // Public: list approved reviews for a hotel
    list: publicProcedure
      .input(z.object({ hotelProfileId: z.number() }))
      .query(({ input }) => getReviewsByHotel(input.hotelProfileId, true)),

    // Public: get rating summary (average, total, distribution)
    summary: publicProcedure
      .input(z.object({ hotelProfileId: z.number() }))
      .query(({ input }) => getHotelRatingSummary(input.hotelProfileId)),

    // Public: submit a review (no auth required)
    create: publicProcedure
      .input(z.object({
        hotelProfileId: z.number(),
        clientName: z.string().min(1).max(255),
        clientEmail: z.string().email().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(2000).optional(),
      }))
      .mutation(({ input }) => createReview({
        hotelProfileId: input.hotelProfileId,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        rating: input.rating,
        comment: input.comment,
        approved: false,
      })),

    // Admin: list all reviews (pending + approved)
    adminList: protectedProcedure
      .query(() => getAllReviewsForAdmin()),

    // Admin: approve or reject a review
    approve: protectedProcedure
      .input(z.object({ id: z.number(), approved: z.boolean() }))
      .mutation(({ input }) => approveReview(input.id, input.approved)),

    // Admin: delete a review
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteReview(input.id)),
  }),

  specialOffers: router({
    // Public: list active & valid offers for a hotel
    listPublic: publicProcedure
      .input(z.object({ hotelProfileId: z.number() }))
      .query(({ input }) => getActiveOffersByHotel(input.hotelProfileId)),

    // Admin: list all offers (including inactive) for the logged-in hotel
    listAdmin: protectedProcedure
      .query(async ({ ctx }) => {
        const profile = await getHotelProfileByUserId(ctx.user.id);
        if (!profile) return [];
        return getOffersByHotel(profile.id);
      }),

    // Admin: create a new offer
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(2000).optional(),
        discountType: z.enum(["percent", "fixed"]),
        discountValue: z.number().min(0),
        minNights: z.number().min(1).optional(),
        validFrom: z.string().optional(),   // ISO date string
        validUntil: z.string().optional(),  // ISO date string
        badgeLabel: z.string().max(50).optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await getHotelProfileByUserId(ctx.user.id);
        if (!profile) throw new Error("Profil hôtel introuvable");
        return createOffer({
          hotelProfileId: profile.id,
          title: input.title,
          description: input.description,
          discountType: input.discountType,
          discountValue: String(input.discountValue),
          minNights: input.minNights ?? 1,
          validFrom: input.validFrom ? new Date(input.validFrom) : null,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          badgeLabel: input.badgeLabel,
          active: input.active ?? true,
        });
      }),

    // Admin: update an offer
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(2000).optional(),
        discountType: z.enum(["percent", "fixed"]).optional(),
        discountValue: z.number().min(0).optional(),
        minNights: z.number().min(1).optional(),
        validFrom: z.string().nullable().optional(),
        validUntil: z.string().nullable().optional(),
        badgeLabel: z.string().max(50).nullable().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, discountValue, validFrom, validUntil, ...rest } = input;
        return updateOffer(id, {
          ...rest,
          ...(discountValue !== undefined ? { discountValue: String(discountValue) } : {}),
          ...(validFrom !== undefined ? { validFrom: validFrom ? new Date(validFrom) : null } : {}),
          ...(validUntil !== undefined ? { validUntil: validUntil ? new Date(validUntil) : null } : {}),
        });
      }),

    // Admin: delete an offer
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => deleteOffer(input.id)),
  }),

  // ─── TRANSPORT MODULE ────────────────────────────────────────────────────────
  transport: transportRouter,
  routes: routesRouter,
  buses: busesRouter,
  stops: stopsRouter,
  stations: stationsRouter,
  cashier: cashierRouter,
  leisure: leisureRouter,
  rentalSales: rentalSalesRouter,
  clientAuth: router(clientAuthRouter),
  menu: menuRouter,
  team: teamRouter,
  recruitment: router(recruitmentRouter),
  chatbot: router(chatbotRouter),
  billing: router(billingRouter),
  management: managementModulesRouter,
  photos: photosRouter,
  adminAuth: adminAuthRouter,
  // ─── ROOM PHOTOS ────────────────────────────────────────────────────────────
  roomPhotos: router({
    // List photos for a room (public)
    list: publicProcedure
      .input(z.object({ roomId: z.number() }))
      .query(({ input }) => getPhotosByRoom(input.roomId)),
    // Update caption
    updateCaption: protectedProcedure
      .input(z.object({ photoId: z.number(), caption: z.string().nullable() }))
      .mutation(({ input }) => updatePhotoCaption(input.photoId, input.caption)),
    // Reorder photos
    reorder: protectedProcedure
      .input(z.object({ photos: z.array(z.object({ id: z.number(), sortOrder: z.number() })) }))
      .mutation(({ input }) => reorderPhotos(input.photos)),
    // Delete a photo
    delete: protectedProcedure
      .input(z.object({ photoId: z.number() }))
      .mutation(({ input }) => deleteRoomPhoto(input.photoId)),
  }),
});
export type AppRouter = typeof appRouter;