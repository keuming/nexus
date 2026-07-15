var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/_core/env.ts
var ADMIN_EMAILS_RAW, ADMIN_EMAILS, ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ADMIN_EMAILS_RAW = process.env.ADMIN_EMAILS ?? "keuming@yahoo.fr,anicettefd.wayou@gmail.com";
    ADMIN_EMAILS = new Set(
      ADMIN_EMAILS_RAW.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
    );
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? ""
    };
  }
});

// server/_core/notification.ts
var notification_exports = {};
__export(notification_exports, {
  notifyOwner: () => notifyOwner
});
import { TRPCError } from "@trpc/server";
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}
var TITLE_MAX_LENGTH, CONTENT_MAX_LENGTH, trimValue, isNonEmptyString, buildEndpointUrl, validatePayload;
var init_notification = __esm({
  "server/_core/notification.ts"() {
    "use strict";
    init_env();
    TITLE_MAX_LENGTH = 1200;
    CONTENT_MAX_LENGTH = 2e4;
    trimValue = (value) => value.trim();
    isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
    buildEndpointUrl = (baseUrl) => {
      const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      return new URL(
        "webdevtoken.v1.WebDevService/SendNotification",
        normalizedBase
      ).toString();
    };
    validatePayload = (input) => {
      if (!isNonEmptyString(input.title)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification title is required."
        });
      }
      if (!isNonEmptyString(input.content)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification content is required."
        });
      }
      const title = trimValue(input.title);
      const content = trimValue(input.content);
      if (title.length > TITLE_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
        });
      }
      if (content.length > CONTENT_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
        });
      }
      return { title, content };
    };
  }
});

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminCredentials: () => adminCredentials,
  adminLoginLogs: () => adminLoginLogs,
  buses: () => buses,
  businessDevelopers: () => businessDevelopers,
  businessDevelopersRelations: () => businessDevelopersRelations,
  cashierTransactions: () => cashierTransactions,
  chatbotMessages: () => chatbotMessages,
  chatbotSessions: () => chatbotSessions,
  cities: () => cities,
  clientBookings: () => clientBookings,
  clients: () => clients,
  commercialCandidates: () => commercialCandidates,
  companyCredits: () => companyCredits,
  companyGallery: () => companyGallery,
  companyMembers: () => companyMembers,
  companyPhotos: () => companyPhotos,
  companyReviews: () => companyReviews,
  countries: () => countries,
  creditPurchases: () => creditPurchases,
  creditRequests: () => creditRequests,
  creditTransactions: () => creditTransactions,
  deliveryZones: () => deliveryZones,
  employees: () => employees,
  furnishedResidences: () => furnishedResidences,
  furnishedResidencesRelations: () => furnishedResidencesRelations,
  gasBottles: () => gasBottles,
  gasBottlesRelations: () => gasBottlesRelations,
  gasDeliveries: () => gasDeliveries,
  gasDeliveriesRelations: () => gasDeliveriesRelations,
  gasDeliverymen: () => gasDeliverymen,
  gasDeliverymenRelations: () => gasDeliverymenRelations,
  gasOrderItems: () => gasOrderItems,
  gasOrderItemsRelations: () => gasOrderItemsRelations,
  gasOrderNotifications: () => gasOrderNotifications,
  gasOrderNotificationsRelations: () => gasOrderNotificationsRelations,
  gasOrders: () => gasOrders,
  gasOrdersRelations: () => gasOrdersRelations,
  gasOrdersRelationsUpdated: () => gasOrdersRelationsUpdated,
  gasSuppliers: () => gasSuppliers,
  gasSuppliersRelations: () => gasSuppliersRelations,
  guestReviews: () => guestReviews,
  guestReviewsRelations: () => guestReviewsRelations,
  hotelProfiles: () => hotelProfiles,
  hotelSettings: () => hotelSettings,
  housekeepingTasks: () => housekeepingTasks,
  internalMessages: () => internalMessages,
  inventoryCategories: () => inventoryCategories,
  inventoryItems: () => inventoryItems,
  inventoryMovements: () => inventoryMovements,
  invoices: () => invoices,
  leisureActivities: () => leisureActivities,
  leisureActivitiesRelations: () => leisureActivitiesRelations,
  leisureBookings: () => leisureBookings,
  leisureBookingsRelations: () => leisureBookingsRelations,
  leisureReviews: () => leisureReviews,
  leisureReviewsRelations: () => leisureReviewsRelations,
  menuCategories: () => menuCategories,
  menuItems: () => menuItems,
  onlineOrders: () => onlineOrders,
  payments: () => payments,
  quoteRequests: () => quoteRequests,
  rentalInventory: () => rentalInventory,
  rentalInventoryRelations: () => rentalInventoryRelations,
  rentalProducts: () => rentalProducts,
  rentalProductsRelations: () => rentalProductsRelations,
  reservationServices: () => reservationServices,
  reservations: () => reservations,
  residenceReservations: () => residenceReservations,
  residenceReservationsRelations: () => residenceReservationsRelations,
  reviews: () => reviews,
  roomAvailability: () => roomAvailability,
  roomAvailabilityRelations: () => roomAvailabilityRelations,
  roomPhotos: () => roomPhotos,
  roomTypes: () => roomTypes,
  rooms: () => rooms,
  routes: () => routes,
  salesOrderItems: () => salesOrderItems,
  salesOrderItemsRelations: () => salesOrderItemsRelations,
  salesOrders: () => salesOrders,
  salesOrdersRelations: () => salesOrdersRelations,
  services: () => services,
  shopProductOrderItems: () => shopProductOrderItems,
  shopProductOrderItemsRelations: () => shopProductOrderItemsRelations,
  shopProductOrders: () => shopProductOrders,
  shopProductOrdersRelations: () => shopProductOrdersRelations,
  shopProductStockMovements: () => shopProductStockMovements,
  shopProductStockMovementsRelations: () => shopProductStockMovementsRelations,
  shopProducts: () => shopProducts,
  shopProductsRelations: () => shopProductsRelations,
  specialOffers: () => specialOffers,
  stops: () => stops,
  transportBookings: () => transportBookings,
  transportBusLines: () => transportBusLines,
  transportBuses: () => transportBuses,
  transportCashierProfiles: () => transportCashierProfiles,
  transportCharges: () => transportCharges,
  transportCompanies: () => transportCompanies,
  transportCompanyBilling: () => transportCompanyBilling,
  transportDepartures: () => transportDepartures,
  transportGalleryImages: () => transportGalleryImages,
  transportRouteFares: () => transportRouteFares,
  transportShipments: () => transportShipments,
  transportStaff: () => transportStaff,
  transportStations: () => transportStations,
  transportTickets: () => transportTickets,
  transportTrips: () => transportTrips,
  users: () => users
});
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  date,
  serial
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
var users, hotelSettings, roomTypes, rooms, clients, reservations, services, reservationServices, invoices, payments, employees, housekeepingTasks, inventoryCategories, inventoryItems, inventoryMovements, countries, cities, hotelProfiles, reviews, specialOffers, roomPhotos, transportCompanies, transportGalleryImages, transportBusLines, transportBuses, transportTrips, transportDepartures, transportTickets, transportBookings, transportShipments, transportStaff, transportCashierProfiles, transportStations, transportCharges, transportCompanyBilling, transportRouteFares, menuCategories, menuItems, onlineOrders, deliveryZones, companyReviews, companyGallery, companyCredits, creditTransactions, companyMembers, internalMessages, companyPhotos, commercialCandidates, chatbotSessions, chatbotMessages, adminCredentials, adminLoginLogs, creditRequests, creditPurchases, quoteRequests, clientBookings, routes, buses, stops, cashierTransactions, businessDevelopers, businessDevelopersRelations, furnishedResidences, roomAvailability, residenceReservations, guestReviews, furnishedResidencesRelations, roomAvailabilityRelations, residenceReservationsRelations, guestReviewsRelations, leisureActivities, leisureBookings, leisureReviews, rentalProducts, rentalInventory, salesOrders, salesOrderItems, leisureActivitiesRelations, leisureBookingsRelations, leisureReviewsRelations, rentalProductsRelations, rentalInventoryRelations, salesOrdersRelations, salesOrderItemsRelations, gasSuppliers, gasBottles, gasOrders, gasOrderItems, gasDeliveries, gasSuppliersRelations, gasBottlesRelations, gasOrdersRelations, gasOrderItemsRelations, gasDeliveriesRelations, gasDeliverymen, gasOrderNotifications, gasDeliverymenRelations, gasOrderNotificationsRelations, gasOrdersRelationsUpdated, shopProducts, shopProductOrders, shopProductOrderItems, shopProductStockMovements, shopProductsRelations, shopProductOrdersRelations, shopProductOrderItemsRelations, shopProductStockMovementsRelations;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: text("role").default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
      confirmPinHash: varchar("confirmPinHash", { length: 255 }),
      confirmPinAttempts: integer("confirmPinAttempts").default(0).notNull(),
      confirmPinLockedUntil: timestamp("confirmPinLockedUntil")
    });
    hotelSettings = pgTable("hotel_settings", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull().default("Mon H\xF4tel"),
      stars: integer("stars").default(3),
      address: text("address"),
      phone: varchar("phone", { length: 50 }),
      email: varchar("email", { length: 320 }),
      currency: varchar("currency", { length: 10 }).default("FCFA"),
      checkInTime: varchar("checkInTime", { length: 10 }).default("14:00"),
      checkOutTime: varchar("checkOutTime", { length: 10 }).default("12:00"),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    roomTypes = pgTable("room_types", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      description: text("description"),
      basePrice: decimal("basePrice", { precision: 12, scale: 2 }).notNull().default("0"),
      capacity: integer("capacity").default(2),
      amenities: text("amenities"),
      // JSON string
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    rooms = pgTable("rooms", {
      id: serial("id").primaryKey(),
      number: varchar("number", { length: 20 }).notNull().unique(),
      floor: integer("floor").default(1),
      roomTypeId: integer("roomTypeId").notNull(),
      status: text("status").default("libre").notNull(),
      priceOverride: decimal("priceOverride", { precision: 12, scale: 2 }),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    clients = pgTable("clients", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 200 }).notNull(),
      firstName: varchar("firstName", { length: 100 }),
      lastName: varchar("lastName", { length: 100 }),
      email: varchar("email", { length: 320 }).unique(),
      phone: varchar("phone", { length: 50 }),
      nationality: varchar("nationality", { length: 100 }),
      idType: text("idType"),
      idNumber: varchar("idNumber", { length: 100 }),
      address: text("address"),
      preferences: text("preferences"),
      notes: text("notes"),
      vip: boolean("vip").default(false),
      clientType: text("clientType").default("standard"),
      company: varchar("company", { length: 200 }),
      passwordHash: varchar("passwordHash", { length: 255 }),
      isActive: boolean("isActive").default(true).notNull(),
      lastLoginAt: timestamp("lastLoginAt"),
      country: varchar("country", { length: 100 }),
      city: varchar("city", { length: 100 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    reservations = pgTable("reservations", {
      id: serial("id").primaryKey(),
      reference: varchar("reference", { length: 20 }).notNull().unique(),
      clientId: integer("clientId").notNull(),
      roomId: integer("roomId").notNull(),
      checkInDate: date("checkInDate").notNull(),
      checkOutDate: date("checkOutDate").notNull(),
      actualCheckIn: timestamp("actualCheckIn"),
      actualCheckOut: timestamp("actualCheckOut"),
      adults: integer("adults").default(1),
      children: integer("children").default(0),
      status: text("status").default("en_attente").notNull(),
      totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).default("0"),
      paidAmount: decimal("paidAmount", { precision: 12, scale: 2 }).default("0"),
      source: text("source").default("direct"),
      notes: text("notes"),
      refusalReason: text("refusalReason"),
      confirmedAt: timestamp("confirmedAt"),
      refusedAt: timestamp("refusedAt"),
      createdBy: integer("createdBy"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    services = pgTable("services", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 150 }).notNull(),
      category: text("category").default("autre"),
      price: decimal("price", { precision: 12, scale: 2 }).notNull().default("0"),
      unit: varchar("unit", { length: 50 }).default("unit\xE9"),
      description: text("description"),
      active: boolean("active").default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    reservationServices = pgTable("reservation_services", {
      id: serial("id").primaryKey(),
      reservationId: integer("reservationId").notNull(),
      serviceId: integer("serviceId").notNull(),
      quantity: integer("quantity").default(1),
      unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
      totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
      date: timestamp("date").defaultNow().notNull(),
      notes: text("notes")
    });
    invoices = pgTable("invoices", {
      id: serial("id").primaryKey(),
      number: varchar("number", { length: 30 }).notNull().unique(),
      reservationId: integer("reservationId"),
      clientId: integer("clientId").notNull(),
      amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
      taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0"),
      totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
      status: text("status").default("brouillon"),
      issuedAt: timestamp("issuedAt").defaultNow().notNull(),
      dueAt: timestamp("dueAt"),
      notes: text("notes")
    });
    payments = pgTable("payments", {
      id: serial("id").primaryKey(),
      reservationId: integer("reservationId"),
      invoiceId: integer("invoiceId"),
      clientId: integer("clientId").notNull(),
      amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
      method: text("method").default("especes"),
      reference: varchar("reference", { length: 100 }),
      status: text("status").default("complete"),
      paidAt: timestamp("paidAt").defaultNow().notNull(),
      type: text("type").default("encaissement"),
      description: text("description"),
      notes: text("notes"),
      createdBy: integer("createdBy")
    });
    employees = pgTable("employees", {
      id: serial("id").primaryKey(),
      firstName: varchar("firstName", { length: 100 }).notNull(),
      lastName: varchar("lastName", { length: 100 }).notNull(),
      email: varchar("email", { length: 320 }),
      phone: varchar("phone", { length: 50 }),
      role: text("role").notNull(),
      department: varchar("department", { length: 100 }),
      hireDate: date("hireDate"),
      salary: decimal("salary", { precision: 12, scale: 2 }),
      status: text("status").default("actif"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    housekeepingTasks = pgTable("housekeeping_tasks", {
      id: serial("id").primaryKey(),
      roomId: integer("roomId").notNull(),
      assignedTo: integer("assignedTo"),
      type: text("type").default("nettoyage"),
      status: text("status").default("en_attente"),
      priority: text("priority").default("normale"),
      scheduledAt: timestamp("scheduledAt"),
      startedAt: timestamp("startedAt"),
      completedAt: timestamp("completedAt"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    inventoryCategories = pgTable("inventory_categories", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      description: text("description")
    });
    inventoryItems = pgTable("inventory_items", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 150 }).notNull(),
      categoryId: integer("categoryId"),
      unit: varchar("unit", { length: 50 }).default("unit\xE9"),
      currentStock: decimal("currentStock", { precision: 10, scale: 2 }).default("0"),
      minStock: decimal("minStock", { precision: 10, scale: 2 }).default("0"),
      maxStock: decimal("maxStock", { precision: 10, scale: 2 }),
      unitCost: decimal("unitCost", { precision: 12, scale: 2 }).default("0"),
      supplier: varchar("supplier", { length: 200 }),
      location: varchar("location", { length: 100 }),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    inventoryMovements = pgTable("inventory_movements", {
      id: serial("id").primaryKey(),
      itemId: integer("itemId").notNull(),
      type: text("type").notNull(),
      quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
      reason: varchar("reason", { length: 255 }),
      createdBy: integer("createdBy"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    countries = pgTable("countries", {
      id: serial("id").primaryKey(),
      code: varchar("code", { length: 10 }).notNull().unique(),
      name: varchar("name", { length: 100 }).notNull(),
      flag: varchar("flag", { length: 10 })
    });
    cities = pgTable("cities", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      countryId: integer("countryId").notNull()
    });
    hotelProfiles = pgTable("hotel_profiles", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().unique(),
      // owner user id
      hotelName: varchar("hotelName", { length: 255 }).notNull(),
      managerName: varchar("managerName", { length: 255 }),
      phone: varchar("phone", { length: 50 }),
      email: varchar("email", { length: 320 }),
      address: text("address"),
      countryId: integer("countryId"),
      cityId: integer("cityId"),
      type: text("type").default("hotel").notNull(),
      stars: integer("stars").default(3),
      logoUrl: text("logoUrl"),
      description: text("description"),
      isActive: boolean("isActive").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    reviews = pgTable("reviews", {
      id: serial("id").primaryKey(),
      hotelProfileId: integer("hotelProfileId").notNull(),
      clientName: varchar("clientName", { length: 255 }).notNull(),
      clientEmail: varchar("clientEmail", { length: 320 }),
      rating: integer("rating").notNull(),
      // 1-5
      comment: text("comment"),
      approved: boolean("approved").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    specialOffers = pgTable("special_offers", {
      id: serial("id").primaryKey(),
      hotelProfileId: integer("hotelProfileId").notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      description: text("description"),
      discountType: text("discountType").default("percent").notNull(),
      discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
      minNights: integer("minNights").default(1),
      validFrom: timestamp("validFrom"),
      validUntil: timestamp("validUntil"),
      badgeLabel: varchar("badgeLabel", { length: 50 }),
      // ex: "-20%", "Promoété"
      active: boolean("active").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    roomPhotos = pgTable("room_photos", {
      id: serial("id").primaryKey(),
      roomId: integer("roomId").notNull(),
      url: text("url").notNull(),
      fileKey: varchar("fileKey", { length: 512 }).notNull(),
      caption: varchar("caption", { length: 255 }),
      sortOrder: integer("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    transportCompanies = pgTable("transport_companies", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      // owner user (OAuth Google) — un utilisateur peut avoir plusieurs compagnies
      companyName: varchar("companyName", { length: 255 }).notNull(),
      managerName: varchar("managerName", { length: 255 }),
      phone: varchar("phone", { length: 50 }),
      email: varchar("email", { length: 320 }),
      address: text("address"),
      countryId: integer("countryId"),
      cityId: integer("cityId"),
      logoUrl: text("logoUrl"),
      galleryImageUrl: text("galleryImageUrl"),
      // Image affichée dans la galerie publique
      description: text("description"),
      // Personnalisation documents imprimés
      printHeaderText: text("printHeaderText"),
      printFooterText: text("printFooterText"),
      primaryColor: varchar("primaryColor", { length: 20 }).default("#1a56db"),
      activityType: text("activityType").default("transport").notNull(),
      status: text("status").default("pending").notNull(),
      validatedAt: timestamp("validatedAt"),
      validatedBy: integer("validatedBy"),
      // NEXUS admin userId
      rejectionReason: text("rejectionReason"),
      bdId: varchar("bdId", { length: 7 }),
      // ID du Business Developer qui a recruté cette compagnie
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    transportGalleryImages = pgTable("transport_gallery_images", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      imageUrl: text("imageUrl").notNull(),
      fileKey: varchar("fileKey", { length: 255 }).notNull(),
      caption: varchar("caption", { length: 255 }),
      sortOrder: integer("sortOrder").default(0),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    transportBusLines = pgTable("transport_bus_lines", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      departureCity: varchar("departureCity", { length: 100 }).notNull(),
      arrivalCity: varchar("arrivalCity", { length: 100 }).notNull(),
      departureCountryId: integer("departureCountryId"),
      arrivalCountryId: integer("arrivalCountryId"),
      lineType: text("lineType").default("national").notNull(),
      distance: integer("distance"),
      // km
      estimatedDuration: integer("estimatedDuration"),
      // minutes
      active: boolean("active").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    transportBuses = pgTable("transport_buses", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      registration: varchar("registration", { length: 50 }).notNull(),
      model: varchar("model", { length: 100 }),
      capacity: integer("capacity").notNull().default(50),
      status: text("status").default("disponible").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    transportTrips = pgTable("transport_trips", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      busLineId: integer("busLineId").notNull(),
      departureDate: date("departureDate").notNull(),
      departureTime: varchar("departureTime", { length: 10 }).notNull(),
      // HH:MM
      priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }),
      priceGHS: decimal("priceGHS", { precision: 12, scale: 2 }),
      totalSeats: integer("totalSeats").notNull().default(50),
      active: boolean("active").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    transportDepartures = pgTable("transport_departures", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      busLineId: integer("busLineId").notNull(),
      busId: integer("busId"),
      tripId: integer("tripId"),
      departureDate: date("departureDate").notNull(),
      departureTime: varchar("departureTime", { length: 10 }).notNull(),
      driverName: varchar("driverName", { length: 255 }),
      status: text("status").default("programme").notNull(),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    transportTickets = pgTable("transport_tickets", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      ticketNumber: varchar("ticketNumber", { length: 30 }).notNull().unique(),
      // TK-XXXXXXXX
      departureId: integer("departureId").notNull(),
      seatNumber: integer("seatNumber").notNull(),
      // Passager
      firstName: varchar("firstName", { length: 100 }).notNull(),
      lastName: varchar("lastName", { length: 100 }).notNull(),
      phone: varchar("phone", { length: 50 }),
      idType: text("idType").default("cni"),
      idNumber: varchar("idNumber", { length: 100 }),
      gender: text("gender").default("M"),
      nationality: varchar("nationality", { length: 100 }),
      dropOffCity: varchar("dropOffCity", { length: 100 }),
      // Paiement
      priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }),
      paymentMethod: text("paymentMethod").default("cash"),
      // Statuts
      ticketStatus: text("ticketStatus").default("actif").notNull(),
      cashStatus: text("cashStatus").default("en_attente").notNull(),
      boardingStatus: text("boardingStatus").default("non_embarque").notNull(),
      qrCode: text("qrCode"),
      soldBy: integer("soldBy"),
      // userId agent
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    transportBookings = pgTable("transport_bookings", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      tripId: integer("tripId").notNull(),
      bookingRef: varchar("bookingRef", { length: 20 }).notNull().unique(),
      seatNumber: integer("seatNumber").notNull(),
      // Client
      firstName: varchar("firstName", { length: 100 }).notNull(),
      lastName: varchar("lastName", { length: 100 }).notNull(),
      phone: varchar("phone", { length: 50 }),
      email: varchar("email", { length: 320 }),
      // Paiement
      priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }),
      status: text("status").default("en_attente").notNull(),
      cashStatus: text("cashStatus").default("en_attente").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    transportShipments = pgTable("transport_shipments", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      trackingNumber: varchar("trackingNumber", { length: 30 }).notNull().unique(),
      // Expéditeur
      senderName: varchar("senderName", { length: 255 }).notNull(),
      senderPhone: varchar("senderPhone", { length: 50 }),
      senderCity: varchar("senderCity", { length: 100 }),
      // Destinataire
      receiverName: varchar("receiverName", { length: 255 }).notNull(),
      receiverPhone: varchar("receiverPhone", { length: 50 }),
      receiverCity: varchar("receiverCity", { length: 100 }),
      // Colis
      description: text("description"),
      weight: decimal("weight", { precision: 8, scale: 2 }),
      priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }),
      photoUrl: text("photoUrl"),
      photoKey: varchar("photoKey", { length: 512 }),
      // Statuts
      status: text("status").default("enregistre").notNull(),
      cashStatus: text("cashStatus").default("en_attente").notNull(),
      registeredBy: integer("registeredBy"),
      // userId agent
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    transportStaff = pgTable("transport_staff", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      userId: integer("userId"),
      // linked to dashboard user if applicable
      firstName: varchar("firstName", { length: 100 }).notNull(),
      lastName: varchar("lastName", { length: 100 }).notNull(),
      phone: varchar("phone", { length: 50 }),
      role: text("role").notNull(),
      station: varchar("station", { length: 100 }),
      active: boolean("active").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    transportCashierProfiles = pgTable("transport_cashier_profiles", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      userId: integer("userId").notNull().unique(),
      pinHash: varchar("pinHash", { length: 255 }),
      station: varchar("station", { length: 100 }),
      pinAttempts: integer("pinAttempts").default(0).notNull(),
      pinLockedUntil: timestamp("pinLockedUntil"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    transportStations = pgTable("transport_stations", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      city: varchar("city", { length: 100 }).notNull(),
      countryId: integer("countryId"),
      address: text("address"),
      active: boolean("active").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    transportCharges = pgTable("transport_charges", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      category: text("category").notNull(),
      description: text("description"),
      amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
      station: varchar("station", { length: 100 }),
      chargeDate: date("chargeDate").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    transportCompanyBilling = pgTable("transport_company_billing", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      billingPeriod: varchar("billingPeriod", { length: 10 }).notNull(),
      // YYYY-MM
      ticketsSold: integer("ticketsSold").default(0).notNull(),
      ticketsCashed: integer("ticketsCashed").default(0).notNull(),
      shipmentsCashed: integer("shipmentsCashed").default(0).notNull(),
      // 200 FCFA/billet vendu + 100 FCFA/ticket expédition encaissé
      ticketFeeXOF: decimal("ticketFeeXOF", { precision: 12, scale: 2 }).default("0"),
      shipmentFeeXOF: decimal("shipmentFeeXOF", { precision: 12, scale: 2 }).default("0"),
      totalFeeXOF: decimal("totalFeeXOF", { precision: 12, scale: 2 }).default("0"),
      status: text("status").default("en_attente").notNull(),
      generatedAt: timestamp("generatedAt").defaultNow().notNull(),
      paidAt: timestamp("paidAt")
    });
    transportRouteFares = pgTable("transport_route_fares", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      busLineId: integer("busLineId").notNull(),
      fromCity: varchar("fromCity", { length: 100 }).notNull(),
      toCity: varchar("toCity", { length: 100 }).notNull(),
      priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }),
      priceGHS: decimal("priceGHS", { precision: 12, scale: 2 }),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    menuCategories = pgTable("menu_categories", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      name: varchar("name", { length: 100 }).notNull(),
      description: varchar("description", { length: 255 }),
      sortOrder: integer("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    menuItems = pgTable("menu_items", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      categoryId: integer("categoryId").notNull(),
      name: varchar("name", { length: 150 }).notNull(),
      description: text("description"),
      priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }).notNull(),
      photoUrl: varchar("photoUrl", { length: 500 }),
      photoKey: varchar("photoKey", { length: 300 }),
      available: boolean("available").default(true).notNull(),
      preparationTime: integer("preparationTime").default(15),
      // minutes
      sortOrder: integer("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    onlineOrders = pgTable("online_orders", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      orderRef: varchar("orderRef", { length: 30 }).notNull().unique(),
      customerName: varchar("customerName", { length: 150 }).notNull(),
      customerPhone: varchar("customerPhone", { length: 30 }).notNull(),
      deliveryType: varchar("deliveryType", { length: 20 }).notNull().default("sur_place"),
      // livraison | sur_place
      deliveryAddress: varchar("deliveryAddress", { length: 300 }),
      notes: text("notes"),
      itemsJson: text("itemsJson").notNull(),
      // JSON: [{itemId, name, qty, priceXOF, preparationTime}]
      totalXOF: decimal("totalXOF", { precision: 12, scale: 2 }).notNull(),
      estimatedPrepTime: integer("estimatedPrepTime"),
      // minutes (max des preparationTime * qty)
      status: varchar("status", { length: 30 }).notNull().default("nouvelle"),
      // nouvelle | en_preparation | prete | livree | annulee
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    deliveryZones = pgTable("delivery_zones", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      name: varchar("name", { length: 100 }).notNull(),
      description: text("description"),
      extraMinutes: integer("extraMinutes").notNull().default(15),
      active: boolean("active").notNull().default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    companyReviews = pgTable("company_reviews", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      authorName: varchar("authorName", { length: 150 }).notNull(),
      rating: integer("rating").notNull(),
      // 1-5
      comment: text("comment"),
      activityType: varchar("activityType", { length: 30 }).notNull().default("transport"),
      // transport | restauration | expedition
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    companyGallery = pgTable("company_gallery", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
      caption: varchar("caption", { length: 200 }),
      displayOrder: integer("displayOrder").notNull().default(0),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    companyCredits = pgTable("company_credits", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull().unique(),
      balance: integer("balance").notNull().default(0),
      // solde en points
      countryCode: varchar("countryCode", { length: 10 }).notNull().default("CI"),
      // code pays ISO
      currency: varchar("currency", { length: 10 }).notNull().default("XOF"),
      // devise
      pointPriceLocal: decimal("pointPriceLocal", { precision: 10, scale: 2 }).notNull().default("125.00"),
      // prix 1 point en devise locale
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    creditTransactions = pgTable("credit_transactions", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      type: varchar("type", { length: 20 }).notNull(),
      // "credit" | "debit"
      points: integer("points").notNull(),
      // nb points crédités ou débités
      amountLocal: decimal("amountLocal", { precision: 12, scale: 2 }),
      // montant en devise locale (pour les achats)
      description: varchar("description", { length: 300 }).notNull(),
      refType: varchar("refType", { length: 50 }),
      // "ticket" | "booking" | "order" | "shipment" | "purchase"
      refId: varchar("refId", { length: 100 }),
      // ID ou référence de la transaction source
      balanceBefore: integer("balanceBefore"),
      // solde avant opération
      balanceAfter: integer("balanceAfter").notNull(),
      // solde après opération
      reference: varchar("reference", { length: 100 }),
      // référence paiement ou note admin
      adminNote: varchar("adminNote", { length: 300 }),
      // note de l'admin (crédit manuel)
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    companyMembers = pgTable("company_members", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      userId: integer("userId"),
      // lié à un compte OAuth si accepté
      firstName: varchar("firstName", { length: 100 }).notNull(),
      lastName: varchar("lastName", { length: 100 }).notNull(),
      phone: varchar("phone", { length: 50 }),
      email: varchar("email", { length: 320 }),
      role: text("role").notNull().default("employe"),
      pinHash: varchar("pinHash", { length: 255 }),
      // PIN 4 chiffres hashé
      isActive: boolean("isActive").notNull().default(true),
      lastLoginAt: timestamp("lastLoginAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    internalMessages = pgTable("internal_messages", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      senderType: text("senderType").notNull(),
      senderId: integer("senderId"),
      // userId de l'expéditeur
      senderName: varchar("senderName", { length: 150 }).notNull(),
      content: text("content").notNull(),
      isRead: boolean("isRead").notNull().default(false),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    companyPhotos = pgTable("company_photos", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      url: varchar("url", { length: 500 }).notNull(),
      fileKey: varchar("fileKey", { length: 300 }).notNull(),
      caption: varchar("caption", { length: 300 }).default(""),
      sortOrder: integer("sortOrder").notNull().default(0),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    commercialCandidates = pgTable("commercial_candidates", {
      id: serial("id").primaryKey(),
      firstName: varchar("firstName", { length: 100 }).notNull(),
      lastName: varchar("lastName", { length: 100 }).notNull(),
      phone: varchar("phone", { length: 50 }).notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      country: varchar("country", { length: 100 }).notNull(),
      city: varchar("city", { length: 100 }).notNull(),
      educationLevel: text("educationLevel").notNull(),
      language: text("language").notNull(),
      status: text("status").notNull().default("nouveau"),
      notes: text("notes"),
      cvUrl: varchar("cvUrl", { length: 1e3 }),
      cvKey: varchar("cvKey", { length: 500 }),
      coverLetterUrl: varchar("coverLetterUrl", { length: 1e3 }),
      coverLetterKey: varchar("coverLetterKey", { length: 500 }),
      experience: text("experience"),
      targetSector: text("targetSector"),
      motivation: text("motivation"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    chatbotSessions = pgTable("chatbot_sessions", {
      id: serial("id").primaryKey(),
      sessionToken: varchar("sessionToken", { length: 64 }).notNull().unique(),
      visitorName: varchar("visitorName", { length: 100 }).notNull().default("Visiteur"),
      visitorEmail: varchar("visitorEmail", { length: 320 }),
      status: text("status").notNull().default("open"),
      csnTookOver: boolean("csnTookOver").notNull().default(false),
      // true si un agent NEXUS a répondu
      humanTakeoverActive: boolean("humanTakeoverActive").notNull().default(false),
      // true = IA suspendue, agent humain actif
      humanTakeoverAt: timestamp("humanTakeoverAt"),
      // horodatage de la prise de relais
      adminInterventionActive: boolean("adminInterventionActive").notNull().default(false),
      // true = admin intervient
      adminId: integer("adminId"),
      // ID de l'admin qui intervient
      adminInterventionAt: timestamp("adminInterventionAt"),
      // horodatage de l'intervention admin
      adminInterventionReason: text("adminInterventionReason"),
      // motif de l'escalade
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    chatbotMessages = pgTable("chatbot_messages", {
      id: serial("id").primaryKey(),
      sessionId: integer("sessionId").notNull(),
      role: text("role").notNull(),
      content: text("content").notNull(),
      isRead: boolean("isRead").notNull().default(false),
      // lu par l'agent NEXUS
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    adminCredentials = pgTable("admin_credentials", {
      id: serial("id").primaryKey(),
      email: varchar("email", { length: 320 }).notNull().unique(),
      passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
      displayName: varchar("displayName", { length: 100 }).notNull().default("Administrateur"),
      isActive: boolean("isActive").notNull().default(true),
      lastLoginAt: timestamp("lastLoginAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    adminLoginLogs = pgTable("admin_login_logs", {
      id: serial("id").primaryKey(),
      adminId: integer("adminId").notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      displayName: varchar("displayName", { length: 100 }),
      ipAddress: varchar("ipAddress", { length: 64 }),
      userAgent: varchar("userAgent", { length: 512 }),
      success: boolean("success").notNull().default(true),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    creditRequests = pgTable("credit_requests", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      points: integer("points").notNull(),
      // nombre de points demandés
      amountLocal: decimal("amountLocal", { precision: 12, scale: 2 }).notNull(),
      // montant total en devise locale
      currency: varchar("currency", { length: 10 }).notNull().default("XOF"),
      paymentMethod: varchar("paymentMethod", { length: 50 }).notNull().default("mobile_money"),
      // "mobile_money" | "bank_transfer" | "cash"
      paymentPhone: varchar("paymentPhone", { length: 30 }),
      // numéro Mobile Money
      paymentOperator: varchar("paymentOperator", { length: 50 }),
      // "orange_money" | "mtn_momo" | "moov_money" | "wave"
      paymentRef: varchar("paymentRef", { length: 200 }),
      // référence de transaction Mobile Money
      status: varchar("status", { length: 30 }).notNull().default("pending"),
      // "pending" | "payment_confirmed" | "credited" | "rejected"
      rejectionReason: varchar("rejectionReason", { length: 500 }),
      paymentConfirmedAt: timestamp("paymentConfirmedAt"),
      creditedAt: timestamp("creditedAt"),
      validatedBy: varchar("validatedBy", { length: 100 }),
      // email de l'admin NEXUS qui a validé
      notes: varchar("notes", { length: 500 }),
      // notes internes NEXUS
      // CinetPay integration
      cinetpayTransactionId: varchar("cinetpayTransactionId", { length: 100 }),
      // ID unique CinetPay
      cinetpayPaymentUrl: varchar("cinetpayPaymentUrl", { length: 500 }),
      // URL de paiement CinetPay
      cinetpayPaymentToken: varchar("cinetpayPaymentToken", { length: 200 }),
      // token CinetPay
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    creditPurchases = pgTable("credit_purchases", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      amountLocal: decimal("amountLocal", { precision: 12, scale: 2 }).notNull(),
      // montant en devise locale (FCFA)
      creditsGranted: integer("creditsGranted").notNull(),
      // nombre de crédits à accorder (amountLocal / 125)
      paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(),
      // "stripe" | "hub2_mobile_money" | "bank_transfer" | "cash"
      paymentStatus: varchar("paymentStatus", { length: 30 }).notNull().default("pending"),
      // "pending" | "processing" | "completed" | "failed" | "cancelled"
      paymentLink: text("paymentLink"),
      // lien de paiement généré (Stripe ou Hub2)
      stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
      // ID Stripe PaymentIntent
      hub2TransactionId: varchar("hub2TransactionId", { length: 255 }),
      // ID transaction Hub2
      hub2PaymentUrl: text("hub2PaymentUrl"),
      // URL de paiement Hub2
      currency: varchar("currency", { length: 10 }).notNull().default("XOF"),
      reference: varchar("reference", { length: 100 }).unique(),
      // référence unique pour traçabilité
      notes: varchar("notes", { length: 500 }),
      // notes admin
      completedAt: timestamp("completedAt"),
      // date de completion du paiement
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    quoteRequests = pgTable("quote_requests", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 150 }).notNull(),
      email: varchar("email", { length: 320 }).notNull(),
      phone: varchar("phone", { length: 30 }).notNull(),
      activityType: text("activityType").notNull(),
      message: text("message").notNull(),
      status: text("status").notNull().default("new"),
      notes: text("notes"),
      // notes internes NEXUS
      contactedAt: timestamp("contactedAt"),
      closedAt: timestamp("closedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    clientBookings = pgTable("client_bookings", {
      id: serial("id").primaryKey(),
      clientId: integer("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
      bookingType: text("bookingType").notNull(),
      bookingRef: varchar("bookingRef", { length: 100 }).notNull().unique(),
      status: text("status").notNull().default("pending"),
      departureDate: date("departureDate"),
      departureCity: varchar("departureCity", { length: 100 }),
      arrivalCity: varchar("arrivalCity", { length: 100 }),
      companyId: integer("companyId"),
      companyName: varchar("companyName", { length: 150 }),
      totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }),
      currency: varchar("currency", { length: 10 }).notNull().default("XOF"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    routes = pgTable("routes", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      // Ex: "Abidjan - Yamoussoukro"
      departureCity: varchar("departureCity", { length: 100 }).notNull(),
      arrivalCity: varchar("arrivalCity", { length: 100 }).notNull(),
      distance: integer("distance"),
      // en km
      estimatedDuration: integer("estimatedDuration"),
      // en minutes
      basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
      currency: varchar("currency", { length: 10 }).notNull().default("XOF"),
      isActive: boolean("isActive").default(true).notNull(),
      description: text("description"),
      createdBy: integer("createdBy"),
      // userId
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    buses = pgTable("buses", {
      id: serial("id").primaryKey(),
      licensePlate: varchar("licensePlate", { length: 50 }).notNull().unique(),
      model: varchar("model", { length: 100 }).notNull(),
      capacity: integer("capacity").notNull(),
      // Nombre de sièges
      companyId: integer("companyId"),
      // Référence à la compagnie
      description: text("description"),
      isActive: boolean("isActive").default(true).notNull(),
      createdBy: integer("createdBy"),
      // userId
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    stops = pgTable("stops", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      // Ex: "Gare routière d'Abidjan"
      city: varchar("city", { length: 100 }).notNull(),
      address: text("address"),
      latitude: decimal("latitude", { precision: 10, scale: 8 }),
      longitude: decimal("longitude", { precision: 11, scale: 8 }),
      description: text("description"),
      isActive: boolean("isActive").default(true).notNull(),
      createdBy: integer("createdBy"),
      // userId
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    cashierTransactions = pgTable("cashier_transactions", {
      id: serial("id").primaryKey(),
      transactionType: text("transactionType").notNull(),
      referenceId: integer("referenceId"),
      // ID du billet, expédition, ou service
      referenceType: varchar("referenceType", { length: 50 }),
      // "ticket", "shipment", "service"
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: varchar("currency", { length: 10 }).notNull().default("XOF"),
      paymentMethod: text("paymentMethod").notNull(),
      status: text("status").default("pending").notNull(),
      cashierId: integer("cashierId"),
      // userId de la personne qui encaisse
      companyId: integer("companyId"),
      // Compagnie de transport
      stationId: integer("stationId"),
      // Gare routière
      receiptNumber: varchar("receiptNumber", { length: 50 }),
      // Numéro de reçu généré
      ticketGenerated: boolean("ticketGenerated").default(false),
      // Billet généré après encaissement
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    businessDevelopers = pgTable("business_developers", {
      id: serial("id").primaryKey(),
      bdId: varchar("bdId", { length: 7 }).notNull().unique(),
      // ID unique 7 chars ex: BD12345
      firstName: varchar("firstName", { length: 100 }).notNull(),
      lastName: varchar("lastName", { length: 100 }).notNull(),
      contact: varchar("contact", { length: 100 }),
      // contact secondaire
      email: varchar("email", { length: 320 }).notNull().unique(),
      whatsapp: varchar("whatsapp", { length: 30 }),
      // numéro WhatsApp avec indicatif
      loginPhone: varchar("loginPhone", { length: 30 }).notNull().unique(),
      // login = indicatif + numéro
      countryCode: varchar("countryCode", { length: 5 }).notNull().default("+225"),
      // indicatif pays
      pinHash: varchar("pinHash", { length: 255 }).notNull(),
      // bcrypt hash du code PIN 4 chiffres
      status: text("status").default("pending").notNull(),
      commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("5.00").notNull(),
      // Taux de commission en % (défaut 5%)
      referrerBdevId: varchar("referrerBdevId", { length: 7 }),
      // ID du parrain (BDev qui l'a recruté)
      lastLoginAt: timestamp("lastLoginAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    businessDevelopersRelations = relations(businessDevelopers, ({ one }) => ({
      referrer: one(businessDevelopers, {
        fields: [businessDevelopers.referrerBdevId],
        references: [businessDevelopers.bdId]
      })
    }));
    furnishedResidences = pgTable("furnished_residences", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      // Nom de la résidence
      description: text("description"),
      // Description détaillée
      address: text("address").notNull(),
      // Adresse complète
      city: varchar("city", { length: 100 }).notNull(),
      // Ville
      country: varchar("country", { length: 100 }).notNull(),
      // Pays
      phone: varchar("phone", { length: 50 }),
      // Téléphone
      email: varchar("email", { length: 320 }),
      // Email
      totalRooms: integer("totalRooms").notNull().default(1),
      // Nombre total de chambres
      amenities: text("amenities"),
      // JSON: équipements (wifi, parking, climatisation, etc.)
      pricePerNight: decimal("pricePerNight", { precision: 10, scale: 2 }).notNull(),
      // Prix par nuit
      pricePerMonth: decimal("pricePerMonth", { precision: 10, scale: 2 }),
      // Prix par mois (optionnel)
      minStay: integer("minStay").default(1),
      // Séjour minimum en jours
      maxStay: integer("maxStay"),
      // Séjour maximum en jours (optionnel)
      status: text("status").default("active").notNull(),
      images: text("images"),
      // JSON: URLs des images
      rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
      // Note moyenne
      reviewCount: integer("reviewCount").default(0),
      // Nombre d'avis
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    roomAvailability = pgTable("room_availability", {
      id: serial("id").primaryKey(),
      residenceId: integer("residenceId").notNull(),
      date: date("date").notNull(),
      // Date de disponibilité
      availableRooms: integer("availableRooms").notNull(),
      // Nombre de chambres disponibles
      pricePerNight: decimal("pricePerNight", { precision: 10, scale: 2 }),
      // Prix spécial pour ce jour (optionnel)
      status: text("status").default("available").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    residenceReservations = pgTable("residence_reservations", {
      id: serial("id").primaryKey(),
      residenceId: integer("residenceId").notNull(),
      guestName: varchar("guestName", { length: 255 }).notNull(),
      // Nom du client
      guestEmail: varchar("guestEmail", { length: 320 }).notNull(),
      // Email du client
      guestPhone: varchar("guestPhone", { length: 50 }),
      // Téléphone du client
      checkInDate: date("checkInDate").notNull(),
      // Date d'arrivée
      checkOutDate: date("checkOutDate").notNull(),
      // Date de départ
      numberOfRooms: integer("numberOfRooms").notNull().default(1),
      // Nombre de chambres réservées
      numberOfGuests: integer("numberOfGuests").notNull().default(1),
      // Nombre de clients
      totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
      // Prix total
      paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0.00"),
      // Montant payé
      paymentStatus: text("paymentStatus").default("pending").notNull(),
      paymentMethod: varchar("paymentMethod", { length: 50 }),
      // Méthode de paiement
      reservationStatus: text("reservationStatus").default("pending").notNull(),
      specialRequests: text("specialRequests"),
      // Demandes spéciales
      notes: text("notes"),
      // Notes internes
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    guestReviews = pgTable("guest_reviews", {
      id: serial("id").primaryKey(),
      reservationId: integer("reservationId").notNull(),
      residenceId: integer("residenceId").notNull(),
      guestName: varchar("guestName", { length: 255 }).notNull(),
      rating: integer("rating").notNull(),
      // 1-5 stars
      comment: text("comment"),
      // Avis textuel
      cleanliness: integer("cleanliness"),
      // Note sur la propreté (1-5)
      comfort: integer("comfort"),
      // Note sur le confort (1-5)
      amenities: integer("amenities"),
      // Note sur les équipements (1-5)
      service: integer("service"),
      // Note sur le service (1-5)
      verified: boolean("verified").default(false),
      // Avis vérifié
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    furnishedResidencesRelations = relations(furnishedResidences, ({ many }) => ({
      availability: many(roomAvailability),
      reservations: many(residenceReservations),
      reviews: many(guestReviews)
    }));
    roomAvailabilityRelations = relations(roomAvailability, ({ one }) => ({
      residence: one(furnishedResidences, {
        fields: [roomAvailability.residenceId],
        references: [furnishedResidences.id]
      })
    }));
    residenceReservationsRelations = relations(residenceReservations, ({ one, many }) => ({
      residence: one(furnishedResidences, {
        fields: [residenceReservations.residenceId],
        references: [furnishedResidences.id]
      }),
      reviews: many(guestReviews)
    }));
    guestReviewsRelations = relations(guestReviews, ({ one }) => ({
      residence: one(furnishedResidences, {
        fields: [guestReviews.residenceId],
        references: [furnishedResidences.id]
      }),
      reservation: one(residenceReservations, {
        fields: [guestReviews.reservationId],
        references: [residenceReservations.id]
      })
    }));
    leisureActivities = pgTable("leisure_activities", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      category: varchar("category", { length: 100 }).notNull(),
      // ex: sports, culture, aventure
      location: varchar("location", { length: 255 }).notNull(),
      pricePerPerson: varchar("pricePerPerson", { length: 50 }).notNull(),
      maxCapacity: integer("maxCapacity").notNull(),
      duration: varchar("duration", { length: 100 }),
      // ex: "2 heures", "1 jour"
      image: text("image"),
      rating: decimal("rating", { precision: 3, scale: 2 }),
      reviewCount: integer("reviewCount").default(0),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    leisureBookings = pgTable("leisure_bookings", {
      id: serial("id").primaryKey(),
      activityId: integer("activityId").notNull(),
      guestName: varchar("guestName", { length: 255 }).notNull(),
      guestEmail: varchar("guestEmail", { length: 255 }).notNull(),
      guestPhone: varchar("guestPhone", { length: 20 }),
      bookingDate: timestamp("bookingDate").notNull(),
      numberOfPeople: integer("numberOfPeople").notNull(),
      totalPrice: varchar("totalPrice", { length: 50 }).notNull(),
      paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }),
      paymentStatus: text("paymentStatus").default("pending"),
      bookingStatus: text("bookingStatus").default("pending"),
      specialRequests: text("specialRequests"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    leisureReviews = pgTable("leisure_reviews", {
      id: serial("id").primaryKey(),
      activityId: integer("activityId").notNull(),
      guestName: varchar("guestName", { length: 255 }).notNull(),
      rating: integer("rating").notNull(),
      // 1-5 stars
      comment: text("comment"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    rentalProducts = pgTable("rental_products", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      category: varchar("category", { length: 100 }).notNull(),
      pricePerDay: varchar("pricePerDay", { length: 50 }).notNull(),
      pricePerWeek: varchar("pricePerWeek", { length: 50 }),
      pricePerMonth: varchar("pricePerMonth", { length: 50 }),
      depositAmount: varchar("depositAmount", { length: 50 }),
      image: text("image"),
      rating: decimal("rating", { precision: 3, scale: 2 }),
      reviewCount: integer("reviewCount").default(0),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    rentalInventory = pgTable("rental_inventory", {
      id: serial("id").primaryKey(),
      productId: integer("productId").notNull(),
      quantity: integer("quantity").notNull(),
      availableQuantity: integer("availableQuantity").notNull(),
      lastUpdated: timestamp("lastUpdated").defaultNow().notNull()
    });
    salesOrders = pgTable("sales_orders", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      customerName: varchar("customerName", { length: 255 }).notNull(),
      customerEmail: varchar("customerEmail", { length: 255 }).notNull(),
      customerPhone: varchar("customerPhone", { length: 20 }),
      orderDate: timestamp("orderDate").defaultNow().notNull(),
      totalAmount: varchar("totalAmount", { length: 50 }).notNull(),
      paymentStatus: text("paymentStatus").default("pending"),
      orderStatus: text("orderStatus").default("pending"),
      deliveryDate: timestamp("deliveryDate"),
      deliveryAddress: text("deliveryAddress"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    salesOrderItems = pgTable("sales_order_items", {
      id: serial("id").primaryKey(),
      orderId: integer("orderId").notNull(),
      productId: integer("productId").notNull(),
      quantity: integer("quantity").notNull(),
      unitPrice: varchar("unitPrice", { length: 50 }).notNull(),
      totalPrice: varchar("totalPrice", { length: 50 }).notNull()
    });
    leisureActivitiesRelations = relations(leisureActivities, ({ many }) => ({
      bookings: many(leisureBookings),
      reviews: many(leisureReviews)
    }));
    leisureBookingsRelations = relations(leisureBookings, ({ one }) => ({
      activity: one(leisureActivities, {
        fields: [leisureBookings.activityId],
        references: [leisureActivities.id]
      })
    }));
    leisureReviewsRelations = relations(leisureReviews, ({ one }) => ({
      activity: one(leisureActivities, {
        fields: [leisureReviews.activityId],
        references: [leisureActivities.id]
      })
    }));
    rentalProductsRelations = relations(rentalProducts, ({ many }) => ({
      inventory: many(rentalInventory),
      orderItems: many(salesOrderItems)
    }));
    rentalInventoryRelations = relations(rentalInventory, ({ one }) => ({
      product: one(rentalProducts, {
        fields: [rentalInventory.productId],
        references: [rentalProducts.id]
      })
    }));
    salesOrdersRelations = relations(salesOrders, ({ many }) => ({
      items: many(salesOrderItems)
    }));
    salesOrderItemsRelations = relations(salesOrderItems, ({ one }) => ({
      order: one(salesOrders, {
        fields: [salesOrderItems.orderId],
        references: [salesOrders.id]
      }),
      product: one(rentalProducts, {
        fields: [salesOrderItems.productId],
        references: [rentalProducts.id]
      })
    }));
    gasSuppliers = pgTable("gas_suppliers", {
      id: serial("id").primaryKey(),
      companyId: integer("companyId").notNull(),
      businessName: varchar("businessName", { length: 255 }).notNull(),
      phone: varchar("phone", { length: 50 }).notNull(),
      email: varchar("email", { length: 320 }),
      address: text("address"),
      city: varchar("city", { length: 100 }),
      country: varchar("country", { length: 100 }),
      isActive: boolean("isActive").default(true).notNull(),
      logoUrl: text("logoUrl"),
      description: text("description"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    gasBottles = pgTable("gas_bottles", {
      id: serial("id").primaryKey(),
      supplierId: integer("supplierId").notNull(),
      type: varchar("type", { length: 50 }).notNull(),
      // B6, B12, etc.
      capacity: varchar("capacity", { length: 50 }).notNull(),
      // 6kg, 12kg, etc.
      priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }).notNull(),
      deliveryFeeXOF: decimal("deliveryFeeXOF", { precision: 12, scale: 2 }).notNull(),
      // 200 for B6, 300 for B12
      stock: integer("stock").default(0).notNull(),
      minStock: integer("minStock").default(5).notNull(),
      description: text("description"),
      isAvailable: boolean("isAvailable").default(true).notNull(),
      photoUrl: text("photoUrl"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    gasOrders = pgTable("gas_orders", {
      id: serial("id").primaryKey(),
      reference: varchar("reference", { length: 50 }).notNull().unique(),
      clientName: varchar("clientName", { length: 200 }).notNull(),
      clientPhone: varchar("clientPhone", { length: 50 }).notNull(),
      clientEmail: varchar("clientEmail", { length: 320 }),
      deliveryAddress: text("deliveryAddress").notNull(),
      city: varchar("city", { length: 100 }).notNull(),
      supplierId: integer("supplierId").notNull(),
      totalAmountXOF: decimal("totalAmountXOF", { precision: 12, scale: 2 }).notNull(),
      paymentMethod: text("paymentMethod").default("cash"),
      paymentStatus: text("paymentStatus").default("pending"),
      orderStatus: text("orderStatus").default("pending"),
      deliveryDate: timestamp("deliveryDate"),
      estimatedDeliveryTime: varchar("estimatedDeliveryTime", { length: 50 }),
      // e.g., "30 minutes"
      notes: text("notes"),
      deliverymanId: integer("deliverymanId"),
      selectedSupplierId: integer("selectedSupplierId"),
      status: text("status").default("pending"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    gasOrderItems = pgTable("gas_order_items", {
      id: serial("id").primaryKey(),
      orderId: integer("orderId").notNull(),
      bottleId: integer("bottleId").notNull(),
      quantity: integer("quantity").notNull(),
      unitPriceXOF: decimal("unitPriceXOF", { precision: 12, scale: 2 }).notNull(),
      deliveryFeeXOF: decimal("deliveryFeeXOF", { precision: 12, scale: 2 }).notNull(),
      subtotalXOF: decimal("subtotalXOF", { precision: 12, scale: 2 }).notNull()
    });
    gasDeliveries = pgTable("gas_deliveries", {
      id: serial("id").primaryKey(),
      orderId: integer("orderId").notNull(),
      driverId: integer("driverId"),
      driverName: varchar("driverName", { length: 200 }),
      driverPhone: varchar("driverPhone", { length: 50 }),
      vehicleInfo: varchar("vehicleInfo", { length: 200 }),
      gpsLatitude: varchar("gpsLatitude", { length: 50 }),
      gpsLongitude: varchar("gpsLongitude", { length: 50 }),
      status: text("status").default("pending"),
      startedAt: timestamp("startedAt"),
      completedAt: timestamp("completedAt"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    gasSuppliersRelations = relations(gasSuppliers, ({ many }) => ({
      bottles: many(gasBottles),
      orders: many(gasOrders)
    }));
    gasBottlesRelations = relations(gasBottles, ({ one, many }) => ({
      supplier: one(gasSuppliers, {
        fields: [gasBottles.supplierId],
        references: [gasSuppliers.id]
      }),
      orderItems: many(gasOrderItems)
    }));
    gasOrdersRelations = relations(gasOrders, ({ one, many }) => ({
      supplier: one(gasSuppliers, {
        fields: [gasOrders.supplierId],
        references: [gasSuppliers.id]
      }),
      items: many(gasOrderItems),
      delivery: one(gasDeliveries, {
        fields: [gasOrders.id],
        references: [gasDeliveries.orderId]
      })
    }));
    gasOrderItemsRelations = relations(gasOrderItems, ({ one }) => ({
      order: one(gasOrders, {
        fields: [gasOrderItems.orderId],
        references: [gasOrders.id]
      }),
      bottle: one(gasBottles, {
        fields: [gasOrderItems.bottleId],
        references: [gasBottles.id]
      })
    }));
    gasDeliveriesRelations = relations(gasDeliveries, ({ one }) => ({
      order: one(gasOrders, {
        fields: [gasDeliveries.orderId],
        references: [gasOrders.id]
      })
    }));
    gasDeliverymen = pgTable("gas_deliverymen", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull().unique(),
      phone: varchar("phone", { length: 20 }).notNull(),
      email: varchar("email", { length: 255 }),
      address: varchar("address", { length: 255 }),
      city: varchar("city", { length: 100 }),
      latitude: decimal("latitude", { precision: 10, scale: 8 }),
      longitude: decimal("longitude", { precision: 11, scale: 8 }),
      isActive: boolean("isActive").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    gasOrderNotifications = pgTable("gas_order_notifications", {
      id: serial("id").primaryKey(),
      orderId: integer("orderId").notNull(),
      recipientType: text("recipientType").notNull(),
      recipientId: integer("recipientId").notNull(),
      notificationType: text("notificationType").notNull(),
      isRead: boolean("isRead").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    gasDeliverymenRelations = relations(gasDeliverymen, ({ many }) => ({
      orders: many(gasOrders)
    }));
    gasOrderNotificationsRelations = relations(gasOrderNotifications, ({ one }) => ({
      order: one(gasOrders, {
        fields: [gasOrderNotifications.orderId],
        references: [gasOrders.id]
      })
    }));
    gasOrdersRelationsUpdated = relations(gasOrders, ({ one, many }) => ({
      supplier: one(gasSuppliers, {
        fields: [gasOrders.supplierId],
        references: [gasSuppliers.id]
      }),
      deliveryman: one(gasDeliverymen, {
        fields: [gasOrders.deliverymanId],
        references: [gasDeliverymen.id]
      }),
      selectedSupplier: one(gasSuppliers, {
        fields: [gasOrders.selectedSupplierId],
        references: [gasSuppliers.id]
      }),
      items: many(gasOrderItems),
      delivery: one(gasDeliveries, {
        fields: [gasOrders.id],
        references: [gasDeliveries.orderId]
      }),
      notifications: many(gasOrderNotifications)
    }));
    shopProducts = pgTable("shop_products", {
      id: serial("id").primaryKey(),
      supplierId: integer("supplierId").notNull(),
      // Référence à transportCompanies (ZAZA DÉPÔT, etc.)
      name: varchar("name", { length: 255 }).notNull(),
      description: text("description"),
      category: varchar("category", { length: 100 }).notNull(),
      // ex: "Gaz", "Boissons", "Épicerie"
      price: decimal("price", { precision: 12, scale: 2 }).notNull(),
      stock: integer("stock").default(0).notNull(),
      sku: varchar("sku", { length: 100 }).unique(),
      barcode: varchar("barcode", { length: 100 }),
      imageUrl: text("imageUrl"),
      isActive: boolean("isActive").default(true).notNull(),
      minStockAlert: integer("minStockAlert").default(10),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    shopProductOrders = pgTable("shop_product_orders", {
      id: serial("id").primaryKey(),
      reference: varchar("reference", { length: 50 }).notNull().unique(),
      supplierId: integer("supplierId").notNull(),
      clientName: varchar("clientName", { length: 200 }).notNull(),
      clientPhone: varchar("clientPhone", { length: 50 }).notNull(),
      clientEmail: varchar("clientEmail", { length: 320 }),
      deliveryAddress: text("deliveryAddress").notNull(),
      city: varchar("city", { length: 100 }).notNull(),
      totalAmountXOF: decimal("totalAmountXOF", { precision: 12, scale: 2 }).notNull(),
      status: text("status").default("pending").notNull(),
      paymentMethod: text("paymentMethod").default("cash"),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    shopProductOrderItems = pgTable("shop_product_order_items", {
      id: serial("id").primaryKey(),
      orderId: integer("orderId").notNull(),
      productId: integer("productId").notNull(),
      quantity: integer("quantity").notNull(),
      unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
      subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    shopProductStockMovements = pgTable("shop_product_stock_movements", {
      id: serial("id").primaryKey(),
      productId: integer("productId").notNull(),
      supplierId: integer("supplierId").notNull(),
      movementType: text("movementType").notNull(),
      quantity: integer("quantity").notNull(),
      reason: varchar("reason", { length: 255 }),
      reference: varchar("reference", { length: 100 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    shopProductsRelations = relations(shopProducts, ({ one, many }) => ({
      supplier: one(transportCompanies, {
        fields: [shopProducts.supplierId],
        references: [transportCompanies.id]
      }),
      orderItems: many(shopProductOrderItems),
      stockMovements: many(shopProductStockMovements)
    }));
    shopProductOrdersRelations = relations(shopProductOrders, ({ one, many }) => ({
      supplier: one(transportCompanies, {
        fields: [shopProductOrders.supplierId],
        references: [transportCompanies.id]
      }),
      items: many(shopProductOrderItems)
    }));
    shopProductOrderItemsRelations = relations(shopProductOrderItems, ({ one }) => ({
      order: one(shopProductOrders, {
        fields: [shopProductOrderItems.orderId],
        references: [shopProductOrders.id]
      }),
      product: one(shopProducts, {
        fields: [shopProductOrderItems.productId],
        references: [shopProducts.id]
      })
    }));
    shopProductStockMovementsRelations = relations(shopProductStockMovements, ({ one }) => ({
      product: one(shopProducts, {
        fields: [shopProductStockMovements.productId],
        references: [shopProducts.id]
      }),
      supplier: one(transportCompanies, {
        fields: [shopProductStockMovements.supplierId],
        references: [transportCompanies.id]
      })
    }));
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addInventoryMovement: () => addInventoryMovement,
  addReservationService: () => addReservationService,
  approveReview: () => approveReview,
  createCaisseTransaction: () => createCaisseTransaction,
  createClient: () => createClient,
  createEmployee: () => createEmployee,
  createHousekeepingTask: () => createHousekeepingTask,
  createInventoryItem: () => createInventoryItem,
  createInvoice: () => createInvoice,
  createOffer: () => createOffer,
  createPayment: () => createPayment,
  createReservation: () => createReservation,
  createReview: () => createReview,
  createRoom: () => createRoom,
  createRoomType: () => createRoomType,
  createService: () => createService,
  deleteClient: () => deleteClient,
  deleteEmployee: () => deleteEmployee,
  deleteOffer: () => deleteOffer,
  deleteReview: () => deleteReview,
  deleteRoom: () => deleteRoom,
  deleteRoomPhoto: () => deleteRoomPhoto,
  deleteRoomType: () => deleteRoomType,
  deleteService: () => deleteService,
  getActiveOffersByHotel: () => getActiveOffersByHotel,
  getAllReviewsForAdmin: () => getAllReviewsForAdmin,
  getAvailableRoomsByDates: () => getAvailableRoomsByDates,
  getCaisseSummary: () => getCaisseSummary,
  getCaisseTransactions: () => getCaisseTransactions,
  getCitiesByCountry: () => getCitiesByCountry,
  getClientById: () => getClientById,
  getClientReservations: () => getClientReservations,
  getClients: () => getClients,
  getCountries: () => getCountries,
  getDashboardStats: () => getDashboardStats,
  getDb: () => getDb,
  getEmployeeById: () => getEmployeeById,
  getEmployees: () => getEmployees,
  getHotelProfileById: () => getHotelProfileById,
  getHotelProfileByUserId: () => getHotelProfileByUserId,
  getHotelProfiles: () => getHotelProfiles,
  getHotelRatingSummary: () => getHotelRatingSummary,
  getHotelSettings: () => getHotelSettings,
  getHousekeepingTasks: () => getHousekeepingTasks,
  getInventoryCategories: () => getInventoryCategories,
  getInventoryItems: () => getInventoryItems,
  getInvoices: () => getInvoices,
  getMonthlyRevenue: () => getMonthlyRevenue,
  getOffersByHotel: () => getOffersByHotel,
  getPayments: () => getPayments,
  getPhotosByRoom: () => getPhotosByRoom,
  getPublicRoomsByHotelUserId: () => getPublicRoomsByHotelUserId,
  getReservationById: () => getReservationById,
  getReservationServices: () => getReservationServices,
  getReservations: () => getReservations,
  getReviewsByHotel: () => getReviewsByHotel,
  getRoomById: () => getRoomById,
  getRoomTypes: () => getRoomTypes,
  getRooms: () => getRooms,
  getServices: () => getServices,
  getUserByOpenId: () => getUserByOpenId,
  promoteToAdminByEmail: () => promoteToAdminByEmail,
  reorderPhotos: () => reorderPhotos,
  seedCountriesAndCities: () => seedCountriesAndCities,
  updateClient: () => updateClient,
  updateEmployee: () => updateEmployee,
  updateHotelSettings: () => updateHotelSettings,
  updateHousekeepingTask: () => updateHousekeepingTask,
  updateInventoryItem: () => updateInventoryItem,
  updateInvoice: () => updateInvoice,
  updateOffer: () => updateOffer,
  updatePhotoCaption: () => updatePhotoCaption,
  updateReservation: () => updateReservation,
  updateRoom: () => updateRoom,
  updateRoomType: () => updateRoomType,
  updateService: () => updateService,
  upsertHotelProfile: () => upsertHotelProfile,
  upsertUser: () => upsertUser
});
import { and, count, desc, eq, gte, lte, sql, like, or, notInArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
async function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      console.error("[Database] DATABASE_URL not set");
      return null;
    }
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10
      });
      _db = drizzle(_pool);
      console.log("[Database] Connected to PostgreSQL (Neon)");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  textFields.forEach((field) => {
    const value = user[field];
    if (value === void 0) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function promoteToAdminByEmail(email) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: "admin" }).where(eq(users.email, email));
}
async function getHotelSettings() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(hotelSettings).limit(1);
  if (result.length === 0) {
    await db.insert(hotelSettings).values({ name: "Grand H\xF4tel", stars: 4, currency: "FCFA" });
    const r2 = await db.select().from(hotelSettings).limit(1);
    return r2[0] ?? null;
  }
  return result[0];
}
async function updateHotelSettings(data) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(hotelSettings).limit(1);
  if (existing.length === 0) {
    await db.insert(hotelSettings).values({ name: "Grand H\xF4tel", stars: 4, currency: "FCFA", ...data });
  } else {
    await db.update(hotelSettings).set(data).where(eq(hotelSettings.id, existing[0].id));
  }
}
async function getRoomTypes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roomTypes).orderBy(roomTypes.name);
}
async function createRoomType(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(roomTypes).values(data);
}
async function updateRoomType(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(roomTypes).set(data).where(eq(roomTypes.id, id));
}
async function deleteRoomType(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(roomTypes).where(eq(roomTypes.id, id));
}
async function getRooms() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: rooms.id,
    number: rooms.number,
    floor: rooms.floor,
    roomTypeId: rooms.roomTypeId,
    status: rooms.status,
    priceOverride: rooms.priceOverride,
    notes: rooms.notes,
    createdAt: rooms.createdAt,
    updatedAt: rooms.updatedAt,
    typeName: roomTypes.name,
    basePrice: roomTypes.basePrice,
    capacity: roomTypes.capacity
  }).from(rooms).leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id)).orderBy(rooms.floor, rooms.number);
}
async function getRoomById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return result[0] ?? null;
}
async function createRoom(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(rooms).values(data);
}
async function updateRoom(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(rooms).set(data).where(eq(rooms.id, id));
}
async function deleteRoom(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(rooms).where(eq(rooms.id, id));
}
async function getClients(search) {
  const db = await getDb();
  if (!db) return [];
  let baseClients;
  if (search) {
    baseClients = await db.select().from(clients).where(
      or(
        like(clients.firstName, `%${search}%`),
        like(clients.lastName, `%${search}%`),
        like(clients.email, `%${search}%`),
        like(clients.phone, `%${search}%`)
      )
    ).orderBy(desc(clients.createdAt));
  } else {
    baseClients = await db.select().from(clients).orderBy(desc(clients.createdAt));
  }
  const enriched = await Promise.all(baseClients.map(async (c) => {
    const stats = await db.select({
      totalStays: count(reservations.id),
      totalRevenue: sql`COALESCE(SUM(${reservations.totalAmount}), 0)`
    }).from(reservations).where(eq(reservations.clientId, c.id));
    return {
      ...c,
      totalStays: Number(stats[0]?.totalStays ?? 0),
      totalRevenue: stats[0]?.totalRevenue ?? "0"
    };
  }));
  return enriched;
}
async function getClientById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0] ?? null;
}
async function createClient(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(clients).values(data).returning({ id: clients.id });
  return { id: result[0]?.id ?? 0 };
}
async function updateClient(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(clients).set(data).where(eq(clients.id, id));
}
async function deleteClient(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(clients).where(eq(clients.id, id));
}
function generateReference() {
  const prefix = "RES";
  const year = (/* @__PURE__ */ new Date()).getFullYear().toString().slice(-2);
  const rand = Math.floor(Math.random() * 1e5).toString().padStart(5, "0");
  return `${prefix}${year}${rand}`;
}
async function getReservations(filters) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select({
    id: reservations.id,
    reference: reservations.reference,
    clientId: reservations.clientId,
    roomId: reservations.roomId,
    checkInDate: reservations.checkInDate,
    checkOutDate: reservations.checkOutDate,
    actualCheckIn: reservations.actualCheckIn,
    actualCheckOut: reservations.actualCheckOut,
    adults: reservations.adults,
    children: reservations.children,
    status: reservations.status,
    totalAmount: reservations.totalAmount,
    paidAmount: reservations.paidAmount,
    source: reservations.source,
    notes: reservations.notes,
    createdAt: reservations.createdAt,
    clientFirstName: clients.firstName,
    clientLastName: clients.lastName,
    clientEmail: clients.email,
    clientPhone: clients.phone,
    roomNumber: rooms.number,
    roomFloor: rooms.floor,
    roomTypeName: roomTypes.name
  }).from(reservations).leftJoin(clients, eq(reservations.clientId, clients.id)).leftJoin(rooms, eq(reservations.roomId, rooms.id)).leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id)).orderBy(desc(reservations.createdAt));
  return query;
}
async function getReservationById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    id: reservations.id,
    reference: reservations.reference,
    clientId: reservations.clientId,
    roomId: reservations.roomId,
    checkInDate: reservations.checkInDate,
    checkOutDate: reservations.checkOutDate,
    actualCheckIn: reservations.actualCheckIn,
    actualCheckOut: reservations.actualCheckOut,
    adults: reservations.adults,
    children: reservations.children,
    status: reservations.status,
    totalAmount: reservations.totalAmount,
    paidAmount: reservations.paidAmount,
    source: reservations.source,
    notes: reservations.notes,
    createdAt: reservations.createdAt,
    updatedAt: reservations.updatedAt,
    clientFirstName: clients.firstName,
    clientLastName: clients.lastName,
    clientEmail: clients.email,
    clientPhone: clients.phone,
    roomNumber: rooms.number,
    roomFloor: rooms.floor,
    roomTypeName: roomTypes.name,
    basePrice: roomTypes.basePrice
  }).from(reservations).leftJoin(clients, eq(reservations.clientId, clients.id)).leftJoin(rooms, eq(reservations.roomId, rooms.id)).leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id)).where(eq(reservations.id, id)).limit(1);
  return result[0] ?? null;
}
async function createReservation(data) {
  const db = await getDb();
  if (!db) return null;
  const reference = generateReference();
  await db.insert(reservations).values({ ...data, reference });
  return reference;
}
async function updateReservation(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(reservations).set(data).where(eq(reservations.id, id));
}
async function getClientReservations(clientId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: reservations.id,
    reference: reservations.reference,
    checkInDate: reservations.checkInDate,
    checkOutDate: reservations.checkOutDate,
    status: reservations.status,
    totalAmount: reservations.totalAmount,
    roomNumber: rooms.number,
    roomTypeName: roomTypes.name
  }).from(reservations).leftJoin(rooms, eq(reservations.roomId, rooms.id)).leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id)).where(eq(reservations.clientId, clientId)).orderBy(desc(reservations.createdAt));
}
async function getServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services).orderBy(services.category, services.name);
}
async function createService(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(services).values(data);
}
async function updateService(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(services).set(data).where(eq(services.id, id));
}
async function deleteService(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(services).where(eq(services.id, id));
}
async function getReservationServices(reservationId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: reservationServices.id,
    reservationId: reservationServices.reservationId,
    serviceId: reservationServices.serviceId,
    quantity: reservationServices.quantity,
    unitPrice: reservationServices.unitPrice,
    totalPrice: reservationServices.totalPrice,
    date: reservationServices.date,
    notes: reservationServices.notes,
    serviceName: services.name,
    serviceCategory: services.category
  }).from(reservationServices).leftJoin(services, eq(reservationServices.serviceId, services.id)).where(eq(reservationServices.reservationId, reservationId));
}
async function addReservationService(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(reservationServices).values(data);
}
async function getPayments(reservationId) {
  const db = await getDb();
  if (!db) return [];
  if (reservationId) {
    return db.select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      status: payments.status,
      paidAt: payments.paidAt,
      notes: payments.notes,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName
    }).from(payments).leftJoin(clients, eq(payments.clientId, clients.id)).where(eq(payments.reservationId, reservationId)).orderBy(desc(payments.paidAt));
  }
  return db.select({
    id: payments.id,
    reservationId: payments.reservationId,
    clientId: payments.clientId,
    amount: payments.amount,
    method: payments.method,
    reference: payments.reference,
    status: payments.status,
    paidAt: payments.paidAt,
    notes: payments.notes,
    clientFirstName: clients.firstName,
    clientLastName: clients.lastName
  }).from(payments).leftJoin(clients, eq(payments.clientId, clients.id)).orderBy(desc(payments.paidAt));
}
async function createPayment(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(payments).values(data);
  if (data.reservationId) {
    const total = await db.select({ total: sql`SUM(amount)` }).from(payments).where(and(eq(payments.reservationId, data.reservationId), eq(payments.status, "complete")));
    const paid = parseFloat(total[0]?.total ?? "0");
    await db.update(reservations).set({ paidAmount: paid.toString() }).where(eq(reservations.id, data.reservationId));
  }
}
function generateInvoiceNumber() {
  const now = /* @__PURE__ */ new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 1e4).toString().padStart(4, "0");
  return `FAC${y}${m}${rand}`;
}
async function getInvoices() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: invoices.id,
    number: invoices.number,
    reservationId: invoices.reservationId,
    clientId: invoices.clientId,
    amount: invoices.amount,
    taxAmount: invoices.taxAmount,
    totalAmount: invoices.totalAmount,
    status: invoices.status,
    issuedAt: invoices.issuedAt,
    dueAt: invoices.dueAt,
    notes: invoices.notes,
    clientFirstName: clients.firstName,
    clientLastName: clients.lastName
  }).from(invoices).leftJoin(clients, eq(invoices.clientId, clients.id)).orderBy(desc(invoices.issuedAt));
}
async function createInvoice(data) {
  const db = await getDb();
  if (!db) return null;
  const number = generateInvoiceNumber();
  await db.insert(invoices).values({ ...data, number });
  return number;
}
async function updateInvoice(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(invoices).set(data).where(eq(invoices.id, id));
}
async function getEmployees() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).orderBy(employees.lastName);
}
async function getEmployeeById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0] ?? null;
}
async function createEmployee(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(employees).values(data);
}
async function updateEmployee(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(employees).set(data).where(eq(employees.id, id));
}
async function deleteEmployee(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(employees).where(eq(employees.id, id));
}
async function getHousekeepingTasks(filters) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: housekeepingTasks.id,
    roomId: housekeepingTasks.roomId,
    assignedTo: housekeepingTasks.assignedTo,
    type: housekeepingTasks.type,
    status: housekeepingTasks.status,
    priority: housekeepingTasks.priority,
    scheduledAt: housekeepingTasks.scheduledAt,
    startedAt: housekeepingTasks.startedAt,
    completedAt: housekeepingTasks.completedAt,
    notes: housekeepingTasks.notes,
    createdAt: housekeepingTasks.createdAt,
    roomNumber: rooms.number,
    roomFloor: rooms.floor,
    employeeFirstName: employees.firstName,
    employeeLastName: employees.lastName
  }).from(housekeepingTasks).leftJoin(rooms, eq(housekeepingTasks.roomId, rooms.id)).leftJoin(employees, eq(housekeepingTasks.assignedTo, employees.id)).orderBy(desc(housekeepingTasks.createdAt));
}
async function createHousekeepingTask(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(housekeepingTasks).values(data);
}
async function updateHousekeepingTask(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(housekeepingTasks).set(data).where(eq(housekeepingTasks.id, id));
}
async function getInventoryCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryCategories).orderBy(inventoryCategories.name);
}
async function getInventoryItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: inventoryItems.id,
    name: inventoryItems.name,
    categoryId: inventoryItems.categoryId,
    unit: inventoryItems.unit,
    currentStock: inventoryItems.currentStock,
    minStock: inventoryItems.minStock,
    maxStock: inventoryItems.maxStock,
    unitCost: inventoryItems.unitCost,
    supplier: inventoryItems.supplier,
    location: inventoryItems.location,
    updatedAt: inventoryItems.updatedAt,
    categoryName: inventoryCategories.name
  }).from(inventoryItems).leftJoin(inventoryCategories, eq(inventoryItems.categoryId, inventoryCategories.id)).orderBy(inventoryItems.name);
}
async function createInventoryItem(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(inventoryItems).values(data);
}
async function updateInventoryItem(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(inventoryItems).set(data).where(eq(inventoryItems.id, id));
}
async function addInventoryMovement(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(inventoryMovements).values(data);
  const item = await db.select().from(inventoryItems).where(eq(inventoryItems.id, data.itemId)).limit(1);
  if (item[0]) {
    const current = parseFloat(item[0].currentStock ?? "0");
    const qty = parseFloat(data.quantity);
    const newStock = data.type === "entree" ? current + qty : data.type === "sortie" ? current - qty : qty;
    await db.update(inventoryItems).set({ currentStock: newStock.toString() }).where(eq(inventoryItems.id, data.itemId));
  }
}
async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  const now = /* @__PURE__ */ new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startStr = startOfMonth.toISOString().split("T")[0];
  const endStr = endOfMonth.toISOString().split("T")[0];
  const [
    totalRooms,
    roomStatuses,
    monthReservations,
    totalRevenue,
    recentReservations,
    lowStockItems
  ] = await Promise.all([
    db.select({ count: sql`COUNT(*)` }).from(rooms),
    db.select({ status: rooms.status, count: sql`COUNT(*)` }).from(rooms).groupBy(rooms.status),
    db.select({ count: sql`COUNT(*)` }).from(reservations).where(
      sql`checkInDate >= ${startStr} AND checkInDate <= ${endStr}`
    ),
    db.select({ total: sql`SUM(totalAmount)` }).from(reservations).where(
      sql`checkInDate >= ${startStr} AND checkInDate <= ${endStr} AND status IN ('confirmee','checkin','checkout')`
    ),
    db.select({
      id: reservations.id,
      reference: reservations.reference,
      checkInDate: reservations.checkInDate,
      checkOutDate: reservations.checkOutDate,
      status: reservations.status,
      totalAmount: reservations.totalAmount,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
      roomNumber: rooms.number,
      roomTypeName: roomTypes.name
    }).from(reservations).leftJoin(clients, eq(reservations.clientId, clients.id)).leftJoin(rooms, eq(reservations.roomId, rooms.id)).leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id)).orderBy(desc(reservations.createdAt)).limit(10),
    db.select({ count: sql`COUNT(*)` }).from(inventoryItems).where(
      sql`currentStock <= minStock`
    )
  ]);
  const total = Number(totalRooms[0]?.count ?? 0);
  const occupied = Number(roomStatuses.find((r) => r.status === "occupee")?.count ?? 0);
  const libre = Number(roomStatuses.find((r) => r.status === "libre")?.count ?? 0);
  const maintenance = Number(roomStatuses.find((r) => r.status === "maintenance")?.count ?? 0);
  const reservee = Number(roomStatuses.find((r) => r.status === "reservee")?.count ?? 0);
  const nettoyage = Number(roomStatuses.find((r) => r.status === "nettoyage")?.count ?? 0);
  const occupancyRate = total > 0 ? Math.round(occupied / total * 100) : 0;
  const caTotal = parseFloat(totalRevenue[0]?.total ?? "0");
  const nbReservations = Number(monthReservations[0]?.count ?? 0);
  const adr = occupied > 0 ? caTotal / occupied : 0;
  const revpar = total > 0 ? caTotal / total : 0;
  const avgBasket = nbReservations > 0 ? caTotal / nbReservations : 0;
  return {
    occupancyRate,
    revpar,
    adr,
    caTotal,
    totalRooms: total,
    occupiedRooms: occupied,
    freeRooms: libre,
    maintenanceRooms: maintenance,
    reservedRooms: reservee,
    cleaningRooms: nettoyage,
    monthReservations: nbReservations,
    avgBasket,
    lowStockItems: Number(lowStockItems[0]?.count ?? 0),
    recentReservations,
    roomStatuses
  };
}
async function getMonthlyRevenue(year) {
  const db = await getDb();
  if (!db) return [];
  const results = [];
  for (let m = 1; m <= 12; m++) {
    const start = `${year}-${m.toString().padStart(2, "0")}-01`;
    const end = new Date(year, m, 0).toISOString().split("T")[0];
    const [hebergement, servicesRev] = await Promise.all([
      db.select({ total: sql`COALESCE(SUM(totalAmount),0)` }).from(reservations).where(
        sql`checkInDate >= ${start} AND checkInDate <= ${end} AND status IN ('confirmee','checkin','checkout')`
      ),
      db.select({ total: sql`COALESCE(SUM(totalPrice),0)` }).from(reservationServices).where(
        and(gte(reservationServices.date, new Date(year, m - 1, 1)), lte(reservationServices.date, new Date(year, m, 0)))
      )
    ]);
    results.push({
      month: m,
      hebergement: parseFloat(hebergement[0]?.total ?? "0"),
      services: parseFloat(servicesRev[0]?.total ?? "0")
    });
  }
  return results;
}
function getPeriodDates(period) {
  const now = /* @__PURE__ */ new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  }
  return { start, end };
}
async function getCaisseSummary(period) {
  const db = await getDb();
  if (!db) return { totalEncaissements: 0, totalDecaissements: 0, solde: 0 };
  const { start, end } = getPeriodDates(period);
  const [enc, dec] = await Promise.all([
    db.select({ total: sql`COALESCE(SUM(amount), 0)` }).from(payments).where(and(
      sql`type = 'encaissement' OR type IS NULL`,
      gte(payments.paidAt, start),
      lte(payments.paidAt, end)
    )),
    db.select({ total: sql`COALESCE(SUM(amount), 0)` }).from(payments).where(and(
      sql`type = 'decaissement'`,
      gte(payments.paidAt, start),
      lte(payments.paidAt, end)
    ))
  ]);
  const totalEncaissements = parseFloat(enc[0]?.total ?? "0");
  const totalDecaissements = parseFloat(dec[0]?.total ?? "0");
  return {
    totalEncaissements,
    totalDecaissements,
    solde: totalEncaissements - totalDecaissements
  };
}
async function getCaisseTransactions(period) {
  const db = await getDb();
  if (!db) return [];
  const { start, end } = getPeriodDates(period);
  return db.select({
    id: payments.id,
    type: payments.type,
    amount: payments.amount,
    method: payments.method,
    description: payments.description,
    notes: payments.notes,
    reference: payments.reference,
    paidAt: payments.paidAt
  }).from(payments).where(and(gte(payments.paidAt, start), lte(payments.paidAt, end))).orderBy(desc(payments.paidAt));
}
async function createCaisseTransaction(data) {
  const db = await getDb();
  if (!db) return null;
  let clientId = 1;
  if (data.reservationId) {
    const res = await db.select({ clientId: reservations.clientId }).from(reservations).where(eq(reservations.id, data.reservationId)).limit(1);
    if (res[0]) clientId = res[0].clientId;
  }
  await db.insert(payments).values({
    clientId,
    reservationId: data.reservationId ?? void 0,
    amount: data.amount,
    method: data.method ?? "especes",
    type: data.type,
    description: data.description ?? void 0,
    status: "complete",
    paidAt: /* @__PURE__ */ new Date()
  });
  if (data.reservationId && data.type === "encaissement") {
    const res = await db.select({ paidAmount: reservations.paidAmount }).from(reservations).where(eq(reservations.id, data.reservationId)).limit(1);
    if (res[0]) {
      const newPaid = parseFloat(res[0].paidAmount ?? "0") + parseFloat(data.amount);
      await db.update(reservations).set({ paidAmount: newPaid.toString() }).where(eq(reservations.id, data.reservationId));
    }
  }
  return true;
}
async function getCountries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(countries).orderBy(countries.name);
}
async function getCitiesByCountry(countryId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cities).where(eq(cities.countryId, countryId)).orderBy(cities.name);
}
async function seedCountriesAndCities() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(countries).limit(1);
  if (existing.length > 0) return;
  const data = [
    { code: "BJ", name: "B\xE9nin", flag: "\u{1F1E7}\u{1F1EF}", cities: ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", "Bohicon", "Natitingou"] },
    { code: "CI", name: "C\xF4te d'Ivoire", flag: "\u{1F1E8}\u{1F1EE}", cities: ["Abidjan", "Bouak\xE9", "Daloa", "Yamoussoukro", "San-P\xE9dro", "Korhogo"] },
    { code: "SN", name: "S\xE9n\xE9gal", flag: "\u{1F1F8}\u{1F1F3}", cities: ["Dakar", "Thi\xE8s", "Saint-Louis", "Ziguinchor", "Kaolack", "Mbour"] },
    { code: "ML", name: "Mali", flag: "\u{1F1F2}\u{1F1F1}", cities: ["Bamako", "Sikasso", "Mopti", "S\xE9gou", "Kayes", "Gao"] },
    { code: "BF", name: "Burkina Faso", flag: "\u{1F1E7}\u{1F1EB}", cities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", "Kaya"] },
    { code: "TG", name: "Togo", flag: "\u{1F1F9}\u{1F1EC}", cities: ["Lom\xE9", "Sokod\xE9", "Kara", "Atakpam\xE9", "Kpalim\xE9", "Ts\xE9vi\xE9"] },
    { code: "GH", name: "Ghana", flag: "\u{1F1EC}\u{1F1ED}", cities: ["Accra", "Kumasi", "Tamale", "Cape Coast", "Sekondi-Takoradi", "Tema"] },
    { code: "NG", name: "Nigeria", flag: "\u{1F1F3}\u{1F1EC}", cities: ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City"] },
    { code: "CM", name: "Cameroun", flag: "\u{1F1E8}\u{1F1F2}", cities: ["Douala", "Yaound\xE9", "Garoua", "Bamenda", "Maroua", "Bafoussam"] },
    { code: "GN", name: "Guin\xE9e", flag: "\u{1F1EC}\u{1F1F3}", cities: ["Conakry", "Nz\xE9r\xE9kor\xE9", "Kankan", "Kindia", "Lab\xE9", "Mamou"] },
    { code: "FR", name: "France", flag: "\u{1F1EB}\u{1F1F7}", cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Bordeaux"] },
    { code: "MA", name: "Maroc", flag: "\u{1F1F2}\u{1F1E6}", cities: ["Casablanca", "Rabat", "Marrakech", "F\xE8s", "Tanger", "Agadir"] },
    { code: "TN", name: "Tunisie", flag: "\u{1F1F9}\u{1F1F3}", cities: ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gab\xE8s"] },
    { code: "DZ", name: "Alg\xE9rie", flag: "\u{1F1E9}\u{1F1FF}", cities: ["Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna"] },
    { code: "GA", name: "Gabon", flag: "\u{1F1EC}\u{1F1E6}", cities: ["Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda", "Mouila"] }
  ];
  for (const country of data) {
    const inserted = await db.insert(countries).values({ code: country.code, name: country.name, flag: country.flag }).returning({ id: countries.id });
    const countryId = inserted[0]?.id;
    if (countryId) {
      for (const cityName of country.cities) {
        await db.insert(cities).values({ name: cityName, countryId });
      }
    }
  }
}
async function getHotelProfiles(filters) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(hotelProfiles.isActive, true)];
  if (filters?.countryId) conditions.push(eq(hotelProfiles.countryId, filters.countryId));
  if (filters?.cityId) conditions.push(eq(hotelProfiles.cityId, filters.cityId));
  if (filters?.type) conditions.push(eq(hotelProfiles.type, filters.type));
  const allResults = await db.select({
    id: hotelProfiles.id,
    userId: hotelProfiles.userId,
    hotelName: hotelProfiles.hotelName,
    managerName: hotelProfiles.managerName,
    phone: hotelProfiles.phone,
    email: hotelProfiles.email,
    address: hotelProfiles.address,
    countryId: hotelProfiles.countryId,
    cityId: hotelProfiles.cityId,
    type: hotelProfiles.type,
    stars: hotelProfiles.stars,
    logoUrl: hotelProfiles.logoUrl,
    description: hotelProfiles.description,
    countryName: countries.name,
    countryFlag: countries.flag,
    cityName: cities.name
  }).from(hotelProfiles).leftJoin(countries, eq(hotelProfiles.countryId, countries.id)).leftJoin(cities, eq(hotelProfiles.cityId, cities.id)).where(and(...conditions)).orderBy(hotelProfiles.hotelName);
  const enriched = await Promise.all(allResults.map(async (hotel) => {
    const roomsForHotel = await getPublicRoomsByHotelUserId(hotel.userId);
    const prices = roomsForHotel.map((r) => r.priceOverride ? parseFloat(r.priceOverride) : r.basePrice ? parseFloat(r.basePrice) : Infinity).filter((p) => isFinite(p));
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const ratingRows = await db.select({ rating: reviews.rating }).from(reviews).where(and(eq(reviews.hotelProfileId, hotel.id), eq(reviews.approved, true)));
    const reviewCount = ratingRows.length;
    const avgRating = reviewCount > 0 ? Math.round(ratingRows.reduce((s, r) => s + r.rating, 0) / reviewCount * 10) / 10 : null;
    return { ...hotel, minPrice, avgRating, reviewCount };
  }));
  if (!filters?.maxPrice) return enriched;
  const maxP = filters.maxPrice;
  return enriched.filter((h) => h.minPrice !== null && h.minPrice <= maxP);
}
async function getHotelProfileByUserId(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(hotelProfiles).where(eq(hotelProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}
async function getHotelProfileById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    id: hotelProfiles.id,
    userId: hotelProfiles.userId,
    hotelName: hotelProfiles.hotelName,
    managerName: hotelProfiles.managerName,
    phone: hotelProfiles.phone,
    email: hotelProfiles.email,
    address: hotelProfiles.address,
    countryId: hotelProfiles.countryId,
    cityId: hotelProfiles.cityId,
    type: hotelProfiles.type,
    stars: hotelProfiles.stars,
    logoUrl: hotelProfiles.logoUrl,
    description: hotelProfiles.description,
    countryName: countries.name,
    countryFlag: countries.flag,
    cityName: cities.name
  }).from(hotelProfiles).leftJoin(countries, eq(hotelProfiles.countryId, countries.id)).leftJoin(cities, eq(hotelProfiles.cityId, cities.id)).where(eq(hotelProfiles.id, id)).limit(1);
  return result[0] ?? null;
}
async function upsertHotelProfile(userId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select({ id: hotelProfiles.id }).from(hotelProfiles).where(eq(hotelProfiles.userId, userId)).limit(1);
  if (existing[0]) {
    await db.update(hotelProfiles).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(hotelProfiles.userId, userId));
    return existing[0].id;
  } else {
    const res = await db.insert(hotelProfiles).values({ userId, hotelName: data.hotelName ?? "Mon H\xF4tel", ...data }).returning({ id: hotelProfiles.id });
    return res[0]?.id ?? 0;
  }
}
async function getPublicRoomsByHotelUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: rooms.id,
    number: rooms.number,
    floor: rooms.floor,
    status: rooms.status,
    priceOverride: rooms.priceOverride,
    notes: rooms.notes,
    typeName: roomTypes.name,
    typeDescription: roomTypes.description,
    basePrice: roomTypes.basePrice,
    capacity: roomTypes.capacity,
    amenities: roomTypes.amenities
  }).from(rooms).leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id)).where(eq(rooms.status, "libre")).orderBy(rooms.number);
}
async function getReviewsByHotel(hotelProfileId, approvedOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(reviews.hotelProfileId, hotelProfileId)];
  if (approvedOnly) conditions.push(eq(reviews.approved, true));
  return db.select().from(reviews).where(and(...conditions)).orderBy(desc(reviews.createdAt));
}
async function getHotelRatingSummary(hotelProfileId) {
  const db = await getDb();
  if (!db) return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const rows = await db.select({ rating: reviews.rating }).from(reviews).where(and(eq(reviews.hotelProfileId, hotelProfileId), eq(reviews.approved, true)));
  if (!rows.length) return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of rows) {
    distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
    sum += r.rating;
  }
  return {
    average: Math.round(sum / rows.length * 10) / 10,
    total: rows.length,
    distribution
  };
}
async function createReview(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const resRes = await db.insert(reviews).values(data).returning({ id: sql`lastval()` });
  const res = { insertId: resRes[0]?.id ?? 0 };
  return { id: res.insertId };
}
async function approveReview(id, approved) {
  const db = await getDb();
  if (!db) return;
  await db.update(reviews).set({ approved }).where(eq(reviews.id, id));
}
async function deleteReview(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(reviews).where(eq(reviews.id, id));
}
async function getAllReviewsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: reviews.id,
    hotelProfileId: reviews.hotelProfileId,
    clientName: reviews.clientName,
    clientEmail: reviews.clientEmail,
    rating: reviews.rating,
    comment: reviews.comment,
    approved: reviews.approved,
    createdAt: reviews.createdAt,
    hotelName: hotelProfiles.hotelName
  }).from(reviews).leftJoin(hotelProfiles, eq(reviews.hotelProfileId, hotelProfiles.id)).orderBy(desc(reviews.createdAt));
}
async function getOffersByHotel(hotelProfileId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(specialOffers).where(eq(specialOffers.hotelProfileId, hotelProfileId)).orderBy(desc(specialOffers.createdAt));
}
async function getActiveOffersByHotel(hotelProfileId) {
  const db = await getDb();
  if (!db) return [];
  const now = /* @__PURE__ */ new Date();
  const rows = await db.select().from(specialOffers).where(eq(specialOffers.hotelProfileId, hotelProfileId)).orderBy(desc(specialOffers.createdAt));
  return rows.filter((o) => {
    if (!o.active) return false;
    if (o.validFrom && new Date(o.validFrom) > now) return false;
    if (o.validUntil && new Date(o.validUntil) < now) return false;
    return true;
  });
}
async function createOffer(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const resultRes = await db.insert(specialOffers).values(data).returning({ id: sql`lastval()` });
  const result = { insertId: resultRes[0]?.id ?? 0 };
  return { id: result.insertId };
}
async function updateOffer(id, data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(specialOffers).set(data).where(eq(specialOffers.id, id));
  return { success: true };
}
async function deleteOffer(id) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(specialOffers).where(eq(specialOffers.id, id));
  return { success: true };
}
async function getPhotosByRoom(roomId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roomPhotos).where(eq(roomPhotos.roomId, roomId)).orderBy(roomPhotos.sortOrder);
}
async function updatePhotoCaption(photoId, caption) {
  const db = await getDb();
  if (!db) return;
  await db.update(roomPhotos).set({ caption }).where(eq(roomPhotos.id, photoId));
}
async function reorderPhotos(photos) {
  const db = await getDb();
  if (!db) return;
  for (const p of photos) {
    await db.update(roomPhotos).set({ sortOrder: p.sortOrder }).where(eq(roomPhotos.id, p.id));
  }
}
async function deleteRoomPhoto(photoId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(roomPhotos).where(eq(roomPhotos.id, photoId));
}
async function getAvailableRoomsByDates(userId, checkIn, checkOut) {
  const db = await getDb();
  if (!db) return [];
  const conflicting = await db.select({ roomId: reservations.roomId }).from(reservations).where(
    and(
      // Only confirmed or checked-in reservations block availability
      or(
        eq(reservations.status, "confirmee"),
        eq(reservations.status, "checkin")
      ),
      // Overlap condition: resCheckIn < checkOut AND resCheckOut > checkIn
      sql`${reservations.checkInDate} < ${checkOut}`,
      sql`${reservations.checkOutDate} > ${checkIn}`
    )
  );
  const blockedRoomIds = conflicting.map((r) => r.roomId);
  const baseConditions = [];
  if (blockedRoomIds.length > 0) {
    baseConditions.push(notInArray(rooms.id, blockedRoomIds));
  }
  return db.select({
    id: rooms.id,
    number: rooms.number,
    floor: rooms.floor,
    status: rooms.status,
    priceOverride: rooms.priceOverride,
    notes: rooms.notes,
    typeName: roomTypes.name,
    typeDescription: roomTypes.description,
    basePrice: roomTypes.basePrice,
    capacity: roomTypes.capacity,
    amenities: roomTypes.amenities
  }).from(rooms).leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id)).where(and(...baseConditions, or(eq(rooms.status, "libre"), eq(rooms.status, "reservee")))).orderBy(rooms.number);
}
var _db, _pool;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    init_schema();
    init_schema();
    _db = null;
    _pool = null;
  }
});

// server/transport-db.ts
var transport_db_exports = {};
__export(transport_db_exports, {
  addCredits: () => addCredits,
  addGalleryImage: () => addGalleryImage,
  adminCreditCompany: () => adminCreditCompany,
  autoValidateMobileMoneyPayment: () => autoValidateMobileMoneyPayment,
  confirmCreditRequestPayment: () => confirmCreditRequestPayment,
  createBooking: () => createBooking,
  createCharge: () => createCharge,
  createCompanyReview: () => createCompanyReview,
  createCreditRequest: () => createCreditRequest,
  createPublicBooking: () => createPublicBooking,
  createQuoteRequest: () => createQuoteRequest,
  createShipment: () => createShipment,
  createTicket: () => createTicket,
  debitCredit: () => debitCredit,
  deleteBus: () => deleteBus,
  deleteBusLine: () => deleteBusLine,
  deleteCompanyById: () => deleteCompanyById,
  deleteGalleryImage: () => deleteGalleryImage,
  generateMonthlyBilling: () => generateMonthlyBilling,
  getAllActiveCompanies: () => getAllActiveCompanies,
  getAllBilling: () => getAllBilling,
  getAllCompanies: () => getAllCompanies,
  getAllCreditRequests: () => getAllCreditRequests,
  getAllCreditsStats: () => getAllCreditsStats,
  getAverageRating: () => getAverageRating,
  getBillingByCompany: () => getBillingByCompany,
  getBookingsByCompany: () => getBookingsByCompany,
  getBusLinesByCompany: () => getBusLinesByCompany,
  getBusesByCompany: () => getBusesByCompany,
  getChargesByCompany: () => getChargesByCompany,
  getCompaniesByCountry: () => getCompaniesByCountry,
  getCompaniesByUserId: () => getCompaniesByUserId,
  getCompaniesDetailedStats: () => getCompaniesDetailedStats,
  getCompanyById: () => getCompanyById,
  getCompanyByUserId: () => getCompanyByUserId,
  getCompanyCredits: () => getCompanyCredits,
  getCompanyDashboardStats: () => getCompanyDashboardStats,
  getCountryCurrency: () => getCountryCurrency,
  getCreditRequestByHub2PurchaseRef: () => getCreditRequestByHub2PurchaseRef,
  getCreditRequestsByCompany: () => getCreditRequestsByCompany,
  getCreditTransactions: () => getCreditTransactions,
  getCsnDashboardStats: () => getCsnDashboardStats,
  getDepartureById: () => getDepartureById,
  getDeparturesByCompany: () => getDeparturesByCompany,
  getGalleryByCompany: () => getGalleryByCompany,
  getOccupiedSeatsByDeparture: () => getOccupiedSeatsByDeparture,
  getOccupiedSeatsByTrip: () => getOccupiedSeatsByTrip,
  getPublicTripsByCompany: () => getPublicTripsByCompany,
  getPublicTripsByCountry: () => getPublicTripsByCountry,
  getQuoteRequests: () => getQuoteRequests,
  getReviewsByCompany: () => getReviewsByCompany,
  getRouteFaresByCompany: () => getRouteFaresByCompany,
  getShipmentsByCompany: () => getShipmentsByCompany,
  getStaffByCompany: () => getStaffByCompany,
  getStationsByCompany: () => getStationsByCompany,
  getTicketsByCompany: () => getTicketsByCompany,
  getTicketsByDeparture: () => getTicketsByDeparture,
  getTrendingData: () => getTrendingData,
  getTripsByCompany: () => getTripsByCompany,
  reactivateCompany: () => reactivateCompany,
  rejectCreditRequest: () => rejectCreditRequest,
  saveHub2PaymentIntent: () => saveHub2PaymentIntent,
  searchPublicTrips: () => searchPublicTrips,
  suspendCompany: () => suspendCompany,
  trackShipment: () => trackShipment,
  updateBillingStatus: () => updateBillingStatus,
  updateBookingStatus: () => updateBookingStatus,
  updateCompanyAdmin: () => updateCompanyAdmin,
  updateDepartureStatus: () => updateDepartureStatus,
  updateQuoteRequestStatus: () => updateQuoteRequestStatus,
  updateShipmentStatus: () => updateShipmentStatus,
  updateTicketStatus: () => updateTicketStatus,
  upsertBus: () => upsertBus,
  upsertBusLine: () => upsertBusLine,
  upsertCompany: () => upsertCompany,
  upsertDeparture: () => upsertDeparture,
  upsertRouteFare: () => upsertRouteFare,
  upsertStaff: () => upsertStaff,
  upsertStation: () => upsertStation,
  upsertTrip: () => upsertTrip,
  validateCompany: () => validateCompany,
  verifyTicketByNumber: () => verifyTicketByNumber
});
import { and as and2, desc as desc2, eq as eq2, sql as sql2 } from "drizzle-orm";
async function getCompanyByUserId(userId) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(transportCompanies).where(eq2(transportCompanies.userId, userId)).limit(1);
  return rows[0] ?? null;
}
async function getCompaniesByUserId(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportCompanies).where(eq2(transportCompanies.userId, userId)).orderBy(desc2(transportCompanies.createdAt));
}
async function getCompanyById(id) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(transportCompanies).where(eq2(transportCompanies.id, id)).limit(1);
  return rows[0] ?? null;
}
async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: transportCompanies.id,
    companyName: transportCompanies.companyName,
    managerName: transportCompanies.managerName,
    phone: transportCompanies.phone,
    email: transportCompanies.email,
    status: transportCompanies.status,
    logoUrl: transportCompanies.logoUrl,
    countryId: transportCompanies.countryId,
    cityId: transportCompanies.cityId,
    createdAt: transportCompanies.createdAt,
    validatedAt: transportCompanies.validatedAt,
    activityType: transportCompanies.activityType
  }).from(transportCompanies).orderBy(desc2(transportCompanies.createdAt));
}
async function upsertCompany(userId, data, companyId) {
  const db = await getDb();
  if (!db) return null;
  if (companyId) {
    await db.update(transportCompanies).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(transportCompanies.id, companyId));
    return getCompanyById(companyId);
  } else {
    await db.insert(transportCompanies).values({ ...data, userId, status: "pending" });
    const rows = await db.select().from(transportCompanies).where(eq2(transportCompanies.userId, userId)).orderBy(desc2(transportCompanies.createdAt)).limit(1);
    return rows[0] ?? null;
  }
}
async function validateCompany(companyId, adminUserId, action, rejectionReason) {
  const db = await getDb();
  if (!db) return;
  await db.update(transportCompanies).set({
    status: action,
    validatedAt: action === "active" ? /* @__PURE__ */ new Date() : null,
    validatedBy: adminUserId,
    rejectionReason: rejectionReason ?? null,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq2(transportCompanies.id, companyId));
}
async function updateCompanyAdmin(companyId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(transportCompanies).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(transportCompanies.id, companyId));
}
async function suspendCompany(companyId) {
  const db = await getDb();
  if (!db) return;
  await db.update(transportCompanies).set({ status: "suspended", updatedAt: /* @__PURE__ */ new Date() }).where(eq2(transportCompanies.id, companyId));
}
async function reactivateCompany(companyId) {
  const db = await getDb();
  if (!db) return;
  await db.update(transportCompanies).set({ status: "active", updatedAt: /* @__PURE__ */ new Date() }).where(eq2(transportCompanies.id, companyId));
}
async function deleteCompanyById(companyId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(transportCompanies).where(eq2(transportCompanies.id, companyId));
}
async function getBusLinesByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportBusLines).where(and2(eq2(transportBusLines.companyId, companyId), eq2(transportBusLines.active, true))).orderBy(transportBusLines.departureCity);
}
async function upsertBusLine(companyId, data) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db.update(transportBusLines).set({ ...data, companyId }).where(and2(eq2(transportBusLines.id, data.id), eq2(transportBusLines.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportBusLines).values({ ...data, companyId }).returning({ id: transportBusLines.id });
    return result[0]?.id ?? 0;
  }
}
async function deleteBusLine(companyId, id) {
  const db = await getDb();
  if (!db) return;
  await db.update(transportBusLines).set({ active: false }).where(and2(eq2(transportBusLines.id, id), eq2(transportBusLines.companyId, companyId)));
}
async function getBusesByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportBuses).where(eq2(transportBuses.companyId, companyId)).orderBy(transportBuses.registration);
}
async function upsertBus(companyId, data) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db.update(transportBuses).set({ ...data, companyId, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq2(transportBuses.id, data.id), eq2(transportBuses.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportBuses).values({ ...data, companyId }).returning({ id: transportBuses.id });
    return result[0]?.id ?? 0;
  }
}
async function deleteBus(companyId, id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(transportBuses).where(and2(eq2(transportBuses.id, id), eq2(transportBuses.companyId, companyId)));
}
async function getTripsByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: transportTrips.id,
    companyId: transportTrips.companyId,
    busLineId: transportTrips.busLineId,
    departureDate: transportTrips.departureDate,
    departureTime: transportTrips.departureTime,
    priceXOF: transportTrips.priceXOF,
    priceGHS: transportTrips.priceGHS,
    totalSeats: transportTrips.totalSeats,
    active: transportTrips.active,
    createdAt: transportTrips.createdAt,
    departureCity: transportBusLines.departureCity,
    arrivalCity: transportBusLines.arrivalCity,
    lineType: transportBusLines.lineType
  }).from(transportTrips).leftJoin(transportBusLines, eq2(transportTrips.busLineId, transportBusLines.id)).where(eq2(transportTrips.companyId, companyId)).orderBy(desc2(transportTrips.departureDate));
}
async function getPublicTripsByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: transportTrips.id,
    companyId: transportTrips.companyId,
    busLineId: transportTrips.busLineId,
    departureDate: transportTrips.departureDate,
    departureTime: transportTrips.departureTime,
    priceXOF: transportTrips.priceXOF,
    priceGHS: transportTrips.priceGHS,
    totalSeats: transportTrips.totalSeats,
    departureCity: transportBusLines.departureCity,
    arrivalCity: transportBusLines.arrivalCity,
    lineType: transportBusLines.lineType
  }).from(transportTrips).leftJoin(transportBusLines, eq2(transportTrips.busLineId, transportBusLines.id)).where(and2(eq2(transportTrips.companyId, companyId), eq2(transportTrips.active, true))).orderBy(transportTrips.departureDate, transportTrips.departureTime);
}
async function getPublicTripsByCountry(countryId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: transportTrips.id,
    companyId: transportTrips.companyId,
    busLineId: transportTrips.busLineId,
    departureDate: transportTrips.departureDate,
    departureTime: transportTrips.departureTime,
    priceXOF: transportTrips.priceXOF,
    priceGHS: transportTrips.priceGHS,
    totalSeats: transportTrips.totalSeats,
    departureCity: transportBusLines.departureCity,
    arrivalCity: transportBusLines.arrivalCity,
    lineType: transportBusLines.lineType,
    companyName: transportCompanies.companyName,
    companyLogo: transportCompanies.logoUrl
  }).from(transportTrips).leftJoin(transportBusLines, eq2(transportTrips.busLineId, transportBusLines.id)).leftJoin(transportCompanies, eq2(transportTrips.companyId, transportCompanies.id)).where(
    and2(
      eq2(transportTrips.active, true),
      eq2(transportCompanies.status, "active"),
      eq2(transportBusLines.departureCountryId, countryId)
    )
  ).orderBy(transportTrips.departureDate, transportTrips.departureTime);
}
async function upsertTrip(companyId, data) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db.update(transportTrips).set({ ...data, departureDate: new Date(data.departureDate).toISOString().split("T")[0], companyId, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq2(transportTrips.id, data.id), eq2(transportTrips.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportTrips).values({ ...data, departureDate: new Date(data.departureDate).toISOString().split("T")[0], companyId }).returning({ id: transportTrips.id });
    return result[0]?.id ?? 0;
  }
}
async function getDeparturesByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: transportDepartures.id,
    companyId: transportDepartures.companyId,
    busLineId: transportDepartures.busLineId,
    busId: transportDepartures.busId,
    tripId: transportDepartures.tripId,
    departureDate: transportDepartures.departureDate,
    departureTime: transportDepartures.departureTime,
    driverName: transportDepartures.driverName,
    status: transportDepartures.status,
    notes: transportDepartures.notes,
    createdAt: transportDepartures.createdAt,
    departureCity: transportBusLines.departureCity,
    arrivalCity: transportBusLines.arrivalCity,
    busRegistration: transportBuses.registration,
    busCapacity: transportBuses.capacity
  }).from(transportDepartures).leftJoin(transportBusLines, eq2(transportDepartures.busLineId, transportBusLines.id)).leftJoin(transportBuses, eq2(transportDepartures.busId, transportBuses.id)).where(eq2(transportDepartures.companyId, companyId)).orderBy(desc2(transportDepartures.departureDate), desc2(transportDepartures.departureTime));
}
async function getDepartureById(id, companyId) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    id: transportDepartures.id,
    companyId: transportDepartures.companyId,
    busLineId: transportDepartures.busLineId,
    busId: transportDepartures.busId,
    tripId: transportDepartures.tripId,
    departureDate: transportDepartures.departureDate,
    departureTime: transportDepartures.departureTime,
    driverName: transportDepartures.driverName,
    status: transportDepartures.status,
    notes: transportDepartures.notes,
    createdAt: transportDepartures.createdAt,
    departureCity: transportBusLines.departureCity,
    arrivalCity: transportBusLines.arrivalCity,
    busRegistration: transportBuses.registration,
    busCapacity: transportBuses.capacity
  }).from(transportDepartures).leftJoin(transportBusLines, eq2(transportDepartures.busLineId, transportBusLines.id)).leftJoin(transportBuses, eq2(transportDepartures.busId, transportBuses.id)).where(and2(eq2(transportDepartures.id, id), eq2(transportDepartures.companyId, companyId))).limit(1);
  return rows[0] ?? null;
}
async function upsertDeparture(companyId, data) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db.update(transportDepartures).set({ ...data, departureDate: new Date(data.departureDate).toISOString().split("T")[0], companyId, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq2(transportDepartures.id, data.id), eq2(transportDepartures.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportDepartures).values({ ...data, departureDate: new Date(data.departureDate).toISOString().split("T")[0], companyId }).returning({ id: transportDepartures.id });
    return result[0]?.id ?? 0;
  }
}
async function updateDepartureStatus(companyId, id, status) {
  const db = await getDb();
  if (!db) return;
  await db.update(transportDepartures).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq2(transportDepartures.id, id), eq2(transportDepartures.companyId, companyId)));
}
function generateTicketNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "TK-";
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}
async function getTicketsByDeparture(companyId, departureId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportTickets).where(
    and2(
      eq2(transportTickets.companyId, companyId),
      eq2(transportTickets.departureId, departureId)
    )
  ).orderBy(transportTickets.seatNumber);
}
async function getTicketsByCompany(companyId, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: transportTickets.id,
    ticketNumber: transportTickets.ticketNumber,
    departureId: transportTickets.departureId,
    seatNumber: transportTickets.seatNumber,
    firstName: transportTickets.firstName,
    lastName: transportTickets.lastName,
    phone: transportTickets.phone,
    dropOffCity: transportTickets.dropOffCity,
    priceXOF: transportTickets.priceXOF,
    paymentMethod: transportTickets.paymentMethod,
    ticketStatus: transportTickets.ticketStatus,
    cashStatus: transportTickets.cashStatus,
    boardingStatus: transportTickets.boardingStatus,
    createdAt: transportTickets.createdAt,
    departureDate: transportDepartures.departureDate,
    departureTime: transportDepartures.departureTime,
    departureCity: transportBusLines.departureCity,
    arrivalCity: transportBusLines.arrivalCity
  }).from(transportTickets).leftJoin(transportDepartures, eq2(transportTickets.departureId, transportDepartures.id)).leftJoin(transportBusLines, eq2(transportDepartures.busLineId, transportBusLines.id)).where(eq2(transportTickets.companyId, companyId)).orderBy(desc2(transportTickets.createdAt)).limit(limit);
}
async function createTicket(companyId, data) {
  const db = await getDb();
  if (!db) return "";
  const ticketNumber = generateTicketNumber();
  await db.insert(transportTickets).values({ ...data, companyId, ticketNumber });
  await debitCredit(companyId, `Billet ${ticketNumber} \u2014 ${data.firstName ?? ""} ${data.lastName ?? ""}`, "ticket", ticketNumber).catch(() => {
  });
  return ticketNumber;
}
async function updateTicketStatus(companyId, ticketId, updates) {
  const db = await getDb();
  if (!db) return;
  await db.update(transportTickets).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq2(transportTickets.id, ticketId), eq2(transportTickets.companyId, companyId)));
}
async function verifyTicketByNumber(ticketNumber) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    id: transportTickets.id,
    ticketNumber: transportTickets.ticketNumber,
    seatNumber: transportTickets.seatNumber,
    firstName: transportTickets.firstName,
    lastName: transportTickets.lastName,
    idType: transportTickets.idType,
    idNumber: transportTickets.idNumber,
    gender: transportTickets.gender,
    nationality: transportTickets.nationality,
    dropOffCity: transportTickets.dropOffCity,
    ticketStatus: transportTickets.ticketStatus,
    boardingStatus: transportTickets.boardingStatus,
    departureDate: transportDepartures.departureDate,
    departureTime: transportDepartures.departureTime,
    departureCity: transportBusLines.departureCity,
    arrivalCity: transportBusLines.arrivalCity,
    companyName: transportCompanies.companyName
  }).from(transportTickets).leftJoin(transportDepartures, eq2(transportTickets.departureId, transportDepartures.id)).leftJoin(transportBusLines, eq2(transportDepartures.busLineId, transportBusLines.id)).leftJoin(transportCompanies, eq2(transportTickets.companyId, transportCompanies.id)).where(eq2(transportTickets.ticketNumber, ticketNumber)).limit(1);
  return rows[0] ?? null;
}
function generateBookingRef() {
  return "BK-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}
async function getBookingsByCompany(companyId, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: transportBookings.id,
    bookingRef: transportBookings.bookingRef,
    tripId: transportBookings.tripId,
    seatNumber: transportBookings.seatNumber,
    firstName: transportBookings.firstName,
    lastName: transportBookings.lastName,
    phone: transportBookings.phone,
    email: transportBookings.email,
    priceXOF: transportBookings.priceXOF,
    status: transportBookings.status,
    cashStatus: transportBookings.cashStatus,
    createdAt: transportBookings.createdAt,
    departureDate: transportTrips.departureDate,
    departureTime: transportTrips.departureTime,
    departureCity: transportBusLines.departureCity,
    arrivalCity: transportBusLines.arrivalCity
  }).from(transportBookings).leftJoin(transportTrips, eq2(transportBookings.tripId, transportTrips.id)).leftJoin(transportBusLines, eq2(transportTrips.busLineId, transportBusLines.id)).where(eq2(transportBookings.companyId, companyId)).orderBy(desc2(transportBookings.createdAt)).limit(limit);
}
async function createBooking(companyId, data) {
  const db = await getDb();
  if (!db) return "";
  const bookingRef = generateBookingRef();
  await db.insert(transportBookings).values({ ...data, companyId, bookingRef });
  await debitCredit(companyId, `R\xE9servation ${bookingRef} \u2014 ${data.firstName ?? ""} ${data.lastName ?? ""}`, "booking", bookingRef).catch(() => {
  });
  return bookingRef;
}
async function updateBookingStatus(companyId, bookingId, status) {
  const db = await getDb();
  if (!db) return;
  await db.update(transportBookings).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq2(transportBookings.id, bookingId), eq2(transportBookings.companyId, companyId)));
}
async function getOccupiedSeatsByTrip(tripId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ seatNumber: transportBookings.seatNumber }).from(transportBookings).where(
    and2(
      eq2(transportBookings.tripId, tripId),
      sql2`${transportBookings.status} != 'annule'`
    )
  );
  return rows.map((r) => r.seatNumber);
}
async function getOccupiedSeatsByDeparture(departureId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ seatNumber: transportTickets.seatNumber }).from(transportTickets).where(
    and2(
      eq2(transportTickets.departureId, departureId),
      sql2`${transportTickets.ticketStatus} != 'annule'`
    )
  );
  return rows.map((r) => r.seatNumber);
}
function generateTrackingNumber() {
  return "EXP-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 4).toUpperCase();
}
async function getShipmentsByCompany(companyId, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportShipments).where(eq2(transportShipments.companyId, companyId)).orderBy(desc2(transportShipments.createdAt)).limit(limit);
}
async function createShipment(companyId, data) {
  const db = await getDb();
  if (!db) return "";
  const trackingNumber = generateTrackingNumber();
  await db.insert(transportShipments).values({ ...data, companyId, trackingNumber });
  await debitCredit(companyId, `Colis ${trackingNumber} \u2014 ${data.senderName ?? ""} \u2192 ${data.receiverName ?? ""}`, "shipment", trackingNumber).catch(() => {
  });
  return trackingNumber;
}
async function updateShipmentStatus(companyId, shipmentId, status, cashStatus) {
  const db = await getDb();
  if (!db) return;
  const updates = { status, updatedAt: /* @__PURE__ */ new Date() };
  if (cashStatus) updates.cashStatus = cashStatus;
  await db.update(transportShipments).set(updates).where(and2(eq2(transportShipments.id, shipmentId), eq2(transportShipments.companyId, companyId)));
}
async function trackShipment(trackingNumber) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    id: transportShipments.id,
    trackingNumber: transportShipments.trackingNumber,
    senderName: transportShipments.senderName,
    senderCity: transportShipments.senderCity,
    receiverName: transportShipments.receiverName,
    receiverPhone: transportShipments.receiverPhone,
    receiverCity: transportShipments.receiverCity,
    description: transportShipments.description,
    weight: transportShipments.weight,
    status: transportShipments.status,
    createdAt: transportShipments.createdAt,
    updatedAt: transportShipments.updatedAt,
    companyName: transportCompanies.companyName
  }).from(transportShipments).leftJoin(transportCompanies, eq2(transportShipments.companyId, transportCompanies.id)).where(eq2(transportShipments.trackingNumber, trackingNumber)).limit(1);
  return rows[0] ?? null;
}
async function getStaffByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportStaff).where(and2(eq2(transportStaff.companyId, companyId), eq2(transportStaff.active, true))).orderBy(transportStaff.lastName);
}
async function upsertStaff(companyId, data) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db.update(transportStaff).set({ ...data, companyId, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq2(transportStaff.id, data.id), eq2(transportStaff.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportStaff).values({ ...data, companyId }).returning({ id: transportStaff.id });
    return result[0]?.id ?? 0;
  }
}
async function getStationsByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportStations).where(and2(eq2(transportStations.companyId, companyId), eq2(transportStations.active, true)));
}
async function upsertStation(companyId, data) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db.update(transportStations).set({ ...data, companyId }).where(and2(eq2(transportStations.id, data.id), eq2(transportStations.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportStations).values({ ...data, companyId }).returning({ id: transportStations.id });
    return result[0]?.id ?? 0;
  }
}
async function getChargesByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportCharges).where(eq2(transportCharges.companyId, companyId)).orderBy(desc2(transportCharges.chargeDate));
}
async function createCharge(companyId, data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(transportCharges).values({
    companyId,
    category: data.category,
    description: data.description,
    amount: data.amount,
    station: data.station,
    chargeDate: new Date(data.chargeDate).toISOString().split("T")[0]
  });
}
async function getRouteFaresByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportRouteFares).where(eq2(transportRouteFares.companyId, companyId));
}
async function upsertRouteFare(companyId, data) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    await db.update(transportRouteFares).set({ ...data, companyId, updatedAt: /* @__PURE__ */ new Date() }).where(and2(eq2(transportRouteFares.id, data.id), eq2(transportRouteFares.companyId, companyId)));
  } else {
    await db.insert(transportRouteFares).values({ ...data, companyId });
  }
}
async function getBillingByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportCompanyBilling).where(eq2(transportCompanyBilling.companyId, companyId)).orderBy(desc2(transportCompanyBilling.billingPeriod));
}
async function getAllBilling() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: transportCompanyBilling.id,
    companyId: transportCompanyBilling.companyId,
    billingPeriod: transportCompanyBilling.billingPeriod,
    ticketsSold: transportCompanyBilling.ticketsSold,
    ticketsCashed: transportCompanyBilling.ticketsCashed,
    shipmentsCashed: transportCompanyBilling.shipmentsCashed,
    ticketFeeXOF: transportCompanyBilling.ticketFeeXOF,
    shipmentFeeXOF: transportCompanyBilling.shipmentFeeXOF,
    totalFeeXOF: transportCompanyBilling.totalFeeXOF,
    status: transportCompanyBilling.status,
    generatedAt: transportCompanyBilling.generatedAt,
    paidAt: transportCompanyBilling.paidAt,
    companyName: transportCompanies.companyName
  }).from(transportCompanyBilling).leftJoin(transportCompanies, eq2(transportCompanyBilling.companyId, transportCompanies.id)).orderBy(desc2(transportCompanyBilling.billingPeriod));
}
async function generateMonthlyBilling(companyId, period) {
  const db = await getDb();
  if (!db) return null;
  const [year, month] = period.split("-").map(Number);
  const startDate = `${period}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];
  const ticketRows = await db.select({
    count: sql2`count(*)`,
    cashed: sql2`SUM(CASE WHEN ${transportTickets.cashStatus} = 'encaisse' THEN 1 ELSE 0 END)`
  }).from(transportTickets).where(
    and2(
      eq2(transportTickets.companyId, companyId),
      sql2`DATE(${transportTickets.createdAt}) BETWEEN ${startDate} AND ${endDate}`,
      sql2`${transportTickets.ticketStatus} != 'annule'`
    )
  );
  const ticketsSold = Number(ticketRows[0]?.count ?? 0);
  const ticketsCashed = Number(ticketRows[0]?.cashed ?? 0);
  const shipmentRows = await db.select({ count: sql2`count(*)` }).from(transportShipments).where(
    and2(
      eq2(transportShipments.companyId, companyId),
      eq2(transportShipments.cashStatus, "encaisse"),
      sql2`DATE(${transportShipments.updatedAt}) BETWEEN ${startDate} AND ${endDate}`
    )
  );
  const shipmentsCashed = Number(shipmentRows[0]?.count ?? 0);
  const ticketFeeXOF = (ticketsSold * 200).toFixed(2);
  const shipmentFeeXOF = (shipmentsCashed * 100).toFixed(2);
  const totalFeeXOF = (ticketsSold * 200 + shipmentsCashed * 100).toFixed(2);
  const existing = await db.select({ id: transportCompanyBilling.id }).from(transportCompanyBilling).where(
    and2(
      eq2(transportCompanyBilling.companyId, companyId),
      eq2(transportCompanyBilling.billingPeriod, period)
    )
  ).limit(1);
  if (existing.length > 0) {
    await db.update(transportCompanyBilling).set({ ticketsSold, ticketsCashed, shipmentsCashed, ticketFeeXOF, shipmentFeeXOF, totalFeeXOF }).where(eq2(transportCompanyBilling.id, existing[0].id));
  } else {
    await db.insert(transportCompanyBilling).values({
      companyId,
      billingPeriod: period,
      ticketsSold,
      ticketsCashed,
      shipmentsCashed,
      ticketFeeXOF,
      shipmentFeeXOF,
      totalFeeXOF,
      status: "en_attente"
    });
  }
  return { ticketsSold, ticketsCashed, shipmentsCashed, ticketFeeXOF, shipmentFeeXOF, totalFeeXOF };
}
async function updateBillingStatus(billingId, status) {
  const db = await getDb();
  if (!db) return;
  await db.update(transportCompanyBilling).set({ status, paidAt: status === "paye" ? /* @__PURE__ */ new Date() : null }).where(eq2(transportCompanyBilling.id, billingId));
}
async function getCompanyDashboardStats(companyId) {
  const db = await getDb();
  if (!db) return { ticketsSoldToday: 0, ticketsRevenueToday: 0, shipmentsToday: 0, shipmentsRevenueToday: 0, departuresToday: 0, pendingBookings: 0 };
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const [ticketStats, shipmentStats, departureStats, bookingStats] = await Promise.all([
    db.select({ count: sql2`count(*)`, revenue: sql2`COALESCE(SUM(${transportTickets.priceXOF}), 0)` }).from(transportTickets).where(
      and2(
        eq2(transportTickets.companyId, companyId),
        sql2`DATE(${transportTickets.createdAt}) = ${today}`,
        sql2`${transportTickets.ticketStatus} != 'annule'`
      )
    ),
    db.select({ count: sql2`count(*)`, revenue: sql2`COALESCE(SUM(${transportShipments.priceXOF}), 0)` }).from(transportShipments).where(
      and2(
        eq2(transportShipments.companyId, companyId),
        sql2`DATE(${transportShipments.createdAt}) = ${today}`
      )
    ),
    db.select({ count: sql2`count(*)` }).from(transportDepartures).where(
      and2(
        eq2(transportDepartures.companyId, companyId),
        sql2`${transportDepartures.departureDate} = ${today}`
      )
    ),
    db.select({ count: sql2`count(*)` }).from(transportBookings).where(
      and2(
        eq2(transportBookings.companyId, companyId),
        eq2(transportBookings.status, "en_attente")
      )
    )
  ]);
  return {
    ticketsSoldToday: Number(ticketStats[0]?.count ?? 0),
    ticketsRevenueToday: Number(ticketStats[0]?.revenue ?? 0),
    shipmentsToday: Number(shipmentStats[0]?.count ?? 0),
    shipmentsRevenueToday: Number(shipmentStats[0]?.revenue ?? 0),
    departuresToday: Number(departureStats[0]?.count ?? 0),
    pendingBookings: Number(bookingStats[0]?.count ?? 0)
  };
}
async function getCsnDashboardStats() {
  const db = await getDb();
  if (!db) return { totalCompanies: 0, activeCompanies: 0, pendingCompanies: 0, ticketsToday: 0, shipmentsToday: 0, pendingBillingXOF: 0 };
  const [companyStats, ticketStats, shipmentStats, billingStats, orderStats] = await Promise.all([
    db.select({
      total: sql2`count(*)`,
      active: sql2`SUM(CASE WHEN ${transportCompanies.status} = 'active' THEN 1 ELSE 0 END)`,
      pending: sql2`SUM(CASE WHEN ${transportCompanies.status} = 'pending' THEN 1 ELSE 0 END)`
    }).from(transportCompanies),
    db.select({ count: sql2`count(*)` }).from(transportTickets).where(sql2`DATE(${transportTickets.createdAt}) = CURDATE()`),
    db.select({ count: sql2`count(*)` }).from(transportShipments).where(sql2`DATE(${transportShipments.createdAt}) = CURDATE()`),
    db.select({ total: sql2`COALESCE(SUM(${transportCompanyBilling.totalFeeXOF}), 0)` }).from(transportCompanyBilling).where(eq2(transportCompanyBilling.status, "en_attente")),
    db.select({
      count: sql2`count(*)`,
      revenue: sql2`COALESCE(SUM(${onlineOrders.totalXOF}), 0)`
    }).from(onlineOrders).where(sql2`DATE(${onlineOrders.createdAt}) = CURDATE()`)
  ]);
  return {
    totalCompanies: Number(companyStats[0]?.total ?? 0),
    activeCompanies: Number(companyStats[0]?.active ?? 0),
    pendingCompanies: Number(companyStats[0]?.pending ?? 0),
    ticketsToday: Number(ticketStats[0]?.count ?? 0),
    shipmentsToday: Number(shipmentStats[0]?.count ?? 0),
    pendingBillingXOF: Number(billingStats[0]?.total ?? 0),
    ordersToday: Number(orderStats[0]?.count ?? 0),
    orderRevenueToday: Number(orderStats[0]?.revenue ?? 0)
  };
}
async function getCompaniesByCountry(countryId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: transportCompanies.id,
    companyName: transportCompanies.companyName,
    logoUrl: transportCompanies.logoUrl,
    countryId: transportCompanies.countryId,
    cityId: transportCompanies.cityId,
    description: transportCompanies.description
  }).from(transportCompanies).where(
    and2(
      eq2(transportCompanies.status, "active"),
      eq2(transportCompanies.countryId, countryId)
    )
  ).orderBy(transportCompanies.companyName);
}
async function searchPublicTrips(params) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq2(transportCompanies.status, "active"),
    eq2(transportTrips.active, true)
  ];
  if (params.countryId) {
    conditions.push(eq2(transportBusLines.departureCountryId, params.countryId));
  }
  if (params.companyId) {
    conditions.push(eq2(transportTrips.companyId, params.companyId));
  }
  if (params.departureCity) {
    conditions.push(sql2`LOWER(${transportBusLines.departureCity}) LIKE LOWER(${"%" + params.departureCity + "%"})`);
  }
  if (params.arrivalCity) {
    conditions.push(sql2`LOWER(${transportBusLines.arrivalCity}) LIKE LOWER(${"%" + params.arrivalCity + "%"})`);
  }
  if (params.date) {
    conditions.push(sql2`DATE(${transportTrips.departureDate}) = ${params.date}`);
  }
  const rows = await db.select({
    id: transportTrips.id,
    companyId: transportTrips.companyId,
    companyName: transportCompanies.companyName,
    logoUrl: transportCompanies.logoUrl,
    departureCity: transportBusLines.departureCity,
    arrivalCity: transportBusLines.arrivalCity,
    lineType: transportBusLines.lineType,
    departureDate: transportTrips.departureDate,
    departureTime: transportTrips.departureTime,
    priceXOF: transportTrips.priceXOF,
    totalSeats: transportTrips.totalSeats
  }).from(transportTrips).leftJoin(transportBusLines, eq2(transportTrips.busLineId, transportBusLines.id)).leftJoin(transportCompanies, eq2(transportTrips.companyId, transportCompanies.id)).where(and2(...conditions)).orderBy(transportTrips.departureDate, transportTrips.departureTime);
  if (rows.length === 0) return [];
  const tripIds = rows.map((r) => r.id);
  const occupiedCounts = await db.select({
    tripId: transportBookings.tripId,
    count: sql2`COUNT(*)`
  }).from(transportBookings).where(
    and2(
      sql2`${transportBookings.tripId} IN (${sql2.join(tripIds.map((id) => sql2`${id}`), sql2`, `)})`,
      sql2`${transportBookings.status} IN ('en_attente', 'confirme')`
    )
  ).groupBy(transportBookings.tripId);
  const occupiedMap = new Map(occupiedCounts.map((r) => [r.tripId, Number(r.count)]));
  return rows.map((r) => ({
    ...r,
    availableSeats: Math.max(0, r.totalSeats - (occupiedMap.get(r.id) ?? 0))
  }));
}
async function createPublicBooking(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select({ id: transportBookings.id }).from(transportBookings).where(
    and2(
      eq2(transportBookings.tripId, data.tripId),
      eq2(transportBookings.seatNumber, data.seatNumber),
      sql2`${transportBookings.status} IN ('en_attente', 'confirme')`
    )
  ).limit(1);
  if (existing.length > 0) {
    throw new Error("Ce si\xE8ge est d\xE9j\xE0 r\xE9serv\xE9. Veuillez en choisir un autre.");
  }
  const trip = await db.select({ priceXOF: transportTrips.priceXOF, companyId: transportTrips.companyId }).from(transportTrips).where(eq2(transportTrips.id, data.tripId)).limit(1);
  if (!trip[0]) throw new Error("D\xE9part introuvable.");
  const bookingRef = generateBookingRef();
  await db.insert(transportBookings).values({
    companyId: trip[0].companyId,
    tripId: data.tripId,
    seatNumber: data.seatNumber,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    email: data.email,
    priceXOF: trip[0].priceXOF ?? void 0,
    bookingRef,
    status: "en_attente"
  });
  return { bookingRef };
}
async function getGalleryByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyGallery).where(eq2(companyGallery.companyId, companyId)).orderBy(companyGallery.displayOrder, companyGallery.createdAt);
}
async function addGalleryImage(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(companyGallery).values({
    companyId: data.companyId,
    imageUrl: data.imageUrl,
    caption: data.caption ?? null,
    displayOrder: data.displayOrder ?? 0
  });
  return { success: true };
}
async function deleteGalleryImage(imageId, companyId) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(companyGallery).where(and2(eq2(companyGallery.id, imageId), eq2(companyGallery.companyId, companyId)));
  return { success: true };
}
async function getReviewsByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyReviews).where(eq2(companyReviews.companyId, companyId)).orderBy(desc2(companyReviews.createdAt));
}
async function createCompanyReview(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(companyReviews).values({
    companyId: data.companyId,
    authorName: data.authorName,
    rating: Math.min(5, Math.max(1, data.rating)),
    comment: data.comment ?? null,
    activityType: data.activityType
  });
  return { success: true };
}
async function getAverageRating(companyId) {
  const db = await getDb();
  if (!db) return { avg: 0, count: 0 };
  const rows = await db.select({
    avg: sql2`AVG(${companyReviews.rating})`,
    count: sql2`COUNT(*)`
  }).from(companyReviews).where(eq2(companyReviews.companyId, companyId));
  return { avg: Number(rows[0]?.avg ?? 0), count: Number(rows[0]?.count ?? 0) };
}
async function getAllActiveCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportCompanies).where(eq2(transportCompanies.status, "active")).orderBy(transportCompanies.companyName);
}
function getCountryCurrency(countryCode) {
  return COUNTRY_CURRENCY[countryCode] ?? COUNTRY_CURRENCY["CI"];
}
async function getCompanyCredits(companyId) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(companyCredits).where(eq2(companyCredits.companyId, companyId));
  if (rows.length > 0) return rows[0];
  await db.insert(companyCredits).values({ companyId, balance: 0, countryCode: "CI", currency: "XOF", pointPriceLocal: "125.00" });
  const created = await db.select().from(companyCredits).where(eq2(companyCredits.companyId, companyId));
  return created[0] ?? null;
}
async function addCredits(companyId, points, amountLocal, description) {
  const db = await getDb();
  if (!db) return null;
  const current = await getCompanyCredits(companyId);
  if (!current) return null;
  const newBalance = current.balance + points;
  await db.update(companyCredits).set({ balance: newBalance }).where(eq2(companyCredits.companyId, companyId));
  await db.insert(creditTransactions).values({
    companyId,
    type: "credit",
    points,
    amountLocal: String(amountLocal),
    description,
    refType: "purchase",
    refId: null,
    balanceAfter: newBalance
  });
  return newBalance;
}
async function debitCredit(companyId, description, refType, refId) {
  const db = await getDb();
  if (!db) return { success: false, balance: 0, insufficient: false };
  const current = await getCompanyCredits(companyId);
  if (!current) return { success: false, balance: 0, insufficient: false };
  if (current.balance <= 0) return { success: false, balance: current.balance, insufficient: true };
  const newBalance = current.balance - 1;
  await db.update(companyCredits).set({ balance: newBalance }).where(eq2(companyCredits.companyId, companyId));
  await db.insert(creditTransactions).values({
    companyId,
    type: "debit",
    points: 1,
    amountLocal: null,
    description,
    refType,
    refId,
    balanceAfter: newBalance
  });
  if (newBalance < 5) {
    const company = await db.select({ companyName: transportCompanies.companyName, email: transportCompanies.email }).from(transportCompanies).where(eq2(transportCompanies.id, companyId)).limit(1);
    const name = company[0]?.companyName ?? `Compagnie #${companyId}`;
    const email = company[0]?.email ?? "non renseign\xE9";
    notifyOwner({
      title: `\u26A0\uFE0F Solde critique \u2014 ${name}`,
      content: `La compagnie **${name}** (ID: ${companyId}) ne dispose plus que de **${newBalance} cr\xE9dit(s)** NEXUS.

Si le solde atteint 0, les nouvelles transactions seront bloqu\xE9es.

Contact : ${email}`
    }).catch(() => {
    });
  }
  return { success: true, balance: newBalance, insufficient: false };
}
async function getCreditTransactions(companyId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions).where(eq2(creditTransactions.companyId, companyId)).orderBy(desc2(creditTransactions.createdAt)).limit(limit);
}
async function getAllCreditsStats() {
  const db = await getDb();
  if (!db) return [];
  const companies = await db.select({
    id: transportCompanies.id,
    companyName: transportCompanies.companyName,
    email: transportCompanies.email,
    activityType: transportCompanies.activityType,
    status: transportCompanies.status
  }).from(transportCompanies).orderBy(transportCompanies.companyName);
  const results = await Promise.all(
    companies.map(async (c) => {
      const credits = await db.select().from(companyCredits).where(eq2(companyCredits.companyId, c.id)).limit(1);
      const balance = credits[0]?.balance ?? 0;
      const currency = credits[0]?.currency ?? "XOF";
      const bought = await db.select({ total: sql2`COALESCE(SUM(${creditTransactions.points}), 0)` }).from(creditTransactions).where(and2(eq2(creditTransactions.companyId, c.id), eq2(creditTransactions.type, "credit")));
      const totalBought = Number(bought[0]?.total ?? 0);
      const spent = await db.select({ total: sql2`COALESCE(SUM(${creditTransactions.points}), 0)` }).from(creditTransactions).where(and2(eq2(creditTransactions.companyId, c.id), eq2(creditTransactions.type, "debit")));
      const totalSpent = Number(spent[0]?.total ?? 0);
      const revenue = await db.select({ total: sql2`COALESCE(SUM(${creditTransactions.amountLocal}), 0)` }).from(creditTransactions).where(and2(eq2(creditTransactions.companyId, c.id), eq2(creditTransactions.type, "credit")));
      const totalRevenue = Number(revenue[0]?.total ?? 0);
      const lastTx = await db.select({ createdAt: creditTransactions.createdAt }).from(creditTransactions).where(eq2(creditTransactions.companyId, c.id)).orderBy(desc2(creditTransactions.createdAt)).limit(1);
      return {
        ...c,
        balance,
        currency,
        totalBought,
        totalSpent,
        totalRevenue,
        lastActivity: lastTx[0]?.createdAt ?? null
      };
    })
  );
  return results;
}
async function createCreditRequest(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(creditRequests).values({
    companyId: data.companyId,
    points: data.points,
    amountLocal: String(data.amountLocal),
    currency: data.currency,
    paymentMethod: data.paymentMethod,
    paymentPhone: data.paymentPhone ?? null,
    paymentOperator: data.paymentOperator ?? null,
    paymentRef: data.paymentRef ?? null,
    notes: data.notes ?? null,
    status: "pending"
  });
  const id = result[0]?.id ?? 0;
  const company = await getCompanyById(data.companyId);
  notifyOwner({
    title: `\u{1F4B3} Nouvelle demande de cr\xE9dit \u2014 ${company?.companyName ?? `#${data.companyId}`}`,
    content: `**${company?.companyName ?? "Compagnie"}** demande **${data.points} points** (${data.amountLocal.toLocaleString()} ${data.currency}) via **${data.paymentMethod}**.

R\xE9f\xE9rence paiement : ${data.paymentRef ?? "non renseign\xE9e"}
T\xE9l\xE9phone : ${data.paymentPhone ?? "non renseign\xE9"}`
  }).catch(() => {
  });
  return id;
}
async function getAllCreditRequests(status) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: creditRequests.id,
    companyId: creditRequests.companyId,
    points: creditRequests.points,
    amountLocal: creditRequests.amountLocal,
    currency: creditRequests.currency,
    paymentMethod: creditRequests.paymentMethod,
    paymentPhone: creditRequests.paymentPhone,
    paymentOperator: creditRequests.paymentOperator,
    paymentRef: creditRequests.paymentRef,
    status: creditRequests.status,
    rejectionReason: creditRequests.rejectionReason,
    paymentConfirmedAt: creditRequests.paymentConfirmedAt,
    creditedAt: creditRequests.creditedAt,
    validatedBy: creditRequests.validatedBy,
    notes: creditRequests.notes,
    createdAt: creditRequests.createdAt,
    updatedAt: creditRequests.updatedAt,
    companyName: transportCompanies.companyName,
    companyEmail: transportCompanies.email,
    companyPhone: transportCompanies.phone
  }).from(creditRequests).leftJoin(transportCompanies, eq2(creditRequests.companyId, transportCompanies.id)).orderBy(desc2(creditRequests.createdAt));
  if (status) return rows.filter((r) => r.status === status);
  return rows;
}
async function getCreditRequestsByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditRequests).where(eq2(creditRequests.companyId, companyId)).orderBy(desc2(creditRequests.createdAt));
}
async function confirmCreditRequestPayment(requestId, validatedBy) {
  const db = await getDb();
  if (!db) return null;
  await db.update(creditRequests).set({
    status: "payment_confirmed",
    paymentConfirmedAt: /* @__PURE__ */ new Date(),
    validatedBy,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq2(creditRequests.id, requestId));
  const rows = await db.select().from(creditRequests).where(eq2(creditRequests.id, requestId)).limit(1);
  const req = rows[0];
  if (!req) return null;
  const newBalance = await addCredits(
    req.companyId,
    req.points,
    Number(req.amountLocal),
    `Achat de ${req.points} point(s) \u2014 paiement ${req.paymentMethod} confirm\xE9 (r\xE9f: ${req.paymentRef ?? "N/A"})`
  );
  await db.update(creditRequests).set({ status: "credited", creditedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq2(creditRequests.id, requestId));
  const company = await getCompanyById(req.companyId);
  notifyOwner({
    title: `\u2705 Cr\xE9dit valid\xE9 \u2014 ${company?.companyName ?? `#${req.companyId}`}`,
    content: `**${req.points} points** ont \xE9t\xE9 cr\xE9dit\xE9s sur le compte de **${company?.companyName ?? "la compagnie"}**.
Nouveau solde : **${newBalance} points**`
  }).catch(() => {
  });
  return { success: true, newBalance, requestId };
}
async function rejectCreditRequest(requestId, validatedBy, reason) {
  const db = await getDb();
  if (!db) return null;
  await db.update(creditRequests).set({
    status: "rejected",
    rejectionReason: reason,
    validatedBy,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq2(creditRequests.id, requestId));
  return { success: true };
}
async function autoValidateMobileMoneyPayment(requestId, paymentRef, operator) {
  const db = await getDb();
  if (!db) return null;
  await db.update(creditRequests).set({ paymentRef, paymentOperator: operator, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(creditRequests.id, requestId));
  return confirmCreditRequestPayment(requestId, "syst\xE8me_mobile_money");
}
async function getCreditRequestByHub2PurchaseRef(purchaseRef) {
  const db = await getDb();
  if (!db) return null;
  const match = purchaseRef.match(/^NEXUS-CR-(\d+)-/);
  if (!match) return null;
  const requestId = parseInt(match[1], 10);
  if (isNaN(requestId)) return null;
  const rows = await db.select().from(creditRequests).where(eq2(creditRequests.id, requestId)).limit(1);
  return rows[0] ?? null;
}
async function saveHub2PaymentIntent(requestId, hub2IntentId, hub2PurchaseRef, hub2Token) {
  const db = await getDb();
  if (!db) return null;
  await db.update(creditRequests).set({
    cinetpayTransactionId: hub2IntentId,
    cinetpayPaymentToken: hub2Token,
    cinetpayPaymentUrl: hub2PurchaseRef,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq2(creditRequests.id, requestId));
  return { success: true };
}
async function adminCreditCompany(companyId, points, motif, reference, adminEmail) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const current = await getCompanyCredits(companyId);
  if (!current) throw new Error("Compagnie introuvable ou cr\xE9dits non initialis\xE9s");
  const company = await getCompanyById(companyId);
  const companyName = company?.companyName ?? `Compagnie #${companyId}`;
  const balanceBefore = current.balance;
  const newBalance = balanceBefore + points;
  await db.update(companyCredits).set({ balance: newBalance }).where(eq2(companyCredits.companyId, companyId));
  await db.insert(creditTransactions).values({
    companyId,
    type: "credit",
    points,
    amountLocal: null,
    description: `Cr\xE9dit manuel NEXUS \u2014 ${motif}`,
    refType: "manual_admin",
    refId: reference ?? null,
    balanceBefore,
    balanceAfter: newBalance,
    reference: reference ?? null,
    adminNote: `Cr\xE9dit\xE9 par ${adminEmail} \u2014 ${motif}`
  });
  await notifyOwner({
    title: `Cr\xE9dit manuel NEXUS \u2014 ${companyName}`,
    content: `L'admin ${adminEmail} a cr\xE9dit\xE9 ${points} point(s) \xE0 "${companyName}".
Motif : ${motif}
R\xE9f\xE9rence : ${reference ?? "\u2014"}
Solde avant : ${balanceBefore} pts \u2192 Solde apr\xE8s : ${newBalance} pts`
  });
  return { success: true, newBalance, balanceBefore, companyName };
}
async function getTrendingData(days = 30) {
  const db = await getDb();
  if (!db) return [];
  const dataResult = await db.execute(sql2`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as tickets,
      COALESCE(SUM(CASE WHEN status = 'confirmed' THEN price_xof ELSE 0 END), 0) as revenue
    FROM transport_tickets
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `);
  return (dataResult.rows ?? []).map((row) => ({
    date: row.date,
    tickets: Number(row.tickets ?? 0),
    revenue: Number(row.revenue ?? 0)
  }));
}
async function getCompaniesDetailedStats() {
  const db = await getDb();
  if (!db) return [];
  const companies = await db.select({
    id: transportCompanies.id,
    companyName: transportCompanies.companyName,
    status: transportCompanies.status,
    createdAt: transportCompanies.createdAt
  }).from(transportCompanies).orderBy(desc2(transportCompanies.createdAt));
  const stats = await Promise.all(
    companies.map(async (company) => {
      const ticketStats = await db.select({
        count: sql2`COUNT(*)`,
        revenue: sql2`COALESCE(SUM(${transportTickets.priceXOF}), 0)`
      }).from(transportTickets).where(eq2(transportTickets.companyId, company.id));
      const shipmentStats = await db.select({
        count: sql2`COUNT(*)`,
        revenue: sql2`COALESCE(SUM(${transportShipments.priceXOF}), 0)`
      }).from(transportShipments).where(eq2(transportShipments.companyId, company.id));
      const totalRevenue = (Number(ticketStats[0]?.revenue ?? 0) || 0) + (Number(shipmentStats[0]?.revenue ?? 0) || 0);
      const totalTransactions = (Number(ticketStats[0]?.count ?? 0) || 0) + (Number(shipmentStats[0]?.count ?? 0) || 0);
      return {
        id: company.id,
        companyName: company.companyName,
        status: company.status,
        tickets: Number(ticketStats[0]?.count ?? 0),
        shipments: Number(shipmentStats[0]?.count ?? 0),
        totalTransactions,
        totalRevenue,
        activityRate: totalTransactions > 0 ? (totalTransactions / 30 * 100).toFixed(1) : "0",
        createdAt: company.createdAt
      };
    })
  );
  return stats;
}
async function createQuoteRequest(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(quoteRequests).values({
    ...data,
    status: "new",
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  });
  return result;
}
async function getQuoteRequests(filters) {
  const db = await getDb();
  if (!db) return [];
  let query = db.select().from(quoteRequests);
  if (filters?.status) {
    query = query.where(eq2(quoteRequests.status, filters.status));
  }
  if (filters?.activityType) {
    query = query.where(eq2(quoteRequests.activityType, filters.activityType));
  }
  return query.orderBy(desc2(quoteRequests.createdAt));
}
async function updateQuoteRequestStatus(id, status, notes) {
  const db = await getDb();
  if (!db) return null;
  const updateData = {
    status,
    updatedAt: /* @__PURE__ */ new Date()
  };
  if (status === "contacted") {
    updateData.contactedAt = /* @__PURE__ */ new Date();
  } else if (status === "closed") {
    updateData.closedAt = /* @__PURE__ */ new Date();
  }
  if (notes) {
    updateData.notes = notes;
  }
  await db.update(quoteRequests).set(updateData).where(eq2(quoteRequests.id, id));
  return db.select().from(quoteRequests).where(eq2(quoteRequests.id, id)).limit(1);
}
var COUNTRY_CURRENCY;
var init_transport_db = __esm({
  "server/transport-db.ts"() {
    "use strict";
    init_db();
    init_notification();
    init_schema();
    COUNTRY_CURRENCY = {
      CI: { currency: "XOF", rate: 125, symbol: "FCFA" },
      SN: { currency: "XOF", rate: 125, symbol: "FCFA" },
      ML: { currency: "XOF", rate: 125, symbol: "FCFA" },
      BF: { currency: "XOF", rate: 125, symbol: "FCFA" },
      BJ: { currency: "XOF", rate: 125, symbol: "FCFA" },
      TG: { currency: "XOF", rate: 125, symbol: "FCFA" },
      NE: { currency: "XOF", rate: 125, symbol: "FCFA" },
      GW: { currency: "XOF", rate: 125, symbol: "FCFA" },
      GN: { currency: "GNF", rate: 1075, symbol: "GNF" },
      CM: { currency: "XAF", rate: 125, symbol: "FCFA" },
      GA: { currency: "XAF", rate: 125, symbol: "FCFA" },
      CG: { currency: "XAF", rate: 125, symbol: "FCFA" },
      CD: { currency: "CDF", rate: 350, symbol: "FC" },
      CF: { currency: "XAF", rate: 125, symbol: "FCFA" },
      TD: { currency: "XAF", rate: 125, symbol: "FCFA" },
      MR: { currency: "MRU", rate: 4.5, symbol: "MRU" },
      MG: { currency: "MGA", rate: 562, symbol: "Ar" },
      KM: { currency: "KMF", rate: 56, symbol: "KMF" },
      SC: { currency: "SCR", rate: 1.7, symbol: "SCR" },
      MU: { currency: "MUR", rate: 5.7, symbol: "MUR" },
      NG: { currency: "NGN", rate: 200, symbol: "\u20A6" },
      GH: { currency: "GHS", rate: 1.5, symbol: "GHS" },
      KE: { currency: "KES", rate: 16, symbol: "KES" },
      TZ: { currency: "TZS", rate: 320, symbol: "TZS" },
      UG: { currency: "UGX", rate: 460, symbol: "UGX" },
      RW: { currency: "RWF", rate: 145, symbol: "RWF" },
      BI: { currency: "BIF", rate: 360, symbol: "BIF" },
      ET: { currency: "ETB", rate: 7, symbol: "ETB" },
      ZM: { currency: "ZMW", rate: 3.2, symbol: "ZMW" },
      ZW: { currency: "USD", rate: 0.125, symbol: "USD" },
      MW: { currency: "MWK", rate: 130, symbol: "MWK" },
      MZ: { currency: "MZN", rate: 8, symbol: "MZN" },
      AO: { currency: "AOA", rate: 105, symbol: "Kz" },
      NA: { currency: "NAD", rate: 2.3, symbol: "NAD" },
      BW: { currency: "BWP", rate: 1.7, symbol: "BWP" },
      ZA: { currency: "ZAR", rate: 2.3, symbol: "R" },
      LS: { currency: "LSL", rate: 2.3, symbol: "LSL" },
      SZ: { currency: "SZL", rate: 2.3, symbol: "SZL" },
      LR: { currency: "LRD", rate: 24, symbol: "LRD" },
      SL: { currency: "SLL", rate: 2750, symbol: "SLL" },
      GM: { currency: "GMD", rate: 8.5, symbol: "GMD" },
      CV: { currency: "CVE", rate: 13.5, symbol: "CVE" },
      ST: { currency: "STN", rate: 2.8, symbol: "STN" },
      GQ: { currency: "XAF", rate: 125, symbol: "FCFA" },
      SS: { currency: "SSP", rate: 165, symbol: "SSP" },
      SO: { currency: "SOS", rate: 71, symbol: "SOS" },
      DJ: { currency: "DJF", rate: 22, symbol: "DJF" },
      ER: { currency: "ERN", rate: 1.9, symbol: "ERN" }
    };
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  storageGet: () => storageGet,
  storagePut: () => storagePut
});
function getStorageConfig() {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    console.warn("[Storage] BUILT_IN_FORGE_API_URL/KEY non configur\xE9s \u2014 upload d\xE9sactiv\xE9");
    return { baseUrl: "https://placeholder.storage", apiKey: "placeholder" };
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}
function buildUploadUrl(baseUrl, relKey) {
  const url = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  url.searchParams.set("path", normalizeKey(relKey));
  return url;
}
async function buildDownloadUrl(baseUrl, relKey, apiKey) {
  const downloadApiUrl = new URL(
    "v1/storage/downloadUrl",
    ensureTrailingSlash(baseUrl)
  );
  downloadApiUrl.searchParams.set("path", normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, {
    method: "GET",
    headers: buildAuthHeaders(apiKey)
  });
  return (await response.json()).url;
}
function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function toFormData(data, contentType, fileName) {
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const form = new FormData();
  form.append("file", blob, fileName || "file");
  return form;
}
function buildAuthHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split("/").pop() ?? key);
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Storage upload failed (${response.status} ${response.statusText}): ${message}`
    );
  }
  const url = (await response.json()).url;
  return { key, url };
}
async function storageGet(relKey) {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  return {
    key,
    url: await buildDownloadUrl(baseUrl, key, apiKey)
  };
}
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_env();
  }
});

// api/index.ts
import "dotenv/config";
import express2 from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers.ts
import { z as z25 } from "zod";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// server/_core/systemRouter.ts
init_notification();
import { z } from "zod";

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers/transport.ts
init_schema();
init_db();
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";
import * as bcrypt from "bcryptjs";
import { eq as eq3 } from "drizzle-orm";
init_transport_db();

// server/services/hub2.ts
import { createHmac } from "crypto";
var HUB2_API_BASE = "https://api.hub2.io";
function getHub2Headers(environment = "live") {
  const apiKey = process.env.HUB2_API_KEY;
  const merchantId = process.env.HUB2_MERCHANT_ID;
  if (!apiKey || !merchantId) {
    throw new Error("Hub2 non configur\xE9. Veuillez d\xE9finir HUB2_API_KEY et HUB2_MERCHANT_ID.");
  }
  return {
    "Content-Type": "application/json",
    "ApiKey": apiKey,
    "MerchantId": merchantId,
    "Environment": process.env.HUB2_ENVIRONMENT ?? environment
  };
}
async function createHub2PaymentIntent(params) {
  try {
    const headers = getHub2Headers();
    const response = await fetch(`${HUB2_API_BASE}/payment-intents`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customerReference: String(params.customerReference),
        purchaseReference: params.purchaseReference,
        amount: params.amount,
        currency: params.currency
      })
    });
    const data = await response.json();
    if (response.ok && data.id) {
      return { success: true, intent: data };
    }
    return {
      success: false,
      error: data?.message ?? data?.error ?? `Hub2 erreur ${response.status}`
    };
  } catch (err) {
    return { success: false, error: `Erreur r\xE9seau Hub2 : ${err.message}` };
  }
}
async function attemptHub2Payment(params) {
  try {
    const response = await fetch(
      `${HUB2_API_BASE}/payment-intents/${params.intentId}/payments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          paymentMethod: "mobile_money",
          country: params.country,
          provider: params.provider,
          mobileMoney: { msisdn: params.msisdn }
        })
      }
    );
    const data = await response.json();
    if (response.status === 201 && data.id) {
      return { success: true, intent: data };
    }
    return {
      success: false,
      error: data?.message ?? data?.error ?? `Hub2 erreur ${response.status}`
    };
  } catch (err) {
    return { success: false, error: `Erreur r\xE9seau Hub2 : ${err.message}` };
  }
}
async function getHub2PaymentIntentStatus(intentId) {
  try {
    const headers = getHub2Headers();
    const response = await fetch(`${HUB2_API_BASE}/payment-intents/${intentId}`, {
      method: "GET",
      headers
    });
    const data = await response.json();
    if (response.ok && data.id) {
      return { success: true, intent: data };
    }
    return { success: false, error: data?.message ?? `Hub2 erreur ${response.status}` };
  } catch (err) {
    return { success: false, error: `Erreur r\xE9seau Hub2 : ${err.message}` };
  }
}
function verifyHub2WebhookSignature(rawBody, signatureHeader) {
  const webhookSecret = process.env.HUB2_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn("[Hub2] HUB2_WEBHOOK_SECRET non d\xE9fini \u2014 signature non v\xE9rifi\xE9e");
    return true;
  }
  try {
    const parts = signatureHeader.split(",").reduce((acc, part) => {
      const [key, val] = part.split("=");
      if (key && val) acc[key.trim()] = val.trim();
      return acc;
    }, {});
    const expectedSig = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (parts.s1 === expectedSig) return true;
    const oldSecret = process.env.HUB2_WEBHOOK_OLD_SECRET;
    if (oldSecret && parts.s0) {
      const expectedOldSig = createHmac("sha256", oldSecret).update(rawBody).digest("hex");
      if (parts.s0 === expectedOldSig) return true;
    }
    return false;
  } catch {
    return false;
  }
}
function generateHub2PurchaseRef(requestId) {
  return `NEXUS-CR-${requestId}-${Date.now()}`;
}
var HUB2_PROVIDERS = {
  orange_ci: { country: "CI", provider: "orange", label: "Orange Money (CI)" },
  mtn_ci: { country: "CI", provider: "mtn", label: "MTN MoMo (CI)" },
  moov_ci: { country: "CI", provider: "moov", label: "Moov Money (CI)" },
  wave_ci: { country: "CI", provider: "wave", label: "Wave (CI)" },
  orange_sn: { country: "SN", provider: "orange", label: "Orange Money (SN)" },
  free_sn: { country: "SN", provider: "free", label: "Free Money (SN)" },
  wave_sn: { country: "SN", provider: "wave", label: "Wave (SN)" },
  orange_cm: { country: "CM", provider: "orange", label: "Orange Money (CM)" },
  mtn_cm: { country: "CM", provider: "mtn", label: "MTN MoMo (CM)" },
  orange_bf: { country: "BF", provider: "orange", label: "Orange Money (BF)" },
  moov_bf: { country: "BF", provider: "moov", label: "Moov Money (BF)" },
  orange_ml: { country: "ML", provider: "orange", label: "Orange Money (ML)" },
  moov_ml: { country: "ML", provider: "moov", label: "Moov Money (ML)" },
  orange_gn: { country: "GN", provider: "orange", label: "Orange Money (GN)" },
  mtn_gn: { country: "GN", provider: "mtn", label: "MTN MoMo (GN)" },
  togocel_tg: { country: "TG", provider: "togocel", label: "T-Money (TG)" },
  moov_tg: { country: "TG", provider: "moov", label: "Moov Money (TG)" },
  mtn_bj: { country: "BJ", provider: "mtn", label: "MTN MoMo (BJ)" },
  moov_bj: { country: "BJ", provider: "moov", label: "Moov Money (BJ)" }
};

// server/routers/transport.ts
init_notification();
var csnProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Acc\xE8s r\xE9serv\xE9 \xE0 l'administrateur NEXUS" });
  }
  return next({ ctx });
});
var companyProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const company = await getCompanyByUserId(ctx.user.id);
  if (!company) {
    throw new TRPCError3({ code: "NOT_FOUND", message: "Aucune compagnie associ\xE9e \xE0 ce compte" });
  }
  if (company.status !== "active") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Votre compte compagnie n'est pas encore activ\xE9" });
  }
  return next({ ctx: { ...ctx, company } });
});
var transportRouter = router({
  // ─── PUBLIC ──────────────────────────────────────────────────────────────────
  public: router({
    // List all active companies
    companies: publicProcedure.query(() => getAllCompanies().then((c) => c.filter((x) => x.status === "active"))),
    // List all companies (alias for ActivityCarousel)
    listCompanies: publicProcedure.query(() => getAllCompanies().then((c) => c.filter((x) => x.status === "active"))),
    // Get company profile by id
    company: publicProcedure.input(z2.object({ id: z2.number() })).query(({ input }) => getCompanyById(input.id)),
    // List trips by company (for public booking page)
    tripsByCompany: publicProcedure.input(z2.object({ companyId: z2.number() })).query(({ input }) => getPublicTripsByCompany(input.companyId)),
    // List trips by country (for home search)
    tripsByCountry: publicProcedure.input(z2.object({ countryId: z2.number() })).query(({ input }) => getPublicTripsByCountry(input.countryId)),
    // Get occupied seats for a trip
    occupiedSeatsTrip: publicProcedure.input(z2.object({ tripId: z2.number() })).query(({ input }) => getOccupiedSeatsByTrip(input.tripId)),
    // Book a seat online
    book: publicProcedure.input(
      z2.object({
        companyId: z2.number(),
        tripId: z2.number(),
        seatNumber: z2.number(),
        firstName: z2.string().min(1),
        lastName: z2.string().min(1),
        phone: z2.string().optional(),
        email: z2.string().email().optional(),
        priceXOF: z2.string().optional()
      })
    ).mutation(({ input }) => createBooking(input.companyId, input)),
    // Track a shipment
    trackShipment: publicProcedure.input(z2.object({ trackingNumber: z2.string() })).query(({ input }) => trackShipment(input.trackingNumber)),
    // Verify a ticket
    verifyTicket: publicProcedure.input(z2.object({ ticketNumber: z2.string() })).query(({ input }) => verifyTicketByNumber(input.ticketNumber)),
    // List companies by country (for public search)
    // Directory: all active companies
    directory: publicProcedure.query(() => getAllActiveCompanies()),
    // Gallery: public
    gallery: publicProcedure.input(z2.object({ companyId: z2.number() })).query(({ input }) => getGalleryByCompany(input.companyId)),
    // Gallery: add image (company protected)
    addGalleryImage: protectedProcedure.input(z2.object({ imageUrl: z2.string(), caption: z2.string().optional(), displayOrder: z2.number().optional() })).mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) throw new Error("Compagnie introuvable");
      return addGalleryImage({ ...input, companyId: company.id });
    }),
    // Gallery: delete image (company protected)
    deleteGalleryImage: protectedProcedure.input(z2.object({ imageId: z2.number() })).mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) throw new Error("Compagnie introuvable");
      return deleteGalleryImage(input.imageId, company.id);
    }),
    // Reviews: public list
    reviews: publicProcedure.input(z2.object({ companyId: z2.number() })).query(({ input }) => getReviewsByCompany(input.companyId)),
    // Reviews: average rating
    averageRating: publicProcedure.input(z2.object({ companyId: z2.number() })).query(({ input }) => getAverageRating(input.companyId)),
    // Reviews: create (public)
    createReview: publicProcedure.input(z2.object({
      companyId: z2.number(),
      authorName: z2.string().min(2),
      rating: z2.number().min(1).max(5),
      comment: z2.string().optional(),
      activityType: z2.string().default("transport")
    })).mutation(({ input }) => createCompanyReview(input)),
    companiesByCountry: publicProcedure.input(z2.object({ countryId: z2.number() })).query(({ input }) => getCompaniesByCountry(input.countryId)),
    // Search trips with filters (for public search page)
    searchDepartures: publicProcedure.input(
      z2.object({
        countryId: z2.number().optional(),
        companyId: z2.number().optional(),
        departureCity: z2.string().optional(),
        arrivalCity: z2.string().optional(),
        date: z2.string().optional()
      })
    ).query(({ input }) => searchPublicTrips(input)),
    // Get occupied seats for a trip (public)
    occupiedSeats: publicProcedure.input(z2.object({ departureId: z2.number() })).query(({ input }) => getOccupiedSeatsByTrip(input.departureId)),
    // Public booking with passenger details
    bookPublic: publicProcedure.input(
      z2.object({
        tripId: z2.number(),
        seatNumber: z2.number(),
        firstName: z2.string().min(1),
        lastName: z2.string().min(1),
        phone: z2.string().optional(),
        email: z2.string().email().optional(),
        idType: z2.string().optional(),
        idNumber: z2.string().optional(),
        gender: z2.string().optional(),
        nationality: z2.string().optional()
      })
    ).mutation(({ input }) => createPublicBooking({ ...input, companyId: 0 }))
  }),
  // ─── COMPANY REGISTRATION ────────────────────────────────────────────────────
  register: protectedProcedure.input(
    z2.object({
      companyName: z2.string().min(2),
      managerName: z2.string().optional(),
      phone: z2.string().optional(),
      email: z2.string().email().optional(),
      address: z2.string().optional(),
      countryId: z2.number().optional(),
      cityId: z2.number().optional(),
      description: z2.string().optional(),
      activityType: z2.enum(["transport", "restauration", "expedition", "hotel", "boutique", "agence_voyage", "residence_meuble", "loisirs", "location_vente"]).optional(),
      bdId: z2.string().optional()
      // ID du Business Développeur recruteur
    })
  ).mutation(({ ctx, input }) => {
    return upsertCompany(ctx.user.id, input);
  }),
  // ─── MY COMPANY (première compagnie) ─────────────────────────────────────────────────────────────
  myCompany: protectedProcedure.query(({ ctx }) => getCompanyByUserId(ctx.user.id)),
  // ─── TOUTES MES COMPAGNIES ─────────────────────────────────────────────────────────────
  myCompanies: protectedProcedure.query(({ ctx }) => getCompaniesByUserId(ctx.user.id)),
  // ─── COMPANY DASHBOARD ───────────────────────────────────────────────────────
  company: router({
    // Update company profile
    update: companyProcedure.input(
      z2.object({
        companyName: z2.string().min(2).optional(),
        managerName: z2.string().optional(),
        phone: z2.string().optional(),
        email: z2.string().email().optional(),
        address: z2.string().optional(),
        countryId: z2.number().optional(),
        cityId: z2.number().optional(),
        logoUrl: z2.string().optional(),
        description: z2.string().optional(),
        printHeaderText: z2.string().optional(),
        printFooterText: z2.string().optional(),
        primaryColor: z2.string().optional()
      })
    ).mutation(({ ctx, input }) => upsertCompany(ctx.user.id, input, ctx.company.id)),
    // Upload logo
    uploadLogo: companyProcedure.input(z2.object({ fileName: z2.string(), fileData: z2.string(), mimeType: z2.string() })).mutation(async ({ ctx, input }) => {
      const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const buffer = Buffer.from(input.fileData, "base64");
      const key = `company-logos/${ctx.company.id}-${Date.now()}-${input.fileName}`;
      const { url } = await storagePut2(key, buffer, input.mimeType);
      await upsertCompany(ctx.user.id, { companyName: ctx.company.companyName, logoUrl: url }, ctx.company.id);
      return { url };
    }),
    // Dashboard stats
    stats: companyProcedure.query(({ ctx }) => getCompanyDashboardStats(ctx.company.id)),
    // ─── BUS LINES
    busLines: router({
      list: companyProcedure.query(({ ctx }) => getBusLinesByCompany(ctx.company.id)),
      upsert: companyProcedure.input(
        z2.object({
          id: z2.number().optional(),
          departureCity: z2.string().min(1),
          arrivalCity: z2.string().min(1),
          departureCountryId: z2.number().optional(),
          arrivalCountryId: z2.number().optional(),
          lineType: z2.enum(["national", "international"]).optional(),
          distance: z2.number().optional(),
          estimatedDuration: z2.number().optional()
        })
      ).mutation(({ ctx, input }) => upsertBusLine(ctx.company.id, input)),
      delete: companyProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => deleteBusLine(ctx.company.id, input.id))
    }),
    // ─── BUSES
    buses: router({
      list: companyProcedure.query(({ ctx }) => getBusesByCompany(ctx.company.id)),
      upsert: companyProcedure.input(
        z2.object({
          id: z2.number().optional(),
          registration: z2.string().min(1),
          model: z2.string().optional(),
          capacity: z2.number().min(1),
          status: z2.enum(["disponible", "en_service", "maintenance"]).optional()
        })
      ).mutation(({ ctx, input }) => upsertBus(ctx.company.id, input)),
      delete: companyProcedure.input(z2.object({ id: z2.number() })).mutation(({ ctx, input }) => deleteBus(ctx.company.id, input.id))
    }),
    // ─── TRIPS (Voyages publics réservables)
    trips: router({
      list: companyProcedure.query(({ ctx }) => getTripsByCompany(ctx.company.id)),
      upsert: companyProcedure.input(
        z2.object({
          id: z2.number().optional(),
          busLineId: z2.number(),
          departureDate: z2.string(),
          departureTime: z2.string(),
          priceXOF: z2.string().optional(),
          priceGHS: z2.string().optional(),
          totalSeats: z2.number().min(1),
          active: z2.boolean().optional()
        })
      ).mutation(({ ctx, input }) => upsertTrip(ctx.company.id, input))
    }),
    // ─── DEPARTURES (Départs opérationnels)
    departures: router({
      list: companyProcedure.query(({ ctx }) => getDeparturesByCompany(ctx.company.id)),
      get: companyProcedure.input(z2.object({ id: z2.number() })).query(({ ctx, input }) => getDepartureById(input.id, ctx.company.id)),
      upsert: companyProcedure.input(
        z2.object({
          id: z2.number().optional(),
          busLineId: z2.number(),
          busId: z2.number().optional(),
          tripId: z2.number().optional(),
          departureDate: z2.string(),
          departureTime: z2.string(),
          driverName: z2.string().optional(),
          status: z2.enum(["programme", "embarquement", "en_route", "arrive", "annule"]).optional(),
          notes: z2.string().optional()
        })
      ).mutation(({ ctx, input }) => upsertDeparture(ctx.company.id, input)),
      updateStatus: companyProcedure.input(
        z2.object({
          id: z2.number(),
          status: z2.enum(["programme", "embarquement", "en_route", "arrive", "annule"])
        })
      ).mutation(({ ctx, input }) => updateDepartureStatus(ctx.company.id, input.id, input.status)),
      occupiedSeats: companyProcedure.input(z2.object({ departureId: z2.number() })).query(({ input }) => getOccupiedSeatsByDeparture(input.departureId))
    }),
    // ─── TICKETS (Billets guichet)
    tickets: router({
      list: companyProcedure.input(z2.object({ limit: z2.number().optional() })).query(({ ctx, input }) => getTicketsByCompany(ctx.company.id, input.limit)),
      byDeparture: companyProcedure.input(z2.object({ departureId: z2.number() })).query(({ ctx, input }) => getTicketsByDeparture(ctx.company.id, input.departureId)),
      create: companyProcedure.input(
        z2.object({
          departureId: z2.number(),
          seatNumber: z2.number(),
          firstName: z2.string().min(1),
          lastName: z2.string().min(1),
          phone: z2.string().optional(),
          idType: z2.enum(["cni", "passeport", "carte_consulaire", "carte_resident", "laissez_passer"]).optional(),
          idNumber: z2.string().optional(),
          gender: z2.enum(["M", "F"]).optional(),
          nationality: z2.string().optional(),
          dropOffCity: z2.string().optional(),
          priceXOF: z2.string().optional(),
          paymentMethod: z2.enum(["cash", "mobile_money", "virement"]).optional()
        })
      ).mutation(({ ctx, input }) => createTicket(ctx.company.id, { ...input, soldBy: ctx.user.id })),
      updateStatus: companyProcedure.input(
        z2.object({
          ticketId: z2.number(),
          ticketStatus: z2.enum(["actif", "utilise", "annule"]).optional(),
          cashStatus: z2.enum(["en_attente", "encaisse"]).optional(),
          boardingStatus: z2.enum(["non_embarque", "embarque"]).optional()
        })
      ).mutation(({ ctx, input }) => {
        const { ticketId, ...updates } = input;
        return updateTicketStatus(ctx.company.id, ticketId, updates);
      })
    }),
    // ─── BOOKINGS (Réservations en ligne)
    bookings: router({
      list: companyProcedure.input(z2.object({ limit: z2.number().optional() })).query(({ ctx, input }) => getBookingsByCompany(ctx.company.id, input.limit)),
      updateStatus: companyProcedure.input(
        z2.object({
          bookingId: z2.number(),
          status: z2.enum(["en_attente", "confirme", "annule"])
        })
      ).mutation(({ ctx, input }) => updateBookingStatus(ctx.company.id, input.bookingId, input.status))
    }),
    // ─── SHIPMENTS (Expéditions)
    shipments: router({
      list: companyProcedure.input(z2.object({ limit: z2.number().optional() })).query(({ ctx, input }) => getShipmentsByCompany(ctx.company.id, input.limit)),
      create: companyProcedure.input(
        z2.object({
          senderName: z2.string().min(1),
          senderPhone: z2.string().optional(),
          senderCity: z2.string().optional(),
          receiverName: z2.string().min(1),
          receiverPhone: z2.string().optional(),
          receiverCity: z2.string().optional(),
          description: z2.string().optional(),
          weight: z2.string().optional(),
          priceXOF: z2.string().optional(),
          photoUrl: z2.string().optional(),
          photoKey: z2.string().optional()
        })
      ).mutation(
        ({ ctx, input }) => createShipment(ctx.company.id, { ...input, registeredBy: ctx.user.id })
      ),
      updateStatus: companyProcedure.input(
        z2.object({
          shipmentId: z2.number(),
          status: z2.enum(["enregistre", "en_transit", "arrive", "livre"]),
          cashStatus: z2.enum(["en_attente", "encaisse"]).optional()
        })
      ).mutation(
        ({ ctx, input }) => updateShipmentStatus(ctx.company.id, input.shipmentId, input.status, input.cashStatus)
      )
    }),
    // ─── STAFF
    staff: router({
      list: companyProcedure.query(({ ctx }) => getStaffByCompany(ctx.company.id)),
      upsert: companyProcedure.input(
        z2.object({
          id: z2.number().optional(),
          firstName: z2.string().min(1),
          lastName: z2.string().min(1),
          phone: z2.string().optional(),
          role: z2.enum(["chauffeur", "agent_billetterie", "agent_expedition", "caissier", "superviseur", "directeur"]),
          station: z2.string().optional(),
          active: z2.boolean().optional()
        })
      ).mutation(({ ctx, input }) => upsertStaff(ctx.company.id, input))
    }),
    // ─── STATIONS
    stations: router({
      list: companyProcedure.query(({ ctx }) => getStationsByCompany(ctx.company.id)),
      upsert: companyProcedure.input(
        z2.object({
          id: z2.number().optional(),
          name: z2.string().min(1),
          city: z2.string().min(1),
          countryId: z2.number().optional(),
          address: z2.string().optional()
        })
      ).mutation(({ ctx, input }) => upsertStation(ctx.company.id, input))
    }),
    // ─── CHARGES
    charges: router({
      list: companyProcedure.query(({ ctx }) => getChargesByCompany(ctx.company.id)),
      create: companyProcedure.input(
        z2.object({
          category: z2.enum(["carburant", "maintenance", "salaire", "frais_divers"]),
          description: z2.string().optional(),
          amount: z2.string(),
          station: z2.string().optional(),
          chargeDate: z2.string()
        })
      ).mutation(({ ctx, input }) => createCharge(ctx.company.id, input))
    }),
    // ─── CREATE TEST TRIPS
    createTestTrips: publicProcedure.input(z2.object({ companyId: z2.number() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Erreur de connexion" };
      const now = /* @__PURE__ */ new Date();
      const tomorrow = new Date(now.getTime() + 864e5);
      const busLinesResult = await db.select().from(transportBusLines).where(eq3(transportBusLines.companyId, input.companyId)).limit(3);
      const busLines = busLinesResult;
      if (busLines.length === 0) {
        return { success: false, error: "Aucune ligne de bus trouv\xE9e" };
      }
      const trips = [];
      for (let i = 0; i < 5; i++) {
        const busLine = busLines[i % busLines.length];
        const tripDate = new Date(tomorrow.getTime() + i * 864e5);
        trips.push({
          companyId: input.companyId,
          busLineId: busLine.id,
          departureDate: tripDate,
          departureTime: `${8 + i % 4}:00`,
          priceXOF: String(15e3 + i * 2e3),
          totalSeats: 50,
          active: true
        });
      }
      await db.insert(transportTrips).values(trips);
      return { success: true, message: "5 trips cr\xE9\xE9s" };
    }),
    // ─── ROUTE FARES
    fares: router({
      list: companyProcedure.query(({ ctx }) => getRouteFaresByCompany(ctx.company.id)),
      upsert: companyProcedure.input(
        z2.object({
          id: z2.number().optional(),
          busLineId: z2.number(),
          fromCity: z2.string().min(1),
          toCity: z2.string().min(1),
          priceXOF: z2.string().optional(),
          priceGHS: z2.string().optional()
        })
      ).mutation(({ ctx, input }) => upsertRouteFare(ctx.company.id, input))
    }),
    // ─── BILLING (company view)
    billing: companyProcedure.query(({ ctx }) => getBillingByCompany(ctx.company.id))
  }),
  // ─── NEXUS ADMIN ───────────────────────────────────────────────────────────────
  csn: router({
    // Global stats
    stats: csnProcedure.query(() => getCsnDashboardStats()),
    // List all companies
    companies: csnProcedure.query(() => getAllCompanies()),
    // Validate or reject a company
    validateCompany: csnProcedure.input(
      z2.object({
        companyId: z2.number(),
        action: z2.enum(["active", "rejected"]),
        rejectionReason: z2.string().optional()
      })
    ).mutation(
      ({ ctx, input }) => validateCompany(input.companyId, ctx.user.id, input.action, input.rejectionReason)
    ),
    // Update company info (admin)
    updateCompany: csnProcedure.input(
      z2.object({
        companyId: z2.number(),
        companyName: z2.string().min(2).optional(),
        managerName: z2.string().optional(),
        phone: z2.string().optional(),
        email: z2.string().email().optional(),
        address: z2.string().optional(),
        activityType: z2.enum(["transport", "restauration", "expedition", "hotel", "boutique", "agence_voyage", "residence_meuble", "loisirs", "location_vente"]).optional()
      })
    ).mutation(({ input }) => updateCompanyAdmin(input.companyId, input)),
    // Set gallery image for a company
    setGalleryImage: csnProcedure.input(
      z2.object({
        companyId: z2.number(),
        galleryImageUrl: z2.string()
      })
    ).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return;
      await db.update(transportCompanies).set({ galleryImageUrl: input.galleryImageUrl, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(transportCompanies.id, input.companyId));
    }),
    // Suspend a company
    suspendCompany: csnProcedure.input(z2.object({ companyId: z2.number() })).mutation(({ input }) => suspendCompany(input.companyId)),
    // Reactivate a suspended company
    reactivateCompany: csnProcedure.input(z2.object({ companyId: z2.number() })).mutation(({ input }) => reactivateCompany(input.companyId)),
    // Delete a company
    deleteCompany: csnProcedure.input(z2.object({ companyId: z2.number() })).mutation(({ input }) => deleteCompanyById(input.companyId)),
    // All billing
    billing: csnProcedure.query(() => getAllBilling()),
    // Generate monthly billing for a company
    generateBilling: csnProcedure.input(z2.object({ companyId: z2.number(), period: z2.string() })).mutation(({ input }) => generateMonthlyBilling(input.companyId, input.period)),
    // Update billing status
    updateBillingStatus: csnProcedure.input(
      z2.object({
        billingId: z2.number(),
        status: z2.enum(["en_attente", "facture", "paye"])
      })
    ).mutation(({ input }) => updateBillingStatus(input.billingId, input.status)),
    // Credits overview for NEXUS (all companies) — enriched stats
    allCredits: csnProcedure.query(() => getAllCreditsStats()),
    // Transactions d'une compagnie (pour l'historique détaillé dans le dashboard NEXUS)
    companyTransactions: csnProcedure.input(z2.object({ companyId: z2.number(), limit: z2.number().optional() })).query(({ input }) => getCreditTransactions(input.companyId, input.limit ?? 100)),
    // Trending data (30 jours)
    trending: csnProcedure.input(z2.object({ days: z2.number().optional() })).query(({ input }) => getTrendingData(input?.days ?? 30)),
    // Companies detailed stats
    companiesStats: csnProcedure.query(() => getCompaniesDetailedStats()),
    // Rapport journalier — déclenchable manuellement depuis le dashboard NEXUS
    dailyReport: csnProcedure.mutation(async () => {
      const stats = await getCsnDashboardStats();
      const creditsStats = await getAllCreditsStats();
      const today = (/* @__PURE__ */ new Date()).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const s = stats;
      const totalRevenue = (s.pendingBillingXOF ?? s.totalRevenue ?? 0).toLocaleString();
      const totalCreditsCA = creditsStats.reduce((sum, c) => sum + (parseFloat(c.totalSpentLocal ?? "0") || 0), 0);
      const zeroBalance = creditsStats.filter((c) => (c.balance ?? 0) <= 0).length;
      const content = [
        `\u{1F4C5} Rapport journalier NEXUS \u2014 ${today}`,
        ``,
        `\u{1F68C} Transport`,
        `  \u2022 Compagnies actives : ${s.activeCompanies ?? s.totalCompanies ?? 0}`,
        `  \u2022 Billets vendus aujourd'hui : ${s.ticketsToday ?? 0}`,
        `  \u2022 Exp\xE9ditions aujourd'hui : ${s.shipmentsToday ?? 0}`,
        `  \u2022 Facturation en attente : ${totalRevenue} XOF`,
        ``,
        `\u{1F37D}\uFE0F Restauration`,
        `  \u2022 Commandes en ligne aujourd'hui : ${s.ordersToday ?? 0}`,
        ``,
        `\u{1F4B3} Cr\xE9dits NEXUS`,
        `  \u2022 Compagnies avec cr\xE9dits : ${creditsStats.length}`,
        `  \u2022 CA cr\xE9dits encaiss\xE9 : ${totalCreditsCA.toLocaleString()} XOF`,
        `  \u2022 Compagnies \xE0 solde z\xE9ro : ${zeroBalance}`,
        ``,
        `\u2014 Envoy\xE9 par NEXUS`
      ].join("\n");
      await notifyOwner({ title: `Rapport journalier NEXUS \u2014 ${today}`, content });
      return { success: true, today };
    })
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
        countryCode: credits?.countryCode ?? "CI"
      };
    }),
    // Get transaction history
    getHistory: companyProcedure.input(z2.object({ limit: z2.number().optional() })).query(async ({ ctx, input }) => {
      return getCreditTransactions(ctx.company.id, input.limit ?? 50);
    }),
    // Buy credits (simulation paiement mobile)
    buyCredits: companyProcedure.input(
      z2.object({
        points: z2.number().min(1).max(1e4),
        paymentMethod: z2.enum(["wave", "orange_money", "mtn_money", "moov_money", "especes"]),
        phone: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
      const credits = await getCompanyCredits(ctx.company.id);
      const cc = getCountryCurrency(credits?.countryCode ?? "CI");
      const amountLocal = input.points * cc.rate;
      const newBalance = await addCredits(
        ctx.company.id,
        input.points,
        amountLocal,
        `Achat de ${input.points} point(s) via ${input.paymentMethod} \u2014 ${amountLocal.toLocaleString()} ${cc.symbol}`
      );
      return { success: true, newBalance, amountLocal, currency: cc.symbol };
    }),
    // Update country for currency conversion
    updateCountry: companyProcedure.input(z2.object({ countryCode: z2.string().length(2) })).mutation(async ({ ctx, input }) => {
      const cc = getCountryCurrency(input.countryCode);
      const { getDb: getDb2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { companyCredits: companyCredits2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq26 } = await import("drizzle-orm");
      const db = await getDb2();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(companyCredits2).set({ countryCode: input.countryCode, currency: cc.currency, pointPriceLocal: String(cc.rate) }).where(eq26(companyCredits2.companyId, ctx.company.id));
      return { success: true };
    }),
    // ─── CREDIT REQUESTS (demandes d'achat de crédits) ─────────────────────────
    // Compagnie soumet une demande de crédit
    requestCredit: companyProcedure.input(
      z2.object({
        points: z2.number().min(1).max(5e4),
        paymentMethod: z2.enum(["mobile_money", "bank_transfer", "cash"]),
        paymentPhone: z2.string().optional(),
        paymentOperator: z2.enum(["orange_money", "mtn_momo", "moov_money", "wave", "other"]).optional(),
        paymentRef: z2.string().optional(),
        notes: z2.string().optional()
      })
    ).mutation(async ({ ctx, input }) => {
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
        notes: input.notes
      });
      return { success: true, requestId: id, amountLocal, currency: cc.symbol };
    }),
    // Compagnie consulte ses demandes
    myRequests: companyProcedure.query(({ ctx }) => getCreditRequestsByCompany(ctx.company.id)),
    // NEXUS — liste toutes les demandes
    allRequests: csnProcedure.input(z2.object({ status: z2.string().optional() })).query(({ input }) => getAllCreditRequests(input.status)),
    // NEXUS — valider le paiement et créditer automatiquement
    confirmPayment: csnProcedure.input(
      z2.object({
        requestId: z2.number(),
        validatedBy: z2.string().optional()
      })
    ).mutation(
      ({ ctx, input }) => confirmCreditRequestPayment(input.requestId, input.validatedBy ?? ctx.user.email ?? "NEXUS")
    ),
    // NEXUS — rejeter une demande
    rejectRequest: csnProcedure.input(
      z2.object({
        requestId: z2.number(),
        reason: z2.string().min(5)
      })
    ).mutation(
      ({ ctx, input }) => rejectCreditRequest(input.requestId, ctx.user.email ?? "NEXUS", input.reason)
    ),
    // Hub2 — Étape 1 : Créer une intention de paiement
    initHub2Payment: companyProcedure.input(
      z2.object({
        requestId: z2.number(),
        providerKey: z2.string()
      })
    ).mutation(async ({ ctx, input }) => {
      const provider = HUB2_PROVIDERS[input.providerKey];
      if (!provider) throw new TRPCError3({ code: "BAD_REQUEST", message: `Op\xE9rateur inconnu: ${input.providerKey}` });
      const requests = await getCreditRequestsByCompany(ctx.company.id);
      const req = requests.find((r) => r.id === input.requestId);
      if (!req) throw new TRPCError3({ code: "NOT_FOUND", message: "Demande introuvable" });
      if (req.status !== "pending") throw new TRPCError3({ code: "BAD_REQUEST", message: "Cette demande n'est plus en attente" });
      const purchaseRef = generateHub2PurchaseRef(input.requestId);
      const result = await createHub2PaymentIntent({
        amount: Math.round(Number(req.amountLocal)),
        currency: req.currency ?? "XOF",
        customerReference: String(ctx.company.id),
        purchaseReference: purchaseRef
      });
      if (!result.success) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      await saveHub2PaymentIntent(input.requestId, result.intent.id, purchaseRef, result.intent.token);
      return { success: true, intentId: result.intent.id, token: result.intent.token, purchaseRef, amount: result.intent.amount, currency: result.intent.currency, provider };
    }),
    // Hub2 — Étape 2 : Tenter le paiement Mobile Money
    attemptHub2Payment: companyProcedure.input(z2.object({ intentId: z2.string(), token: z2.string(), providerKey: z2.string(), msisdn: z2.string().min(8) })).mutation(async ({ input }) => {
      const provider = HUB2_PROVIDERS[input.providerKey];
      if (!provider) throw new TRPCError3({ code: "BAD_REQUEST", message: `Op\xE9rateur inconnu: ${input.providerKey}` });
      const result = await attemptHub2Payment({ intentId: input.intentId, token: input.token, country: provider.country, provider: provider.provider, msisdn: input.msisdn });
      if (!result.success) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      return { success: true, status: result.intent.status, nextAction: result.intent.payments?.[0]?.nextAction ?? null };
    }),
    // Hub2 — Vérifier le statut d'une intention de paiement
    checkHub2Status: companyProcedure.input(z2.object({ intentId: z2.string() })).query(async ({ input }) => {
      const result = await getHub2PaymentIntentStatus(input.intentId);
      if (!result.success) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: result.error });
      return { status: result.intent.status, payments: result.intent.payments };
    }),
    // Webhook Mobile Money — validation automatique dès paiement confirmé
    mobileMoneyWebhook: publicProcedure.input(
      z2.object({
        requestId: z2.number(),
        paymentRef: z2.string(),
        operator: z2.string(),
        secret: z2.string()
        // clé secrète pour sécuriser le webhook
      })
    ).mutation(async ({ input }) => {
      const WEBHOOK_SECRET = process.env.MOBILE_MONEY_WEBHOOK_SECRET ?? "nexus_mm_secret_2024";
      if (input.secret !== WEBHOOK_SECRET) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Cl\xE9 webhook invalide" });
      }
      return autoValidateMobileMoneyPayment(input.requestId, input.paymentRef, input.operator);
    }),
    // Crédit manuel par l'admin NEXUS (protégé par PIN de confirmation)
    adminCreditCompany: csnProcedure.input(
      z2.object({
        companyId: z2.number(),
        points: z2.number().min(1).max(1e5),
        motif: z2.string().min(3).max(200),
        reference: z2.string().max(100).optional(),
        confirmPin: z2.string().min(4).max(6)
      })
    ).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Base de donn\xE9es indisponible" });
      const [adminUser] = await db.select().from(users).where(eq3(users.id, ctx.user.id)).limit(1);
      if (!adminUser) throw new TRPCError3({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
      if (adminUser.confirmPinLockedUntil && adminUser.confirmPinLockedUntil > /* @__PURE__ */ new Date()) {
        const minutesLeft = Math.ceil((adminUser.confirmPinLockedUntil.getTime() - Date.now()) / 6e4);
        throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: `Compte verrouill\xE9. R\xE9essayez dans ${minutesLeft} minute(s).` });
      }
      if (!adminUser.confirmPinHash) {
        throw new TRPCError3({ code: "PRECONDITION_FAILED", message: "Aucun PIN de confirmation d\xE9fini. Veuillez d'abord d\xE9finir votre PIN dans les param\xE8tres." });
      }
      const pinValid = await bcrypt.compare(input.confirmPin, adminUser.confirmPinHash);
      if (!pinValid) {
        const newAttempts = (adminUser.confirmPinAttempts ?? 0) + 1;
        const lockedUntil = newAttempts >= 3 ? new Date(Date.now() + 15 * 60 * 1e3) : null;
        await db.update(users).set({
          confirmPinAttempts: newAttempts,
          confirmPinLockedUntil: lockedUntil ?? void 0
        }).where(eq3(users.id, ctx.user.id));
        const remaining = Math.max(0, 3 - newAttempts);
        throw new TRPCError3({
          code: "UNAUTHORIZED",
          message: remaining > 0 ? `PIN incorrect. ${remaining} tentative(s) restante(s) avant verrouillage.` : "PIN incorrect. Compte verrouill\xE9 pour 15 minutes."
        });
      }
      await db.update(users).set({ confirmPinAttempts: 0, confirmPinLockedUntil: null }).where(eq3(users.id, ctx.user.id));
      return adminCreditCompany(
        input.companyId,
        input.points,
        input.motif,
        input.reference ?? null,
        ctx.user.email ?? "admin"
      );
    }),
    // Définir ou changer le PIN de confirmation admin
    setConfirmPin: csnProcedure.input(z2.object({ pin: z2.string().min(4).max(6).regex(/^\d+$/, "Le PIN doit contenir uniquement des chiffres") })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Base de donn\xE9es indisponible" });
      const pinHash = await bcrypt.hash(input.pin, 10);
      await db.update(users).set({
        confirmPinHash: pinHash,
        confirmPinAttempts: 0,
        confirmPinLockedUntil: null
      }).where(eq3(users.id, ctx.user.id));
      return { success: true };
    }),
    // Vérifier si un PIN est défini pour l'admin connecté
    hasPinDefined: csnProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { hasPinDefined: false, isLocked: false };
      const [adminUser] = await db.select({
        confirmPinHash: users.confirmPinHash,
        confirmPinLockedUntil: users.confirmPinLockedUntil,
        confirmPinAttempts: users.confirmPinAttempts
      }).from(users).where(eq3(users.id, ctx.user.id)).limit(1);
      if (!adminUser) return { hasPinDefined: false, isLocked: false };
      const isLocked = !!(adminUser.confirmPinLockedUntil && adminUser.confirmPinLockedUntil > /* @__PURE__ */ new Date());
      const lockedUntil = isLocked ? adminUser.confirmPinLockedUntil : null;
      return {
        hasPinDefined: !!adminUser.confirmPinHash,
        isLocked,
        lockedUntil,
        attempts: adminUser.confirmPinAttempts ?? 0
      };
    })
  })
});

// server/routers/menu.ts
import { TRPCError as TRPCError4 } from "@trpc/server";
import { z as z3 } from "zod";
init_transport_db();
init_notification();

// server/menu-db.ts
init_db();
init_schema();
init_storage();
init_schema();
init_schema();
import { and as and3, asc, desc as desc3, eq as eq4 } from "drizzle-orm";
async function getCategoriesByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuCategories).where(eq4(menuCategories.companyId, companyId)).orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name));
}
async function createCategory(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(menuCategories).values({
    companyId: data.companyId,
    name: data.name,
    description: data.description,
    sortOrder: data.sortOrder ?? 0
  }).returning({ id: menuCategories.id });
  return { id: result[0]?.id ?? 0 };
}
async function updateCategory(id, companyId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(menuCategories).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(menuCategories.id, id), eq4(menuCategories.companyId, companyId)));
  return { success: true };
}
async function deleteCategory(id, companyId) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(menuItems).where(and3(eq4(menuItems.categoryId, id), eq4(menuItems.companyId, companyId)));
  await db.delete(menuCategories).where(and3(eq4(menuCategories.id, id), eq4(menuCategories.companyId, companyId)));
  return { success: true };
}
async function getItemsByCompany(companyId, categoryId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq4(menuItems.companyId, companyId)];
  if (categoryId) conditions.push(eq4(menuItems.categoryId, categoryId));
  return db.select().from(menuItems).where(and3(...conditions)).orderBy(asc(menuItems.sortOrder), asc(menuItems.name));
}
async function createItem(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(menuItems).values({
    companyId: data.companyId,
    categoryId: data.categoryId,
    name: data.name,
    description: data.description,
    priceXOF: data.priceXOF,
    available: data.available ?? true,
    preparationTime: data.preparationTime ?? 15,
    sortOrder: data.sortOrder ?? 0
  }).returning({ id: menuItems.id });
  return { id: result[0]?.id ?? 0 };
}
async function updateItem(id, companyId, data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(menuItems).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(and3(eq4(menuItems.id, id), eq4(menuItems.companyId, companyId)));
  return { success: true };
}
async function deleteItem(id, companyId) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(menuItems).where(and3(eq4(menuItems.id, id), eq4(menuItems.companyId, companyId)));
  return { success: true };
}
async function uploadItemPhoto(id, companyId, fileBuffer, mimeType, originalName) {
  const ext = originalName.split(".").pop() ?? "jpg";
  const key = `menu/${companyId}/${id}-${Date.now()}.${ext}`;
  const { url } = await storagePut(key, fileBuffer, mimeType);
  await updateItem(id, companyId, { photoUrl: url, photoKey: key });
  return { url, key };
}
async function getPublicMenu(companyId) {
  const db = await getDb();
  if (!db) return [];
  const cats = await db.select().from(menuCategories).where(eq4(menuCategories.companyId, companyId)).orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name));
  const items = await db.select().from(menuItems).where(and3(eq4(menuItems.companyId, companyId), eq4(menuItems.available, true))).orderBy(asc(menuItems.sortOrder), asc(menuItems.name));
  return cats.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.categoryId === cat.id)
  }));
}
function generateOrderRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "CMD-";
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}
async function createOnlineOrder(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const totalXOF = data.items.reduce((sum, i) => sum + i.priceXOF * i.qty, 0);
  const estimatedPrepTime = Math.max(...data.items.map((i) => i.preparationTime ?? 15));
  const orderRef = generateOrderRef();
  await db.insert(onlineOrders).values({
    companyId: data.companyId,
    orderRef,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    deliveryType: data.deliveryType,
    deliveryAddress: data.deliveryAddress ?? null,
    notes: data.notes ?? null,
    itemsJson: JSON.stringify(data.items),
    totalXOF: String(totalXOF),
    estimatedPrepTime,
    status: "nouvelle"
  });
  return { orderRef, totalXOF, estimatedPrepTime };
}
async function getOnlineOrdersByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(onlineOrders).where(eq4(onlineOrders.companyId, companyId)).orderBy(desc3(onlineOrders.createdAt));
}
async function updateOnlineOrderStatus(orderId, status) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(onlineOrders).set({ status }).where(eq4(onlineOrders.id, orderId));
  return { success: true };
}
async function getDeliveryZonesByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliveryZones).where(eq4(deliveryZones.companyId, companyId)).orderBy(asc(deliveryZones.name));
}
async function upsertDeliveryZone(data) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (data.id) {
    await db.update(deliveryZones).set({ name: data.name, description: data.description, extraMinutes: data.extraMinutes, active: data.active ?? true }).where(and3(eq4(deliveryZones.id, data.id), eq4(deliveryZones.companyId, data.companyId)));
    return { id: data.id };
  } else {
    const result = await db.insert(deliveryZones).values({
      companyId: data.companyId,
      name: data.name,
      description: data.description,
      extraMinutes: data.extraMinutes,
      active: data.active ?? true
    }).returning({ id: deliveryZones.id });
    return { id: result[0]?.id ?? 0 };
  }
}
async function deleteDeliveryZone(id, companyId) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(deliveryZones).where(and3(eq4(deliveryZones.id, id), eq4(deliveryZones.companyId, companyId)));
  return { success: true };
}
async function getPublicDeliveryZones(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(deliveryZones).where(and3(eq4(deliveryZones.companyId, companyId), eq4(deliveryZones.active, true))).orderBy(asc(deliveryZones.name));
}
async function getRestaurantStatsToday(companyId) {
  const db = await getDb();
  if (!db) return { caToday: 0, ordersDelivered: 0, avgBasket: 0, ordersTotal: 0 };
  const todayStart = /* @__PURE__ */ new Date();
  todayStart.setHours(0, 0, 0, 0);
  const orders = await db.select().from(onlineOrders).where(and3(eq4(onlineOrders.companyId, companyId)));
  const todayOrders = orders.filter((o) => new Date(o.createdAt) >= todayStart);
  const delivered = todayOrders.filter((o) => o.status === "livree");
  const caToday = todayOrders.reduce((sum, o) => sum + Number(o.totalXOF), 0);
  const avgBasket = todayOrders.length > 0 ? Math.round(caToday / todayOrders.length) : 0;
  return {
    caToday,
    ordersDelivered: delivered.length,
    avgBasket,
    ordersTotal: todayOrders.length
  };
}

// server/routers/menu.ts
var companyProcedure2 = protectedProcedure.use(async ({ ctx, next }) => {
  const company = await getCompanyByUserId(ctx.user.id);
  if (!company) throw new TRPCError4({ code: "FORBIDDEN", message: "Compagnie introuvable" });
  if (company.status !== "active")
    throw new TRPCError4({ code: "FORBIDDEN", message: "Compte non valid\xE9 par NEXUS" });
  return next({ ctx: { ...ctx, company } });
});
var menuRouter = router({
  // ─── PUBLIC ──────────────────────────────────────────────────────────────
  publicMenu: publicProcedure.input(z3.object({ companyId: z3.number() })).query(({ input }) => getPublicMenu(input.companyId)),
  // ─── CATEGORIES (dashboard compagnie) ────────────────────────────────────
  listCategories: companyProcedure2.query(
    ({ ctx }) => getCategoriesByCompany(ctx.company.id)
  ),
  createCategory: companyProcedure2.input(
    z3.object({
      name: z3.string().min(1).max(100),
      description: z3.string().max(255).optional(),
      sortOrder: z3.number().int().min(0).optional()
    })
  ).mutation(
    ({ ctx, input }) => createCategory({ companyId: ctx.company.id, ...input })
  ),
  updateCategory: companyProcedure2.input(
    z3.object({
      id: z3.number().int(),
      name: z3.string().min(1).max(100).optional(),
      description: z3.string().max(255).optional(),
      sortOrder: z3.number().int().min(0).optional()
    })
  ).mutation(({ ctx, input }) => {
    const { id, ...data } = input;
    return updateCategory(id, ctx.company.id, data);
  }),
  deleteCategory: companyProcedure2.input(z3.object({ id: z3.number().int() })).mutation(({ ctx, input }) => deleteCategory(input.id, ctx.company.id)),
  // ─── ITEMS (dashboard compagnie) ─────────────────────────────────────────
  listItems: companyProcedure2.input(z3.object({ categoryId: z3.number().int().optional() })).query(({ ctx, input }) => getItemsByCompany(ctx.company.id, input.categoryId)),
  createItem: companyProcedure2.input(
    z3.object({
      categoryId: z3.number().int(),
      name: z3.string().min(1).max(150),
      description: z3.string().optional(),
      priceXOF: z3.string().min(1),
      available: z3.boolean().optional(),
      preparationTime: z3.number().int().min(0).optional(),
      sortOrder: z3.number().int().min(0).optional()
    })
  ).mutation(
    ({ ctx, input }) => createItem({ companyId: ctx.company.id, ...input })
  ),
  updateItem: companyProcedure2.input(
    z3.object({
      id: z3.number().int(),
      name: z3.string().min(1).max(150).optional(),
      description: z3.string().optional(),
      priceXOF: z3.string().optional(),
      categoryId: z3.number().int().optional(),
      available: z3.boolean().optional(),
      preparationTime: z3.number().int().min(0).optional(),
      sortOrder: z3.number().int().min(0).optional()
    })
  ).mutation(({ ctx, input }) => {
    const { id, ...data } = input;
    return updateItem(id, ctx.company.id, data);
  }),
  deleteItem: companyProcedure2.input(z3.object({ id: z3.number().int() })).mutation(({ ctx, input }) => deleteItem(input.id, ctx.company.id)),
  // ─── UPLOAD PHOTO ─────────────────────────────────────────────────────────
  uploadPhoto: companyProcedure2.input(
    z3.object({
      itemId: z3.number().int(),
      fileBase64: z3.string(),
      mimeType: z3.string(),
      fileName: z3.string()
    })
  ).mutation(async ({ ctx, input }) => {
    const buffer = Buffer.from(input.fileBase64, "base64");
    if (buffer.length > 5 * 1024 * 1024)
      throw new TRPCError4({ code: "BAD_REQUEST", message: "Photo trop lourde (max 5 Mo)" });
    return uploadItemPhoto(
      input.itemId,
      ctx.company.id,
      buffer,
      input.mimeType,
      input.fileName
    );
  }),
  // ─── ONLINE ORDERS (public : passer commande) ─────────────────────────────
  createOrder: publicProcedure.input(
    z3.object({
      companyId: z3.number().int(),
      customerName: z3.string().min(1).max(150),
      customerPhone: z3.string().min(1).max(30),
      deliveryType: z3.enum(["livraison", "sur_place"]),
      deliveryAddress: z3.string().max(300).optional(),
      notes: z3.string().optional(),
      items: z3.array(
        z3.object({
          itemId: z3.number().int(),
          name: z3.string(),
          qty: z3.number().int().min(1),
          priceXOF: z3.number(),
          preparationTime: z3.number().int().optional()
        })
      ).min(1)
    })
  ).mutation(async ({ input }) => {
    const order = await createOnlineOrder(input);
    const itemsSummary = input.items.map((it) => `${it.qty}\xD7 ${it.name}`).join(", ");
    const totalXOF = input.items.reduce((sum, it) => sum + it.priceXOF * it.qty, 0);
    notifyOwner({
      title: `\u{1F6D2} Nouvelle commande restaurant \u2014 ${order.orderRef}`,
      content: `Client : ${input.customerName} (${input.customerPhone})
Type : ${input.deliveryType === "livraison" ? "Livraison" : "Sur place"}${input.deliveryAddress ? `
Adresse : ${input.deliveryAddress}` : ""}
Articles : ${itemsSummary}
Total : ${totalXOF.toLocaleString()} FCFA${input.notes ? `
Note : ${input.notes}` : ""}`
    }).catch(() => {
    });
    const { debitCredit: debitCredit2 } = await Promise.resolve().then(() => (init_transport_db(), transport_db_exports));
    await debitCredit2(input.companyId, `Commande ${order.orderRef} \u2014 ${input.customerName}`, "order", order.orderRef).catch(() => {
    });
    return order;
  }),
  // ─── ONLINE ORDERS (dashboard compagnie) ──────────────────────────────────
  listOrders: companyProcedure2.query(
    ({ ctx }) => getOnlineOrdersByCompany(ctx.company.id)
  ),
  updateOrderStatus: companyProcedure2.input(
    z3.object({
      orderId: z3.number().int(),
      status: z3.enum(["nouvelle", "en_preparation", "prete", "livree", "annulee"])
    })
  ).mutation(({ input }) => updateOnlineOrderStatus(input.orderId, input.status)),
  // ─── STATS RESTAURATION ──────────────────────────────────────────────────
  restaurantStats: companyProcedure2.query(
    ({ ctx }) => getRestaurantStatsToday(ctx.company.id)
  ),
  // ─── DELIVERY ZONES (dashboard compagnie) ────────────────────────────────
  listDeliveryZones: companyProcedure2.query(
    ({ ctx }) => getDeliveryZonesByCompany(ctx.company.id)
  ),
  upsertDeliveryZone: companyProcedure2.input(
    z3.object({
      id: z3.number().int().optional(),
      name: z3.string().min(1).max(100),
      description: z3.string().max(300).optional(),
      extraMinutes: z3.number().int().min(0).max(120),
      active: z3.boolean().optional()
    })
  ).mutation(
    ({ ctx, input }) => upsertDeliveryZone({ ...input, companyId: ctx.company.id })
  ),
  deleteDeliveryZone: companyProcedure2.input(z3.object({ id: z3.number().int() })).mutation(({ ctx, input }) => deleteDeliveryZone(input.id, ctx.company.id)),
  // ─── PUBLIC DELIVERY ZONES ───────────────────────────────────────────────
  publicDeliveryZones: publicProcedure.input(z3.object({ companyId: z3.number().int() })).query(({ input }) => getPublicDeliveryZones(input.companyId)),
  // ─── SEED TEST MENUS (admin only) ────────────────────────────────────────
  seedTestMenus: publicProcedure.input(z3.object({ companyId: z3.number().int() })).mutation(async ({ input }) => {
    const companyId = input.companyId;
    const categories = [
      { name: "Entr\xE9es", description: "Plats d'entr\xE9e", sortOrder: 1 },
      { name: "Plats Principaux", description: "Nos sp\xE9cialit\xE9s", sortOrder: 2 },
      { name: "Boissons", description: "Boissons froides et chaudes", sortOrder: 3 },
      { name: "Desserts", description: "Nos desserts maison", sortOrder: 4 }
    ];
    const items = {
      "Entr\xE9es": [
        { name: "Salade Verte", description: "Salade fra\xEEche", price: "2500", prepTime: 5 },
        { name: "Soupe \xE0 l'Oignon", description: "Soupe gratin\xE9e", price: "3000", prepTime: 10 }
      ],
      "Plats Principaux": [
        { name: "Poulet R\xF4ti", description: "Poulet fermier", price: "7500", prepTime: 20 },
        { name: "Poisson Grill\xE9", description: "Poisson du jour", price: "8500", prepTime: 18 }
      ],
      "Boissons": [
        { name: "Eau Min\xE9rale", description: "50cl", price: "500", prepTime: 1 },
        { name: "Jus Frais", description: "Press\xE9 maison", price: "1500", prepTime: 3 }
      ],
      "Desserts": [
        { name: "Tiramisu", description: "Dessert italien", price: "3500", prepTime: 5 },
        { name: "Fruit Frais", description: "Assiette", price: "2500", prepTime: 3 }
      ]
    };
    try {
      const categoryIds = {};
      for (const category of categories) {
        const result = await createCategory({ companyId, ...category });
        categoryIds[category.name] = result.id;
      }
      let itemCount = 0;
      for (const [categoryName, categoryItems] of Object.entries(items)) {
        const categoryId = categoryIds[categoryName];
        for (const item of categoryItems) {
          await createItem({
            companyId,
            categoryId,
            name: item.name,
            description: item.description,
            priceXOF: item.price,
            available: true,
            preparationTime: item.prepTime,
            sortOrder: itemCount++
          });
        }
      }
      const zones = [
        { name: "Zone Centre", description: "Abidjan Centre", extraMinutes: 15 },
        { name: "Zone Plateau", description: "Plateau - Cocody", extraMinutes: 20 }
      ];
      for (const zone of zones) {
        await upsertDeliveryZone({ companyId, ...zone });
      }
      return { success: true, message: "Menus de test cr\xE9\xE9s" };
    } catch (error) {
      console.error("Erreur seed:", error);
      return { success: false, message: "Erreur lors de la cr\xE9ation" };
    }
  })
});

// server/routers/team.ts
import { z as z4 } from "zod";
import { TRPCError as TRPCError5 } from "@trpc/server";
init_db();
init_schema();
init_transport_db();
import { eq as eq5, and as and4, desc as desc4, asc as asc2 } from "drizzle-orm";
import * as bcrypt2 from "bcryptjs";
async function hashPin(pin) {
  return bcrypt2.hash(pin, 10);
}
async function verifyPin(pin, hash3) {
  return bcrypt2.compare(pin, hash3);
}
async function getMembersByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyMembers).where(eq5(companyMembers.companyId, companyId)).orderBy(asc2(companyMembers.role), asc2(companyMembers.lastName));
}
async function getMemberById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(companyMembers).where(eq5(companyMembers.id, id)).limit(1);
  return result[0] ?? null;
}
async function getMessagesByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(internalMessages).where(eq5(internalMessages.companyId, companyId)).orderBy(asc2(internalMessages.createdAt));
}
async function getUnreadCountForCompany(companyId, senderType) {
  const db = await getDb();
  if (!db) return 0;
  const { count: count2 } = await import("drizzle-orm");
  const result = await db.select({ cnt: count2() }).from(internalMessages).where(
    and4(
      eq5(internalMessages.companyId, companyId),
      eq5(internalMessages.isRead, false),
      eq5(internalMessages.senderType, senderType === "company" ? "csn" : "company")
    )
  );
  return Number(result[0]?.cnt ?? 0);
}
async function getTotalUnreadForCsn() {
  const db = await getDb();
  if (!db) return 0;
  const { count: count2 } = await import("drizzle-orm");
  const result = await db.select({ cnt: count2() }).from(internalMessages).where(
    and4(
      eq5(internalMessages.isRead, false),
      eq5(internalMessages.senderType, "company")
    )
  );
  return Number(result[0]?.cnt ?? 0);
}
var companyProcedure3 = protectedProcedure.use(async ({ ctx, next }) => {
  const company = await getCompanyByUserId(ctx.user.id);
  if (!company) {
    throw new TRPCError5({ code: "NOT_FOUND", message: "Aucune compagnie associ\xE9e \xE0 ce compte" });
  }
  if (company.status !== "active") {
    throw new TRPCError5({ code: "FORBIDDEN", message: "Votre compte compagnie n'est pas encore activ\xE9" });
  }
  return next({ ctx: { ...ctx, company } });
});
var csnProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError5({ code: "FORBIDDEN", message: "Acc\xE8s r\xE9serv\xE9 \xE0 l'administrateur NEXUS" });
  }
  return next({ ctx });
});
var teamRouter = router({
  // ─── TEAM MANAGEMENT ─────────────────────────────────────────────────────────
  // List all members of a company
  listMembers: companyProcedure3.query(async ({ ctx }) => {
    const members = await getMembersByCompany(ctx.company.id);
    return members.map(({ pinHash: _ph, ...m }) => m);
  }),
  // Add a new member (gérant only)
  addMember: companyProcedure3.input(
    z4.object({
      firstName: z4.string().min(1).max(100),
      lastName: z4.string().min(1).max(100),
      phone: z4.string().max(50).optional(),
      email: z4.string().email().max(320).optional(),
      role: z4.enum(["caissier", "employe"]),
      pin: z4.string().length(4).regex(/^\d{4}$/, "Le PIN doit \xEAtre 4 chiffres")
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    const pinHash = await hashPin(input.pin);
    await db.insert(companyMembers).values({
      companyId: ctx.company.id,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      email: input.email ?? null,
      role: input.role,
      pinHash,
      isActive: true
    });
    return { success: true };
  }),
  // Update member role or status
  updateMember: companyProcedure3.input(
    z4.object({
      memberId: z4.number(),
      role: z4.enum(["caissier", "employe"]).optional(),
      isActive: z4.boolean().optional(),
      phone: z4.string().max(50).optional(),
      email: z4.string().email().max(320).optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    const member = await getMemberById(input.memberId);
    if (!member || member.companyId !== ctx.company.id) {
      throw new TRPCError5({ code: "NOT_FOUND", message: "Membre introuvable" });
    }
    const { memberId, ...updates } = input;
    await db.update(companyMembers).set(updates).where(eq5(companyMembers.id, memberId));
    return { success: true };
  }),
  // Reset PIN for a member
  resetPin: companyProcedure3.input(
    z4.object({
      memberId: z4.number(),
      newPin: z4.string().length(4).regex(/^\d{4}$/, "Le PIN doit \xEAtre 4 chiffres")
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    const member = await getMemberById(input.memberId);
    if (!member || member.companyId !== ctx.company.id) {
      throw new TRPCError5({ code: "NOT_FOUND", message: "Membre introuvable" });
    }
    const pinHash = await hashPin(input.newPin);
    await db.update(companyMembers).set({ pinHash }).where(eq5(companyMembers.id, input.memberId));
    return { success: true };
  }),
  // Delete a member
  deleteMember: companyProcedure3.input(z4.object({ memberId: z4.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    const member = await getMemberById(input.memberId);
    if (!member || member.companyId !== ctx.company.id) {
      throw new TRPCError5({ code: "NOT_FOUND", message: "Membre introuvable" });
    }
    await db.delete(companyMembers).where(eq5(companyMembers.id, input.memberId));
    return { success: true };
  }),
  // Verify PIN for a member (for cashier login)
  verifyMemberPin: publicProcedure.input(
    z4.object({
      companyId: z4.number(),
      memberId: z4.number(),
      pin: z4.string().length(4)
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    const result = await db.select().from(companyMembers).where(
      and4(
        eq5(companyMembers.id, input.memberId),
        eq5(companyMembers.companyId, input.companyId),
        eq5(companyMembers.isActive, true)
      )
    ).limit(1);
    const member = result[0];
    if (!member) throw new TRPCError5({ code: "NOT_FOUND", message: "Membre introuvable ou inactif" });
    if (!member.pinHash) throw new TRPCError5({ code: "BAD_REQUEST", message: "Aucun PIN configur\xE9" });
    const valid = await verifyPin(input.pin, member.pinHash);
    if (!valid) throw new TRPCError5({ code: "UNAUTHORIZED", message: "PIN incorrect" });
    await db.update(companyMembers).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq5(companyMembers.id, input.memberId));
    const { pinHash: _ph, ...memberData } = member;
    return { success: true, member: memberData };
  }),
  // Get members by companyId (public, for PIN login screen)
  listMembersPublic: publicProcedure.input(z4.object({ companyId: z4.number() })).query(async ({ input }) => {
    const members = await getMembersByCompany(input.companyId);
    return members.filter((m) => m.isActive).map(({ pinHash: _ph, ...m }) => ({ id: m.id, firstName: m.firstName, lastName: m.lastName, role: m.role }));
  }),
  // ─── INTERNAL MESSAGES ───────────────────────────────────────────────────────
  // Send a message (company side)
  sendMessageAsCompany: companyProcedure3.input(z4.object({ content: z4.string().min(1).max(2e3) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(internalMessages).values({
      companyId: ctx.company.id,
      senderType: "company",
      senderId: ctx.user.id,
      senderName: ctx.company.companyName,
      content: input.content,
      isRead: false
    });
    return { success: true };
  }),
  // Send a message (NEXUS side)
  sendMessageAsCsn: csnProcedure2.input(z4.object({ companyId: z4.number(), content: z4.string().min(1).max(2e3) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(internalMessages).values({
      companyId: input.companyId,
      senderType: "csn",
      senderId: ctx.user.id,
      senderName: "Support NEXUS NEXUS",
      content: input.content,
      isRead: false
    });
    return { success: true };
  }),
  // List messages for a company (company side)
  listMessagesForCompany: companyProcedure3.query(async ({ ctx }) => {
    const messages = await getMessagesByCompany(ctx.company.id);
    return messages;
  }),
  // List messages for a company (NEXUS side)
  listMessagesForCsn: csnProcedure2.input(z4.object({ companyId: z4.number() })).query(async ({ input }) => {
    return getMessagesByCompany(input.companyId);
  }),
  // Mark messages as read (company marks NEXUS messages as read)
  markReadAsCompany: companyProcedure3.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(internalMessages).set({ isRead: true }).where(
      and4(
        eq5(internalMessages.companyId, ctx.company.id),
        eq5(internalMessages.senderType, "csn"),
        eq5(internalMessages.isRead, false)
      )
    );
    return { success: true };
  }),
  // Mark messages as read (NEXUS marks company messages as read)
  markReadAsCsn: csnProcedure2.input(z4.object({ companyId: z4.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError5({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(internalMessages).set({ isRead: true }).where(
      and4(
        eq5(internalMessages.companyId, input.companyId),
        eq5(internalMessages.senderType, "company"),
        eq5(internalMessages.isRead, false)
      )
    );
    return { success: true };
  }),
  // Get unread count for company (messages from NEXUS not yet read)
  unreadCountForCompany: companyProcedure3.query(async ({ ctx }) => {
    return getUnreadCountForCompany(ctx.company.id, "company");
  }),
  // Get total unread count for NEXUS (messages from all companies)
  totalUnreadForCsn: csnProcedure2.query(async () => {
    return getTotalUnreadForCsn();
  }),
  // Get list of companies with message count (for NEXUS inbox)
  companiesWithMessages: csnProcedure2.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const { transportCompanies: transportCompanies2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
    const { count: count2, sql: sql7 } = await import("drizzle-orm");
    const companies = await db.select({
      id: transportCompanies2.id,
      companyName: transportCompanies2.companyName,
      activityType: transportCompanies2.activityType,
      logoUrl: transportCompanies2.logoUrl
    }).from(transportCompanies2).where(eq5(transportCompanies2.status, "active")).orderBy(asc2(transportCompanies2.companyName));
    const unreadCounts = await db.select({
      companyId: internalMessages.companyId,
      unread: count2()
    }).from(internalMessages).where(
      and4(
        eq5(internalMessages.isRead, false),
        eq5(internalMessages.senderType, "company")
      )
    ).groupBy(internalMessages.companyId);
    const unreadMap = new Map(unreadCounts.map((u) => [u.companyId, Number(u.unread)]));
    const lastMessages = await db.select({
      companyId: internalMessages.companyId,
      content: internalMessages.content,
      createdAt: internalMessages.createdAt
    }).from(internalMessages).orderBy(desc4(internalMessages.createdAt));
    const lastMessageMap = /* @__PURE__ */ new Map();
    for (const msg of lastMessages) {
      if (!lastMessageMap.has(msg.companyId)) {
        lastMessageMap.set(msg.companyId, { content: msg.content, createdAt: msg.createdAt });
      }
    }
    return companies.map((c) => ({
      ...c,
      unreadCount: unreadMap.get(c.id) ?? 0,
      lastMessage: lastMessageMap.get(c.id) ?? null
    }));
  })
});

// server/routers/photos.ts
init_schema();
init_db();
import { TRPCError as TRPCError6 } from "@trpc/server";
import { and as and5, asc as asc3, desc as desc5, eq as eq6, inArray } from "drizzle-orm";
import { z as z5 } from "zod";
init_storage();
function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}
var companyProcedure4 = protectedProcedure.use(async ({ ctx, next }) => {
  const db = await getDb();
  if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
  const company = await db.select().from(transportCompanies).where(eq6(transportCompanies.userId, ctx.user.id)).limit(1).then((r) => r[0]);
  if (!company) throw new TRPCError6({ code: "NOT_FOUND", message: "Aucune compagnie associ\xE9e" });
  if (company.status !== "active")
    throw new TRPCError6({ code: "FORBIDDEN", message: "Compte compagnie non activ\xE9" });
  return next({ ctx: { ...ctx, company } });
});
var photosRouter = router({
  // Upload une photo (base64 → S3 → DB)
  uploadPhoto: companyProcedure4.input(
    z5.object({
      base64: z5.string().min(10),
      // data:image/...;base64,...
      mimeType: z5.string().regex(/^image\/(jpeg|png|webp|gif)$/),
      caption: z5.string().max(300).default("")
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    const base64Data = input.base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.byteLength > 5 * 1024 * 1024) {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "Image trop lourde (max 5 Mo)" });
    }
    const ext = input.mimeType.split("/")[1];
    const fileKey = `company-photos/${ctx.company.id}/${randomSuffix()}.${ext}`;
    const { url } = await storagePut(fileKey, buffer, input.mimeType);
    const existing = await db.select({ id: companyPhotos.id }).from(companyPhotos).where(eq6(companyPhotos.companyId, ctx.company.id));
    const [photo] = await db.insert(companyPhotos).values({
      companyId: ctx.company.id,
      url,
      fileKey,
      caption: input.caption,
      sortOrder: existing.length
    }).returning({ id: companyPhotos.id });
    return { id: photo.id, url, caption: input.caption };
  }),
  // Lister les photos d'une compagnie (dashboard — protégé)
  listMyPhotos: companyProcedure4.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(companyPhotos).where(eq6(companyPhotos.companyId, ctx.company.id)).orderBy(asc3(companyPhotos.sortOrder), asc3(companyPhotos.createdAt));
  }),
  // Mettre à jour la légende d'une photo
  updateCaption: companyProcedure4.input(z5.object({ photoId: z5.number(), caption: z5.string().max(300) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    const photo = await db.select().from(companyPhotos).where(
      and5(eq6(companyPhotos.id, input.photoId), eq6(companyPhotos.companyId, ctx.company.id))
    ).limit(1).then((r) => r[0]);
    if (!photo) throw new TRPCError6({ code: "NOT_FOUND" });
    await db.update(companyPhotos).set({ caption: input.caption }).where(eq6(companyPhotos.id, input.photoId));
    return { success: true };
  }),
  // Supprimer une photo
  deletePhoto: companyProcedure4.input(z5.object({ photoId: z5.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    const photo = await db.select().from(companyPhotos).where(
      and5(eq6(companyPhotos.id, input.photoId), eq6(companyPhotos.companyId, ctx.company.id))
    ).limit(1).then((r) => r[0]);
    if (!photo) throw new TRPCError6({ code: "NOT_FOUND" });
    await db.delete(companyPhotos).where(eq6(companyPhotos.id, input.photoId));
    return { success: true };
  }),
  // Réordonner les photos (drag-and-drop)
  reorderPhotos: companyProcedure4.input(z5.object({ orderedIds: z5.array(z5.number()).min(1) })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    const existing = await db.select({ id: companyPhotos.id }).from(companyPhotos).where(eq6(companyPhotos.companyId, ctx.company.id));
    const ownedIds = new Set(existing.map((p) => p.id));
    for (const id of input.orderedIds) {
      if (!ownedIds.has(id)) throw new TRPCError6({ code: "FORBIDDEN", message: "Photo non autoris\xE9e" });
    }
    await Promise.all(
      input.orderedIds.map(
        (id, index) => db.update(companyPhotos).set({ sortOrder: index }).where(eq6(companyPhotos.id, id))
      )
    );
    return { success: true };
  }),
  // ─── PUBLIC ────────────────────────────────────────────────────────────────
  // Liste des compagnies actives avec au moins 1 photo (pour la page Bibliothèque)
  listCompaniesWithPhotos: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const companies = await db.select({
      id: transportCompanies.id,
      companyName: transportCompanies.companyName,
      activityType: transportCompanies.activityType,
      logoUrl: transportCompanies.logoUrl,
      countryId: transportCompanies.countryId,
      cityId: transportCompanies.cityId
    }).from(transportCompanies).where(eq6(transportCompanies.status, "active")).orderBy(asc3(transportCompanies.companyName));
    const photoCounts = await db.select({ companyId: companyPhotos.companyId }).from(companyPhotos);
    const countMap = /* @__PURE__ */ new Map();
    for (const p of photoCounts) {
      countMap.set(p.companyId, (countMap.get(p.companyId) ?? 0) + 1);
    }
    return companies.map((c) => ({
      ...c,
      photoCount: countMap.get(c.id) ?? 0
    }));
  }),
  // Galerie publique d'une compagnie (par slug ou id)
  getCompanyGallery: publicProcedure.input(z5.object({ companyId: z5.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { company: null, photos: [] };
    const company = await db.select({
      id: transportCompanies.id,
      companyName: transportCompanies.companyName,
      activityType: transportCompanies.activityType,
      logoUrl: transportCompanies.logoUrl,
      countryId: transportCompanies.countryId,
      cityId: transportCompanies.cityId
    }).from(transportCompanies).where(
      and5(
        eq6(transportCompanies.id, input.companyId),
        eq6(transportCompanies.status, "active")
      )
    ).limit(1).then((r) => r[0] ?? null);
    if (!company) return { company: null, photos: [] };
    const photos = await db.select().from(companyPhotos).where(eq6(companyPhotos.companyId, input.companyId)).orderBy(asc3(companyPhotos.sortOrder), asc3(companyPhotos.createdAt));
    return { company, photos };
  }),
  // Récupérer les détails d'une compagnie (pour page de partage)
  getCompanyById: publicProcedure.input(z5.object({ id: z5.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const company = await db.select({
      id: transportCompanies.id,
      companyName: transportCompanies.companyName,
      activityType: transportCompanies.activityType,
      logoUrl: transportCompanies.logoUrl,
      galleryImageUrl: transportCompanies.galleryImageUrl,
      description: transportCompanies.description,
      phone: transportCompanies.phone,
      email: transportCompanies.email,
      address: transportCompanies.address
    }).from(transportCompanies).where(
      and5(
        eq6(transportCompanies.id, input.id),
        eq6(transportCompanies.status, "active")
      )
    ).limit(1).then((r) => r[0] ?? null);
    return company;
  }),
  // Première photo d'une compagnie (pour bannière dans le répertoire)
  getFirstPhoto: publicProcedure.input(z5.object({ companyId: z5.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const photo = await db.select({ url: companyPhotos.url, caption: companyPhotos.caption }).from(companyPhotos).where(eq6(companyPhotos.companyId, input.companyId)).orderBy(asc3(companyPhotos.sortOrder), asc3(companyPhotos.createdAt)).limit(1).then((r) => r[0] ?? null);
    return photo;
  }),
  // Photos récentes de compagnies actives ou en attente (pour le carrousel page d'accueil)
  recentPublic: publicProcedure.input(z5.object({ limit: z5.number().min(1).max(30).default(12) }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select({
      id: companyPhotos.id,
      url: companyPhotos.url,
      caption: companyPhotos.caption,
      companyId: companyPhotos.companyId,
      companyName: transportCompanies.companyName,
      logoUrl: transportCompanies.logoUrl
    }).from(companyPhotos).innerJoin(transportCompanies, eq6(companyPhotos.companyId, transportCompanies.id)).where(inArray(transportCompanies.status, ["active", "pending"])).orderBy(desc5(companyPhotos.createdAt)).limit(input?.limit ?? 12);
    return rows;
  }),
  // Compagnies pour le carrousel (avec ou sans photos) — affiche logos + noms
  companiesForCarousel: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const companies = await db.select({
      id: transportCompanies.id,
      companyName: transportCompanies.companyName,
      logoUrl: transportCompanies.logoUrl,
      galleryImageUrl: transportCompanies.galleryImageUrl,
      description: transportCompanies.description,
      status: transportCompanies.status,
      activityType: transportCompanies.activityType
    }).from(transportCompanies).orderBy(desc5(transportCompanies.createdAt)).limit(50);
    console.log("[companiesForCarousel] Retournant", companies.length, "compagnies");
    return companies;
  }),
  // Premières photos de plusieurs compagnies en une seule requête (batch pour le répertoire)
  getBannerPhotos: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};
    const photos = await db.select({
      companyId: companyPhotos.companyId,
      url: companyPhotos.url,
      caption: companyPhotos.caption,
      sortOrder: companyPhotos.sortOrder
    }).from(companyPhotos).orderBy(asc3(companyPhotos.sortOrder), asc3(companyPhotos.createdAt));
    const bannerMap = {};
    for (const p of photos) {
      if (!(p.companyId in bannerMap)) {
        bannerMap[p.companyId] = { url: p.url, caption: p.caption ?? null };
      }
    }
    return bannerMap;
  }),
  // Upload une image de galerie pour remplacer le logo dans le carrousel
  uploadGalleryImage: companyProcedure4.input(
    z5.object({
      base64: z5.string().min(10),
      // data:image/...;base64,...
      mimeType: z5.string().regex(/^image\/(jpeg|png|webp)$/)
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError6({ code: "INTERNAL_SERVER_ERROR" });
    const base64Data = input.base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.byteLength > 5 * 1024 * 1024) {
      throw new TRPCError6({ code: "BAD_REQUEST", message: "Image trop lourde (max 5 Mo)" });
    }
    const ext = input.mimeType.split("/")[1];
    const fileKey = `gallery-images/${ctx.company.id}/${randomSuffix()}.${ext}`;
    const { url } = await storagePut(fileKey, buffer, input.mimeType);
    return { url };
  })
});

// server/routers/recruitment.ts
import { z as z6 } from "zod";
init_db();
init_schema();
import { desc as desc6, eq as eq7 } from "drizzle-orm";
import { TRPCError as TRPCError7 } from "@trpc/server";
var educationLevels = ["brevet", "bac", "bac+2", "bac+3", "bac+4", "bac+5", "doctorat", "autre"];
var languages = ["francais", "espagnol", "anglais"];
var statuses = ["nouveau", "contacte", "entretien", "retenu", "rejete"];
var experienceLevels = ["aucune", "moins_1an", "1_3ans", "3_5ans", "plus_5ans"];
var targetSectors = ["transport", "restauration", "hotel", "boutique", "agence_voyage", "tous"];
var candidateSchema = z6.object({
  firstName: z6.string().min(2).max(100),
  lastName: z6.string().min(2).max(100),
  phone: z6.string().min(8).max(50),
  email: z6.string().email().max(320),
  country: z6.string().min(2).max(100),
  city: z6.string().min(2).max(100),
  educationLevel: z6.enum(educationLevels),
  language: z6.enum(languages),
  // Nouveaux champs enrichis
  experience: z6.enum(experienceLevels).optional(),
  targetSector: z6.enum(targetSectors).optional(),
  motivation: z6.string().max(2e3).optional(),
  cvUrl: z6.string().url().max(1e3).optional(),
  cvKey: z6.string().max(500).optional(),
  coverLetterUrl: z6.string().url().max(1e3).optional(),
  coverLetterKey: z6.string().max(500).optional()
});
var recruitmentRouter = {
  // ── PUBLIC : soumettre une candidature ──────────────────────────────────────
  submit: publicProcedure.input(candidateSchema).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
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
      status: "nouveau"
    });
    try {
      const { notifyOwner: notifyOwner2 } = await Promise.resolve().then(() => (init_notification(), notification_exports));
      await notifyOwner2({
        title: `\u{1F3AF} Nouvelle candidature BD \u2014 ${input.firstName} ${input.lastName}`,
        content: `Pays : ${input.country} | Ville : ${input.city}
Niveau : ${input.educationLevel} | Exp\xE9rience : ${input.experience ?? "non pr\xE9cis\xE9e"}
Secteur cible : ${input.targetSector ?? "tous"}
Email : ${input.email} | T\xE9l : ${input.phone}
CV joint : ${input.cvUrl ? "Oui" : "Non"} | LM jointe : ${input.coverLetterUrl ? "Oui" : "Non"}`
      });
    } catch (_) {
    }
    return { success: true };
  }),
  // ── ADMIN : liste des candidats ─────────────────────────────────────────────
  list: protectedProcedure.input(z6.object({
    search: z6.string().optional(),
    status: z6.enum([...statuses, "all"]).default("all")
  }).optional()).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError7({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];
    let query = db.select().from(commercialCandidates).$dynamic();
    if (input?.status && input.status !== "all") {
      query = query.where(eq7(commercialCandidates.status, input.status));
    }
    const rows = await query.orderBy(desc6(commercialCandidates.createdAt));
    if (input?.search) {
      const s = input.search.toLowerCase();
      return rows.filter(
        (r) => r.firstName.toLowerCase().includes(s) || r.lastName.toLowerCase().includes(s) || r.email.toLowerCase().includes(s) || r.phone.includes(s) || r.city.toLowerCase().includes(s) || r.country.toLowerCase().includes(s)
      );
    }
    return rows;
  }),
  // ── ADMIN : mettre à jour le statut ────────────────────────────────────────
  updateStatus: protectedProcedure.input(z6.object({
    id: z6.number(),
    status: z6.enum(statuses)
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError7({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(commercialCandidates).set({ status: input.status }).where(eq7(commercialCandidates.id, input.id));
    return { success: true };
  }),
  // ── ADMIN : ajouter une note ────────────────────────────────────────────────
  addNote: protectedProcedure.input(z6.object({ id: z6.number(), notes: z6.string().max(2e3) })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError7({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(commercialCandidates).set({ notes: input.notes }).where(eq7(commercialCandidates.id, input.id));
    return { success: true };
  }),
  // ── ADMIN : supprimer un candidat ───────────────────────────────────────────
  delete: protectedProcedure.input(z6.object({ id: z6.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError7({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError7({ code: "INTERNAL_SERVER_ERROR" });
    await db.delete(commercialCandidates).where(eq7(commercialCandidates.id, input.id));
    return { success: true };
  }),
  // ── ADMIN : statistiques rapides ───────────────────────────────────────────
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError7({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return { total: 0, nouveau: 0, contacte: 0, entretien: 0, retenu: 0, rejete: 0 };
    const rows = await db.select().from(commercialCandidates);
    return {
      total: rows.length,
      nouveau: rows.filter((r) => r.status === "nouveau").length,
      contacte: rows.filter((r) => r.status === "contacte").length,
      entretien: rows.filter((r) => r.status === "entretien").length,
      retenu: rows.filter((r) => r.status === "retenu").length,
      rejete: rows.filter((r) => r.status === "rejete").length
    };
  })
};

// server/routers/chatbot.ts
import { z as z7 } from "zod";
init_db();
init_schema();
import { desc as desc7, eq as eq8, and as and6 } from "drizzle-orm";
import { TRPCError as TRPCError8 } from "@trpc/server";

// server/_core/llm.ts
init_env();
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://api.openai.com/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("LLM API key is not configured. Set BUILT_IN_FORGE_API_KEY or OPENAI_API_KEY.");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/routers/chatbot.ts
import { nanoid } from "nanoid";
var SYSTEM_PROMPT = `Tu es l'agent virtuel de NEXUS, la plateforme multi-services en Afrique de l'Ouest.

Ton r\xF4le :
- Accueillir chaleureusement les visiteurs
- R\xE9pondre aux questions sur NEXUS : transport, h\xF4tel, restauration, exp\xE9dition de colis, boutique, agences de voyage
- Orienter les visiteurs vers les bonnes sections du site
- Informer sur le programme de recrutement des Business D\xE9veloppeurs si demand\xE9
- Inviter les compagnies \xE0 rejoindre la plateforme via "Inscrire mon entreprise"
- Rester concis (max 3 phrases par r\xE9ponse), professionnel et bienveillant
- Si la question d\xE9passe tes comp\xE9tences, proposer de mettre en relation avec un agent NEXUS

### INFORMATIONS ESSENTIELLES SUR NEXUS

**Syst\xE8me de cr\xE9dits :**
- 1 cr\xE9dit = 125 FCFA
- 1 r\xE9servation = 1 cr\xE9dit consomm\xE9
- Minimum requis pour recevoir des r\xE9servations : 1 cr\xE9dit
- Montant minimum initial : 10 000 FCFA (= 80 cr\xE9dits)

**Frais de mise en service pour les compagnies :**
- Frais unique : 100 000 FCFA
- R\xE9partition : 75% pour NEXUS, 25% (25 000 FCFA) pour le Business D\xE9veloppeur qui a recrut\xE9

**Business D\xE9veloppeurs (BDev) :**
- Inscription gratuite
- Prime de recrutement : 25 000 FCFA par compagnie inscrite
- Commission : 25 FCFA par cr\xE9dit achet\xE9 par les compagnies recrut\xE9es
- Salaire de base : 250 000 FCFA/mois apr\xE8s 100 compagnies recrut\xE9es

**Contact :**
- T\xE9l\xE9phone : +225 0504921096 / 0701578857
- Email : support@nexus.africa
- Si\xE8ge : Abidjan, Cocody Rivi\xE8ra 2`;
var chatbotRouter = {
  // ── PUBLIC : démarrer une session ───────────────────────────────────────────
  startSession: publicProcedure.input(z7.object({
    visitorName: z7.string().min(1).max(100).default("Visiteur"),
    visitorEmail: z7.string().email().optional()
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      return {
        token: nanoid(64),
        sessionId: void 0,
        fallback: true
      };
    }
    const token = nanoid(64);
    await db.insert(chatbotSessions).values({
      sessionToken: token,
      visitorName: input.visitorName,
      visitorEmail: input.visitorEmail ?? null,
      status: "open",
      csnTookOver: false
    });
    const session = await db.select().from(chatbotSessions).where(eq8(chatbotSessions.sessionToken, token)).then((r) => r[0]);
    if (session) {
      await db.insert(chatbotMessages).values({
        sessionId: session.id,
        role: "assistant",
        content: `Bonjour ${input.visitorName} ! \u{1F44B} Je suis l'agent virtuel de **NEXUS**. Comment puis-je vous aider aujourd'hui ? Vous pouvez me poser des questions sur nos services de transport, d'exp\xE9dition, de restauration, ou sur comment rejoindre notre r\xE9seau de compagnies partenaires.`,
        isRead: true
      });
    }
    return { token, sessionId: session?.id };
  }),
  // ── PUBLIC : envoyer un message (réponse IA automatique) ───────────────────
  sendMessage: publicProcedure.input(z7.object({
    token: z7.string().length(64),
    content: z7.string().min(1).max(2e3)
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      return {
        aiResponse: "Je suis l'assistant NEXUS. La base de donn\xE9es n'est pas encore configur\xE9e. Contactez-nous directement au +225 0504921096 ou par email \xE0 support@nexus.africa.",
        waitingForCSN: false
      };
    }
    const session = await db.select().from(chatbotSessions).where(eq8(chatbotSessions.sessionToken, input.token)).then((r) => r[0]);
    if (!session) throw new TRPCError8({ code: "NOT_FOUND", message: "Session introuvable" });
    if (session.status === "closed") throw new TRPCError8({ code: "BAD_REQUEST", message: "Session ferm\xE9e" });
    await db.insert(chatbotMessages).values({
      sessionId: session.id,
      role: "user",
      content: input.content,
      isRead: false
    });
    await db.update(chatbotSessions).set({ status: "pending_csn", updatedAt: /* @__PURE__ */ new Date() }).where(eq8(chatbotSessions.id, session.id));
    if (session.humanTakeoverActive) {
      return { aiResponse: null, waitingForCSN: true, humanTakeover: true };
    }
    const history = await db.select().from(chatbotMessages).where(eq8(chatbotMessages.sessionId, session.id)).orderBy(chatbotMessages.createdAt).limit(20);
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.filter((m) => m.role === "user" || m.role === "assistant").map((m) => ({
        role: m.role,
        content: m.content
      }))
    ];
    let aiContent = "Bonjour ! Je suis l'assistant NEXUS. Je ne suis pas encore connect\xE9 \xE0 l'IA compl\xE8te, mais un agent humain peut vous aider. Contactez-nous au +225 0504921096 ou via support@nexus.africa.";
    try {
      const llmResponse = await invokeLLM({ messages });
      const rawContent = llmResponse?.choices?.[0]?.message?.content;
      if (typeof rawContent === "string") aiContent = rawContent;
    } catch (err) {
      console.warn("[Chatbot] LLM non disponible:", String(err));
    }
    await db.insert(chatbotMessages).values({
      sessionId: session.id,
      role: "assistant",
      content: aiContent,
      isRead: true
    });
    return { aiResponse: aiContent, waitingForCSN: false };
  }),
  // ── PUBLIC : récupérer les messages d'une session ──────────────────────────
  getMessages: publicProcedure.input(z7.object({ token: z7.string().length(64) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const session = await db.select().from(chatbotSessions).where(eq8(chatbotSessions.sessionToken, input.token)).then((r) => r[0]);
    if (!session) return [];
    return db.select().from(chatbotMessages).where(eq8(chatbotMessages.sessionId, session.id)).orderBy(chatbotMessages.createdAt);
  }),
  // ── PUBLIC : obtenir le statut d'une session ───────────────────────────────
  getSession: publicProcedure.input(z7.object({ token: z7.string().length(64) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    return db.select().from(chatbotSessions).where(eq8(chatbotSessions.sessionToken, input.token)).then((r) => r[0] ?? null);
  }),
  // ── ADMIN : liste des sessions (ouvertes en priorité) ─────────────────────
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError8({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];
    const sessions = await db.select().from(chatbotSessions).orderBy(desc7(chatbotSessions.updatedAt));
    const allUnread = await db.select().from(chatbotMessages).where(and6(eq8(chatbotMessages.role, "user"), eq8(chatbotMessages.isRead, false)));
    return sessions.map((s) => ({
      ...s,
      unreadCount: allUnread.filter((m) => m.sessionId === s.id).length
    }));
  }),
  // ── ADMIN : messages d'une session ─────────────────────────────────────────
  getSessionMessages: protectedProcedure.input(z7.object({ sessionId: z7.number() })).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError8({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];
    await db.update(chatbotMessages).set({ isRead: true }).where(and6(eq8(chatbotMessages.sessionId, input.sessionId), eq8(chatbotMessages.role, "user")));
    return db.select().from(chatbotMessages).where(eq8(chatbotMessages.sessionId, input.sessionId)).orderBy(chatbotMessages.createdAt);
  }),
  // ── ADMIN : répondre en tant qu'agent NEXUS ──────────────────────────────────
  replyAsCSN: protectedProcedure.input(z7.object({
    sessionId: z7.number(),
    content: z7.string().min(1).max(2e3)
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError8({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(chatbotSessions).set({ csnTookOver: true, status: "open", updatedAt: /* @__PURE__ */ new Date() }).where(eq8(chatbotSessions.id, input.sessionId));
    await db.insert(chatbotMessages).values({
      sessionId: input.sessionId,
      role: "csn",
      content: input.content,
      isRead: true
    });
    return { success: true };
  }),
  // ── ADMIN : prendre le relais de l'IA (suspendre l'IA) ──────────────────────────────────────────────────────────────────────
  takeoverSession: protectedProcedure.input(z7.object({ sessionId: z7.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError8({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(chatbotSessions).set({
      humanTakeoverActive: true,
      humanTakeoverAt: /* @__PURE__ */ new Date(),
      csnTookOver: true,
      status: "open",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(chatbotSessions.id, input.sessionId));
    await db.insert(chatbotMessages).values({
      sessionId: input.sessionId,
      role: "csn",
      content: "Un agent NEXUS a pris le relais. Vous etes maintenant en conversation directe avec notre equipe.",
      isRead: true
    });
    return { success: true };
  }),
  // ── ADMIN : rendre la main a l'IA ─────────────────────────────────────────────────────────────────────────────────────
  releaseSession: protectedProcedure.input(z7.object({ sessionId: z7.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError8({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(chatbotSessions).set({
      humanTakeoverActive: false,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(chatbotSessions.id, input.sessionId));
    await db.insert(chatbotMessages).values({
      sessionId: input.sessionId,
      role: "assistant",
      content: "L'assistant IA NEXUS reprend la conversation. Comment puis-je vous aider ?",
      isRead: true
    });
    return { success: true };
  }),
  // ── ADMIN : fermer une session ──────────────────────────────────────────────
  markClosed: protectedProcedure.input(z7.object({ sessionId: z7.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError8({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(chatbotSessions).set({ status: "closed", updatedAt: /* @__PURE__ */ new Date() }).where(eq8(chatbotSessions.id, input.sessionId));
    return { success: true };
  }),
  //  // ── ADMIN : compteur de sessions non lues ──────────────────────────────
  unreadSessionsCount: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") return 0;
    const db = await getDb();
    if (!db) return 0;
    const unread = await db.select().from(chatbotMessages).where(and6(eq8(chatbotMessages.role, "user"), eq8(chatbotMessages.isRead, false)));
    const sessionIds = new Set(unread.map((m) => m.sessionId));
    return sessionIds.size;
  }),
  // ── ADMIN : intervenir et envoyer un message admin ──────────────────────
  sendAdminMessage: protectedProcedure.input(z7.object({
    sessionId: z7.number(),
    content: z7.string().min(1).max(2e3),
    reason: z7.string().optional()
    // motif de l'intervention
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError8({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(chatbotSessions).set({
      adminInterventionActive: true,
      adminId: ctx.user.id,
      adminInterventionAt: /* @__PURE__ */ new Date(),
      adminInterventionReason: input.reason ?? null,
      humanTakeoverActive: true,
      // Suspension de l'IA
      csnTookOver: true,
      status: "open",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(chatbotSessions.id, input.sessionId));
    await db.insert(chatbotMessages).values({
      sessionId: input.sessionId,
      role: "csn",
      content: input.content,
      isRead: true
    });
    return { success: true };
  }),
  // ── ADMIN : escalader vers un agent humain ────────────────────────────────
  escalateToHuman: protectedProcedure.input(z7.object({
    sessionId: z7.number(),
    reason: z7.string()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError8({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(chatbotSessions).set({
      adminInterventionActive: true,
      adminId: ctx.user.id,
      adminInterventionAt: /* @__PURE__ */ new Date(),
      adminInterventionReason: input.reason,
      humanTakeoverActive: true,
      csnTookOver: true,
      status: "open",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(chatbotSessions.id, input.sessionId));
    await db.insert(chatbotMessages).values({
      sessionId: input.sessionId,
      role: "csn",
      content: `Un agent NEXUS sp\xE9cialis\xE9 a pris le relais pour mieux vous aider. Motif : ${input.reason}. Merci de votre patience.`,
      isRead: true
    });
    return { success: true };
  }),
  // ── ADMIN : libérer la session (rendre à l'IA) ────────────────────────────
  releaseFromAdmin: protectedProcedure.input(z7.object({ sessionId: z7.number() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError8({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(chatbotSessions).set({
      adminInterventionActive: false,
      humanTakeoverActive: false,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq8(chatbotSessions.id, input.sessionId));
    await db.insert(chatbotMessages).values({
      sessionId: input.sessionId,
      role: "assistant",
      content: "L'assistant IA reprend la conversation. Comment puis-je vous aider ?",
      isRead: true
    });
    return { success: true };
  }),
  // ── CHAT EN TEMPS RÉEL : envoyer un message (visiteur ou admin) ─────────────
  sendChatMessage: publicProcedure.input(z7.object({
    sessionToken: z7.string(),
    message: z7.string().min(1).max(2e3),
    senderRole: z7.enum(["user", "csn"])
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR" });
    const sessions = await db.select().from(chatbotSessions).where(eq8(chatbotSessions.sessionToken, input.sessionToken));
    const session = sessions[0];
    if (!session) throw new TRPCError8({ code: "NOT_FOUND", message: "Session non trouv\xE9e" });
    const msg = await db.insert(chatbotMessages).values({
      sessionId: session.id,
      role: input.senderRole,
      content: input.message,
      isRead: input.senderRole === "csn"
      // Les messages NEXUS sont lus
    }).returning({ id: chatbotMessages.id });
    return {
      messageId: msg[0].id,
      sessionId: session.id,
      timestamp: /* @__PURE__ */ new Date()
    };
  }),
  // ── CHAT EN TEMPS RÉEL : récupérer l'historique des messages ───────────────
  getChatMessages: publicProcedure.input(z7.object({
    sessionToken: z7.string(),
    limit: z7.number().int().min(1).max(100).default(50)
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR" });
    const sessions = await db.select().from(chatbotSessions).where(eq8(chatbotSessions.sessionToken, input.sessionToken));
    const session = sessions[0];
    if (!session) throw new TRPCError8({ code: "NOT_FOUND", message: "Session non trouv\xE9e" });
    const messages = await db.select().from(chatbotMessages).where(eq8(chatbotMessages.sessionId, session.id)).orderBy(desc7(chatbotMessages.createdAt)).limit(input.limit);
    return messages.reverse();
  }),
  // ── ADMIN : marquer les messages comme lus ────────────────────────────────
  markMessagesAsRead: protectedProcedure.input(z7.object({
    sessionId: z7.number()
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError8({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError8({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(chatbotMessages).set({ isRead: true }).where(and6(
      eq8(chatbotMessages.sessionId, input.sessionId),
      eq8(chatbotMessages.role, "user")
    ));
    return { success: true };
  })
};

// server/routers/adminAuth.ts
init_schema();
init_db();
init_env();
import { TRPCError as TRPCError9 } from "@trpc/server";
import bcrypt3 from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { z as z8 } from "zod";
import { eq as eq9, desc as desc8 } from "drizzle-orm";
var ADMIN_COOKIE = "admin_session";
var ONE_YEAR_MS2 = 1e3 * 60 * 60 * 24 * 365;
async function getSecretKey() {
  return new TextEncoder().encode(ENV.cookieSecret + "_admin");
}
async function signAdminToken(payload) {
  const key = await getSecretKey();
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("365d").sign(key);
}
async function verifyAdminToken(token) {
  try {
    const key = await getSecretKey();
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}
async function requireAdmin(ctx) {
  const cookies = ctx.req.headers.cookie ?? "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  if (!match) throw new TRPCError9({ code: "UNAUTHORIZED", message: "Non connect\xE9" });
  const payload = await verifyAdminToken(decodeURIComponent(match[1]));
  if (!payload) throw new TRPCError9({ code: "UNAUTHORIZED", message: "Session expir\xE9e" });
  const db = await getDb();
  if (!db) throw new TRPCError9({ code: "INTERNAL_SERVER_ERROR" });
  const [admin] = await db.select().from(adminCredentials).where(eq9(adminCredentials.id, payload.adminId)).limit(1);
  if (!admin || !admin.isActive) throw new TRPCError9({ code: "UNAUTHORIZED", message: "Compte d\xE9sactiv\xE9" });
  return { admin, db };
}
var adminAuthRouter = router({
  // ─── Connexion admin par email + mot de passe ───────────────────────────────
  login: publicProcedure.input(z8.object({ email: z8.string().email(), password: z8.string().min(1) })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError9({ code: "INTERNAL_SERVER_ERROR" });
    const [admin] = await db.select().from(adminCredentials).where(eq9(adminCredentials.email, input.email.toLowerCase().trim())).limit(1);
    const ipAddress = ctx.req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ?? ctx.req.socket?.remoteAddress ?? "unknown";
    const userAgent = ctx.req.headers["user-agent"] ?? "";
    if (!admin || !admin.isActive) {
      if (admin) {
        await db.insert(adminLoginLogs).values({
          adminId: admin.id,
          email: admin.email,
          displayName: admin.displayName,
          ipAddress,
          userAgent,
          success: false
        });
      }
      throw new TRPCError9({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });
    }
    const valid = await bcrypt3.compare(input.password, admin.passwordHash);
    if (!valid) {
      await db.insert(adminLoginLogs).values({
        adminId: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        ipAddress,
        userAgent,
        success: false
      });
      throw new TRPCError9({ code: "UNAUTHORIZED", message: "Email ou mot de passe incorrect" });
    }
    await db.update(adminCredentials).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq9(adminCredentials.id, admin.id));
    await db.insert(adminLoginLogs).values({
      adminId: admin.id,
      email: admin.email,
      displayName: admin.displayName,
      ipAddress,
      userAgent,
      success: true
    });
    const token = await signAdminToken({ adminId: admin.id, email: admin.email });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(ADMIN_COOKIE, token, { ...cookieOptions, maxAge: ONE_YEAR_MS2 });
    return {
      success: true,
      admin: { id: admin.id, email: admin.email, displayName: admin.displayName }
    };
  }),
  // ─── Vérifier si l'admin est connecté ──────────────────────────────────────
  me: publicProcedure.query(async ({ ctx }) => {
    const cookies = ctx.req.headers.cookie ?? "";
    const match = cookies.match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
    if (!match) return null;
    const payload = await verifyAdminToken(decodeURIComponent(match[1]));
    if (!payload) return null;
    const db = await getDb();
    if (!db) return null;
    const [admin] = await db.select({ id: adminCredentials.id, email: adminCredentials.email, displayName: adminCredentials.displayName, isActive: adminCredentials.isActive }).from(adminCredentials).where(eq9(adminCredentials.id, payload.adminId)).limit(1);
    if (!admin || !admin.isActive) return null;
    return admin;
  }),
  // ─── Déconnexion admin ──────────────────────────────────────────────────────
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(ADMIN_COOKIE, { ...cookieOptions });
    return { success: true };
  }),
  // ─── Liste des profils admin ────────────────────────────────────────────────
  listAdmins: publicProcedure.query(async ({ ctx }) => {
    const { db } = await requireAdmin(ctx);
    return db.select({ id: adminCredentials.id, email: adminCredentials.email, displayName: adminCredentials.displayName, isActive: adminCredentials.isActive, lastLoginAt: adminCredentials.lastLoginAt, createdAt: adminCredentials.createdAt }).from(adminCredentials).orderBy(desc8(adminCredentials.createdAt));
  }),
  // ─── Ajouter un profil admin ────────────────────────────────────────────────
  addAdmin: publicProcedure.input(z8.object({ email: z8.string().email(), password: z8.string().min(4), displayName: z8.string().min(2) })).mutation(async ({ input, ctx }) => {
    const { db } = await requireAdmin(ctx);
    const passwordHash = await bcrypt3.hash(input.password, 12);
    await db.insert(adminCredentials).values({
      email: input.email.toLowerCase().trim(),
      passwordHash,
      displayName: input.displayName,
      isActive: true
    });
    return { success: true };
  }),
  // ─── Activer / Désactiver un profil admin ───────────────────────────────────
  toggleAdmin: publicProcedure.input(z8.object({ id: z8.number(), isActive: z8.boolean() })).mutation(async ({ input, ctx }) => {
    const { admin, db } = await requireAdmin(ctx);
    if (admin.id === input.id) throw new TRPCError9({ code: "BAD_REQUEST", message: "Impossible de se d\xE9sactiver soi-m\xEAme" });
    await db.update(adminCredentials).set({ isActive: input.isActive }).where(eq9(adminCredentials.id, input.id));
    return { success: true };
  }),
  // ─── Modifier le mot de passe d'un admin ───────────────────────────────────
  changePassword: publicProcedure.input(z8.object({ id: z8.number(), newPassword: z8.string().min(4) })).mutation(async ({ input, ctx }) => {
    const { db } = await requireAdmin(ctx);
    const passwordHash = await bcrypt3.hash(input.newPassword, 12);
    await db.update(adminCredentials).set({ passwordHash }).where(eq9(adminCredentials.id, input.id));
    return { success: true };
  }),
  // ─── Supprimer un profil admin ──────────────────────────────────────────────
  deleteAdmin: publicProcedure.input(z8.object({ id: z8.number() })).mutation(async ({ input, ctx }) => {
    const { admin, db } = await requireAdmin(ctx);
    if (admin.id === input.id) throw new TRPCError9({ code: "BAD_REQUEST", message: "Impossible de se supprimer soi-m\xEAme" });
    await db.delete(adminCredentials).where(eq9(adminCredentials.id, input.id));
    return { success: true };
  }),
  // ─── Journal des connexions ─────────────────────────────────────────────────
  loginLogs: publicProcedure.input(z8.object({ limit: z8.number().min(1).max(200).default(100) }).optional()).query(async ({ input, ctx }) => {
    const { db } = await requireAdmin(ctx);
    return db.select().from(adminLoginLogs).orderBy(desc8(adminLoginLogs.createdAt)).limit(input?.limit ?? 100);
  }),
  // ─── Liste des utilisateurs OAuth (pour promotion) ─────────────────────────
  listUsers: publicProcedure.query(async ({ ctx }) => {
    const { db } = await requireAdmin(ctx);
    return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc8(users.lastSignedIn));
  }),
  // ─── Promouvoir un utilisateur OAuth en admin ───────────────────────────────
  promoteUser: publicProcedure.input(z8.object({ userId: z8.number() })).mutation(async ({ input, ctx }) => {
    const { db } = await requireAdmin(ctx);
    await db.update(users).set({ role: "admin" }).where(eq9(users.id, input.userId));
    return { success: true };
  }),
  // ─── Rétrograder un utilisateur OAuth en user ──────────────────────────────
  demoteUser: publicProcedure.input(z8.object({ userId: z8.number() })).mutation(async ({ input, ctx }) => {
    const { db } = await requireAdmin(ctx);
    await db.update(users).set({ role: "user" }).where(eq9(users.id, input.userId));
    return { success: true };
  }),
  // ─── Bootstrap : Promouvoir un utilisateur par email (sans authentification) ──
  // Procédure publique pour promouvoir le premier administrateur
  bootstrapPromoteUserByEmail: publicProcedure.input(z8.object({ email: z8.string().email(), bootstrapSecret: z8.string() })).mutation(async ({ input }) => {
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET || "nexus-bootstrap-2026";
    if (input.bootstrapSecret !== bootstrapSecret) {
      throw new TRPCError9({ code: "UNAUTHORIZED", message: "Secret de bootstrap invalide" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError9({ code: "INTERNAL_SERVER_ERROR" });
    const [user] = await db.select().from(users).where(eq9(users.email, input.email.toLowerCase().trim())).limit(1);
    if (!user) {
      throw new TRPCError9({ code: "NOT_FOUND", message: `Utilisateur avec l'email ${input.email} non trouv\xE9` });
    }
    await db.update(users).set({ role: "admin" }).where(eq9(users.id, user.id));
    return { success: true, message: `L'utilisateur ${input.email} a \xE9t\xE9 promu en administrateur` };
  })
});

// server/routers/billing.ts
import { z as z9 } from "zod";
init_db();
init_schema();
import { eq as eq10, desc as desc9 } from "drizzle-orm";
import { TRPCError as TRPCError10 } from "@trpc/server";
import crypto from "crypto";
var CREDIT_COST_FCFA = 125;
var billingRouter = {
  // ── PUBLIC : créer une demande d'achat de crédits ────────────────────────────
  createCreditPurchase: publicProcedure.input(
    z9.object({
      companyId: z9.number().int().positive(),
      amountFcfa: z9.number().positive(),
      // montant en FCFA
      paymentMethod: z9.enum(["stripe", "hub2_mobile_money", "bank_transfer", "cash"])
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR" });
    const company = await db.select().from(transportCompanies).where(eq10(transportCompanies.id, input.companyId)).then((r) => r[0]);
    if (!company) {
      throw new TRPCError10({
        code: "NOT_FOUND",
        message: "Compagnie non trouv\xE9e"
      });
    }
    const creditsGranted = Math.floor(input.amountFcfa / CREDIT_COST_FCFA);
    if (creditsGranted === 0) {
      throw new TRPCError10({
        code: "BAD_REQUEST",
        message: `Le montant minimum est ${CREDIT_COST_FCFA} FCFA (1 cr\xE9dit)`
      });
    }
    const reference = `CP-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const purchase = await db.insert(creditPurchases).values({
      companyId: input.companyId,
      amountLocal: input.amountFcfa.toString(),
      creditsGranted,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      currency: "XOF",
      reference
    }).returning({ id: creditPurchases.id });
    let paymentLink = "";
    let stripePaymentIntentId = "";
    let hub2PaymentUrl = "";
    if (input.paymentMethod === "stripe") {
      stripePaymentIntentId = `pi_${crypto.randomBytes(16).toString("hex")}`;
      paymentLink = `https://stripe.com/pay/${stripePaymentIntentId}`;
    } else if (input.paymentMethod === "hub2_mobile_money") {
      hub2PaymentUrl = `https://hub2.example.com/pay/${reference}`;
      paymentLink = hub2PaymentUrl;
    }
    await db.update(creditPurchases).set({
      paymentLink,
      stripePaymentIntentId,
      hub2PaymentUrl
    }).where(eq10(creditPurchases.id, purchase[0].id));
    return {
      purchaseId: purchase[0].id,
      reference,
      amountFcfa: input.amountFcfa,
      creditsGranted,
      paymentLink,
      paymentMethod: input.paymentMethod
    };
  }),
  // ── ADMIN : confirmer le paiement et ajouter les crédits ──────────────────────
  confirmCreditPayment: protectedProcedure.input(
    z9.object({
      purchaseId: z9.number().int().positive()
    })
  ).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError10({ code: "FORBIDDEN" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR" });
    const purchase = await db.select().from(creditPurchases).where(eq10(creditPurchases.id, input.purchaseId)).then((r) => r[0]);
    if (!purchase) {
      throw new TRPCError10({
        code: "NOT_FOUND",
        message: "Achat de cr\xE9dits non trouv\xE9"
      });
    }
    if (purchase.paymentStatus !== "pending") {
      throw new TRPCError10({
        code: "BAD_REQUEST",
        message: `Le paiement a d\xE9j\xE0 le statut: ${purchase.paymentStatus}`
      });
    }
    let companyCredit = await db.select().from(companyCredits).where(eq10(companyCredits.companyId, purchase.companyId)).then((r) => r[0]);
    if (!companyCredit) {
      await db.insert(companyCredits).values({
        companyId: purchase.companyId,
        balance: 0,
        countryCode: "CI",
        currency: "XOF",
        pointPriceLocal: "125.00"
      });
      companyCredit = await db.select().from(companyCredits).where(eq10(companyCredits.companyId, purchase.companyId)).then((r) => r[0]);
    }
    const balanceBefore = companyCredit?.balance ?? 0;
    const balanceAfter = balanceBefore + purchase.creditsGranted;
    await db.update(companyCredits).set({
      balance: balanceAfter,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq10(companyCredits.companyId, purchase.companyId));
    await db.insert(creditTransactions).values({
      companyId: purchase.companyId,
      type: "credit",
      points: purchase.creditsGranted,
      amountLocal: purchase.amountLocal,
      description: `Achat de ${purchase.creditsGranted} cr\xE9dits`,
      refType: "purchase",
      refId: purchase.reference,
      balanceBefore,
      balanceAfter,
      reference: purchase.reference
    });
    await db.update(creditPurchases).set({
      paymentStatus: "completed",
      completedAt: /* @__PURE__ */ new Date()
    }).where(eq10(creditPurchases.id, input.purchaseId));
    return {
      success: true,
      purchaseId: input.purchaseId,
      creditsAdded: purchase.creditsGranted,
      newBalance: balanceAfter
    };
  }),
  // ── PUBLIC : obtenir le solde de crédits d'une compagnie ──────────────────────
  getCompanyCredits: publicProcedure.input(z9.object({ companyId: z9.number().int().positive() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR" });
    let companyCredit = await db.select().from(companyCredits).where(eq10(companyCredits.companyId, input.companyId)).then((r) => r[0]);
    if (!companyCredit) {
      await db.insert(companyCredits).values({
        companyId: input.companyId,
        balance: 0,
        countryCode: "CI",
        currency: "XOF",
        pointPriceLocal: "125.00"
      });
      companyCredit = await db.select().from(companyCredits).where(eq10(companyCredits.companyId, input.companyId)).then((r) => r[0]);
    }
    return {
      companyId: input.companyId,
      balance: companyCredit?.balance ?? 0,
      currency: companyCredit?.currency ?? "XOF",
      pointPrice: companyCredit?.pointPriceLocal ?? "125.00",
      equivalentFcfa: ((companyCredit?.balance ?? 0) * 125).toString()
    };
  }),
  // ── PUBLIC : historique des achats de crédits d'une compagnie ────────────────
  getCreditPurchaseHistory: publicProcedure.input(
    z9.object({
      companyId: z9.number().int().positive(),
      limit: z9.number().int().min(1).max(100).default(50)
    })
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR" });
    const purchases = await db.select().from(creditPurchases).where(eq10(creditPurchases.companyId, input.companyId)).orderBy(desc9(creditPurchases.createdAt)).limit(input.limit);
    return purchases.map((p) => ({
      id: p.id,
      reference: p.reference,
      amountFcfa: parseFloat(p.amountLocal),
      creditsGranted: p.creditsGranted,
      paymentMethod: p.paymentMethod,
      paymentStatus: p.paymentStatus,
      createdAt: p.createdAt,
      completedAt: p.completedAt
    }));
  }),
  // ── ADMIN : toutes les transactions de crédits (pour le dashboard NEXUS) ────────
  getAllCreditTransactions: protectedProcedure.input(
    z9.object({
      limit: z9.number().int().min(1).max(100).default(50),
      offset: z9.number().int().min(0).default(0)
    })
  ).query(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError10({ code: "FORBIDDEN" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR" });
    const transactions = await db.select().from(creditTransactions).orderBy(desc9(creditTransactions.createdAt)).limit(input.limit).offset(input.offset);
    return transactions.map((t2) => ({
      id: t2.id,
      companyId: t2.companyId,
      type: t2.type,
      points: t2.points,
      amountFcfa: t2.amountLocal ? parseFloat(t2.amountLocal) : null,
      description: t2.description,
      balanceBefore: t2.balanceBefore,
      balanceAfter: t2.balanceAfter,
      reference: t2.reference,
      createdAt: t2.createdAt
    }));
  }),
  // ── ADMIN : toutes les demandes de crédit (pour la page de gestion) ──────────
  getAllCreditPurchases: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError10({ code: "FORBIDDEN" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR" });
    const purchases = await db.select().from(creditPurchases).orderBy(desc9(creditPurchases.createdAt));
    return purchases.map((p) => ({
      id: p.id,
      reference: p.reference,
      companyId: p.companyId,
      amountFcfa: parseFloat(p.amountLocal),
      creditsGranted: p.creditsGranted,
      paymentMethod: p.paymentMethod,
      paymentStatus: p.paymentStatus,
      paymentLink: p.stripePaymentIntentId || p.hub2PaymentUrl || "",
      createdAt: p.createdAt,
      completedAt: p.completedAt
    }));
  }),
  // ── ADMIN : statistiques de crédits (pour le dashboard NEXUS) ───────────────────
  getCreditStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError10({ code: "FORBIDDEN" });
    }
    const db = await getDb();
    if (!db) throw new TRPCError10({ code: "INTERNAL_SERVER_ERROR" });
    const allCredits = await db.select().from(companyCredits);
    const totalCreditsDistributed = allCredits.reduce((sum, c) => sum + c.balance, 0);
    const completedPurchases = await db.select().from(creditPurchases).where(eq10(creditPurchases.paymentStatus, "completed"));
    const totalAmountEncashed = completedPurchases.reduce(
      (sum, p) => sum + parseFloat(p.amountLocal),
      0
    );
    const companiesWithCredits = allCredits.filter((c) => c.balance > 0).length;
    return {
      totalCreditsDistributed,
      totalAmountEncashed,
      companiesWithCredits,
      totalCompanies: allCredits.length,
      averageCreditsPerCompany: allCredits.length > 0 ? Math.round(totalCreditsDistributed / allCredits.length) : 0
    };
  })
};

// server/routers/management-modules.ts
import { z as z10 } from "zod";
import { eq as eq11, and as and7, gte as gte2, lte as lte2 } from "drizzle-orm";
init_db();
init_schema();
import { desc as desc10 } from "drizzle-orm";
var financeRouter = router({
  /**
   * Get daily cash summary for a company
   */
  getDailySummary: protectedProcedure.input(z10.object({
    companyId: z10.number(),
    date: z10.date().optional()
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const targetDate = input.date || /* @__PURE__ */ new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    const ticketsToday = await db.select().from(transportTickets).where(
      and7(
        eq11(transportTickets.companyId, input.companyId),
        gte2(transportTickets.createdAt, startOfDay),
        lte2(transportTickets.createdAt, endOfDay),
        eq11(transportTickets.cashStatus, "encaisse")
      )
    );
    const shipmentsToday = await db.select().from(transportShipments).where(
      and7(
        eq11(transportShipments.companyId, input.companyId),
        gte2(transportShipments.createdAt, startOfDay),
        lte2(transportShipments.createdAt, endOfDay),
        eq11(transportShipments.cashStatus, "encaisse")
      )
    );
    const chargesToday = await db.select().from(transportCharges).where(
      and7(
        eq11(transportCharges.companyId, input.companyId),
        gte2(transportCharges.chargeDate, typeof startOfDay === "string" ? startOfDay : startOfDay.toISOString().split("T")[0]),
        lte2(transportCharges.chargeDate, typeof endOfDay === "string" ? endOfDay : endOfDay.toISOString().split("T")[0])
      )
    );
    const ticketsRevenue = ticketsToday.reduce((sum, t2) => sum + (Number(t2.priceXOF) || 0), 0);
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
      chargesCount: chargesToday.length
    };
  }),
  /**
   * Get monthly cash summary
   */
  getMonthlySummary: protectedProcedure.input(z10.object({
    companyId: z10.number(),
    month: z10.string()
    // YYYY-MM
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [year, month] = input.month.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const ticketsMonth = await db.select().from(transportTickets).where(
      and7(
        eq11(transportTickets.companyId, input.companyId),
        gte2(transportTickets.createdAt, startOfMonth),
        lte2(transportTickets.createdAt, endOfMonth),
        eq11(transportTickets.cashStatus, "encaisse")
      )
    );
    const shipmentsMonth = await db.select().from(transportShipments).where(
      and7(
        eq11(transportShipments.companyId, input.companyId),
        gte2(transportShipments.createdAt, startOfMonth),
        lte2(transportShipments.createdAt, endOfMonth),
        eq11(transportShipments.cashStatus, "encaisse")
      )
    );
    const chargesMonth = await db.select().from(transportCharges).where(
      and7(
        eq11(transportCharges.companyId, input.companyId),
        gte2(transportCharges.chargeDate, typeof startOfMonth === "string" ? startOfMonth : startOfMonth.toISOString().split("T")[0]),
        lte2(transportCharges.chargeDate, typeof endOfMonth === "string" ? endOfMonth : endOfMonth.toISOString().split("T")[0])
      )
    );
    const ticketsRevenue = ticketsMonth.reduce((sum, t2) => sum + (Number(t2.priceXOF) || 0), 0);
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
      chargesCount: chargesMonth.length
    };
  }),
  /**
   * Create a charge (décaissement)
   */
  createCharge: protectedProcedure.input(z10.object({
    companyId: z10.number(),
    category: z10.enum(["carburant", "maintenance", "salaire", "frais_divers"]),
    description: z10.string(),
    amount: z10.string(),
    station: z10.string().optional()
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    await db.insert(transportCharges).values({
      companyId: input.companyId,
      category: input.category,
      description: input.description,
      amount: input.amount,
      station: input.station,
      chargeDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      createdAt: /* @__PURE__ */ new Date()
    });
    return { success: true };
  }),
  /**
   * Get charges history for a company
   */
  getChargesHistory: protectedProcedure.input(z10.object({
    companyId: z10.number(),
    startDate: z10.date().optional(),
    endDate: z10.date().optional()
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const startDate = input.startDate || new Date((/* @__PURE__ */ new Date()).setDate((/* @__PURE__ */ new Date()).getDate() - 30));
    const endDate = input.endDate || /* @__PURE__ */ new Date();
    return db.select().from(transportCharges).where(
      and7(
        eq11(transportCharges.companyId, input.companyId),
        gte2(transportCharges.chargeDate, typeof startDate === "string" ? startDate : startDate.toISOString().split("T")[0]),
        lte2(transportCharges.chargeDate, typeof endDate === "string" ? endDate : endDate.toISOString().split("T")[0])
      )
    ).orderBy(desc10(transportCharges.chargeDate));
  })
});
var embarquementRouter = router({
  /**
   * Get boarding status for a departure
   */
  getBoardingStatus: protectedProcedure.input(z10.object({
    departureId: z10.number()
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const departure = await db.select().from(transportDepartures).where(eq11(transportDepartures.id, input.departureId)).limit(1);
    if (!departure[0]) return null;
    const busLine = await db.select().from(transportBusLines).where(eq11(transportBusLines.id, departure[0].busLineId)).limit(1);
    const tickets = await db.select().from(transportTickets).where(eq11(transportTickets.departureId, input.departureId));
    const boarded = tickets.filter((t2) => t2.boardingStatus === "embarque").length;
    const notBoarded = tickets.filter((t2) => t2.boardingStatus === "non_embarque").length;
    return {
      departureId: input.departureId,
      departureCity: busLine?.[0]?.departureCity || "\u2014",
      arrivalCity: busLine?.[0]?.arrivalCity || "\u2014",
      departureDate: departure[0].departureDate,
      departureTime: departure[0].departureTime,
      status: departure[0].status,
      totalTickets: tickets.length,
      boarded,
      notBoarded,
      boardingPercentage: tickets.length > 0 ? Math.round(boarded / tickets.length * 100) : 0
    };
  }),
  /**
   * Get list of passengers for boarding
   */
  getPassengersList: protectedProcedure.input(z10.object({
    departureId: z10.number()
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select({
      id: transportTickets.id,
      ticketNumber: transportTickets.ticketNumber,
      firstName: transportTickets.firstName,
      lastName: transportTickets.lastName,
      seatNumber: transportTickets.seatNumber,
      boardingStatus: transportTickets.boardingStatus,
      idType: transportTickets.idType,
      idNumber: transportTickets.idNumber,
      nationality: transportTickets.nationality
    }).from(transportTickets).where(eq11(transportTickets.departureId, input.departureId)).orderBy(transportTickets.seatNumber);
  }),
  /**
   * Update boarding status for a ticket
   */
  updateBoardingStatus: protectedProcedure.input(z10.object({
    ticketId: z10.number(),
    boardingStatus: z10.enum(["embarque", "non_embarque"])
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    await db.update(transportTickets).set({ boardingStatus: input.boardingStatus, updatedAt: /* @__PURE__ */ new Date() }).where(eq11(transportTickets.id, input.ticketId));
    return { success: true };
  })
});
var manifesteRouter = router({
  /**
   * Get complete manifest for a departure
   */
  getManifest: protectedProcedure.input(z10.object({
    departureId: z10.number()
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const departure = await db.select().from(transportDepartures).where(eq11(transportDepartures.id, input.departureId)).limit(1);
    if (!departure[0]) return null;
    const busLine = await db.select().from(transportBusLines).where(eq11(transportBusLines.id, departure[0].busLineId)).limit(1);
    const passengers = await db.select({
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
      boardingStatus: transportTickets.boardingStatus
    }).from(transportTickets).where(eq11(transportTickets.departureId, input.departureId)).orderBy(transportTickets.seatNumber);
    return {
      departure: {
        id: departure[0].id,
        departureCity: busLine?.[0]?.departureCity || "\u2014",
        arrivalCity: busLine?.[0]?.arrivalCity || "\u2014",
        departureDate: departure[0].departureDate,
        departureTime: departure[0].departureTime,
        driverName: departure[0].driverName,
        status: departure[0].status
      },
      passengers,
      totalPassengers: passengers.length,
      maleCount: passengers.filter((p) => p.gender === "M").length,
      femaleCount: passengers.filter((p) => p.gender === "F").length,
      boardedCount: passengers.filter((p) => p.boardingStatus === "embarque").length
    };
  }),
  /**
   * Export manifest as PDF-ready data
   */
  getManifestForPrint: protectedProcedure.input(z10.object({
    departureId: z10.number()
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const departure = await db.select().from(transportDepartures).where(eq11(transportDepartures.id, input.departureId)).limit(1);
    if (!departure[0]) return null;
    const busLine = await db.select().from(transportBusLines).where(eq11(transportBusLines.id, departure[0].busLineId)).limit(1);
    const company = await db.select().from(transportCompanies).where(eq11(transportCompanies.id, departure[0].companyId)).limit(1);
    const passengers = await db.select({
      seatNumber: transportTickets.seatNumber,
      firstName: transportTickets.firstName,
      lastName: transportTickets.lastName,
      idType: transportTickets.idType,
      idNumber: transportTickets.idNumber,
      nationality: transportTickets.nationality,
      dropOffCity: transportTickets.dropOffCity
    }).from(transportTickets).where(eq11(transportTickets.departureId, input.departureId)).orderBy(transportTickets.seatNumber);
    return {
      company: company?.[0]?.companyName || "Transport Company",
      departure: {
        departureCity: busLine?.[0]?.departureCity || "\u2014",
        arrivalCity: busLine?.[0]?.arrivalCity || "\u2014",
        departureDate: departure[0].departureDate,
        departureTime: departure[0].departureTime,
        driverName: departure[0].driverName
      },
      passengers,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  })
});
var managementModulesRouter = router({
  finance: financeRouter,
  embarquement: embarquementRouter,
  manifeste: manifesteRouter
});

// server/routers/carousel.ts
import { z as z11 } from "zod";
init_notification();
init_transport_db();
var carouselRouter = router({
  // Send quote request
  sendQuoteRequest: publicProcedure.input(
    z11.object({
      name: z11.string().min(2, "Le nom doit contenir au moins 2 caract\xE8res"),
      email: z11.string().email("Email invalide"),
      phone: z11.string().min(8, "T\xE9l\xE9phone invalide"),
      activityType: z11.enum(["transport", "restauration", "expedition", "hotel", "boutique", "residence_meuble"]),
      message: z11.string().min(10, "Le message doit contenir au moins 10 caract\xE8res")
    })
  ).mutation(async ({ input }) => {
    try {
      await createQuoteRequest({
        name: input.name,
        email: input.email,
        phone: input.phone,
        activityType: input.activityType,
        message: input.message
      });
      await notifyOwner({
        title: `Nouvelle demande de devis - ${input.activityType}`,
        content: `De: ${input.name}
Email: ${input.email}
T\xE9l\xE9phone: ${input.phone}

Message:
${input.message}`
      });
      return {
        success: true,
        message: "Demande de devis envoy\xE9e avec succ\xE8s"
      };
    } catch (error) {
      console.error("Error sending quote request:", error);
      throw new Error("Erreur lors de l'envoi de la demande");
    }
  }),
  // Get real-time statistics
  getStatistics: publicProcedure.query(async () => {
    try {
      return {
        activeTrips: 12,
        openRestaurants: 8,
        inTransitShipments: 5
      };
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return {
        activeTrips: 0,
        openRestaurants: 0,
        inTransitShipments: 0
      };
    }
  }),
  // Get filtered partners
  getFilteredPartners: publicProcedure.input(
    z11.object({
      activityType: z11.enum(["transport", "restauration", "expedition", "hotel", "boutique", "residence_meuble"]),
      minRating: z11.number().min(0).max(5).optional(),
      maxPrice: z11.number().optional(),
      maxDistance: z11.number().optional()
    })
  ).query(async ({ input }) => {
    try {
      return {
        partners: [
          {
            id: "1",
            name: "Partner 1",
            rating: 4.5,
            price: 5e3,
            distance: 2.5
          },
          {
            id: "2",
            name: "Partner 2",
            rating: 4.8,
            price: 6e3,
            distance: 3.2
          }
        ]
      };
    } catch (error) {
      console.error("Error fetching filtered partners:", error);
      return { partners: [] };
    }
  }),
  // Global search for trips, restaurants, shipments
  globalSearch: publicProcedure.input(
    z11.object({
      query: z11.string().min(1)
    })
  ).query(async ({ input }) => {
    try {
      return {
        results: []
      };
    } catch (error) {
      console.error("Error in global search:", error);
      return { results: [] };
    }
  }),
  // List quote requests (admin only)
  listQuoteRequests: protectedProcedure.input(
    z11.object({
      status: z11.string().optional(),
      activityType: z11.string().optional()
    })
  ).query(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Acc\xE8s r\xE9serv\xE9 \xE0 l'administrateur");
    }
    try {
      return await getQuoteRequests(input);
    } catch (error) {
      console.error("Error fetching quote requests:", error);
      return [];
    }
  }),
  // Update quote request status (admin only)
  updateQuoteRequestStatus: protectedProcedure.input(
    z11.object({
      id: z11.number(),
      status: z11.enum(["new", "contacted", "closed"]),
      notes: z11.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Acc\xE8s r\xE9serv\xE9 \xE0 l'administrateur");
    }
    try {
      return await updateQuoteRequestStatus(input.id, input.status, input.notes);
    } catch (error) {
      console.error("Error updating quote request:", error);
      throw error;
    }
  })
});

// server/routers/search-favorites.ts
import { z as z12 } from "zod";
var searchFavoritesRouter = router({
  // Global search across all services
  globalSearch: publicProcedure.input(
    z12.object({
      query: z12.string().min(1).max(100),
      type: z12.enum(["all", "transport", "restaurant", "expedition"]).optional()
    })
  ).query(async ({ input }) => {
    const { query, type = "all" } = input;
    const results = [];
    if (type === "all" || type === "transport") {
      results.push(
        {
          id: "t1",
          type: "transport",
          name: "Trans-C\xF4te d'Ivoire",
          description: "Abidjan \u2192 Yamoussoukro",
          price: 5e3
        },
        {
          id: "t2",
          type: "transport",
          name: "Garantie Express",
          description: "Abidjan \u2192 Bouak\xE9",
          price: 8e3
        }
      );
    }
    if (type === "all" || type === "restaurant") {
      results.push(
        {
          id: "r1",
          type: "restaurant",
          name: "Le Plateau Gourmand",
          description: "Abidjan",
          cuisine: "Ivoirienne"
        },
        {
          id: "r2",
          type: "restaurant",
          name: "Saveurs d'Afrique",
          description: "Yamoussoukro",
          cuisine: "Africaine"
        }
      );
    }
    if (type === "all" || type === "expedition") {
      results.push({
        id: "e1",
        type: "expedition",
        name: "Abidjan \u2192 Yamoussoukro",
        description: "Exp\xE9dition standard",
        status: "En transit"
      });
    }
    return results.filter(
      (r) => r.name.toLowerCase().includes(query.toLowerCase()) || r.description.toLowerCase().includes(query.toLowerCase())
    );
  }),
  // Add to favorites
  addFavorite: protectedProcedure.input(
    z12.object({
      itemId: z12.string(),
      itemType: z12.enum(["transport", "restaurant", "expedition"]),
      itemName: z12.string(),
      itemDescription: z12.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return {
      success: true,
      message: "Added to favorites",
      favorite: {
        itemId: input.itemId,
        itemType: input.itemType,
        itemName: input.itemName,
        addedAt: /* @__PURE__ */ new Date()
      }
    };
  }),
  // Remove from favorites
  removeFavorite: protectedProcedure.input(
    z12.object({
      itemId: z12.string(),
      itemType: z12.enum(["transport", "restaurant", "expedition"])
    })
  ).mutation(async ({ ctx, input }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return {
      success: true,
      message: "Removed from favorites"
    };
  }),
  // Get user's favorites
  getFavorites: protectedProcedure.input(
    z12.object({
      type: z12.enum(["all", "transport", "restaurant", "expedition"]).optional()
    })
  ).query(async ({ ctx, input }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    const mockFavorites = [
      {
        id: "1",
        type: "transport",
        name: "Trans-C\xF4te d'Ivoire",
        description: "Abidjan \u2192 Yamoussoukro",
        price: 5e3
      },
      {
        id: "2",
        type: "restaurant",
        name: "Le Plateau Gourmand",
        description: "Abidjan",
        cuisine: "Ivoirienne"
      }
    ];
    if (input?.type && input.type !== "all") {
      return mockFavorites.filter((f) => f.type === input.type);
    }
    return mockFavorites;
  }),
  // Check if item is favorited
  isFavorited: protectedProcedure.input(
    z12.object({
      itemId: z12.string(),
      itemType: z12.enum(["transport", "restaurant", "expedition"])
    })
  ).query(async ({ ctx, input }) => {
    if (!ctx.user) throw new Error("Not authenticated");
    return false;
  })
});

// server/routers/routes.ts
init_schema();
init_db();
import { z as z13 } from "zod";
import { eq as eq12, desc as desc11 } from "drizzle-orm";
var routesRouter = router({
  // Créer une nouvelle ligne de départ
  createRoute: protectedProcedure.input(
    z13.object({
      name: z13.string().min(1, "Le nom de la ligne est requis"),
      departureCity: z13.string().min(1, "La ville de d\xE9part est requise"),
      arrivalCity: z13.string().min(1, "La ville d'arriv\xE9e est requise"),
      distance: z13.number().optional(),
      estimatedDuration: z13.number().optional(),
      basePrice: z13.string().min(1, "Le prix de base est requis"),
      description: z13.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
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
      createdBy: ctx.user?.id ? parseInt(ctx.user.id.toString()) : void 0
    });
    return result;
  }),
  // Récupérer toutes les lignes
  listRoutes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const allRoutes = await db.select().from(routes).orderBy(desc11(routes.createdAt));
    return allRoutes;
  }),
  // Récupérer les lignes actives
  listActiveRoutes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const activeRoutes = await db.select().from(routes).where(eq12(routes.isActive, true)).orderBy(routes.name);
    return activeRoutes;
  }),
  // Récupérer une ligne par ID
  getRoute: publicProcedure.input(z13.object({ id: z13.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const route = await db.select().from(routes).where(eq12(routes.id, input.id));
    return route[0] || null;
  }),
  // Mettre à jour une ligne
  updateRoute: protectedProcedure.input(
    z13.object({
      id: z13.number(),
      name: z13.string().optional(),
      departureCity: z13.string().optional(),
      arrivalCity: z13.string().optional(),
      distance: z13.number().optional(),
      estimatedDuration: z13.number().optional(),
      basePrice: z13.string().optional(),
      description: z13.string().optional(),
      isActive: z13.boolean().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...updateData } = input;
    const result = await db.update(routes).set(updateData).where(eq12(routes.id, id));
    return result;
  }),
  // Supprimer une ligne
  deleteRoute: protectedProcedure.input(z13.object({ id: z13.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.delete(routes).where(eq12(routes.id, input.id));
    return result;
  }),
  // Basculer le statut actif/inactif
  toggleRouteStatus: protectedProcedure.input(z13.object({ id: z13.number(), isActive: z13.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.update(routes).set({ isActive: input.isActive }).where(eq12(routes.id, input.id));
    return result;
  })
});

// server/routers/buses.ts
init_schema();
init_db();
import { z as z14 } from "zod";
import { eq as eq13, desc as desc12, asc as asc5 } from "drizzle-orm";
var busesRouter = router({
  // Créer un nouveau bus
  createBus: protectedProcedure.input(
    z14.object({
      licensePlate: z14.string().min(1, "La plaque d'immatriculation est requise"),
      model: z14.string().min(1, "Le mod\xE8le est requis"),
      capacity: z14.number().min(1, "La capacit\xE9 doit \xEAtre au moins 1"),
      companyId: z14.number().optional(),
      description: z14.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(buses).values({
      licensePlate: input.licensePlate,
      model: input.model,
      capacity: input.capacity,
      companyId: input.companyId,
      description: input.description,
      isActive: true,
      createdBy: ctx.user?.id ? parseInt(ctx.user.id.toString()) : void 0
    });
    return result;
  }),
  // Récupérer tous les bus
  listBuses: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const allBuses = await db.select().from(buses).orderBy(desc12(buses.createdAt));
    return allBuses;
  }),
  // Récupérer les bus actifs
  listActiveBuses: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const activeBuses = await db.select().from(buses).where(eq13(buses.isActive, true)).orderBy(asc5(buses.model));
    return activeBuses;
  }),
  // Récupérer un bus par ID
  getBus: publicProcedure.input(z14.object({ id: z14.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const bus = await db.select().from(buses).where(eq13(buses.id, input.id));
    return bus[0] || null;
  }),
  // Mettre à jour un bus
  updateBus: protectedProcedure.input(
    z14.object({
      id: z14.number(),
      licensePlate: z14.string().optional(),
      model: z14.string().optional(),
      capacity: z14.number().optional(),
      description: z14.string().optional(),
      isActive: z14.boolean().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...updateData } = input;
    const result = await db.update(buses).set(updateData).where(eq13(buses.id, id));
    return result;
  }),
  // Supprimer un bus
  deleteBus: protectedProcedure.input(z14.object({ id: z14.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.delete(buses).where(eq13(buses.id, input.id));
    return result;
  }),
  // Basculer le statut d'un bus
  toggleBusStatus: protectedProcedure.input(z14.object({ id: z14.number(), isActive: z14.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.update(buses).set({ isActive: input.isActive }).where(eq13(buses.id, input.id));
    return result;
  })
});

// server/routers/stops.ts
init_schema();
init_db();
import { z as z15 } from "zod";
import { eq as eq14, desc as desc13, asc as asc6 } from "drizzle-orm";
var stopsRouter = router({
  // Créer un nouvel arrêt
  createStop: protectedProcedure.input(
    z15.object({
      name: z15.string().min(1, "Le nom de l'arr\xEAt est requis"),
      city: z15.string().min(1, "La ville est requise"),
      address: z15.string().optional(),
      latitude: z15.string().optional(),
      longitude: z15.string().optional(),
      description: z15.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
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
      createdBy: ctx.user?.id ? parseInt(ctx.user.id.toString()) : void 0
    });
    return result;
  }),
  // Récupérer tous les arrêts
  listStops: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const allStops = await db.select().from(stops).orderBy(desc13(stops.createdAt));
    return allStops;
  }),
  // Récupérer les arrêts actifs
  listActiveStops: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const activeStops = await db.select().from(stops).where(eq14(stops.isActive, true)).orderBy(asc6(stops.city), asc6(stops.name));
    return activeStops;
  }),
  // Récupérer les arrêts par ville
  getStopsByCity: publicProcedure.input(z15.object({ city: z15.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const cityStops = await db.select().from(stops).where(eq14(stops.city, input.city));
    return cityStops;
  }),
  // Récupérer un arrêt par ID
  getStop: publicProcedure.input(z15.object({ id: z15.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const stop = await db.select().from(stops).where(eq14(stops.id, input.id));
    return stop[0] || null;
  }),
  // Mettre à jour un arrêt
  updateStop: protectedProcedure.input(
    z15.object({
      id: z15.number(),
      name: z15.string().optional(),
      city: z15.string().optional(),
      address: z15.string().optional(),
      latitude: z15.string().optional(),
      longitude: z15.string().optional(),
      description: z15.string().optional(),
      isActive: z15.boolean().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...updateData } = input;
    const result = await db.update(stops).set(updateData).where(eq14(stops.id, id));
    return result;
  }),
  // Supprimer un arrêt
  deleteStop: protectedProcedure.input(z15.object({ id: z15.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.delete(stops).where(eq14(stops.id, input.id));
    return result;
  }),
  // Basculer le statut d'un arrêt
  toggleStopStatus: protectedProcedure.input(z15.object({ id: z15.number(), isActive: z15.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.update(stops).set({ isActive: input.isActive }).where(eq14(stops.id, input.id));
    return result;
  })
});

// server/routers/stations.ts
init_schema();
init_db();
import { z as z16 } from "zod";
import { eq as eq15, desc as desc14, sql as sql4 } from "drizzle-orm";
var stationsRouter = router({
  // Créer une nouvelle gare
  createStation: protectedProcedure.input(
    z16.object({
      companyId: z16.number(),
      name: z16.string().min(1, "Le nom de la gare est requis"),
      city: z16.string().min(1, "La ville est requise"),
      countryId: z16.number().optional(),
      address: z16.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(transportStations).values({
      companyId: input.companyId,
      name: input.name,
      city: input.city,
      countryId: input.countryId,
      address: input.address,
      active: true
    });
    return result;
  }),
  // Récupérer toutes les gares d'une compagnie
  listStations: publicProcedure.input(z16.object({ companyId: z16.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const stations = await db.select().from(transportStations).where(eq15(transportStations.companyId, input.companyId)).orderBy(desc14(transportStations.createdAt));
    return stations;
  }),
  // Récupérer les gares actives d'une compagnie
  listActiveStations: publicProcedure.input(z16.object({ companyId: z16.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const stations = await db.select().from(transportStations).where(
      sql4`${transportStations.companyId} = ${input.companyId} AND ${transportStations.active} = true`
    ).orderBy(transportStations.name);
    return stations;
  }),
  // Récupérer une gare par ID
  getStation: publicProcedure.input(z16.object({ id: z16.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const station = await db.select().from(transportStations).where(eq15(transportStations.id, input.id));
    return station[0] || null;
  }),
  // Mettre à jour une gare
  updateStation: protectedProcedure.input(
    z16.object({
      id: z16.number(),
      name: z16.string().optional(),
      city: z16.string().optional(),
      countryId: z16.number().optional(),
      address: z16.string().optional(),
      active: z16.boolean().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...updateData } = input;
    const result = await db.update(transportStations).set(updateData).where(eq15(transportStations.id, id));
    return result;
  }),
  // Supprimer une gare
  deleteStation: protectedProcedure.input(z16.object({ id: z16.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.delete(transportStations).where(eq15(transportStations.id, input.id));
    return result;
  }),
  // Basculer le statut actif/inactif
  toggleStationStatus: protectedProcedure.input(z16.object({ id: z16.number(), active: z16.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.update(transportStations).set({ active: input.active }).where(eq15(transportStations.id, input.id));
    return result;
  })
});

// server/routers/cashier.ts
init_schema();
init_db();
import { z as z17 } from "zod";
import { eq as eq16, desc as desc15, and as and8, gte as gte3, lte as lte3 } from "drizzle-orm";
var cashierRouter = router({
  // Créer une transaction d'encaissement
  createTransaction: protectedProcedure.input(
    z17.object({
      transactionType: z17.enum(["ticket", "shipment", "service", "other"]),
      referenceId: z17.number().optional(),
      referenceType: z17.string().optional(),
      amount: z17.string(),
      currency: z17.string().default("XOF"),
      paymentMethod: z17.enum(["cash", "card", "mobile_money", "check", "transfer"]),
      companyId: z17.number().optional(),
      stationId: z17.number().optional(),
      notes: z17.string().optional()
    })
  ).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const result = await db.insert(cashierTransactions).values({
      transactionType: input.transactionType,
      referenceId: input.referenceId,
      referenceType: input.referenceType,
      amount: input.amount,
      currency: input.currency,
      paymentMethod: input.paymentMethod,
      status: "completed",
      cashierId: ctx.user?.id ? parseInt(ctx.user.id.toString()) : void 0,
      companyId: input.companyId,
      stationId: input.stationId,
      receiptNumber,
      ticketGenerated: false,
      notes: input.notes
    });
    return { receiptNumber, ...result };
  }),
  // Récupérer toutes les transactions
  listTransactions: protectedProcedure.input(
    z17.object({
      companyId: z17.number().optional(),
      stationId: z17.number().optional(),
      startDate: z17.date().optional(),
      endDate: z17.date().optional(),
      limit: z17.number().default(50),
      offset: z17.number().default(0)
    })
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [];
    if (input.companyId) conditions.push(eq16(cashierTransactions.companyId, input.companyId));
    if (input.stationId) conditions.push(eq16(cashierTransactions.stationId, input.stationId));
    if (input.startDate) conditions.push(gte3(cashierTransactions.createdAt, input.startDate));
    if (input.endDate) conditions.push(lte3(cashierTransactions.createdAt, input.endDate));
    const transactions = await db.select().from(cashierTransactions).where(conditions.length > 0 ? and8(...conditions) : void 0).orderBy(desc15(cashierTransactions.createdAt)).limit(input.limit).offset(input.offset);
    return transactions;
  }),
  // Récupérer le total des encaissements par période
  getTotalByPeriod: protectedProcedure.input(
    z17.object({
      companyId: z17.number().optional(),
      stationId: z17.number().optional(),
      startDate: z17.date(),
      endDate: z17.date()
    })
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { total: 0, count: 0 };
    const conditions = [
      gte3(cashierTransactions.createdAt, input.startDate),
      lte3(cashierTransactions.createdAt, input.endDate),
      eq16(cashierTransactions.status, "completed")
    ];
    if (input.companyId) conditions.push(eq16(cashierTransactions.companyId, input.companyId));
    if (input.stationId) conditions.push(eq16(cashierTransactions.stationId, input.stationId));
    const transactions = await db.select().from(cashierTransactions).where(and8(...conditions));
    const total = transactions.reduce((sum, t2) => sum + parseFloat(t2.amount.toString()), 0);
    return { total, count: transactions.length };
  }),
  // Mettre à jour le statut d'une transaction
  updateTransactionStatus: protectedProcedure.input(
    z17.object({
      id: z17.number(),
      status: z17.enum(["pending", "completed", "cancelled"]),
      ticketGenerated: z17.boolean().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.update(cashierTransactions).set({
      status: input.status,
      ticketGenerated: input.ticketGenerated
    }).where(eq16(cashierTransactions.id, input.id));
    return result;
  }),
  // Récupérer une transaction par ID
  getTransaction: publicProcedure.input(z17.object({ id: z17.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const transaction = await db.select().from(cashierTransactions).where(eq16(cashierTransactions.id, input.id));
    return transaction[0] || null;
  }),
  // Récupérer les transactions par numéro de reçu
  getByReceiptNumber: publicProcedure.input(z17.object({ receiptNumber: z17.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const transaction = await db.select().from(cashierTransactions).where(eq16(cashierTransactions.receiptNumber, input.receiptNumber));
    return transaction[0] || null;
  })
});

// server/routers/client-auth.ts
import { z as z18 } from "zod";
init_db();
init_schema();
import { eq as eq17 } from "drizzle-orm";
import { TRPCError as TRPCError11 } from "@trpc/server";
import crypto2 from "crypto";
async function hashPassword(password) {
  return crypto2.createHash("sha256").update(password + "salt").digest("hex");
}
async function verifyPassword(password, hash3) {
  const computed = crypto2.createHash("sha256").update(password + "salt").digest("hex");
  return computed === hash3;
}
var clientAuthRouter = {
  // ── SIGNUP ───────────────────────────────────────────────────────────────────
  signup: publicProcedure.input(
    z18.object({
      name: z18.string().min(1),
      email: z18.string().email(),
      password: z18.string().min(6),
      phone: z18.string().optional(),
      country: z18.string().optional(),
      city: z18.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError11({ code: "INTERNAL_SERVER_ERROR" });
    const existing = await db.select().from(clients).where(eq17(clients.email, input.email));
    if (existing.length > 0) {
      throw new TRPCError11({
        code: "BAD_REQUEST",
        message: "Cet email est d\xE9j\xE0 utilis\xE9"
      });
    }
    const passwordHash = await hashPassword(input.password);
    await db.insert(clients).values({
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
      country: input.country,
      city: input.city,
      isActive: true
    });
    return {
      success: true,
      message: "Compte cr\xE9\xE9 avec succ\xE8s"
    };
  }),
  // ── LOGIN ────────────────────────────────────────────────────────────────────
  login: publicProcedure.input(
    z18.object({
      email: z18.string().email(),
      password: z18.string()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError11({ code: "INTERNAL_SERVER_ERROR" });
    const clientList = await db.select().from(clients).where(eq17(clients.email, input.email));
    if (clientList.length === 0) {
      throw new TRPCError11({
        code: "UNAUTHORIZED",
        message: "Email ou mot de passe incorrect"
      });
    }
    const client = clientList[0];
    if (!client.isActive) {
      throw new TRPCError11({
        code: "FORBIDDEN",
        message: "Ce compte a \xE9t\xE9 d\xE9sactiv\xE9"
      });
    }
    const isValid = await verifyPassword(input.password, client.passwordHash || "");
    if (!isValid) {
      throw new TRPCError11({
        code: "UNAUTHORIZED",
        message: "Email ou mot de passe incorrect"
      });
    }
    await db.update(clients).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq17(clients.id, client.id));
    return {
      id: client.id,
      email: client.email,
      name: client.name || "",
      message: "Connexion r\xE9ussie"
    };
  }),
  // ── GET PROFILE ──────────────────────────────────────────────────────────────
  getProfile: publicProcedure.query(async () => {
    return null;
  }),
  // ── GET BOOKINGS ─────────────────────────────────────────────────────────────
  getBookings: publicProcedure.query(async () => {
    return [];
  }),
  // ── UPDATE PROFILE ───────────────────────────────────────────────────────────
  updateProfile: publicProcedure.input(
    z18.object({
      name: z18.string().optional(),
      phone: z18.string().optional(),
      country: z18.string().optional(),
      city: z18.string().optional()
    })
  ).mutation(async ({ input }) => {
    return { success: true, message: "Profil mis \xE0 jour" };
  }),
  // ── CHANGE PASSWORD ──────────────────────────────────────────────────────────
  changePassword: publicProcedure.input(
    z18.object({
      oldPassword: z18.string(),
      newPassword: z18.string().min(6)
    })
  ).mutation(async ({ input }) => {
    return { success: true, message: "Mot de passe chang\xE9 avec succ\xE8s" };
  }),
  // ── LOGOUT ───────────────────────────────────────────────────────────────────
  logout: publicProcedure.mutation(async () => {
    return { success: true, message: "D\xE9connect\xE9" };
  }),
  // ── LIST CLIENTS (Admin) ─────────────────────────────────────────────────────
  listClients: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError11({ code: "INTERNAL_SERVER_ERROR" });
    const allClients = await db.select().from(clients);
    return allClients;
  }),
  // ── TOGGLE CLIENT STATUS (Admin) ─────────────────────────────────────────────
  toggleClientStatus: protectedProcedure.input(
    z18.object({
      clientId: z18.number(),
      isActive: z18.boolean()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError11({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(clients).set({ isActive: input.isActive }).where(eq17(clients.id, Number(input.clientId)));
    return { success: true };
  }),
  // ── GET CLIENT BOOKINGS (Admin) ──────────────────────────────────────────────
  getClientBookings: publicProcedure.input(z18.object({ clientId: z18.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError11({ code: "INTERNAL_SERVER_ERROR" });
    return [];
  })
};

// server/routers/businessDev.ts
import { z as z19 } from "zod";
init_db();
init_schema();
init_env();
import { eq as eq18, and as and9, gte as gte4, lte as lte4, sql as sql5, desc as desc16, isNotNull } from "drizzle-orm";
import bcrypt4 from "bcryptjs";
import { SignJWT as SignJWT2, jwtVerify as jwtVerify2 } from "jose";
import { TRPCError as TRPCError12 } from "@trpc/server";
async function getBdevSecretKey() {
  return new TextEncoder().encode(ENV.cookieSecret + "_bdev");
}
async function signBdevToken(payload) {
  const key = await getBdevSecretKey();
  return new SignJWT2({ ...payload, type: "bdev" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key);
}
async function verifyBdevToken(token) {
  try {
    const key = await getBdevSecretKey();
    const { payload } = await jwtVerify2(token, key);
    if (payload.type !== "bdev") return null;
    return { bdId: payload.bdId, id: payload.id };
  } catch {
    return null;
  }
}
function generateBdId() {
  const digits = Math.floor(1e4 + Math.random() * 9e4).toString();
  return `BD${digits}`;
}
var adminRouter = router({
  /** Liste tous les BDevs avec nombre de compagnies et CA total */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    if (ctx.user.role !== "admin") throw new TRPCError12({ code: "FORBIDDEN" });
    const bdevs = await db.select().from(businessDevelopers).orderBy(desc16(businessDevelopers.createdAt));
    const result = await Promise.all(
      bdevs.map(async (bdev) => {
        const companies = await db.select({
          id: transportCompanies.id,
          companyName: transportCompanies.companyName,
          activityType: transportCompanies.activityType,
          status: transportCompanies.status,
          createdAt: transportCompanies.createdAt
        }).from(transportCompanies).where(eq18(transportCompanies.bdId, bdev.bdId));
        let totalRevenue = 0;
        let totalCredits = 0;
        for (const company of companies) {
          const stats = await db.select({
            totalAmount: sql5`COALESCE(SUM(CAST(${creditTransactions.amountLocal} AS DECIMAL(12,2))), 0)`,
            totalCredits: sql5`COALESCE(SUM(${creditTransactions.points}), 0)`
          }).from(creditTransactions).where(
            and9(
              eq18(creditTransactions.companyId, company.id),
              eq18(creditTransactions.type, "credit")
            )
          );
          totalRevenue += Number(stats[0]?.totalAmount ?? 0);
          totalCredits += Number(stats[0]?.totalCredits ?? 0);
        }
        const commissionRate = Number(bdev.commissionRate ?? 5);
        const totalCommission = totalRevenue * commissionRate / 100;
        return {
          ...bdev,
          pinHash: void 0,
          // ne jamais exposer le hash
          commissionRate,
          companiesCount: companies.length,
          totalRevenue,
          totalCredits,
          totalCommission,
          companies
        };
      })
    );
    return result;
  }),
  /** Détail d'un BDev avec ses compagnies et stats par compagnie */
  getDetail: protectedProcedure.input(z19.object({ bdId: z19.string() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    if (ctx.user.role !== "admin") throw new TRPCError12({ code: "FORBIDDEN" });
    const [bdev] = await db.select().from(businessDevelopers).where(eq18(businessDevelopers.bdId, input.bdId));
    if (!bdev) throw new TRPCError12({ code: "NOT_FOUND", message: "BDev introuvable" });
    const companies = await db.select().from(transportCompanies).where(eq18(transportCompanies.bdId, input.bdId)).orderBy(desc16(transportCompanies.createdAt));
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const credits = await db.select({ balance: companyCredits.balance }).from(companyCredits).where(eq18(companyCredits.companyId, company.id));
        const revenueStats = await db.select({
          totalAmount: sql5`COALESCE(SUM(CAST(${creditTransactions.amountLocal} AS DECIMAL(12,2))), 0)`,
          totalCredits: sql5`COALESCE(SUM(${creditTransactions.points}), 0)`
        }).from(creditTransactions).where(
          and9(
            eq18(creditTransactions.companyId, company.id),
            eq18(creditTransactions.type, "credit")
          )
        );
        return {
          ...company,
          creditBalance: credits[0]?.balance ?? 0,
          totalRevenue: Number(revenueStats[0]?.totalAmount ?? 0),
          totalCredits: Number(revenueStats[0]?.totalCredits ?? 0)
        };
      })
    );
    return { ...bdev, pinHash: void 0, companies: companiesWithStats };
  }),
  /** Activer ou suspendre un BDev */
  updateStatus: protectedProcedure.input(z19.object({
    bdId: z19.string(),
    status: z19.enum(["active", "suspended", "pending"])
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    if (ctx.user.role !== "admin") throw new TRPCError12({ code: "FORBIDDEN" });
    await db.update(businessDevelopers).set({ status: input.status }).where(eq18(businessDevelopers.bdId, input.bdId));
    return { success: true };
  }),
  /** Modifier le taux de commission d'un BDev */
  updateCommissionRate: protectedProcedure.input(z19.object({
    bdId: z19.string(),
    commissionRate: z19.number().min(0).max(100)
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    if (ctx.user.role !== "admin") throw new TRPCError12({ code: "FORBIDDEN" });
    await db.update(businessDevelopers).set({ commissionRate: input.commissionRate.toFixed(2) }).where(eq18(businessDevelopers.bdId, input.bdId));
    return { success: true };
  }),
  /** Stats globales pour le widget dashboard admin */
  getGlobalStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    if (ctx.user.role !== "admin") throw new TRPCError12({ code: "FORBIDDEN" });
    const [counts] = await db.select({
      total: sql5`COUNT(*)`,
      active: sql5`SUM(CASE WHEN ${businessDevelopers.status} = 'active' THEN 1 ELSE 0 END)`,
      pending: sql5`SUM(CASE WHEN ${businessDevelopers.status} = 'pending' THEN 1 ELSE 0 END)`
    }).from(businessDevelopers);
    const [companiesWithBdev] = await db.select({ count: sql5`COUNT(*)` }).from(transportCompanies).where(isNotNull(transportCompanies.bdId));
    const [revenueTotal] = await db.select({
      total: sql5`COALESCE(SUM(CAST(${creditTransactions.amountLocal} AS DECIMAL(12,2))), 0)`
    }).from(creditTransactions).where(eq18(creditTransactions.type, "credit"));
    return {
      totalBdevs: Number(counts?.total ?? 0),
      activeBdevs: Number(counts?.active ?? 0),
      pendingBdevs: Number(counts?.pending ?? 0),
      companiesRecruited: Number(companiesWithBdev?.count ?? 0),
      totalRevenue: Number(revenueTotal?.total ?? 0)
    };
  })
});
var businessDevRouter = router({
  admin: adminRouter,
  /** Créer un compte BDev */
  register: publicProcedure.input(z19.object({
    firstName: z19.string().min(2),
    lastName: z19.string().min(2),
    contact: z19.string().optional(),
    email: z19.string().email(),
    whatsapp: z19.string().optional(),
    countryCode: z19.string().default("+225"),
    loginPhone: z19.string().min(6),
    // numéro sans indicatif
    pin: z19.string().length(4).regex(/^\d{4}$/, "Le PIN doit \xEAtre 4 chiffres")
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    const fullLoginPhone = `${input.countryCode}${input.loginPhone}`;
    const [existingEmail] = await db.select({ id: businessDevelopers.id }).from(businessDevelopers).where(eq18(businessDevelopers.email, input.email));
    if (existingEmail) throw new TRPCError12({ code: "CONFLICT", message: "Cet email est d\xE9j\xE0 utilis\xE9" });
    const [existingPhone] = await db.select({ id: businessDevelopers.id }).from(businessDevelopers).where(eq18(businessDevelopers.loginPhone, fullLoginPhone));
    if (existingPhone) throw new TRPCError12({ code: "CONFLICT", message: "Ce num\xE9ro est d\xE9j\xE0 utilis\xE9" });
    let bdId = generateBdId();
    let attempts = 0;
    while (attempts < 10) {
      const [existing] = await db.select({ id: businessDevelopers.id }).from(businessDevelopers).where(eq18(businessDevelopers.bdId, bdId));
      if (!existing) break;
      bdId = generateBdId();
      attempts++;
    }
    const pinHash = await bcrypt4.hash(input.pin, 10);
    await db.insert(businessDevelopers).values({
      bdId,
      firstName: input.firstName,
      lastName: input.lastName,
      contact: input.contact,
      email: input.email,
      whatsapp: input.whatsapp,
      countryCode: input.countryCode,
      loginPhone: fullLoginPhone,
      pinHash,
      status: "pending"
    });
    return { success: true, bdId, message: "Compte cr\xE9\xE9 avec succ\xE8s. En attente de validation par l'administrateur." };
  }),
  /** Connexion BDev par loginPhone + PIN */
  login: publicProcedure.input(z19.object({
    countryCode: z19.string().default("+225"),
    loginPhone: z19.string().min(6),
    pin: z19.string().length(4)
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    const fullLoginPhone = `${input.countryCode}${input.loginPhone}`;
    const [bdev] = await db.select().from(businessDevelopers).where(eq18(businessDevelopers.loginPhone, fullLoginPhone));
    if (!bdev) throw new TRPCError12({ code: "UNAUTHORIZED", message: "Identifiants incorrects" });
    if (bdev.status === "suspended") throw new TRPCError12({ code: "FORBIDDEN", message: "Votre compte est suspendu. Contactez l'administration." });
    if (bdev.status === "pending") throw new TRPCError12({ code: "FORBIDDEN", message: "Votre compte est en attente de validation." });
    const pinValid = await bcrypt4.compare(input.pin, bdev.pinHash);
    if (!pinValid) throw new TRPCError12({ code: "UNAUTHORIZED", message: "Code PIN incorrect" });
    await db.update(businessDevelopers).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq18(businessDevelopers.id, bdev.id));
    const token = await signBdevToken({ bdId: bdev.bdId, id: bdev.id });
    return {
      token,
      bdev: {
        id: bdev.id,
        bdId: bdev.bdId,
        firstName: bdev.firstName,
        lastName: bdev.lastName,
        email: bdev.email,
        status: bdev.status
      }
    };
  }),
  /** Profil du BDev connecté (token dans header) */
  getProfile: publicProcedure.input(z19.object({ token: z19.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    const payload = await verifyBdevToken(input.token);
    if (!payload) throw new TRPCError12({ code: "UNAUTHORIZED", message: "Token invalide" });
    const [bdev] = await db.select().from(businessDevelopers).where(eq18(businessDevelopers.id, payload.id));
    if (!bdev) throw new TRPCError12({ code: "NOT_FOUND" });
    const { pinHash: _, ...safe } = bdev;
    return safe;
  }),
  /** Liste des compagnies recrutées par le BDev connecté */
  getMyCompanies: publicProcedure.input(z19.object({ token: z19.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    const payload = await verifyBdevToken(input.token);
    if (!payload) throw new TRPCError12({ code: "UNAUTHORIZED", message: "Token invalide" });
    const [bdev] = await db.select({ bdId: businessDevelopers.bdId, status: businessDevelopers.status }).from(businessDevelopers).where(eq18(businessDevelopers.id, payload.id));
    if (!bdev) throw new TRPCError12({ code: "NOT_FOUND" });
    if (bdev.status !== "active") throw new TRPCError12({ code: "FORBIDDEN", message: "Compte inactif" });
    const companies = await db.select({
      id: transportCompanies.id,
      companyName: transportCompanies.companyName,
      activityType: transportCompanies.activityType,
      status: transportCompanies.status,
      createdAt: transportCompanies.createdAt
    }).from(transportCompanies).where(eq18(transportCompanies.bdId, bdev.bdId)).orderBy(desc16(transportCompanies.createdAt));
    return companies;
  }),
  /** Stats globales du BDev : CA, crédits, nombre de compagnies */
  getMyStats: publicProcedure.input(z19.object({
    token: z19.string(),
    startDate: z19.string().optional(),
    // ISO date string
    endDate: z19.string().optional()
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    const payload = await verifyBdevToken(input.token);
    if (!payload) throw new TRPCError12({ code: "UNAUTHORIZED", message: "Token invalide" });
    const [bdev] = await db.select({ bdId: businessDevelopers.bdId, status: businessDevelopers.status }).from(businessDevelopers).where(eq18(businessDevelopers.id, payload.id));
    if (!bdev || bdev.status !== "active") throw new TRPCError12({ code: "FORBIDDEN" });
    const companies = await db.select({ id: transportCompanies.id, companyName: transportCompanies.companyName, activityType: transportCompanies.activityType, status: transportCompanies.status, createdAt: transportCompanies.createdAt }).from(transportCompanies).where(eq18(transportCompanies.bdId, bdev.bdId));
    const companyIds = companies.map((c) => c.id);
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const conditions = [
          eq18(creditTransactions.companyId, company.id),
          eq18(creditTransactions.type, "credit")
        ];
        if (input.startDate) conditions.push(gte4(creditTransactions.createdAt, new Date(input.startDate)));
        if (input.endDate) conditions.push(lte4(creditTransactions.createdAt, new Date(input.endDate)));
        const [stats] = await db.select({
          totalAmount: sql5`COALESCE(SUM(CAST(${creditTransactions.amountLocal} AS DECIMAL(12,2))), 0)`,
          totalCredits: sql5`COALESCE(SUM(${creditTransactions.points}), 0)`
        }).from(creditTransactions).where(and9(...conditions));
        const [creditBalance] = await db.select({ balance: companyCredits.balance }).from(companyCredits).where(eq18(companyCredits.companyId, company.id));
        return {
          ...company,
          totalRevenue: Number(stats?.totalAmount ?? 0),
          totalCredits: Number(stats?.totalCredits ?? 0),
          creditBalance: creditBalance?.balance ?? 0
        };
      })
    );
    const totalRevenue = companiesWithStats.reduce((s, c) => s + c.totalRevenue, 0);
    const totalCredits = companiesWithStats.reduce((s, c) => s + c.totalCredits, 0);
    const [bdevFull] = await db.select({ commissionRate: businessDevelopers.commissionRate }).from(businessDevelopers).where(eq18(businessDevelopers.id, payload.id));
    const commissionRate = Number(bdevFull?.commissionRate ?? 5);
    const totalCommission = totalRevenue * commissionRate / 100;
    return {
      companiesCount: companies.length,
      totalRevenue,
      totalCredits,
      commissionRate,
      totalCommission,
      companies: companiesWithStats
    };
  }),
  /** Statistiques des parrainages réussis */
  getReferralStats: publicProcedure.input(z19.object({
    token: z19.string(),
    startDate: z19.string().optional(),
    endDate: z19.string().optional()
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    const payload = await verifyBdevToken(input.token);
    if (!payload) throw new TRPCError12({ code: "UNAUTHORIZED", message: "Token invalide" });
    const [bdev] = await db.select({ bdId: businessDevelopers.bdId, status: businessDevelopers.status }).from(businessDevelopers).where(eq18(businessDevelopers.id, payload.id));
    if (!bdev || bdev.status !== "active") throw new TRPCError12({ code: "FORBIDDEN" });
    const conditions = [eq18(transportCompanies.bdId, bdev.bdId)];
    if (input.startDate) conditions.push(gte4(transportCompanies.createdAt, new Date(input.startDate)));
    if (input.endDate) conditions.push(lte4(transportCompanies.createdAt, new Date(input.endDate)));
    const companies = await db.select({
      id: transportCompanies.id,
      companyName: transportCompanies.companyName,
      activityType: transportCompanies.activityType,
      status: transportCompanies.status,
      createdAt: transportCompanies.createdAt
    }).from(transportCompanies).where(and9(...conditions)).orderBy(desc16(transportCompanies.createdAt));
    const activeCompanies = companies.filter((c) => c.status === "active").length;
    const pendingCompanies = companies.filter((c) => c.status === "pending").length;
    const rejectedCompanies = companies.filter((c) => c.status === "rejected").length;
    const activeCompanyIds = companies.filter((c) => c.status === "active").map((c) => c.id);
    let totalActiveRevenue = 0;
    let totalActiveCredits = 0;
    if (activeCompanyIds.length > 0) {
      const [revStats] = await db.select({
        totalRevenue: sql5`COALESCE(SUM(CAST(${creditTransactions.amountLocal} AS DECIMAL(12,2))), 0)`,
        totalCredits: sql5`COALESCE(SUM(${creditTransactions.points}), 0)`
      }).from(creditTransactions).where(
        and9(
          sql5`${creditTransactions.companyId} IN (${sql5.raw(activeCompanyIds.join(","))})`,
          eq18(creditTransactions.type, "credit"),
          input.startDate ? gte4(creditTransactions.createdAt, new Date(input.startDate)) : void 0,
          input.endDate ? lte4(creditTransactions.createdAt, new Date(input.endDate)) : void 0
        )
      );
      totalActiveRevenue = Number(revStats?.totalRevenue ?? 0);
      totalActiveCredits = Number(revStats?.totalCredits ?? 0);
    }
    const [bdevFull] = await db.select({ commissionRate: businessDevelopers.commissionRate }).from(businessDevelopers).where(eq18(businessDevelopers.id, payload.id));
    const commissionRate = Number(bdevFull?.commissionRate ?? 5);
    return {
      totalReferred: companies.length,
      activeCompanies,
      pendingCompanies,
      rejectedCompanies,
      totalActiveRevenue,
      totalActiveCredits,
      commissionFromReferrals: totalActiveRevenue * commissionRate / 100,
      commissionRate,
      companies: companies.map((c) => ({
        ...c,
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt
      }))
    };
  }),
  /** Vérifier si un bdId existe (pour le formulaire d'inscription compagnie) */
  checkBdId: publicProcedure.input(z19.object({ bdId: z19.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError12({ code: "INTERNAL_SERVER_ERROR", message: "DB indisponible" });
    const [bdev] = await db.select({ bdId: businessDevelopers.bdId, firstName: businessDevelopers.firstName, lastName: businessDevelopers.lastName, status: businessDevelopers.status }).from(businessDevelopers).where(eq18(businessDevelopers.bdId, input.bdId.toUpperCase()));
    if (!bdev) return { valid: false, bdev: null };
    return { valid: true, bdev: { bdId: bdev.bdId, name: `${bdev.firstName} ${bdev.lastName}`, status: bdev.status } };
  })
});

// server/routers/loisirs.ts
import { z as z20 } from "zod";
import { TRPCError as TRPCError13 } from "@trpc/server";

// server/loisirs-db.ts
init_db();
init_schema();
import { eq as eq19, and as and10, gte as gte5, lte as lte5, desc as desc17 } from "drizzle-orm";
async function createActivity(data) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(leisureActivities).values([{
    ...data,
    pricePerPerson: String(data.pricePerPerson)
  }]);
  return null;
}
async function getActivitiesByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leisureActivities).where(eq19(leisureActivities.companyId, companyId));
}
async function getActivityById(activityId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(leisureActivities).where(eq19(leisureActivities.id, activityId)).limit(1);
  return result[0];
}
async function updateActivity(activityId, data) {
  const db = await getDb();
  if (!db) return null;
  const cleanData = { ...data };
  if (cleanData.pricePerPerson !== void 0) cleanData.pricePerPerson = String(cleanData.pricePerPerson);
  if (cleanData.rating !== void 0 && cleanData.rating !== null) cleanData.rating = String(cleanData.rating);
  await db.update(leisureActivities).set(cleanData).where(eq19(leisureActivities.id, activityId));
  return null;
}
async function deleteActivity(activityId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(leisureActivities).where(eq19(leisureActivities.id, activityId));
}
async function getActivitiesByCategory(companyId, category) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leisureActivities).where(
    and10(
      eq19(leisureActivities.companyId, companyId),
      eq19(leisureActivities.category, category)
    )
  );
}
async function getActivitiesByLocation(companyId, location) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leisureActivities).where(
    and10(
      eq19(leisureActivities.companyId, companyId),
      eq19(leisureActivities.location, location)
    )
  );
}
async function createBooking2(data) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(leisureBookings).values([{
    ...data,
    totalPrice: String(data.totalPrice),
    paymentStatus: data.paymentStatus || "pending",
    bookingStatus: "pending"
  }]);
  return null;
}
async function getBookingsByActivity(activityId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leisureBookings).where(eq19(leisureBookings.activityId, activityId)).orderBy(desc17(leisureBookings.createdAt));
}
async function getBookingById(bookingId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(leisureBookings).where(eq19(leisureBookings.id, bookingId)).limit(1);
  return result[0];
}
async function updateBookingStatus2(bookingId, status) {
  const db = await getDb();
  if (!db) return null;
  await db.update(leisureBookings).set({ bookingStatus: status }).where(eq19(leisureBookings.id, bookingId));
  return null;
}
async function updatePaymentStatus(bookingId, paymentStatus, paidAmount) {
  const db = await getDb();
  if (!db) return null;
  const updates = { paymentStatus };
  if (paidAmount !== void 0) {
    updates.paidAmount = paidAmount;
  }
  await db.update(leisureBookings).set(updates).where(eq19(leisureBookings.id, bookingId));
  return null;
}
async function getBookingsByDateRange(activityId, startDate, endDate) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leisureBookings).where(
    and10(
      eq19(leisureBookings.activityId, activityId),
      gte5(leisureBookings.bookingDate, startDate),
      lte5(leisureBookings.bookingDate, endDate)
    )
  ).orderBy(desc17(leisureBookings.bookingDate));
}
async function getBookingsByCompany2(companyId) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(leisureBookings).innerJoin(leisureActivities, eq19(leisureBookings.activityId, leisureActivities.id)).where(eq19(leisureActivities.companyId, companyId));
  return results.map((r) => r.leisure_bookings);
}
async function createReview2(data) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(leisureReviews).values([data]);
  return null;
}
async function getReviewsByActivity(activityId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leisureReviews).where(eq19(leisureReviews.activityId, activityId)).orderBy(desc17(leisureReviews.createdAt));
}
async function getAverageRating2(activityId) {
  const reviews2 = await getReviewsByActivity(activityId);
  if (reviews2.length === 0) return 0;
  const sum = reviews2.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews2.length;
}
async function deleteReview2(reviewId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(leisureReviews).where(eq19(leisureReviews.id, reviewId));
}
async function getActivityStatistics(activityId) {
  const db = await getDb();
  if (!db) return null;
  const bookings = await getBookingsByActivity(activityId);
  const reviews2 = await getReviewsByActivity(activityId);
  const activity = await getActivityById(activityId);
  if (!activity) return null;
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.bookingStatus === "confirmed").length;
  const totalPeople = bookings.reduce((acc, b) => acc + b.numberOfPeople, 0);
  const totalRevenue = bookings.filter((b) => b.paymentStatus === "paid").reduce((acc, b) => acc + parseFloat(b.totalPrice), 0);
  const averageRating = await getAverageRating2(activityId);
  const occupancyRate = totalPeople / (activity.maxCapacity * totalBookings) * 100 || 0;
  return {
    totalBookings,
    confirmedBookings,
    totalPeople,
    totalRevenue,
    averageRating,
    occupancyRate,
    reviewCount: reviews2.length
  };
}
async function getCompanyStatistics(companyId) {
  const db = await getDb();
  if (!db) return null;
  const activities = await getActivitiesByCompany(companyId);
  const bookings = await getBookingsByCompany2(companyId);
  const totalActivities = activities.length;
  const totalBookings = bookings.length;
  const totalRevenue = bookings.filter((b) => b.paymentStatus === "paid").reduce((acc, b) => acc + parseFloat(b.totalPrice), 0);
  const totalPeople = bookings.reduce((acc, b) => acc + b.numberOfPeople, 0);
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
  return {
    totalActivities,
    totalBookings,
    totalRevenue,
    totalPeople,
    averageBookingValue
  };
}

// server/routers/loisirs.ts
init_transport_db();
var leisureRouter = router({
  // ─── ACTIVITIES ──────────────────────────────────────────────────────────
  createActivity: protectedProcedure.input(
    z20.object({
      name: z20.string().min(1),
      description: z20.string().optional(),
      category: z20.string().min(1),
      location: z20.string().min(1),
      pricePerPerson: z20.union([z20.string(), z20.number()]),
      maxCapacity: z20.number().min(1),
      duration: z20.string().optional(),
      image: z20.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return createActivity({
      companyId: company.id,
      ...input
    });
  }),
  getActivities: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return getActivitiesByCompany(company.id);
  }),
  getActivityById: protectedProcedure.input(z20.object({ activityId: z20.number() })).query(async ({ input }) => {
    return getActivityById(input.activityId);
  }),
  updateActivity: protectedProcedure.input(
    z20.object({
      activityId: z20.number(),
      name: z20.string().optional(),
      description: z20.string().optional(),
      category: z20.string().optional(),
      location: z20.string().optional(),
      pricePerPerson: z20.union([z20.string(), z20.number()]).optional(),
      maxCapacity: z20.number().optional(),
      duration: z20.string().optional(),
      image: z20.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const activity = await getActivityById(input.activityId);
    if (!activity || activity.companyId !== company.id) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    const { activityId, ...updateData } = input;
    const cleanData = { ...updateData };
    if (cleanData.pricePerPerson !== void 0) cleanData.pricePerPerson = String(cleanData.pricePerPerson);
    return updateActivity(activityId, cleanData);
  }),
  deleteActivity: protectedProcedure.input(z20.object({ activityId: z20.number() })).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const activity = await getActivityById(input.activityId);
    if (!activity || activity.companyId !== company.id) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    await deleteActivity(input.activityId);
    return { success: true };
  }),
  getActivitiesByCategory: protectedProcedure.input(z20.object({ category: z20.string() })).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return getActivitiesByCategory(company.id, input.category);
  }),
  getActivitiesByLocation: protectedProcedure.input(z20.object({ location: z20.string() })).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return getActivitiesByLocation(company.id, input.location);
  }),
  // ─── BOOKINGS ────────────────────────────────────────────────────────────
  createBooking: protectedProcedure.input(
    z20.object({
      activityId: z20.number(),
      guestName: z20.string().min(1),
      guestEmail: z20.string().email(),
      guestPhone: z20.string().optional(),
      bookingDate: z20.date(),
      numberOfPeople: z20.number().min(1),
      totalPrice: z20.union([z20.string(), z20.number()]),
      paymentStatus: z20.enum(["pending", "partial", "paid"]).optional(),
      specialRequests: z20.string().optional()
    })
  ).mutation(async ({ input }) => {
    return createBooking2(input);
  }),
  getBookingsByActivity: protectedProcedure.input(z20.object({ activityId: z20.number() })).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const activity = await getActivityById(input.activityId);
    if (!activity || activity.companyId !== company.id) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    return getBookingsByActivity(input.activityId);
  }),
  getBookingById: protectedProcedure.input(z20.object({ bookingId: z20.number() })).query(async ({ input }) => {
    return getBookingById(input.bookingId);
  }),
  updateBookingStatus: protectedProcedure.input(
    z20.object({
      bookingId: z20.number(),
      status: z20.enum(["pending", "confirmed", "cancelled", "completed"])
    })
  ).mutation(async ({ input }) => {
    return updateBookingStatus2(input.bookingId, input.status);
  }),
  updatePaymentStatus: protectedProcedure.input(
    z20.object({
      bookingId: z20.number(),
      paymentStatus: z20.enum(["pending", "partial", "paid"]),
      paidAmount: z20.number().optional()
    })
  ).mutation(async ({ input }) => {
    return updatePaymentStatus(input.bookingId, input.paymentStatus, input.paidAmount);
  }),
  getBookingsByDateRange: protectedProcedure.input(
    z20.object({
      activityId: z20.number(),
      startDate: z20.date(),
      endDate: z20.date()
    })
  ).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const activity = await getActivityById(input.activityId);
    if (!activity || activity.companyId !== company.id) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    return getBookingsByDateRange(input.activityId, input.startDate, input.endDate);
  }),
  getCompanyBookings: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return getBookingsByCompany2(company.id);
  }),
  // ─── REVIEWS ─────────────────────────────────────────────────────────────
  createReview: protectedProcedure.input(
    z20.object({
      activityId: z20.number(),
      guestName: z20.string().min(1),
      rating: z20.number().min(1).max(5),
      comment: z20.string().optional()
    })
  ).mutation(async ({ input }) => {
    return createReview2(input);
  }),
  getReviewsByActivity: protectedProcedure.input(z20.object({ activityId: z20.number() })).query(async ({ input }) => {
    return getReviewsByActivity(input.activityId);
  }),
  getAverageRating: protectedProcedure.input(z20.object({ activityId: z20.number() })).query(async ({ input }) => {
    return getAverageRating2(input.activityId);
  }),
  deleteReview: protectedProcedure.input(z20.object({ reviewId: z20.number() })).mutation(async ({ input }) => {
    await deleteReview2(input.reviewId);
    return { success: true };
  }),
  // ─── STATISTICS ──────────────────────────────────────────────────────────
  getActivityStatistics: protectedProcedure.input(z20.object({ activityId: z20.number() })).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const activity = await getActivityById(input.activityId);
    if (!activity || activity.companyId !== company.id) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    return getActivityStatistics(input.activityId);
  }),
  getCompanyStatistics: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError13({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return getCompanyStatistics(company.id);
  })
});

// server/routers/rental-sales.ts
import { z as z21 } from "zod";
import { TRPCError as TRPCError14 } from "@trpc/server";

// server/rental-sales-db.ts
init_db();
init_schema();
import { eq as eq20, and as and11, gte as gte6, lte as lte6, desc as desc18, like as like3 } from "drizzle-orm";
async function createRentalProduct(data) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(rentalProducts).values([{
    ...data,
    pricePerDay: String(data.pricePerDay),
    pricePerWeek: data.pricePerWeek ? String(data.pricePerWeek) : void 0,
    pricePerMonth: data.pricePerMonth ? String(data.pricePerMonth) : void 0,
    depositAmount: data.depositAmount ? String(data.depositAmount) : void 0
  }]);
  return null;
}
async function getProductsByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rentalProducts).where(eq20(rentalProducts.companyId, companyId));
}
async function getProductById(productId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(rentalProducts).where(eq20(rentalProducts.id, productId)).limit(1);
  return result[0];
}
async function updateProduct(productId, data) {
  const db = await getDb();
  if (!db) return null;
  const cleanData = { ...data };
  if (cleanData.pricePerDay !== void 0) cleanData.pricePerDay = String(cleanData.pricePerDay);
  if (cleanData.pricePerWeek !== void 0) cleanData.pricePerWeek = String(cleanData.pricePerWeek);
  if (cleanData.pricePerMonth !== void 0) cleanData.pricePerMonth = String(cleanData.pricePerMonth);
  if (cleanData.depositAmount !== void 0) cleanData.depositAmount = String(cleanData.depositAmount);
  await db.update(rentalProducts).set(cleanData).where(eq20(rentalProducts.id, productId));
  return null;
}
async function deleteProduct(productId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(rentalProducts).where(eq20(rentalProducts.id, productId));
}
async function searchProducts(companyId, searchTerm) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rentalProducts).where(
    and11(
      eq20(rentalProducts.companyId, companyId),
      like3(rentalProducts.name, `%${searchTerm}%`)
    )
  );
}
async function getProductsByCategory(companyId, category) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rentalProducts).where(
    and11(
      eq20(rentalProducts.companyId, companyId),
      eq20(rentalProducts.category, category)
    )
  );
}
async function updateInventory(productId, quantity) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(rentalInventory).where(eq20(rentalInventory.productId, productId)).limit(1);
  if (existing.length > 0) {
    await db.update(rentalInventory).set({
      quantity,
      availableQuantity: quantity,
      lastUpdated: /* @__PURE__ */ new Date()
    }).where(eq20(rentalInventory.productId, productId));
  } else {
    await db.insert(rentalInventory).values([{
      productId,
      quantity,
      availableQuantity: quantity,
      lastUpdated: /* @__PURE__ */ new Date()
    }]);
  }
  return null;
}
async function getInventory(productId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(rentalInventory).where(eq20(rentalInventory.productId, productId)).limit(1);
  return result[0];
}
async function decreaseInventory(productId, quantity) {
  const db = await getDb();
  if (!db) return false;
  const inventory = await getInventory(productId);
  if (!inventory || inventory.availableQuantity < quantity) {
    return false;
  }
  await db.update(rentalInventory).set({
    availableQuantity: inventory.availableQuantity - quantity,
    lastUpdated: /* @__PURE__ */ new Date()
  }).where(eq20(rentalInventory.productId, productId));
  return true;
}
async function increaseInventory(productId, quantity) {
  const db = await getDb();
  if (!db) return;
  const inventory = await getInventory(productId);
  if (inventory) {
    await db.update(rentalInventory).set({
      availableQuantity: inventory.availableQuantity + quantity,
      lastUpdated: /* @__PURE__ */ new Date()
    }).where(eq20(rentalInventory.productId, productId));
  }
}
async function createOrder(data) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(salesOrders).values([{
    ...data,
    totalAmount: String(data.totalAmount),
    paymentStatus: data.paymentStatus || "pending",
    orderStatus: "pending",
    orderDate: /* @__PURE__ */ new Date()
  }]);
  return null;
}
async function getOrdersByCompany(companyId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesOrders).where(eq20(salesOrders.companyId, companyId)).orderBy(desc18(salesOrders.orderDate));
}
async function getOrderById(orderId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(salesOrders).where(eq20(salesOrders.id, orderId)).limit(1);
  return result[0];
}
async function updateOrderStatus(orderId, status) {
  const db = await getDb();
  if (!db) return null;
  await db.update(salesOrders).set({ orderStatus: status }).where(eq20(salesOrders.id, orderId));
  return null;
}
async function updatePaymentStatus2(orderId, paymentStatus) {
  const db = await getDb();
  if (!db) return null;
  await db.update(salesOrders).set({ paymentStatus }).where(eq20(salesOrders.id, orderId));
  return null;
}
async function getOrdersByDateRange(companyId, startDate, endDate) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesOrders).where(
    and11(
      eq20(salesOrders.companyId, companyId),
      gte6(salesOrders.orderDate, startDate),
      lte6(salesOrders.orderDate, endDate)
    )
  ).orderBy(desc18(salesOrders.orderDate));
}
async function addOrderItem(data) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(salesOrderItems).values([{
    ...data,
    unitPrice: String(data.unitPrice),
    totalPrice: String(data.totalPrice)
  }]);
  return null;
}
async function getOrderItems(orderId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesOrderItems).where(eq20(salesOrderItems.orderId, orderId));
}
async function deleteOrderItem(itemId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(salesOrderItems).where(eq20(salesOrderItems.id, itemId));
}
async function getOrderStatistics(companyId, monthStart, monthEnd) {
  const db = await getDb();
  if (!db) return null;
  const orders = await getOrdersByDateRange(companyId, monthStart, monthEnd);
  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.orderStatus === "delivered").length;
  const totalRevenue = orders.filter((o) => o.paymentStatus === "paid").reduce((acc, o) => acc + parseFloat(o.totalAmount), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingPayments = orders.filter((o) => o.paymentStatus !== "paid").reduce((acc, o) => acc + parseFloat(o.totalAmount), 0);
  return {
    totalOrders,
    completedOrders,
    totalRevenue,
    averageOrderValue,
    pendingPayments
  };
}
async function getProductStatistics(productId) {
  const db = await getDb();
  if (!db) return null;
  const product = await getProductById(productId);
  const inventory = await getInventory(productId);
  if (!product) return null;
  return {
    productName: product.name,
    category: product.category,
    totalStock: inventory?.quantity || 0,
    availableStock: inventory?.availableQuantity || 0,
    pricePerDay: product.pricePerDay,
    pricePerWeek: product.pricePerWeek,
    pricePerMonth: product.pricePerMonth
  };
}

// server/routers/rental-sales.ts
init_transport_db();
var rentalSalesRouter = router({
  // ─── RENTAL PRODUCTS ─────────────────────────────────────────────────────
  createProduct: protectedProcedure.input(
    z21.object({
      name: z21.string().min(1),
      description: z21.string().optional(),
      category: z21.string().min(1),
      pricePerDay: z21.union([z21.string(), z21.number()]),
      pricePerWeek: z21.union([z21.string(), z21.number()]).optional(),
      pricePerMonth: z21.union([z21.string(), z21.number()]).optional(),
      depositAmount: z21.union([z21.string(), z21.number()]).optional(),
      image: z21.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return createRentalProduct({
      companyId: company.id,
      ...input
    });
  }),
  getProducts: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return getProductsByCompany(company.id);
  }),
  getProductById: protectedProcedure.input(z21.object({ productId: z21.number() })).query(async ({ input }) => {
    return getProductById(input.productId);
  }),
  updateProduct: protectedProcedure.input(
    z21.object({
      productId: z21.number(),
      name: z21.string().optional(),
      description: z21.string().optional(),
      category: z21.string().optional(),
      pricePerDay: z21.union([z21.string(), z21.number()]).optional(),
      pricePerWeek: z21.union([z21.string(), z21.number()]).optional(),
      pricePerMonth: z21.union([z21.string(), z21.number()]).optional(),
      depositAmount: z21.union([z21.string(), z21.number()]).optional(),
      image: z21.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const product = await getProductById(input.productId);
    if (!product || product.companyId !== company.id) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    const { productId, ...updateData } = input;
    const cleanData = { ...updateData };
    if (cleanData.pricePerDay !== void 0) cleanData.pricePerDay = String(cleanData.pricePerDay);
    if (cleanData.pricePerWeek !== void 0) cleanData.pricePerWeek = String(cleanData.pricePerWeek);
    if (cleanData.pricePerMonth !== void 0) cleanData.pricePerMonth = String(cleanData.pricePerMonth);
    if (cleanData.depositAmount !== void 0) cleanData.depositAmount = String(cleanData.depositAmount);
    return updateProduct(productId, cleanData);
  }),
  deleteProduct: protectedProcedure.input(z21.object({ productId: z21.number() })).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const product = await getProductById(input.productId);
    if (!product || product.companyId !== company.id) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    await deleteProduct(input.productId);
    return { success: true };
  }),
  searchProducts: protectedProcedure.input(z21.object({ searchTerm: z21.string() })).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return searchProducts(company.id, input.searchTerm);
  }),
  getProductsByCategory: protectedProcedure.input(z21.object({ category: z21.string() })).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return getProductsByCategory(company.id, input.category);
  }),
  // ─── INVENTORY ───────────────────────────────────────────────────────────
  updateInventory: protectedProcedure.input(z21.object({ productId: z21.number(), quantity: z21.number().min(0) })).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const product = await getProductById(input.productId);
    if (!product || product.companyId !== company.id) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    return updateInventory(input.productId, input.quantity);
  }),
  getInventory: protectedProcedure.input(z21.object({ productId: z21.number() })).query(async ({ input }) => {
    return getInventory(input.productId);
  }),
  decreaseInventory: protectedProcedure.input(z21.object({ productId: z21.number(), quantity: z21.number().min(1) })).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const product = await getProductById(input.productId);
    if (!product || product.companyId !== company.id) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    const success = await decreaseInventory(input.productId, input.quantity);
    if (!success) {
      throw new TRPCError14({ code: "BAD_REQUEST", message: "Stock insuffisant" });
    }
    return { success: true };
  }),
  increaseInventory: protectedProcedure.input(z21.object({ productId: z21.number(), quantity: z21.number().min(1) })).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const product = await getProductById(input.productId);
    if (!product || product.companyId !== company.id) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    await increaseInventory(input.productId, input.quantity);
    return { success: true };
  }),
  // ─── SALES ORDERS ────────────────────────────────────────────────────────
  createOrder: protectedProcedure.input(
    z21.object({
      customerName: z21.string().min(1),
      customerEmail: z21.string().email(),
      customerPhone: z21.string().optional(),
      totalAmount: z21.union([z21.string(), z21.number()]),
      paymentStatus: z21.enum(["pending", "partial", "paid"]).optional(),
      deliveryDate: z21.date().optional(),
      deliveryAddress: z21.string().optional(),
      notes: z21.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return createOrder({
      companyId: company.id,
      ...input
    });
  }),
  getOrders: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return getOrdersByCompany(company.id);
  }),
  getOrderById: protectedProcedure.input(z21.object({ orderId: z21.number() })).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const order = await getOrderById(input.orderId);
    if (!order || order.companyId !== company.id) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    return order;
  }),
  updateOrderStatus: protectedProcedure.input(
    z21.object({
      orderId: z21.number(),
      status: z21.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"])
    })
  ).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const order = await getOrderById(input.orderId);
    if (!order || order.companyId !== company.id) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    return updateOrderStatus(input.orderId, input.status);
  }),
  updatePaymentStatus: protectedProcedure.input(
    z21.object({
      orderId: z21.number(),
      paymentStatus: z21.enum(["pending", "partial", "paid"])
    })
  ).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const order = await getOrderById(input.orderId);
    if (!order || order.companyId !== company.id) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    return updatePaymentStatus2(input.orderId, input.paymentStatus);
  }),
  getOrdersByDateRange: protectedProcedure.input(
    z21.object({
      startDate: z21.date(),
      endDate: z21.date()
    })
  ).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return getOrdersByDateRange(company.id, input.startDate, input.endDate);
  }),
  // ─── ORDER ITEMS ─────────────────────────────────────────────────────────
  addOrderItem: protectedProcedure.input(
    z21.object({
      orderId: z21.number(),
      productId: z21.number(),
      quantity: z21.number().min(1),
      unitPrice: z21.union([z21.string(), z21.number()]),
      totalPrice: z21.union([z21.string(), z21.number()])
    })
  ).mutation(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const order = await getOrderById(input.orderId);
    if (!order || order.companyId !== company.id) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    return addOrderItem(input);
  }),
  getOrderItems: protectedProcedure.input(z21.object({ orderId: z21.number() })).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const order = await getOrderById(input.orderId);
    if (!order || order.companyId !== company.id) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    return getOrderItems(input.orderId);
  }),
  deleteOrderItem: protectedProcedure.input(z21.object({ itemId: z21.number() })).mutation(async ({ input }) => {
    await deleteOrderItem(input.itemId);
    return { success: true };
  }),
  // ─── STATISTICS ──────────────────────────────────────────────────────────
  getOrderStatistics: protectedProcedure.input(
    z21.object({
      startDate: z21.date(),
      endDate: z21.date()
    })
  ).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    return getOrderStatistics(company.id, input.startDate, input.endDate);
  }),
  getProductStatistics: protectedProcedure.input(z21.object({ productId: z21.number() })).query(async ({ ctx, input }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Compagnie non trouv\xE9e" });
    }
    const product = await getProductById(input.productId);
    if (!product || product.companyId !== company.id) {
      throw new TRPCError14({ code: "FORBIDDEN", message: "Acc\xE8s refus\xE9" });
    }
    return getProductStatistics(input.productId);
  })
});

// server/routers/gas.ts
import { z as z22 } from "zod";

// server/gas-db.ts
init_db();
init_schema();
import { eq as eq21, and as and12, desc as desc19 } from "drizzle-orm";
async function createGasSupplier(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gasSuppliers).values(data);
  return result;
}
async function getGasSupplierById(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasSuppliers).where(eq21(gasSuppliers.id, id)).limit(1);
}
async function getGasSuppliersByCompanyId(companyId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasSuppliers).where(eq21(gasSuppliers.companyId, companyId));
}
async function updateGasSupplier(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(gasSuppliers).set(data).where(eq21(gasSuppliers.id, id));
}
async function createGasBottle(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const price = typeof data.priceXOF === "string" ? data.priceXOF : data.priceXOF.toString();
  const deliveryFee = typeof data.deliveryFeeXOF === "string" ? data.deliveryFeeXOF : data.deliveryFeeXOF.toString();
  return await db.insert(gasBottles).values({
    supplierId: data.supplierId,
    type: data.type,
    capacity: data.capacity,
    priceXOF: price,
    deliveryFeeXOF: deliveryFee,
    stock: data.stock,
    minStock: data.minStock,
    description: data.description,
    photoUrl: data.photoUrl
  });
}
async function getGasBottleById(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasBottles).where(eq21(gasBottles.id, id)).limit(1);
}
async function getGasBottlesBySupplierId(supplierId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasBottles).where(eq21(gasBottles.supplierId, supplierId));
}
async function getAvailableGasBottles(supplierId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasBottles).where(and12(eq21(gasBottles.supplierId, supplierId), eq21(gasBottles.isAvailable, true)));
}
async function updateGasBottle(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(gasBottles).set(data).where(eq21(gasBottles.id, id));
}
async function decreaseGasBottleStock(id, quantity) {
  const bottle = await getGasBottleById(id);
  if (!bottle || bottle.length === 0) throw new Error("Bouteille non trouv\xE9e");
  const newStock = Math.max(0, (bottle[0].stock || 0) - quantity);
  return await updateGasBottle(id, { stock: newStock });
}
async function createGasOrder(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const totalAmount = typeof data.totalAmountXOF === "string" ? data.totalAmountXOF : data.totalAmountXOF.toString();
  return await db.insert(gasOrders).values({
    reference: data.reference,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    clientEmail: data.clientEmail,
    deliveryAddress: data.deliveryAddress,
    city: data.city,
    supplierId: data.supplierId,
    totalAmountXOF: totalAmount,
    paymentMethod: data.paymentMethod || "cash",
    estimatedDeliveryTime: data.estimatedDeliveryTime,
    notes: data.notes
  });
}
async function getGasOrderById(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasOrders).where(eq21(gasOrders.id, id)).limit(1);
}
async function getGasOrderByReference(reference) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasOrders).where(eq21(gasOrders.reference, reference)).limit(1);
}
async function getGasOrdersBySupplierId(supplierId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasOrders).where(eq21(gasOrders.supplierId, supplierId)).orderBy(desc19(gasOrders.createdAt));
}
async function getGasOrdersByStatus(supplierId, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasOrders).where(and12(eq21(gasOrders.supplierId, supplierId), eq21(gasOrders.orderStatus, status))).orderBy(desc19(gasOrders.createdAt));
}
async function updateGasOrder(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(gasOrders).set(data).where(eq21(gasOrders.id, id));
}
async function generateOrderReference() {
  const timestamp2 = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `GAZ-${timestamp2}-${random}`;
}
async function createGasOrderItem(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const unitPrice = typeof data.unitPriceXOF === "string" ? data.unitPriceXOF : data.unitPriceXOF.toString();
  const deliveryFee = typeof data.deliveryFeeXOF === "string" ? data.deliveryFeeXOF : data.deliveryFeeXOF.toString();
  const subtotal = typeof data.subtotalXOF === "string" ? data.subtotalXOF : data.subtotalXOF.toString();
  return await db.insert(gasOrderItems).values({
    orderId: data.orderId,
    bottleId: data.bottleId,
    quantity: data.quantity,
    unitPriceXOF: unitPrice,
    deliveryFeeXOF: deliveryFee,
    subtotalXOF: subtotal
  });
}
async function getGasOrderItemsByOrderId(orderId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasOrderItems).where(eq21(gasOrderItems.orderId, orderId));
}
async function deleteGasOrderItem(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(gasOrderItems).where(eq21(gasOrderItems.id, id));
}
async function createGasDelivery(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(gasDeliveries).values(data);
}
async function getGasDeliveryByOrderId(orderId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasDeliveries).where(eq21(gasDeliveries.orderId, orderId)).limit(1);
}
async function updateGasDelivery(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(gasDeliveries).set(data).where(eq21(gasDeliveries.id, id));
}
async function getGasDeliveriesByStatus(status) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasDeliveries).where(eq21(gasDeliveries.status, status)).orderBy(desc19(gasDeliveries.createdAt));
}
async function getGasSupplierStats(supplierId) {
  const orders = await getGasOrdersBySupplierId(supplierId);
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + (typeof order.totalAmountXOF === "string" ? parseFloat(order.totalAmountXOF) : order.totalAmountXOF);
  }, 0);
  const deliveredOrders = orders.filter((o) => o.orderStatus === "delivered").length;
  const pendingOrders = orders.filter((o) => o.orderStatus === "pending").length;
  return {
    totalOrders,
    totalRevenue,
    deliveredOrders,
    pendingOrders,
    conversionRate: totalOrders > 0 ? (deliveredOrders / totalOrders * 100).toFixed(2) : "0"
  };
}

// server/gas-deliverymen-db.ts
init_db();
init_schema();
import { eq as eq22, and as and13, inArray as inArray2 } from "drizzle-orm";
async function getDeliverymanById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const rows = await db.select().from(gasDeliverymen).where(eq22(gasDeliverymen.id, id));
  return rows[0];
}
async function getDeliverymanByUserId(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const rows = await db.select().from(gasDeliverymen).where(eq22(gasDeliverymen.userId, userId));
  return rows[0];
}
async function listActiveDeliverymen() {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(gasDeliverymen).where(eq22(gasDeliverymen.isActive, true));
  return results;
}
async function listDeliverymenByLocation(latitude, longitude, radiusKm = 5) {
  const db = await getDb();
  if (!db) return [];
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
  const results = await db.select().from(gasDeliverymen).where(
    and13(
      eq22(gasDeliverymen.isActive, true)
      // Latitude entre latitude - latDelta et latitude + latDelta
      // Longitude entre longitude - lonDelta et longitude + lonDelta
    )
  );
  return results.filter((d) => {
    if (!d.latitude || !d.longitude) return false;
    const lat = parseFloat(d.latitude.toString());
    const lon = parseFloat(d.longitude.toString());
    return Math.abs(lat - latitude) <= latDelta && Math.abs(lon - longitude) <= lonDelta;
  });
}
async function createNotification(data) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(gasOrderNotifications).values(data).returning({ id: gasOrderNotifications.id });
  return result[0];
}
async function notifySuppliersByBottleType(orderId, bottleType) {
  const db = await getDb();
  if (!db) return [];
  const suppliers = await db.select().from(gasSuppliers).where(eq22(gasSuppliers.isActive, true));
  const supplierIds = suppliers.map((s) => s.id);
  for (const supplierId of supplierIds) {
    await createNotification({
      orderId,
      recipientType: "supplier",
      recipientId: supplierId,
      notificationType: "new_order"
    });
  }
  return supplierIds;
}
async function notifyAllDeliverymen(orderId) {
  const db = await getDb();
  if (!db) return [];
  const deliverymen = await listActiveDeliverymen();
  for (const deliveryman of deliverymen) {
    await createNotification({
      orderId,
      recipientType: "deliveryman",
      recipientId: deliveryman.id,
      notificationType: "new_order"
    });
  }
  return deliverymen.map((d) => d.id);
}
async function getUnreadNotificationsForSupplier(supplierId) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(gasOrderNotifications).where(
    and13(
      eq22(gasOrderNotifications.recipientType, "supplier"),
      eq22(gasOrderNotifications.recipientId, supplierId),
      eq22(gasOrderNotifications.isRead, false)
    )
  );
  return results;
}
async function getUnreadNotificationsForDeliveryman(deliverymanId) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(gasOrderNotifications).where(
    and13(
      eq22(gasOrderNotifications.recipientType, "deliveryman"),
      eq22(gasOrderNotifications.recipientId, deliverymanId),
      eq22(gasOrderNotifications.isRead, false)
    )
  );
  return results;
}
async function markNotificationAsRead(notificationId) {
  const db = await getDb();
  if (!db) return;
  await db.update(gasOrderNotifications).set({ isRead: true }).where(eq22(gasOrderNotifications.id, notificationId));
}
async function getOrdersAssignedToDeliveryman(deliverymanId) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(gasOrders).where(
    and13(
      eq22(gasOrders.deliverymanId, deliverymanId),
      inArray2(gasOrders.status, ["assigned_to_deliveryman", "validated_by_deliveryman"])
    )
  );
  return results;
}
async function getPendingOrdersForSupplier(supplierId) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(gasOrders).where(
    and13(
      eq22(gasOrders.supplierId, supplierId),
      eq22(gasOrders.status, "pending")
    )
  );
  return results;
}
async function assignOrderToDeliveryman(orderId, deliverymanId) {
  const db = await getDb();
  if (!db) return;
  await db.update(gasOrders).set({
    deliverymanId,
    status: "assigned_to_deliveryman"
  }).where(eq22(gasOrders.id, orderId));
  await createNotification({
    orderId,
    recipientType: "deliveryman",
    recipientId: deliverymanId,
    notificationType: "order_assigned"
  });
}
async function validateOrderByDeliveryman(orderId, supplierId) {
  const db = await getDb();
  if (!db) return;
  await db.update(gasOrders).set({
    selectedSupplierId: supplierId,
    status: "validated_by_deliveryman"
  }).where(eq22(gasOrders.id, orderId));
  await createNotification({
    orderId,
    recipientType: "supplier",
    recipientId: supplierId,
    notificationType: "order_validated"
  });
}
async function confirmDelivery(orderId) {
  const db = await getDb();
  if (!db) return;
  await db.update(gasOrders).set({
    status: "delivered"
  }).where(eq22(gasOrders.id, orderId));
  const order = await db.select().from(gasOrders).where(eq22(gasOrders.id, orderId));
  if (order.length > 0 && order[0].selectedSupplierId) {
    await createNotification({
      orderId,
      recipientType: "supplier",
      recipientId: order[0].selectedSupplierId,
      notificationType: "order_delivered"
    });
  }
}

// server/routers/gas.ts
var gasRouter = router({
  // --- GAS SUPPLIERS ---
  suppliers: router({
    getById: publicProcedure.input(z22.number()).query(({ input }) => getGasSupplierById(input)),
    getByCompanyId: protectedProcedure.input(z22.number()).query(({ input }) => getGasSuppliersByCompanyId(input)),
    create: protectedProcedure.input(z22.object({
      companyId: z22.number(),
      businessName: z22.string(),
      phone: z22.string(),
      email: z22.string().optional(),
      address: z22.string().optional(),
      city: z22.string().optional(),
      country: z22.string().optional(),
      logoUrl: z22.string().optional(),
      description: z22.string().optional()
    })).mutation(({ input }) => createGasSupplier(input)),
    update: protectedProcedure.input(z22.object({
      id: z22.number(),
      businessName: z22.string().optional(),
      phone: z22.string().optional(),
      email: z22.string().optional(),
      address: z22.string().optional(),
      city: z22.string().optional(),
      country: z22.string().optional(),
      logoUrl: z22.string().optional(),
      description: z22.string().optional(),
      isActive: z22.boolean().optional()
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return updateGasSupplier(id, data);
    })
  }),
  // --- GAS BOTTLES ---
  bottles: router({
    getById: publicProcedure.input(z22.number()).query(({ input }) => getGasBottleById(input)),
    getBySupplierId: publicProcedure.input(z22.number()).query(({ input }) => getGasBottlesBySupplierId(input)),
    getAvailable: publicProcedure.input(z22.number()).query(({ input }) => getAvailableGasBottles(input)),
    create: protectedProcedure.input(z22.object({
      supplierId: z22.number(),
      type: z22.string(),
      // B6, B12, etc.
      capacity: z22.string(),
      // 6kg, 12kg, etc.
      priceXOF: z22.number(),
      deliveryFeeXOF: z22.number(),
      stock: z22.number().optional(),
      minStock: z22.number().optional(),
      description: z22.string().optional(),
      photoUrl: z22.string().optional()
    })).mutation(({ input }) => createGasBottle(input)),
    update: protectedProcedure.input(z22.object({
      id: z22.number(),
      type: z22.string().optional(),
      capacity: z22.string().optional(),
      priceXOF: z22.number().optional(),
      deliveryFeeXOF: z22.number().optional(),
      stock: z22.number().optional(),
      minStock: z22.number().optional(),
      description: z22.string().optional(),
      photoUrl: z22.string().optional(),
      isAvailable: z22.boolean().optional()
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      const updateData = { ...data };
      if (data.priceXOF !== void 0) updateData.priceXOF = data.priceXOF.toString();
      if (data.deliveryFeeXOF !== void 0) updateData.deliveryFeeXOF = data.deliveryFeeXOF.toString();
      return updateGasBottle(id, updateData);
    }),
    decreaseStock: protectedProcedure.input(z22.object({
      bottleId: z22.number(),
      quantity: z22.number()
    })).mutation(({ input }) => decreaseGasBottleStock(input.bottleId, input.quantity))
  }),
  // --- GAS ORDERS ---
  orders: router({
    getById: publicProcedure.input(z22.number()).query(({ input }) => getGasOrderById(input)),
    getByReference: publicProcedure.input(z22.string()).query(({ input }) => getGasOrderByReference(input)),
    getBySupplierId: protectedProcedure.input(z22.number()).query(({ input }) => getGasOrdersBySupplierId(input)),
    getByStatus: protectedProcedure.input(z22.object({
      supplierId: z22.number(),
      status: z22.enum(["pending", "confirmed", "in_delivery", "delivered", "cancelled"])
    })).query(({ input }) => getGasOrdersByStatus(input.supplierId, input.status)),
    create: publicProcedure.input(z22.object({
      clientName: z22.string(),
      clientPhone: z22.string(),
      clientEmail: z22.string().optional(),
      deliveryAddress: z22.string(),
      city: z22.string(),
      supplierId: z22.number(),
      items: z22.array(z22.object({
        bottleId: z22.number(),
        quantity: z22.number(),
        unitPriceXOF: z22.number(),
        deliveryFeeXOF: z22.number()
      })),
      paymentMethod: z22.enum(["cash", "mobile_money", "card", "bank_transfer"]).optional(),
      notes: z22.string().optional()
    })).mutation(async ({ input }) => {
      const reference = await generateOrderReference();
      const totalAmountXOF = input.items.reduce((sum, item) => {
        return sum + (item.unitPriceXOF * item.quantity + item.deliveryFeeXOF);
      }, 0);
      const orderResult = await createGasOrder({
        reference,
        clientName: input.clientName,
        clientPhone: input.clientPhone,
        clientEmail: input.clientEmail,
        deliveryAddress: input.deliveryAddress,
        city: input.city,
        supplierId: input.supplierId,
        totalAmountXOF,
        paymentMethod: input.paymentMethod,
        notes: input.notes
      });
      for (const item of input.items) {
        const subtotal = item.unitPriceXOF * item.quantity + item.deliveryFeeXOF;
        await createGasOrderItem({
          orderId: orderResult.insertId || 0,
          bottleId: item.bottleId,
          quantity: item.quantity,
          unitPriceXOF: item.unitPriceXOF,
          deliveryFeeXOF: item.deliveryFeeXOF,
          subtotalXOF: subtotal
        });
        await decreaseGasBottleStock(item.bottleId, item.quantity);
      }
      await createGasDelivery({
        orderId: orderResult.insertId || 0
      });
      const orderId = orderResult.insertId || 0;
      const bottleType = input.items[0]?.bottleId;
      if (bottleType) {
        await notifySuppliersByBottleType(orderId, "B6");
      }
      await notifyAllDeliverymen(orderId);
      return { reference, totalAmountXOF };
    }),
    update: protectedProcedure.input(z22.object({
      id: z22.number(),
      orderStatus: z22.enum(["pending", "confirmed", "in_delivery", "delivered", "cancelled"]).optional(),
      paymentStatus: z22.enum(["pending", "partial", "paid"]).optional(),
      deliveryDate: z22.date().optional(),
      notes: z22.string().optional()
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return updateGasOrder(id, data);
    })
  }),
  // --- GAS ORDER ITEMS ---
  orderItems: router({
    getByOrderId: publicProcedure.input(z22.number()).query(({ input }) => getGasOrderItemsByOrderId(input)),
    delete: protectedProcedure.input(z22.number()).mutation(({ input }) => deleteGasOrderItem(input))
  }),
  // --- GAS DELIVERIES ---
  deliveries: router({
    getByOrderId: publicProcedure.input(z22.number()).query(({ input }) => getGasDeliveryByOrderId(input)),
    getByStatus: protectedProcedure.input(z22.enum(["pending", "in_transit", "arrived", "completed", "failed"])).query(({ input }) => getGasDeliveriesByStatus(input)),
    update: protectedProcedure.input(z22.object({
      id: z22.number(),
      status: z22.enum(["pending", "in_transit", "arrived", "completed", "failed"]).optional(),
      driverName: z22.string().optional(),
      driverPhone: z22.string().optional(),
      vehicleInfo: z22.string().optional(),
      gpsLatitude: z22.string().optional(),
      gpsLongitude: z22.string().optional(),
      notes: z22.string().optional()
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return updateGasDelivery(id, data);
    })
  }),
  // --- STATISTICS ---
  stats: router({
    getSupplierStats: protectedProcedure.input(z22.number()).query(({ input }) => getGasSupplierStats(input))
  }),
  // --- DELIVERYMEN ---
  deliverymen: router({
    getById: protectedProcedure.input(z22.number()).query(({ input }) => getDeliverymanById(input)),
    getByUserId: protectedProcedure.input(z22.number()).query(({ input }) => getDeliverymanByUserId(input)),
    listActive: publicProcedure.query(() => listActiveDeliverymen()),
    listByLocation: publicProcedure.input(z22.object({
      latitude: z22.number(),
      longitude: z22.number(),
      radiusKm: z22.number().optional()
    })).query(({ input }) => listDeliverymenByLocation(input.latitude, input.longitude, input.radiusKm))
  }),
  // --- NOTIFICATIONS ---
  notifications: router({
    getUnreadForSupplier: protectedProcedure.input(z22.number()).query(({ input }) => getUnreadNotificationsForSupplier(input)),
    getUnreadForDeliveryman: protectedProcedure.input(z22.number()).query(({ input }) => getUnreadNotificationsForDeliveryman(input)),
    markAsRead: protectedProcedure.input(z22.number()).mutation(({ input }) => markNotificationAsRead(input))
  }),
  // --- ORDER WORKFLOW ---
  workflow: router({
    getAssignedToDeliveryman: protectedProcedure.input(z22.number()).query(({ input }) => getOrdersAssignedToDeliveryman(input)),
    getPendingForSupplier: protectedProcedure.input(z22.number()).query(({ input }) => getPendingOrdersForSupplier(input)),
    assignToDeliveryman: protectedProcedure.input(z22.object({
      orderId: z22.number(),
      deliverymanId: z22.number()
    })).mutation(({ input }) => assignOrderToDeliveryman(input.orderId, input.deliverymanId)),
    validateByDeliveryman: protectedProcedure.input(z22.object({
      orderId: z22.number(),
      supplierId: z22.number()
    })).mutation(({ input }) => validateOrderByDeliveryman(input.orderId, input.supplierId)),
    confirmDelivery: protectedProcedure.input(z22.number()).mutation(({ input }) => confirmDelivery(input))
  })
});

// server/routers/shop.ts
import { z as z23 } from "zod";

// server/shop-db.ts
init_db();
init_schema();
import { eq as eq23, and as and14, lte as lte7, like as like4, desc as desc20 } from "drizzle-orm";
async function createShopProduct(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.insert(shopProducts).values(data);
  return result;
}
async function getShopProductById(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProducts).where(eq23(shopProducts.id, id)).limit(1);
}
async function getShopProductsBySupplierId(supplierId) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProducts).where(
    and14(
      eq23(shopProducts.supplierId, supplierId),
      eq23(shopProducts.isActive, true)
    )
  ).orderBy(desc20(shopProducts.createdAt));
}
async function getShopProductsByCategory(supplierId, category) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProducts).where(
    and14(
      eq23(shopProducts.supplierId, supplierId),
      eq23(shopProducts.category, category),
      eq23(shopProducts.isActive, true)
    )
  ).orderBy(desc20(shopProducts.createdAt));
}
async function searchShopProducts(supplierId, searchTerm) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProducts).where(
    and14(
      eq23(shopProducts.supplierId, supplierId),
      like4(shopProducts.name, `%${searchTerm}%`),
      eq23(shopProducts.isActive, true)
    )
  ).orderBy(desc20(shopProducts.createdAt));
}
async function updateShopProduct(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.update(shopProducts).set(data).where(eq23(shopProducts.id, id));
}
async function deleteShopProduct(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.update(shopProducts).set({ isActive: false }).where(eq23(shopProducts.id, id));
}
async function getShopProductsLowStock(supplierId) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProducts).where(
    and14(
      eq23(shopProducts.supplierId, supplierId),
      lte7(shopProducts.stock, shopProducts.minStockAlert),
      eq23(shopProducts.isActive, true)
    )
  ).orderBy(desc20(shopProducts.stock));
}
async function createShopProductOrder(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.insert(shopProductOrders).values(data);
  return result;
}
async function getShopProductOrderById(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProductOrders).where(eq23(shopProductOrders.id, id)).limit(1);
}
async function getShopProductOrderByReference(reference) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProductOrders).where(eq23(shopProductOrders.reference, reference)).limit(1);
}
async function getShopProductOrdersBySupplierId(supplierId) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProductOrders).where(eq23(shopProductOrders.supplierId, supplierId)).orderBy(desc20(shopProductOrders.createdAt));
}
async function getShopProductOrdersByStatus(supplierId, status) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProductOrders).where(
    and14(
      eq23(shopProductOrders.supplierId, supplierId),
      eq23(shopProductOrders.status, status)
    )
  ).orderBy(desc20(shopProductOrders.createdAt));
}
async function updateShopProductOrder(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.update(shopProductOrders).set(data).where(eq23(shopProductOrders.id, id));
}
async function createShopProductOrderItem(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.insert(shopProductOrderItems).values(data);
}
async function createStockMovement(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.insert(shopProductStockMovements).values(data);
}
async function getStockMovementsByProductId(productId) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProductStockMovements).where(eq23(shopProductStockMovements.productId, productId)).orderBy(desc20(shopProductStockMovements.createdAt));
}
async function getStockMovementsBySupplierId(supplierId) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProductStockMovements).where(eq23(shopProductStockMovements.supplierId, supplierId)).orderBy(desc20(shopProductStockMovements.createdAt));
}
async function decreaseProductStock(productId, quantity) {
  const productList = await getShopProductById(productId);
  const product = Array.isArray(productList) ? productList[0] : productList;
  if (!product) throw new Error("Product not found");
  const currentStock = typeof product.stock === "string" ? parseInt(product.stock) : product.stock;
  const newStock = Math.max(0, currentStock - quantity);
  await updateShopProduct(productId, { stock: newStock });
  await createStockMovement({
    productId,
    supplierId: product.supplierId,
    movementType: "out",
    quantity,
    reason: "Order"
  });
  return newStock;
}
async function increaseProductStock(productId, quantity, reason = "Restock") {
  const productList = await getShopProductById(productId);
  const product = Array.isArray(productList) ? productList[0] : productList;
  if (!product) throw new Error("Product not found");
  const currentStock = typeof product.stock === "string" ? parseInt(product.stock) : product.stock;
  const newStock = currentStock + quantity;
  await updateShopProduct(productId, { stock: newStock });
  await createStockMovement({
    productId,
    supplierId: product.supplierId,
    movementType: "in",
    quantity,
    reason
  });
  return newStock;
}
async function generateOrderReference2() {
  const timestamp2 = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PRD-${timestamp2}-${random}`;
}

// server/routers/shop.ts
import { TRPCError as TRPCError15 } from "@trpc/server";
var shopRouter = router({
  // Create product
  createProduct: protectedProcedure.input(
    z23.object({
      supplierId: z23.number(),
      name: z23.string().min(1),
      description: z23.string().optional(),
      category: z23.string().min(1),
      price: z23.number().positive(),
      stock: z23.number().min(0),
      sku: z23.string().optional(),
      barcode: z23.string().optional(),
      imageUrl: z23.string().optional(),
      minStockAlert: z23.number().min(0).optional()
    })
  ).mutation(async ({ input }) => {
    try {
      const result = await createShopProduct({
        ...input,
        isActive: true
      });
      return { success: true, productId: result.insertId || 0 };
    } catch (error) {
      throw new TRPCError15({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create product"
      });
    }
  }),
  // Get product by ID
  getProduct: protectedProcedure.input(z23.object({ id: z23.number() })).query(async ({ input }) => {
    const product = await getShopProductById(input.id);
    if (!product) {
      throw new TRPCError15({
        code: "NOT_FOUND",
        message: "Product not found"
      });
    }
    return product;
  }),
  // Get products by supplier
  getProductsBySupplier: protectedProcedure.input(z23.object({ supplierId: z23.number() })).query(async ({ input }) => {
    return await getShopProductsBySupplierId(input.supplierId);
  }),
  // Get products by category
  getProductsByCategory: protectedProcedure.input(z23.object({ supplierId: z23.number(), category: z23.string() })).query(async ({ input }) => {
    return await getShopProductsByCategory(input.supplierId, input.category);
  }),
  // Search products
  searchProducts: protectedProcedure.input(z23.object({ supplierId: z23.number(), searchTerm: z23.string() })).query(async ({ input }) => {
    return await searchShopProducts(input.supplierId, input.searchTerm);
  }),
  // Update product
  updateProduct: protectedProcedure.input(
    z23.object({
      id: z23.number(),
      name: z23.string().optional(),
      description: z23.string().optional(),
      category: z23.string().optional(),
      price: z23.number().positive().optional(),
      stock: z23.number().min(0).optional(),
      sku: z23.string().optional(),
      barcode: z23.string().optional(),
      imageUrl: z23.string().optional(),
      isActive: z23.boolean().optional(),
      minStockAlert: z23.number().min(0).optional()
    })
  ).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await updateShopProduct(id, data);
    return { success: true };
  }),
  // Delete product (soft delete)
  deleteProduct: protectedProcedure.input(z23.object({ id: z23.number() })).mutation(async ({ input }) => {
    await deleteShopProduct(input.id);
    return { success: true };
  }),
  // Get low stock products
  getLowStockProducts: protectedProcedure.input(z23.object({ supplierId: z23.number() })).query(async ({ input }) => {
    return await getShopProductsLowStock(input.supplierId);
  }),
  // --- SHOP PRODUCT ORDERS CRUD -----------------------------------------------
  // Create order
  createOrder: protectedProcedure.input(
    z23.object({
      supplierId: z23.number(),
      clientName: z23.string().min(1),
      clientPhone: z23.string().min(1),
      clientEmail: z23.string().email().optional(),
      deliveryAddress: z23.string().min(1),
      city: z23.string().min(1),
      totalAmountXOF: z23.number().positive(),
      paymentMethod: z23.enum(["cash", "mobile_money", "card", "bank_transfer"]).optional(),
      notes: z23.string().optional(),
      items: z23.array(
        z23.object({
          productId: z23.number(),
          quantity: z23.number().positive(),
          unitPrice: z23.number().positive()
        })
      )
    })
  ).mutation(async ({ input }) => {
    try {
      const reference = await generateOrderReference2();
      const orderResult = await createShopProductOrder({
        reference,
        supplierId: input.supplierId,
        clientName: input.clientName,
        clientPhone: input.clientPhone,
        clientEmail: input.clientEmail,
        deliveryAddress: input.deliveryAddress,
        city: input.city,
        totalAmountXOF: input.totalAmountXOF,
        paymentMethod: input.paymentMethod || "cash",
        notes: input.notes,
        status: "pending"
      });
      const orderId = orderResult.insertId || 0;
      for (const item of input.items) {
        const subtotal = (item.quantity * item.unitPrice).toString();
        await createShopProductOrderItem({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          subtotal
        });
        await decreaseProductStock(item.productId, item.quantity);
      }
      return { success: true, reference, orderId };
    } catch (error) {
      throw new TRPCError15({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create order"
      });
    }
  }),
  // Get order by ID
  getOrder: protectedProcedure.input(z23.object({ id: z23.number() })).query(async ({ input }) => {
    const order = await getShopProductOrderById(input.id);
    if (!order) {
      throw new TRPCError15({
        code: "NOT_FOUND",
        message: "Order not found"
      });
    }
    return order;
  }),
  // Get order by reference
  getOrderByReference: protectedProcedure.input(z23.object({ reference: z23.string() })).query(async ({ input }) => {
    const order = await getShopProductOrderByReference(input.reference);
    if (!order) {
      throw new TRPCError15({
        code: "NOT_FOUND",
        message: "Order not found"
      });
    }
    return order;
  }),
  // Get orders by supplier
  getOrdersBySupplier: protectedProcedure.input(z23.object({ supplierId: z23.number() })).query(async ({ input }) => {
    return await getShopProductOrdersBySupplierId(input.supplierId);
  }),
  // Get orders by status
  getOrdersByStatus: protectedProcedure.input(z23.object({ supplierId: z23.number(), status: z23.string() })).query(async ({ input }) => {
    return await getShopProductOrdersByStatus(input.supplierId, input.status);
  }),
  // Update order status
  updateOrderStatus: protectedProcedure.input(
    z23.object({
      id: z23.number(),
      status: z23.enum(["pending", "confirmed", "in_delivery", "delivered", "cancelled"])
    })
  ).mutation(async ({ input }) => {
    await updateShopProductOrder(input.id, { status: input.status });
    return { success: true };
  }),
  // --- STOCK MOVEMENTS -------------------------------------------------------
  // Get stock movements by product
  getStockMovementsByProduct: protectedProcedure.input(z23.object({ productId: z23.number() })).query(async ({ input }) => {
    return await getStockMovementsByProductId(input.productId);
  }),
  // Get stock movements by supplier
  getStockMovementsBySupplier: protectedProcedure.input(z23.object({ supplierId: z23.number() })).query(async ({ input }) => {
    return await getStockMovementsBySupplierId(input.supplierId);
  }),
  // Adjust stock
  adjustStock: protectedProcedure.input(
    z23.object({
      productId: z23.number(),
      quantity: z23.number(),
      reason: z23.string()
    })
  ).mutation(async ({ input }) => {
    try {
      if (input.quantity > 0) {
        await increaseProductStock(input.productId, input.quantity, input.reason);
      } else if (input.quantity < 0) {
        await decreaseProductStock(input.productId, Math.abs(input.quantity));
      }
      return { success: true };
    } catch (error) {
      throw new TRPCError15({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to adjust stock"
      });
    }
  })
});

// server/routers/supplier-dashboard.ts
import { z as z24 } from "zod";
init_db();
init_schema();
import { eq as eq24, and as and15, desc as desc21, sql as sql6 } from "drizzle-orm";
import { TRPCError as TRPCError16 } from "@trpc/server";
var supplierDashboardRouter = router({
  // Get supplier dashboard overview
  getOverview: protectedProcedure.input(z24.object({ supplierId: z24.number() })).query(async ({ input, ctx }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError16({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }
    const supplier = await database.select().from(gasSuppliers).where(eq24(gasSuppliers.id, input.supplierId)).limit(1);
    if (!supplier.length) {
      throw new TRPCError16({ code: "NOT_FOUND", message: "Supplier not found" });
    }
    const totalOrders = await database.select({ count: sql6`COUNT(*)` }).from(gasOrders).where(eq24(gasOrders.supplierId, input.supplierId));
    const pendingOrders = await database.select({ count: sql6`COUNT(*)` }).from(gasOrders).where(
      and15(
        eq24(gasOrders.supplierId, input.supplierId),
        eq24(gasOrders.status, "pending")
      )
    );
    const completedOrders = await database.select({ count: sql6`COUNT(*)` }).from(gasOrders).where(
      and15(
        eq24(gasOrders.supplierId, input.supplierId),
        eq24(gasOrders.status, "delivered")
      )
    );
    const revenue = await database.select({ total: sql6`SUM(CAST(totalAmountXOF AS DECIMAL(12,2)))` }).from(gasOrders).where(
      and15(
        eq24(gasOrders.supplierId, input.supplierId),
        eq24(gasOrders.status, "delivered")
      )
    );
    const stocks = await database.select().from(gasBottles).where(eq24(gasBottles.supplierId, input.supplierId));
    return {
      supplier: supplier[0],
      stats: {
        totalOrders: Number(totalOrders[0]?.count || 0),
        pendingOrders: Number(pendingOrders[0]?.count || 0),
        completedOrders: Number(completedOrders[0]?.count || 0),
        totalRevenue: parseFloat(revenue[0]?.total || 0)
      },
      stocks
    };
  }),
  // Get all orders for supplier
  getOrders: protectedProcedure.input(
    z24.object({
      supplierId: z24.number(),
      status: z24.enum(["pending", "confirmed", "in_transit", "delivered", "cancelled"]).optional(),
      page: z24.number().default(1),
      limit: z24.number().default(10)
    })
  ).query(async ({ input }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError16({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }
    const offset = (input.page - 1) * input.limit;
    let query = database.select().from(gasOrders).where(eq24(gasOrders.supplierId, input.supplierId));
    if (input.status) {
      query = query.where(eq24(gasOrders.status, input.status));
    }
    const orders = await query.orderBy(desc21(gasOrders.createdAt)).limit(input.limit).offset(offset);
    return orders;
  }),
  // Update order status
  updateOrderStatus: protectedProcedure.input(
    z24.object({
      orderId: z24.number(),
      status: z24.enum(["pending", "confirmed", "in_transit", "delivered", "cancelled"]),
      supplierId: z24.number()
    })
  ).mutation(async ({ input }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError16({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }
    const order = await database.select().from(gasOrders).where(
      and15(
        eq24(gasOrders.id, input.orderId),
        eq24(gasOrders.supplierId, input.supplierId)
      )
    ).limit(1);
    if (!order.length) {
      throw new TRPCError16({
        code: "NOT_FOUND",
        message: "Order not found or access denied"
      });
    }
    const updated = await database.update(gasOrders).set({
      status: input.status,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq24(gasOrders.id, input.orderId));
    return { success: true, orderId: input.orderId, newStatus: input.status };
  }),
  // Update stock levels
  updateStock: protectedProcedure.input(
    z24.object({
      bottleId: z24.number(),
      newStock: z24.number().min(0),
      supplierId: z24.number()
    })
  ).mutation(async ({ input }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError16({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }
    const bottle = await database.select().from(gasBottles).where(
      and15(
        eq24(gasBottles.id, input.bottleId),
        eq24(gasBottles.supplierId, input.supplierId)
      )
    ).limit(1);
    if (!bottle.length) {
      throw new TRPCError16({
        code: "NOT_FOUND",
        message: "Bottle not found or access denied"
      });
    }
    const updated = await database.update(gasBottles).set({
      stock: input.newStock,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq24(gasBottles.id, input.bottleId));
    return {
      success: true,
      bottleId: input.bottleId,
      newStock: input.newStock
    };
  }),
  // Get order details with items
  getOrderDetails: protectedProcedure.input(z24.object({ orderId: z24.number(), supplierId: z24.number() })).query(async ({ input }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError16({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }
    const order = await database.select().from(gasOrders).where(
      and15(
        eq24(gasOrders.id, input.orderId),
        eq24(gasOrders.supplierId, input.supplierId)
      )
    ).limit(1);
    if (!order.length) {
      throw new TRPCError16({
        code: "NOT_FOUND",
        message: "Order not found"
      });
    }
    return order[0];
  }),
  // Get supplier performance metrics
  getPerformanceMetrics: protectedProcedure.input(z24.object({ supplierId: z24.number(), days: z24.number().default(30) })).query(async ({ input }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError16({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - input.days);
    const dailyOrders = await database.select({
      date: sql6`DATE(createdAt)`,
      count: sql6`COUNT(*)`,
      revenue: sql6`SUM(CAST(totalAmountXOF AS DECIMAL(12,2)))`
    }).from(gasOrders).where(
      and15(
        eq24(gasOrders.supplierId, input.supplierId),
        sql6`createdAt >= ${startDate}`
      )
    ).groupBy(sql6`DATE(createdAt)`).orderBy(sql6`DATE(createdAt)`);
    const topBottles = await database.select({
      type: gasBottles.type,
      capacity: gasBottles.capacity,
      totalSold: sql6`COUNT(*)`
    }).from(gasBottles).where(eq24(gasBottles.supplierId, input.supplierId)).groupBy(gasBottles.id).orderBy(sql6`COUNT(*) DESC`).limit(5);
    return {
      dailyOrders,
      topBottles
    };
  }),
  // Get low stock alerts
  getLowStockAlerts: protectedProcedure.input(z24.object({ supplierId: z24.number(), threshold: z24.number().default(10) })).query(async ({ input }) => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError16({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
    }
    const lowStockBottles = await database.select().from(gasBottles).where(
      and15(
        eq24(gasBottles.supplierId, input.supplierId),
        sql6`stock <= ${input.threshold}`
      )
    );
    return lowStockBottles;
  })
});

// server/routers.ts
init_db();
var appRouter = router({
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
      return { success: true };
    })
  }),
  // ─── HOTEL SETTINGS ────────────────────────────────────────────────────────
  hotel: router({
    getSettings: publicProcedure.query(() => getHotelSettings()),
    updateSettings: protectedProcedure.input(z25.object({
      name: z25.string().optional(),
      stars: z25.number().optional(),
      address: z25.string().optional(),
      phone: z25.string().optional(),
      email: z25.string().optional(),
      currency: z25.string().optional(),
      checkInTime: z25.string().optional(),
      checkOutTime: z25.string().optional()
    })).mutation(({ input }) => updateHotelSettings(input))
  }),
  // ─── ROOM TYPES ────────────────────────────────────────────────────────────
  roomTypes: router({
    list: publicProcedure.query(() => getRoomTypes()),
    create: protectedProcedure.input(z25.object({
      name: z25.string(),
      description: z25.string().optional(),
      basePrice: z25.string(),
      capacity: z25.number().optional(),
      amenities: z25.string().optional()
    })).mutation(({ input }) => createRoomType(input)),
    update: protectedProcedure.input(z25.object({
      id: z25.number(),
      name: z25.string().optional(),
      description: z25.string().optional(),
      basePrice: z25.string().optional(),
      capacity: z25.number().optional(),
      amenities: z25.string().optional()
    })).mutation(({ input: { id, ...data } }) => updateRoomType(id, data)),
    delete: protectedProcedure.input(z25.object({ id: z25.number() })).mutation(({ input }) => deleteRoomType(input.id))
  }),
  // ─── ROOMS ─────────────────────────────────────────────────────────────────
  rooms: router({
    list: publicProcedure.query(() => getRooms()),
    getById: publicProcedure.input(z25.object({ id: z25.number() })).query(({ input }) => getRoomById(input.id)),
    create: protectedProcedure.input(z25.object({
      number: z25.string(),
      floor: z25.number().optional(),
      roomTypeId: z25.number(),
      status: z25.enum(["libre", "occupee", "maintenance", "reservee", "nettoyage"]).optional(),
      priceOverride: z25.string().optional(),
      notes: z25.string().optional()
    })).mutation(({ input }) => createRoom(input)),
    update: protectedProcedure.input(z25.object({
      id: z25.number(),
      number: z25.string().optional(),
      floor: z25.number().optional(),
      roomTypeId: z25.number().optional(),
      status: z25.enum(["libre", "occupee", "maintenance", "reservee", "nettoyage"]).optional(),
      priceOverride: z25.string().optional(),
      notes: z25.string().optional()
    })).mutation(({ input: { id, ...data } }) => updateRoom(id, data)),
    delete: protectedProcedure.input(z25.object({ id: z25.number() })).mutation(({ input }) => deleteRoom(input.id))
  }),
  // ─── CLIENTS ───────────────────────────────────────────────────────────────
  clients: router({
    list: publicProcedure.input(z25.object({ search: z25.string().optional() })).query(({ input }) => getClients(input.search)),
    getById: publicProcedure.input(z25.object({ id: z25.number() })).query(({ input }) => getClientById(input.id)),
    getReservations: publicProcedure.input(z25.object({ clientId: z25.number() })).query(({ input }) => getClientReservations(input.clientId)),
    create: protectedProcedure.input(z25.object({
      firstName: z25.string(),
      lastName: z25.string(),
      email: z25.string().optional(),
      phone: z25.string().optional(),
      nationality: z25.string().optional(),
      idType: z25.enum(["passeport", "cni", "permis", "autre"]).optional(),
      idNumber: z25.string().optional(),
      address: z25.string().optional(),
      preferences: z25.string().optional(),
      vip: z25.boolean().optional()
    })).mutation(({ input }) => createClient({ ...input, name: `${input.firstName} ${input.lastName}`.trim() })),
    update: protectedProcedure.input(z25.object({
      id: z25.number(),
      firstName: z25.string().optional(),
      lastName: z25.string().optional(),
      email: z25.string().optional(),
      phone: z25.string().optional(),
      nationality: z25.string().optional(),
      idType: z25.enum(["passeport", "cni", "permis", "autre"]).optional(),
      idNumber: z25.string().optional(),
      address: z25.string().optional(),
      preferences: z25.string().optional(),
      vip: z25.boolean().optional()
    })).mutation(({ input: { id, ...data } }) => updateClient(id, data)),
    delete: protectedProcedure.input(z25.object({ id: z25.number() })).mutation(({ input }) => deleteClient(input.id))
  }),
  // ─── RESERVATIONS ──────────────────────────────────────────────────────────
  reservations: router({
    list: publicProcedure.input(z25.object({ status: z25.string().optional(), search: z25.string().optional() }).optional()).query(({ input }) => getReservations(input)),
    getById: publicProcedure.input(z25.object({ id: z25.number() })).query(({ input }) => getReservationById(input.id)),
    create: protectedProcedure.input(z25.object({
      clientId: z25.number(),
      roomId: z25.number(),
      checkInDate: z25.string(),
      checkOutDate: z25.string(),
      adults: z25.number().optional(),
      children: z25.number().optional(),
      status: z25.enum(["en_attente", "confirmee", "checkin", "checkout", "annulee", "no_show"]).optional(),
      totalAmount: z25.string().optional(),
      source: z25.enum(["direct", "booking", "expedia", "airbnb", "phone", "walk_in"]).optional(),
      notes: z25.string().optional(),
      createdBy: z25.number().optional()
    })).mutation(({ input }) => createReservation(input)),
    update: protectedProcedure.input(z25.object({
      id: z25.number(),
      clientId: z25.number().optional(),
      roomId: z25.number().optional(),
      checkInDate: z25.string().optional(),
      checkOutDate: z25.string().optional(),
      actualCheckIn: z25.date().optional(),
      actualCheckOut: z25.date().optional(),
      adults: z25.number().optional(),
      children: z25.number().optional(),
      status: z25.enum(["en_attente", "confirmee", "checkin", "checkout", "annulee", "no_show"]).optional(),
      totalAmount: z25.string().optional(),
      paidAmount: z25.string().optional(),
      source: z25.enum(["direct", "booking", "expedia", "airbnb", "phone", "walk_in"]).optional(),
      notes: z25.string().optional()
    })).mutation(({ input: { id, ...data } }) => updateReservation(id, data)),
    // ─── Confirmation / Refus ───────────────────────────────────────────────
    getPending: protectedProcedure.query(
      () => getReservations({ status: "en_attente" })
    ),
    confirm: protectedProcedure.input(z25.object({ id: z25.number() })).mutation(async ({ input }) => {
      await updateReservation(input.id, {
        status: "confirmee",
        confirmedAt: /* @__PURE__ */ new Date(),
        refusalReason: null,
        refusedAt: null
      });
      return { success: true };
    }),
    refuse: protectedProcedure.input(z25.object({ id: z25.number(), reason: z25.string().min(1) })).mutation(async ({ input }) => {
      await updateReservation(input.id, {
        status: "annulee",
        refusalReason: input.reason,
        refusedAt: /* @__PURE__ */ new Date()
      });
      return { success: true };
    }),
    getServices: publicProcedure.input(z25.object({ reservationId: z25.number() })).query(({ input }) => getReservationServices(input.reservationId)),
    addService: protectedProcedure.input(z25.object({
      reservationId: z25.number(),
      serviceId: z25.number(),
      quantity: z25.number(),
      unitPrice: z25.string(),
      totalPrice: z25.string(),
      notes: z25.string().optional()
    })).mutation(({ input }) => addReservationService(input))
  }),
  // ─── SERVICES ──────────────────────────────────────────────────────────────
  services: router({
    list: publicProcedure.query(() => getServices()),
    create: protectedProcedure.input(z25.object({
      name: z25.string(),
      category: z25.enum(["restaurant", "spa", "blanchisserie", "transport", "minibar", "autre"]).optional(),
      price: z25.string(),
      unit: z25.string().optional(),
      description: z25.string().optional(),
      active: z25.boolean().optional()
    })).mutation(({ input }) => createService(input)),
    update: protectedProcedure.input(z25.object({
      id: z25.number(),
      name: z25.string().optional(),
      category: z25.enum(["restaurant", "spa", "blanchisserie", "transport", "minibar", "autre"]).optional(),
      price: z25.string().optional(),
      unit: z25.string().optional(),
      description: z25.string().optional(),
      active: z25.boolean().optional()
    })).mutation(({ input: { id, ...data } }) => updateService(id, data)),
    delete: protectedProcedure.input(z25.object({ id: z25.number() })).mutation(({ input }) => deleteService(input.id))
  }),
  // ─── CAISSE / PAYMENTS ─────────────────────────────────────────────────────
  caisse: router({
    getSummary: publicProcedure.input(z25.object({ period: z25.string().optional() }).optional()).query(({ input }) => getCaisseSummary(input?.period)),
    getTransactions: publicProcedure.input(z25.object({ period: z25.string().optional() }).optional()).query(({ input }) => getCaisseTransactions(input?.period)),
    createTransaction: protectedProcedure.input(z25.object({
      type: z25.enum(["encaissement", "decaissement"]),
      amount: z25.string(),
      method: z25.enum(["especes", "carte", "virement", "mobile", "cheque"]).optional(),
      description: z25.string().optional(),
      reservationId: z25.number().optional()
    })).mutation(({ input }) => createCaisseTransaction(input)),
    getPayments: publicProcedure.input(z25.object({ reservationId: z25.number().optional() }).optional()).query(({ input }) => getPayments(input?.reservationId)),
    createPayment: protectedProcedure.input(z25.object({
      reservationId: z25.number().optional(),
      invoiceId: z25.number().optional(),
      clientId: z25.number(),
      amount: z25.string(),
      method: z25.enum(["especes", "carte", "virement", "mobile_money", "cheque"]).optional(),
      reference: z25.string().optional(),
      status: z25.enum(["en_attente", "complete", "rembourse", "echec"]).optional(),
      notes: z25.string().optional(),
      createdBy: z25.number().optional()
    })).mutation(({ input }) => createPayment(input)),
    getInvoices: publicProcedure.query(() => getInvoices()),
    createInvoice: protectedProcedure.input(z25.object({
      reservationId: z25.number().optional(),
      clientId: z25.number(),
      amount: z25.string(),
      taxAmount: z25.string().optional(),
      totalAmount: z25.string(),
      status: z25.enum(["brouillon", "emise", "payee", "annulee"]).optional(),
      notes: z25.string().optional()
    })).mutation(({ input }) => createInvoice(input)),
    updateInvoice: protectedProcedure.input(z25.object({
      id: z25.number(),
      status: z25.enum(["brouillon", "emise", "payee", "annulee"]).optional(),
      notes: z25.string().optional()
    })).mutation(({ input: { id, ...data } }) => updateInvoice(id, data))
  }),
  // ─── EMPLOYEES ─────────────────────────────────────────────────────────────
  employees: router({
    list: publicProcedure.query(() => getEmployees()),
    getById: publicProcedure.input(z25.object({ id: z25.number() })).query(({ input }) => getEmployeeById(input.id)),
    create: protectedProcedure.input(z25.object({
      firstName: z25.string(),
      lastName: z25.string(),
      email: z25.string().optional(),
      phone: z25.string().optional(),
      role: z25.enum(["admin", "manager", "receptionniste", "housekeeping", "restauration", "maintenance"]),
      department: z25.string().optional(),
      hireDate: z25.string().optional(),
      salary: z25.string().optional(),
      status: z25.enum(["actif", "conge", "inactif"]).optional(),
      notes: z25.string().optional()
    })).mutation(({ input }) => createEmployee(input)),
    update: protectedProcedure.input(z25.object({
      id: z25.number(),
      firstName: z25.string().optional(),
      lastName: z25.string().optional(),
      email: z25.string().optional(),
      phone: z25.string().optional(),
      role: z25.enum(["admin", "manager", "receptionniste", "housekeeping", "restauration", "maintenance"]).optional(),
      department: z25.string().optional(),
      hireDate: z25.string().optional(),
      salary: z25.string().optional(),
      status: z25.enum(["actif", "conge", "inactif"]).optional(),
      notes: z25.string().optional()
    })).mutation(({ input: { id, ...data } }) => updateEmployee(id, data)),
    delete: protectedProcedure.input(z25.object({ id: z25.number() })).mutation(({ input }) => deleteEmployee(input.id))
  }),
  // ─── HOUSEKEEPING ──────────────────────────────────────────────────────────
  housekeeping: router({
    list: publicProcedure.input(z25.object({ status: z25.string().optional(), assignedTo: z25.number().optional() }).optional()).query(({ input }) => getHousekeepingTasks(input)),
    create: protectedProcedure.input(z25.object({
      roomId: z25.number(),
      assignedTo: z25.number().optional(),
      type: z25.enum(["nettoyage", "recouche", "depart", "inspection", "maintenance"]).optional(),
      status: z25.enum(["en_attente", "en_cours", "termine", "verifie"]).optional(),
      priority: z25.enum(["basse", "normale", "haute", "urgente"]).optional(),
      scheduledAt: z25.date().optional(),
      notes: z25.string().optional()
    })).mutation(({ input }) => createHousekeepingTask(input)),
    update: protectedProcedure.input(z25.object({
      id: z25.number(),
      assignedTo: z25.number().optional(),
      type: z25.enum(["nettoyage", "recouche", "depart", "inspection", "maintenance"]).optional(),
      status: z25.enum(["en_attente", "en_cours", "termine", "verifie"]).optional(),
      priority: z25.enum(["basse", "normale", "haute", "urgente"]).optional(),
      scheduledAt: z25.date().optional(),
      startedAt: z25.date().optional(),
      completedAt: z25.date().optional(),
      notes: z25.string().optional()
    })).mutation(({ input: { id, ...data } }) => updateHousekeepingTask(id, data))
  }),
  // ─── INVENTORY ─────────────────────────────────────────────────────────────
  inventory: router({
    getCategories: publicProcedure.query(() => getInventoryCategories()),
    list: publicProcedure.query(() => getInventoryItems()),
    create: protectedProcedure.input(z25.object({
      name: z25.string(),
      categoryId: z25.number().optional(),
      unit: z25.string().optional(),
      currentStock: z25.string().optional(),
      minStock: z25.string().optional(),
      maxStock: z25.string().optional(),
      unitCost: z25.string().optional(),
      supplier: z25.string().optional(),
      location: z25.string().optional()
    })).mutation(({ input }) => createInventoryItem(input)),
    update: protectedProcedure.input(z25.object({
      id: z25.number(),
      name: z25.string().optional(),
      categoryId: z25.number().optional(),
      unit: z25.string().optional(),
      currentStock: z25.string().optional(),
      minStock: z25.string().optional(),
      maxStock: z25.string().optional(),
      unitCost: z25.string().optional(),
      supplier: z25.string().optional(),
      location: z25.string().optional()
    })).mutation(({ input: { id, ...data } }) => updateInventoryItem(id, data)),
    addMovement: protectedProcedure.input(z25.object({
      itemId: z25.number(),
      type: z25.enum(["entree", "sortie", "ajustement"]),
      quantity: z25.string(),
      reason: z25.string().optional(),
      createdBy: z25.number().optional()
    })).mutation(({ input }) => addInventoryMovement(input))
  }),
  // ─── DASHBOARD / ANALYTICS ───────────────────────────────────────────────────────
  dashboard: router({
    getStats: publicProcedure.query(() => getDashboardStats()),
    getMonthlyRevenue: publicProcedure.input(z25.object({ year: z25.number() })).query(({ input }) => getMonthlyRevenue(input.year))
  }),
  // ─── PUBLIC : COUNTRIES & CITIES ───────────────────────────────────────────────
  geo: router({
    countries: publicProcedure.query(async () => {
      await seedCountriesAndCities();
      return getCountries();
    }),
    cities: publicProcedure.input(z25.object({ countryId: z25.number() })).query(({ input }) => getCitiesByCountry(input.countryId))
  }),
  // ─── PUBLIC : HOTEL PROFILES ───────────────────────────────────────────────────────
  publicHotels: router({
    search: publicProcedure.input(z25.object({
      countryId: z25.number().optional(),
      cityId: z25.number().optional(),
      type: z25.enum(["hotel", "restaurant"]).optional(),
      maxPrice: z25.number().positive().optional()
    })).query(({ input }) => getHotelProfiles(input)),
    getById: publicProcedure.input(z25.object({ id: z25.number() })).query(({ input }) => getHotelProfileById(input.id)),
    getRooms: publicProcedure.input(z25.object({ hotelId: z25.number() })).query(async ({ input }) => {
      const profile = await getHotelProfileById(input.hotelId);
      if (!profile) return [];
      const [rooms2, offers] = await Promise.all([
        getPublicRoomsByHotelUserId(profile.userId),
        getActiveOffersByHotel(input.hotelId)
      ]);
      return rooms2.map((room) => ({ ...room, activeOffers: offers }));
    }),
    getAvailableRooms: publicProcedure.input(z25.object({
      hotelId: z25.number(),
      checkIn: z25.string(),
      // ISO date string YYYY-MM-DD
      checkOut: z25.string()
    })).query(async ({ input }) => {
      const profile = await getHotelProfileById(input.hotelId);
      if (!profile) return [];
      const [rooms2, offers] = await Promise.all([
        getAvailableRoomsByDates(profile.userId, input.checkIn, input.checkOut),
        getActiveOffersByHotel(input.hotelId)
      ]);
      return rooms2.map((room) => ({ ...room, activeOffers: offers }));
    }),
    myProfile: protectedProcedure.query(({ ctx }) => getHotelProfileByUserId(ctx.user.id)),
    upsert: protectedProcedure.input(z25.object({
      hotelName: z25.string().min(1),
      managerName: z25.string().optional(),
      phone: z25.string().optional(),
      email: z25.string().email().optional(),
      address: z25.string().optional(),
      countryId: z25.number().optional(),
      cityId: z25.number().optional(),
      type: z25.enum(["hotel", "restaurant"]).optional(),
      stars: z25.number().min(1).max(5).optional(),
      logoUrl: z25.string().optional(),
      description: z25.string().optional()
    })).mutation(({ ctx, input }) => upsertHotelProfile(ctx.user.id, input)),
    uploadLogo: protectedProcedure.input(z25.object({
      fileName: z25.string(),
      fileData: z25.string(),
      // base64
      mimeType: z25.string()
    })).mutation(async ({ ctx, input }) => {
      const { storagePut: storagePut2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
      const buffer = Buffer.from(input.fileData, "base64");
      const key = `hotel-logos/${ctx.user.id}-${Date.now()}-${input.fileName}`;
      const { url } = await storagePut2(key, buffer, input.mimeType);
      await upsertHotelProfile(ctx.user.id, { logoUrl: url });
      return { url };
    })
  }),
  reviews: router({
    // Public: list approved reviews for a hotel
    list: publicProcedure.input(z25.object({ hotelProfileId: z25.number() })).query(({ input }) => getReviewsByHotel(input.hotelProfileId, true)),
    // Public: get rating summary (average, total, distribution)
    summary: publicProcedure.input(z25.object({ hotelProfileId: z25.number() })).query(({ input }) => getHotelRatingSummary(input.hotelProfileId)),
    // Public: submit a review (no auth required)
    create: publicProcedure.input(z25.object({
      hotelProfileId: z25.number(),
      clientName: z25.string().min(1).max(255),
      clientEmail: z25.string().email().optional(),
      rating: z25.number().min(1).max(5),
      comment: z25.string().max(2e3).optional()
    })).mutation(({ input }) => createReview({
      hotelProfileId: input.hotelProfileId,
      clientName: input.clientName,
      clientEmail: input.clientEmail,
      rating: input.rating,
      comment: input.comment,
      approved: false
    })),
    // Admin: list all reviews (pending + approved)
    adminList: protectedProcedure.query(() => getAllReviewsForAdmin()),
    // Admin: approve or reject a review
    approve: protectedProcedure.input(z25.object({ id: z25.number(), approved: z25.boolean() })).mutation(({ input }) => approveReview(input.id, input.approved)),
    // Admin: delete a review
    delete: protectedProcedure.input(z25.object({ id: z25.number() })).mutation(({ input }) => deleteReview(input.id))
  }),
  specialOffers: router({
    // Public: list active & valid offers for a hotel
    listPublic: publicProcedure.input(z25.object({ hotelProfileId: z25.number() })).query(({ input }) => getActiveOffersByHotel(input.hotelProfileId)),
    // Admin: list all offers (including inactive) for the logged-in hotel
    listAdmin: protectedProcedure.query(async ({ ctx }) => {
      const profile = await getHotelProfileByUserId(ctx.user.id);
      if (!profile) return [];
      return getOffersByHotel(profile.id);
    }),
    // Admin: create a new offer
    create: protectedProcedure.input(z25.object({
      title: z25.string().min(1).max(255),
      description: z25.string().max(2e3).optional(),
      discountType: z25.enum(["percent", "fixed"]),
      discountValue: z25.number().min(0),
      minNights: z25.number().min(1).optional(),
      validFrom: z25.string().optional(),
      // ISO date string
      validUntil: z25.string().optional(),
      // ISO date string
      badgeLabel: z25.string().max(50).optional(),
      active: z25.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      const profile = await getHotelProfileByUserId(ctx.user.id);
      if (!profile) throw new Error("Profil h\xF4tel introuvable");
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
        active: input.active ?? true
      });
    }),
    // Admin: update an offer
    update: protectedProcedure.input(z25.object({
      id: z25.number(),
      title: z25.string().min(1).max(255).optional(),
      description: z25.string().max(2e3).optional(),
      discountType: z25.enum(["percent", "fixed"]).optional(),
      discountValue: z25.number().min(0).optional(),
      minNights: z25.number().min(1).optional(),
      validFrom: z25.string().nullable().optional(),
      validUntil: z25.string().nullable().optional(),
      badgeLabel: z25.string().max(50).nullable().optional(),
      active: z25.boolean().optional()
    })).mutation(({ input }) => {
      const { id, discountValue, validFrom, validUntil, ...rest } = input;
      return updateOffer(id, {
        ...rest,
        ...discountValue !== void 0 ? { discountValue: String(discountValue) } : {},
        ...validFrom !== void 0 ? { validFrom: validFrom ? new Date(validFrom) : null } : {},
        ...validUntil !== void 0 ? { validUntil: validUntil ? new Date(validUntil) : null } : {}
      });
    }),
    // Admin: delete an offer
    delete: protectedProcedure.input(z25.object({ id: z25.number() })).mutation(({ input }) => deleteOffer(input.id))
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
    list: publicProcedure.input(z25.object({ roomId: z25.number() })).query(({ input }) => getPhotosByRoom(input.roomId)),
    // Update caption
    updateCaption: protectedProcedure.input(z25.object({ photoId: z25.number(), caption: z25.string().nullable() })).mutation(({ input }) => updatePhotoCaption(input.photoId, input.caption)),
    // Reorder photos
    reorder: protectedProcedure.input(z25.object({ photos: z25.array(z25.object({ id: z25.number(), sortOrder: z25.number() })) })).mutation(({ input }) => reorderPhotos(input.photos)),
    // Delete a photo
    delete: protectedProcedure.input(z25.object({ photoId: z25.number() })).mutation(({ input }) => deleteRoomPhoto(input.photoId))
  })
});

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT as SignJWT3, jwtVerify as jwtVerify3 } from "jose";
var isNonEmptyString2 = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
  }
  decodeState(state) {
    return atob(state);
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(EXCHANGE_TOKEN_PATH, payload);
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(GET_USER_INFO_PATH, {
      accessToken: token.accessToken
    });
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({ baseURL: ENV.oAuthServerUrl, timeout: AXIOS_TIMEOUT_MS });
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(platforms.filter((p) => typeof p === "string"));
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE")) return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({ accessToken });
    const loginMethod = this.deriveLoginMethod(data?.platforms, data?.platform ?? data.platform ?? null);
    return { ...data, platform: loginMethod, loginMethod };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) return /* @__PURE__ */ new Map();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }
  async createSessionToken(openId, options = {}) {
    return this.signSession({ openId, appId: ENV.appId || "nexus", name: options.name || "" }, options);
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT3({ openId: payload.openId, appId: payload.appId, name: payload.name }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) return null;
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify3(cookieValue, secretKey, { algorithms: ["HS256"] });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString2(openId) || !isNonEmptyString2(appId) || !isNonEmptyString2(name)) return null;
      return { openId, appId, name };
    } catch {
      return null;
    }
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const user = await getUserByOpenId(session.openId);
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({ openId: user.openId, lastSignedIn: /* @__PURE__ */ new Date() });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/uploadRoutes.ts
import express from "express";
import multer from "multer";
init_storage();
init_db();
init_schema();
import { eq as eq25 } from "drizzle-orm";
import { nanoid as nanoid2 } from "nanoid";
var router2 = express.Router();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  // 10 MB max per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont accept\xE9es"));
    }
  }
});
async function requireAuth(req, res, next) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Non autoris\xE9" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Non autoris\xE9" });
  }
}
router2.post(
  "/api/rooms/:roomId/photos",
  requireAuth,
  upload.array("photos", 20),
  async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const user = req.user;
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Aucun fichier re\xE7u" });
      }
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB indisponible" });
      const roomRows = await db.select({ id: rooms.id }).from(rooms).where(eq25(rooms.id, roomId)).limit(1);
      if (!roomRows.length) {
        return res.status(404).json({ error: "Chambre introuvable" });
      }
      const profileRows = await db.select({ id: hotelProfiles.id }).from(hotelProfiles).where(eq25(hotelProfiles.userId, user.id)).limit(1);
      if (!profileRows.length) {
        return res.status(403).json({ error: "Profil h\xF4tel requis" });
      }
      const existingPhotos = await db.select({ sortOrder: roomPhotos.sortOrder }).from(roomPhotos).where(eq25(roomPhotos.roomId, roomId));
      const maxOrder = existingPhotos.reduce((m, p) => Math.max(m, p.sortOrder), -1);
      const uploaded = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.originalname.split(".").pop() ?? "jpg";
        const fileKey = `room-photos/${roomId}/${nanoid2(12)}.${ext}`;
        const { url } = await storagePut(fileKey, file.buffer, file.mimetype);
        const result = await db.insert(roomPhotos).values({
          roomId,
          url,
          fileKey,
          caption: null,
          sortOrder: maxOrder + 1 + i
        }).returning({ id: roomPhotos.id });
        uploaded.push({ id: result.insertId, url, fileKey });
      }
      return res.json({ success: true, photos: uploaded });
    } catch (err) {
      console.error("[Upload] Error:", err);
      return res.status(500).json({ error: err.message ?? "Erreur serveur" });
    }
  }
);
router2.delete("/api/room-photos/:photoId", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const photoId = parseInt(req.params.photoId);
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "DB indisponible" });
    const photoRows = await db.select({ id: roomPhotos.id, roomId: roomPhotos.roomId }).from(roomPhotos).where(eq25(roomPhotos.id, photoId)).limit(1);
    if (!photoRows.length) return res.status(404).json({ error: "Photo introuvable" });
    const profileRows = await db.select({ id: hotelProfiles.id }).from(hotelProfiles).where(eq25(hotelProfiles.userId, user.id)).limit(1);
    if (!profileRows.length) {
      return res.status(403).json({ error: "Acc\xE8s refus\xE9" });
    }
    await db.delete(roomPhotos).where(eq25(roomPhotos.id, photoId));
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
var uploadRoutes_default = router2;
var documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Seuls les fichiers PDF et Word sont accept\xE9s"));
    }
  }
});
router2.post(
  "/api/recruitment/upload-document",
  documentUpload.single("document"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Aucun fichier re\xE7u" });
      }
      const docType = req.query.type === "cover_letter" ? "cover-letter" : "cv";
      const ext = file.originalname.split(".").pop() ?? "pdf";
      const key = `recruitment/${docType}/${nanoid2(12)}.${ext}`;
      const { url } = await storagePut(key, file.buffer, file.mimetype);
      return res.json({ success: true, url, key });
    } catch (err) {
      console.error("[UploadDocument]", err);
      return res.status(500).json({ error: err.message ?? "Erreur upload" });
    }
  }
);

// api/index.ts
init_env();
init_db();
init_transport_db();
var app = express2();
app.use((req, res, next) => {
  if (req.path === "/api/hub2/notify") {
    let rawBody = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      rawBody += chunk;
    });
    req.on("end", () => {
      req.rawBody = rawBody;
      try {
        req.body = JSON.parse(rawBody);
      } catch {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
});
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ limit: "50mb", extended: true }));
app.use(uploadRoutes_default);
app.get("/api/oauth/callback", async (req, res) => {
  const code = req.query["code"];
  const state = req.query["state"];
  if (!code || !state) {
    res.status(400).json({ error: "code and state are required" });
    return;
  }
  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
    if (!userInfo.openId) {
      res.status(400).json({ error: "openId missing from user info" });
      return;
    }
    const emailLower = (userInfo.email ?? "").toLowerCase();
    const shouldBeAdmin = emailLower && ADMIN_EMAILS.has(emailLower);
    await upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: /* @__PURE__ */ new Date(),
      ...shouldBeAdmin ? { role: "admin" } : {}
    });
    if (shouldBeAdmin) {
      await promoteToAdminByEmail(emailLower);
    }
    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS
    });
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.redirect(302, "/");
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    res.status(500).json({ error: "OAuth callback failed" });
  }
});
app.post("/api/hub2/notify", async (req, res) => {
  try {
    const rawBody = req.rawBody ?? JSON.stringify(req.body);
    const signatureHeader = req.headers["hub2-signature"] ?? "";
    if (signatureHeader && !verifyHub2WebhookSignature(rawBody, signatureHeader)) {
      console.warn("[Hub2] Signature webhook invalide");
      return res.status(200).send("OK");
    }
    const payload = req.body;
    if (payload?.purchase_ref) {
      const creditRequest = await getCreditRequestByHub2PurchaseRef(payload.purchase_ref);
      if (creditRequest && payload.status === "SUCCESSFUL") {
        await confirmCreditRequestPayment(creditRequest.id, "hub2_webhook");
      }
    }
    res.status(200).send("OK");
  } catch (error) {
    console.error("[Hub2] Webhook error:", error);
    res.status(200).send("OK");
  }
});
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var index_default = app;
export {
  index_default as default
};
