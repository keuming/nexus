import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  date,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// --- USERS / EMPLOYEES -------------------------------------------------------
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  confirmPinHash: varchar("confirmPinHash", { length: 255 }),
  confirmPinAttempts: int("confirmPinAttempts").default(0).notNull(),
  confirmPinLockedUntil: timestamp("confirmPinLockedUntil"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// --- HOTEL SETTINGS ----------------------------------------------------------
export const hotelSettings = mysqlTable("hotel_settings", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().default("Mon Hôtel"),
  stars: int("stars").default(3),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  currency: varchar("currency", { length: 10 }).default("FCFA"),
  checkInTime: varchar("checkInTime", { length: 10 }).default("14:00"),
  checkOutTime: varchar("checkOutTime", { length: 10 }).default("12:00"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// --- ROOM TYPES --------------------------------------------------------------
export const roomTypes = mysqlTable("room_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  basePrice: decimal("basePrice", { precision: 12, scale: 2 }).notNull().default("0"),
  capacity: int("capacity").default(2),
  amenities: text("amenities"), // JSON string
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- ROOMS -------------------------------------------------------------------
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 20 }).notNull().unique(),
  floor: int("floor").default(1),
  roomTypeId: int("roomTypeId").notNull(),
  status: mysqlEnum("status", ["libre", "occupee", "maintenance", "reservee", "nettoyage"]).default("libre").notNull(),
  priceOverride: decimal("priceOverride", { precision: 12, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// --- CLIENTS -----------------------------------------------------------------
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  email: varchar("email", { length: 320 }).unique(),
  phone: varchar("phone", { length: 50 }),
  nationality: varchar("nationality", { length: 100 }),
  idType: mysqlEnum("idType", ["passeport", "cni", "permis", "autre"]),
  idNumber: varchar("idNumber", { length: 100 }),
  address: text("address"),
  preferences: text("preferences"),
  notes: text("notes"),
  vip: boolean("vip").default(false),
  clientType: mysqlEnum("clientType", ["standard", "vip", "corporate", "groupe"]).default("standard"),
  company: varchar("company", { length: 200 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// --- RESERVATIONS ------------------------------------------------------------
export const reservations = mysqlTable("reservations", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 20 }).notNull().unique(),
  clientId: int("clientId").notNull(),
  roomId: int("roomId").notNull(),
  checkInDate: date("checkInDate").notNull(),
  checkOutDate: date("checkOutDate").notNull(),
  actualCheckIn: timestamp("actualCheckIn"),
  actualCheckOut: timestamp("actualCheckOut"),
  adults: int("adults").default(1),
  children: int("children").default(0),
  status: mysqlEnum("status", ["en_attente", "confirmee", "checkin", "checkout", "annulee", "no_show"]).default("en_attente").notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).default("0"),
  paidAmount: decimal("paidAmount", { precision: 12, scale: 2 }).default("0"),
  source: mysqlEnum("source", ["direct", "booking", "expedia", "airbnb", "phone", "walk_in"]).default("direct"),
  notes: text("notes"),
  refusalReason: text("refusalReason"),
  confirmedAt: timestamp("confirmedAt"),
  refusedAt: timestamp("refusedAt"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
// --- SERVICES -----------------------------------------------------------------
export const services = mysqlTable("services", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  category: mysqlEnum("category", ["restaurant", "spa", "blanchisserie", "transport", "minibar", "autre"]).default("autre"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull().default("0"),
  unit: varchar("unit", { length: 50 }).default("unité"),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- RESERVATION SERVICES (extras) -------------------------------------------
export const reservationServices = mysqlTable("reservation_services", {
  id: int("id").autoincrement().primaryKey(),
  reservationId: int("reservationId").notNull(),
  serviceId: int("serviceId").notNull(),
  quantity: int("quantity").default(1),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
});

// --- INVOICES ----------------------------------------------------------------
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  number: varchar("number", { length: 30 }).notNull().unique(),
  reservationId: int("reservationId"),
  clientId: int("clientId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("taxAmount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["brouillon", "emise", "payee", "annulee"]).default("brouillon"),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  dueAt: timestamp("dueAt"),
  notes: text("notes"),
});

// --- PAYMENTS ----------------------------------------------------------------
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  reservationId: int("reservationId"),
  invoiceId: int("invoiceId"),
  clientId: int("clientId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: mysqlEnum("method", ["especes", "carte", "virement", "mobile_money", "cheque"]).default("especes"),
  reference: varchar("reference", { length: 100 }),
  status: mysqlEnum("status", ["en_attente", "complete", "rembourse", "echec"]).default("complete"),
  paidAt: timestamp("paidAt").defaultNow().notNull(),
  type: mysqlEnum("type", ["encaissement", "decaissement"]).default("encaissement"),
  description: text("description"),
  notes: text("notes"),
  createdBy: int("createdBy"),
});

// --- EMPLOYEES ---------------------------------------------------------------
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  role: mysqlEnum("role", ["admin", "manager", "receptionniste", "housekeeping", "restauration", "maintenance"]).notNull(),
  department: varchar("department", { length: 100 }),
  hireDate: date("hireDate"),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["actif", "conge", "inactif"]).default("actif"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// --- HOUSEKEEPING TASKS -------------------------------------------------------
export const housekeepingTasks = mysqlTable("housekeeping_tasks", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  assignedTo: int("assignedTo"),
  type: mysqlEnum("type", ["nettoyage", "recouche", "depart", "inspection", "maintenance"]).default("nettoyage"),
  status: mysqlEnum("status", ["en_attente", "en_cours", "termine", "verifie"]).default("en_attente"),
  priority: mysqlEnum("priority", ["basse", "normale", "haute", "urgente"]).default("normale"),
  scheduledAt: timestamp("scheduledAt"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- INVENTORY CATEGORIES -----------------------------------------------------
export const inventoryCategories = mysqlTable("inventory_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
});

// --- INVENTORY ITEMS ---------------------------------------------------------
export const inventoryItems = mysqlTable("inventory_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  categoryId: int("categoryId"),
  unit: varchar("unit", { length: 50 }).default("unité"),
  currentStock: decimal("currentStock", { precision: 10, scale: 2 }).default("0"),
  minStock: decimal("minStock", { precision: 10, scale: 2 }).default("0"),
  maxStock: decimal("maxStock", { precision: 10, scale: 2 }),
  unitCost: decimal("unitCost", { precision: 12, scale: 2 }).default("0"),
  supplier: varchar("supplier", { length: 200 }),
  location: varchar("location", { length: 100 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// --- INVENTORY MOVEMENTS -----------------------------------------------------
export const inventoryMovements = mysqlTable("inventory_movements", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  type: mysqlEnum("type", ["entree", "sortie", "ajustement"]).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// --- COUNTRIES & CITIES -----------------------------------------------------
export const countries = mysqlTable("countries", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  flag: varchar("flag", { length: 10 }),
});

export const cities = mysqlTable("cities", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  countryId: int("countryId").notNull(),
});

// --- HOTEL PROFILES (PUBLIC) -------------------------------------------------
export const hotelProfiles = mysqlTable("hotel_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // owner user id
  hotelName: varchar("hotelName", { length: 255 }).notNull(),
  managerName: varchar("managerName", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  countryId: int("countryId"),
  cityId: int("cityId"),
  type: mysqlEnum("type", ["hotel", "restaurant"]).default("hotel").notNull(),
  stars: int("stars").default(3),
  logoUrl: text("logoUrl"),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Country = typeof countries.$inferSelect;
export type City = typeof cities.$inferSelect;
export type HotelProfile = typeof hotelProfiles.$inferSelect;
export type InsertHotelProfile = typeof hotelProfiles.$inferInsert;

// --- REVIEWS ----------------------------------------------------------------
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  hotelProfileId: int("hotelProfileId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// --- SPECIAL OFFERS -----------------------------------------------------
export const specialOffers = mysqlTable("special_offers", {
  id: int("id").autoincrement().primaryKey(),
  hotelProfileId: int("hotelProfileId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  discountType: mysqlEnum("discountType", ["percent", "fixed"]).default("percent").notNull(),
  discountValue: decimal("discountValue", { precision: 10, scale: 2 }).notNull(),
  minNights: int("minNights").default(1),
  validFrom: timestamp("validFrom"),
  validUntil: timestamp("validUntil"),
  badgeLabel: varchar("badgeLabel", { length: 50 }), // ex: "-20%", "Promoété"
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SpecialOffer = typeof specialOffers.$inferSelect;
export type InsertSpecialOffer = typeof specialOffers.$inferInsert;

// --- ROOM PHOTOS -----------------------------------------------------
export const roomPhotos = mysqlTable("room_photos", {
  id: int("id").autoincrement().primaryKey(),
  roomId: int("roomId").notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  caption: varchar("caption", { length: 255 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RoomPhoto = typeof roomPhotos.$inferSelect;
export type InsertRoomPhoto = typeof roomPhotos.$inferInsert;

// --- EXPORT TYPES -----------------------------------------------------
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;
export type RoomType = typeof roomTypes.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = typeof reservations.$inferInsert;
export type Service = typeof services.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type HousekeepingTask = typeof housekeepingTasks.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════
// --- MODULE TRANSPORT MULTI-COMPAGNIES (HUB VOYAGE) ---------------------
// ═══════════════════════════════════════════════════════════════════════════

// --- TRANSPORT COMPANIES -----------------------------------------------------
export const transportCompanies = mysqlTable("transport_companies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner user (OAuth Google) — un utilisateur peut avoir plusieurs compagnies
  companyName: varchar("companyName", { length: 255 }).notNull(),
  managerName: varchar("managerName", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  countryId: int("countryId"),
  cityId: int("cityId"),
  logoUrl: text("logoUrl"),
  galleryImageUrl: text("galleryImageUrl"), // Image affichée dans la galerie publique
  description: text("description"),
  // Personnalisation documents imprimés
  printHeaderText: text("printHeaderText"),
  printFooterText: text("printFooterText"),
  primaryColor: varchar("primaryColor", { length: 20 }).default("#1a56db"),
  activityType: mysqlEnum("activityType", ["transport", "restauration", "expedition", "hotel", "boutique", "agence_voyage", "residence_meuble", "loisirs", "location_vente"]).default("transport").notNull(),
  status: mysqlEnum("status", ["pending", "active", "suspended", "rejected"]).default("pending").notNull(),
  validatedAt: timestamp("validatedAt"),
  validatedBy: int("validatedBy"), // HUB_RESA admin userId
  rejectionReason: text("rejectionReason"),
  bdId: varchar("bdId", { length: 7 }), // ID du Business Developer qui a recruté cette compagnie
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TransportCompany = typeof transportCompanies.$inferSelect;
export type InsertTransportCompany = typeof transportCompanies.$inferInsert;

// --- TRANSPORT GALLERY IMAGES --------------------------------------------------
export const transportGalleryImages = mysqlTable("transport_gallery_images", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  imageUrl: text("imageUrl").notNull(),
  fileKey: varchar("fileKey", { length: 255 }).notNull(),
  caption: varchar("caption", { length: 255 }),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TransportGalleryImage = typeof transportGalleryImages.$inferSelect;
export type InsertTransportGalleryImage = typeof transportGalleryImages.$inferInsert;

// --- TRANSPORT BUS LINES -----------------------------------------------------
export const transportBusLines = mysqlTable("transport_bus_lines", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  departureCity: varchar("departureCity", { length: 100 }).notNull(),
  arrivalCity: varchar("arrivalCity", { length: 100 }).notNull(),
  departureCountryId: int("departureCountryId"),
  arrivalCountryId: int("arrivalCountryId"),
  lineType: mysqlEnum("lineType", ["national", "international"]).default("national").notNull(),
  distance: int("distance"), // km
  estimatedDuration: int("estimatedDuration"), // minutes
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TransportBusLine = typeof transportBusLines.$inferSelect;
export type InsertTransportBusLine = typeof transportBusLines.$inferInsert;

// --- TRANSPORT BUSES ---------------------------------------------------------
export const transportBuses = mysqlTable("transport_buses", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  registration: varchar("registration", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }),
  capacity: int("capacity").notNull().default(50),
  status: mysqlEnum("status", ["disponible", "en_service", "maintenance"]).default("disponible").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TransportBus = typeof transportBuses.$inferSelect;
export type InsertTransportBus = typeof transportBuses.$inferInsert;

// --- TRANSPORT TRIPS (Trajets publics réservables en ligne) ------------------
export const transportTrips = mysqlTable("transport_trips", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  busLineId: int("busLineId").notNull(),
  departureDate: date("departureDate").notNull(),
  departureTime: varchar("departureTime", { length: 10 }).notNull(), // HH:MM
  priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }),
  priceGHS: decimal("priceGHS", { precision: 12, scale: 2 }),
  totalSeats: int("totalSeats").notNull().default(50),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TransportTrip = typeof transportTrips.$inferSelect;
export type InsertTransportTrip = typeof transportTrips.$inferInsert;

// --- TRANSPORT DEPARTURES (Départs opérationnels) ----------------------------
export const transportDepartures = mysqlTable("transport_departures", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  busLineId: int("busLineId").notNull(),
  busId: int("busId"),
  tripId: int("tripId"),
  departureDate: date("departureDate").notNull(),
  departureTime: varchar("departureTime", { length: 10 }).notNull(),
  driverName: varchar("driverName", { length: 255 }),
  status: mysqlEnum("status", ["programme", "embarquement", "en_route", "arrive", "annule"]).default("programme").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TransportDeparture = typeof transportDepartures.$inferSelect;
export type InsertTransportDeparture = typeof transportDepartures.$inferInsert;

// --- TRANSPORT TICKETS (Billets guichet) -------------------------------------
export const transportTickets = mysqlTable("transport_tickets", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  ticketNumber: varchar("ticketNumber", { length: 30 }).notNull().unique(), // TK-XXXXXXXX
  departureId: int("departureId").notNull(),
  seatNumber: int("seatNumber").notNull(),
  // Passager
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  idType: mysqlEnum("idType", ["cni", "passeport", "carte_consulaire", "carte_resident", "laissez_passer"]).default("cni"),
  idNumber: varchar("idNumber", { length: 100 }),
  gender: mysqlEnum("gender", ["M", "F"]).default("M"),
  nationality: varchar("nationality", { length: 100 }),
  dropOffCity: varchar("dropOffCity", { length: 100 }),
  // Paiement
  priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "mobile_money", "virement"]).default("cash"),
  // Statuts
  ticketStatus: mysqlEnum("ticketStatus", ["actif", "utilise", "annule"]).default("actif").notNull(),
  cashStatus: mysqlEnum("cashStatus", ["en_attente", "encaisse"]).default("en_attente").notNull(),
  boardingStatus: mysqlEnum("boardingStatus", ["non_embarque", "embarque"]).default("non_embarque").notNull(),
  qrCode: text("qrCode"),
  soldBy: int("soldBy"), // userId agent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TransportTicket = typeof transportTickets.$inferSelect;
export type InsertTransportTicket = typeof transportTickets.$inferInsert;

// --- TRANSPORT BOOKINGS (Réservations en ligne) ------------------------------
export const transportBookings = mysqlTable("transport_bookings", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  tripId: int("tripId").notNull(),
  bookingRef: varchar("bookingRef", { length: 20 }).notNull().unique(),
  seatNumber: int("seatNumber").notNull(),
  // Client
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  // Paiement
  priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["en_attente", "confirme", "annule"]).default("en_attente").notNull(),
  cashStatus: mysqlEnum("cashStatus", ["en_attente", "encaisse"]).default("en_attente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TransportBooking = typeof transportBookings.$inferSelect;
export type InsertTransportBooking = typeof transportBookings.$inferInsert;

// --- TRANSPORT SHIPMENTS (Expéditions de colis) ------------------------------
export const transportShipments = mysqlTable("transport_shipments", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
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
  status: mysqlEnum("status", ["enregistre", "en_transit", "arrive", "livre"]).default("enregistre").notNull(),
  cashStatus: mysqlEnum("cashStatus", ["en_attente", "encaisse"]).default("en_attente").notNull(),
  registeredBy: int("registeredBy"), // userId agent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TransportShipment = typeof transportShipments.$inferSelect;
export type InsertTransportShipment = typeof transportShipments.$inferInsert;

// --- TRANSPORT STAFF ---------------------------------------------------------
export const transportStaff = mysqlTable("transport_staff", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  userId: int("userId"), // linked to dashboard user if applicable
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  role: mysqlEnum("role", ["chauffeur", "agent_billetterie", "agent_expedition", "caissier", "superviseur", "directeur"]).notNull(),
  station: varchar("station", { length: 100 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TransportStaff = typeof transportStaff.$inferSelect;
export type InsertTransportStaff = typeof transportStaff.$inferInsert;

// --- TRANSPORT CASHIER PROFILES ----------------------------------------------
export const transportCashierProfiles = mysqlTable("transport_cashier_profiles", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  userId: int("userId").notNull().unique(),
  pinHash: varchar("pinHash", { length: 255 }),
  station: varchar("station", { length: 100 }),
  pinAttempts: int("pinAttempts").default(0).notNull(),
  pinLockedUntil: timestamp("pinLockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TransportCashierProfile = typeof transportCashierProfiles.$inferSelect;

// --- TRANSPORT STATIONS (Gares) -----------------------------------------------
export const transportStations = mysqlTable("transport_stations", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  countryId: int("countryId"),
  address: text("address"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TransportStation = typeof transportStations.$inferSelect;

// --- TRANSPORT CHARGES (Dépenses opérationnelles) ----------------------------
export const transportCharges = mysqlTable("transport_charges", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  category: mysqlEnum("category", ["carburant", "maintenance", "salaire", "frais_divers"]).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  station: varchar("station", { length: 100 }),
  chargeDate: date("chargeDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TransportCharge = typeof transportCharges.$inferSelect;

// --- TRANSPORT COMPANY BILLING (Facturation HUB_RESA) -----------------------------
export const transportCompanyBilling = mysqlTable("transport_company_billing", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  billingPeriod: varchar("billingPeriod", { length: 10 }).notNull(), // YYYY-MM
  ticketsSold: int("ticketsSold").default(0).notNull(),
  ticketsCashed: int("ticketsCashed").default(0).notNull(),
  shipmentsCashed: int("shipmentsCashed").default(0).notNull(),
  // 200 FCFA/billet vendu + 100 FCFA/ticket expédition encaissé
  ticketFeeXOF: decimal("ticketFeeXOF", { precision: 12, scale: 2 }).default("0"),
  shipmentFeeXOF: decimal("shipmentFeeXOF", { precision: 12, scale: 2 }).default("0"),
  totalFeeXOF: decimal("totalFeeXOF", { precision: 12, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["en_attente", "facture", "paye"]).default("en_attente").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  paidAt: timestamp("paidAt"),
});
export type TransportCompanyBilling = typeof transportCompanyBilling.$inferSelect;
export type InsertTransportCompanyBilling = typeof transportCompanyBilling.$inferInsert;

// --- TRANSPORT ROUTE FARES (Tarifs par segment) ------------------------------
export const transportRouteFares = mysqlTable("transport_route_fares", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  busLineId: int("busLineId").notNull(),
  fromCity: varchar("fromCity", { length: 100 }).notNull(),
  toCity: varchar("toCity", { length: 100 }).notNull(),
  priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }),
  priceGHS: decimal("priceGHS", { precision: 12, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TransportRouteFare = typeof transportRouteFares.$inferSelect;

// --- MENU CATEGORIES (Catalogue restauration) --------------------------------
export const menuCategories = mysqlTable("menu_categories", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = typeof menuCategories.$inferInsert;

// --- MENU ITEMS (Plats du catalogue) -----------------------------------------
export const menuItems = mysqlTable("menu_items", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }).notNull(),
  photoUrl: varchar("photoUrl", { length: 500 }),
  photoKey: varchar("photoKey", { length: 300 }),
  available: boolean("available").default(true).notNull(),
  preparationTime: int("preparationTime").default(15), // minutes
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = typeof menuItems.$inferInsert;

// --- ONLINE ORDERS (Commandes restaurant en ligne) ---------------------------
export const onlineOrders = mysqlTable("online_orders", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  orderRef: varchar("orderRef", { length: 30 }).notNull().unique(),
  customerName: varchar("customerName", { length: 150 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 30 }).notNull(),
  deliveryType: varchar("deliveryType", { length: 20 }).notNull().default("sur_place"), // livraison | sur_place
  deliveryAddress: varchar("deliveryAddress", { length: 300 }),
  notes: text("notes"),
  itemsJson: text("itemsJson").notNull(), // JSON: [{itemId, name, qty, priceXOF, preparationTime}]
  totalXOF: decimal("totalXOF", { precision: 12, scale: 2 }).notNull(),
  estimatedPrepTime: int("estimatedPrepTime"), // minutes (max des preparationTime * qty)
  status: varchar("status", { length: 30 }).notNull().default("nouvelle"), // nouvelle | en_preparation | prete | livree | annulee
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnlineOrder = typeof onlineOrders.$inferSelect;
export type InsertOnlineOrder = typeof onlineOrders.$inferInsert;

// --- DELIVERY ZONES (zones de livraison restaurant) --------------------------
export const deliveryZones = mysqlTable("delivery_zones", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  extraMinutes: int("extraMinutes").notNull().default(15),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type InsertDeliveryZone = typeof deliveryZones.$inferInsert;

// --- COMPANY REVIEWS (Avis et notations des compagnies) ------------------------------------
export const companyReviews = mysqlTable("company_reviews", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  authorName: varchar("authorName", { length: 150 }).notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  activityType: varchar("activityType", { length: 30 }).notNull().default("transport"), // transport | restauration | expedition
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CompanyReview = typeof companyReviews.$inferSelect;
export type InsertCompanyReview = typeof companyReviews.$inferInsert;

// --- COMPANY GALLERY (Bibliothèque d'images par compagnie) -------------------
export const companyGallery = mysqlTable("company_gallery", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  caption: varchar("caption", { length: 200 }),
  displayOrder: int("displayOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CompanyGalleryItem = typeof companyGallery.$inferSelect;
export type InsertCompanyGalleryItem = typeof companyGallery.$inferInsert;

// --- COMPANY CREDITS (Système de facturation HUB_RESA par points) -------------
export const companyCredits = mysqlTable("company_credits", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull().unique(),
  balance: int("balance").notNull().default(0), // solde en points
  countryCode: varchar("countryCode", { length: 10 }).notNull().default("CI"), // code pays ISO
  currency: varchar("currency", { length: 10 }).notNull().default("XOF"), // devise
  pointPriceLocal: decimal("pointPriceLocal", { precision: 10, scale: 2 }).notNull().default("125.00"), // prix 1 point en devise locale
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CompanyCredits = typeof companyCredits.$inferSelect;
export type InsertCompanyCredits = typeof companyCredits.$inferInsert;

// --- CREDIT TRANSACTIONS (Historique des débits et crédits) -------------------
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // "credit" | "debit"
  points: int("points").notNull(), // nb points crédités ou débités
  amountLocal: decimal("amountLocal", { precision: 12, scale: 2 }), // montant en devise locale (pour les achats)
  description: varchar("description", { length: 300 }).notNull(),
  refType: varchar("refType", { length: 50 }), // "ticket" | "booking" | "order" | "shipment" | "purchase"
  refId: varchar("refId", { length: 100 }), // ID ou référence de la transaction source
  balanceBefore: int("balanceBefore"), // solde avant opération
  balanceAfter: int("balanceAfter").notNull(), // solde après opération
  reference: varchar("reference", { length: 100 }), // référence paiement ou note admin
  adminNote: varchar("adminNote", { length: 300 }), // note de l'admin (crédit manuel)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// --- COMPANY MEMBERS (Membres de l'équipe par compagnie) ----------------------
export const companyMembers = mysqlTable("company_members", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  userId: int("userId"), // lié à un compte OAuth si accepté
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["gerant", "caissier", "employe"]).notNull().default("employe"),
  pinHash: varchar("pinHash", { length: 255 }), // PIN 4 chiffres hashé
  isActive: boolean("isActive").notNull().default(true),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CompanyMember = typeof companyMembers.$inferSelect;
export type InsertCompanyMember = typeof companyMembers.$inferInsert;

// --- INTERNAL MESSAGES (Messagerie interne compagnie ↔ HUB_RESA) -------------------
export const internalMessages = mysqlTable("internal_messages", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  senderType: mysqlEnum("senderType", ["company", "csn"]).notNull(),
  senderId: int("senderId"), // userId de l'expéditeur
  senderName: varchar("senderName", { length: 150 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InternalMessage = typeof internalMessages.$inferSelect;
export type InsertInternalMessage = typeof internalMessages.$inferInsert;

// --- COMPANY PHOTOS (Bibliothèque photos publique par compagnie) ---------------
export const companyPhotos = mysqlTable("company_photos", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 300 }).notNull(),
  caption: varchar("caption", { length: 300 }).default(""),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CompanyPhoto = typeof companyPhotos.$inferSelect;
export type InsertCompanyPhoto = typeof companyPhotos.$inferInsert;

// --- COMMERCIAL CANDIDATES (Programme de recrutement des commerciaux) ----------
export const commercialCandidates = mysqlTable("commercial_candidates", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  educationLevel: mysqlEnum("educationLevel", [
    "brevet",
    "bac",
    "bac+2",
    "bac+3",
    "bac+4",
    "bac+5",
    "doctorat",
    "autre",
  ]).notNull(),
  language: mysqlEnum("language", ["francais", "espagnol", "anglais"]).notNull(),
  status: mysqlEnum("status", ["nouveau", "contacte", "entretien", "retenu", "rejete"])
    .notNull()
    .default("nouveau"),
  notes: text("notes"),
  cvUrl: varchar("cvUrl", { length: 1000 }),
  cvKey: varchar("cvKey", { length: 500 }),
  coverLetterUrl: varchar("coverLetterUrl", { length: 1000 }),
  coverLetterKey: varchar("coverLetterKey", { length: 500 }),
  experience: mysqlEnum("experience", ["aucune", "moins_1an", "1_3ans", "3_5ans", "plus_5ans"]),
  targetSector: mysqlEnum("targetSector", ["transport", "restauration", "hotel", "boutique", "agence_voyage", "tous"]),
  motivation: text("motivation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CommercialCandidate = typeof commercialCandidates.$inferSelect;
export type InsertCommercialCandidate = typeof commercialCandidates.$inferInsert;

// --- CHATBOT SESSIONS (Chatbot IA public + réponses HUB_RESA) -----------------------
export const chatbotSessions = mysqlTable("chatbot_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 64 }).notNull().unique(),
  visitorName: varchar("visitorName", { length: 100 }).notNull().default("Visiteur"),
  visitorEmail: varchar("visitorEmail", { length: 320 }),
  status: mysqlEnum("status", ["open", "pending_csn", "closed"]).notNull().default("open"),
  csnTookOver: boolean("csnTookOver").notNull().default(false), // true si un agent HUB_RESA a répondu
  humanTakeoverActive: boolean("humanTakeoverActive").notNull().default(false), // true = IA suspendue, agent humain actif
  humanTakeoverAt: timestamp("humanTakeoverAt"), // horodatage de la prise de relais
  adminInterventionActive: boolean("adminInterventionActive").notNull().default(false), // true = admin intervient
  adminId: int("adminId"), // ID de l'admin qui intervient
  adminInterventionAt: timestamp("adminInterventionAt"), // horodatage de l'intervention admin
  adminInterventionReason: text("adminInterventionReason"), // motif de l'escalade
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ChatbotSession = typeof chatbotSessions.$inferSelect;
export type InsertChatbotSession = typeof chatbotSessions.$inferInsert;

export const chatbotMessages = mysqlTable("chatbot_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "csn"]).notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").notNull().default(false), // lu par l'agent HUB_RESA
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChatbotMessage = typeof chatbotMessages.$inferSelect;
export type InsertChatbotMessage = typeof chatbotMessages.$inferInsert;

// --- ADMIN CREDENTIALS (Connexion admin général par email + mot de passe) ------
export const adminCredentials = mysqlTable("admin_credentials", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  displayName: varchar("displayName", { length: 100 }).notNull().default("Administrateur"),
  isActive: boolean("isActive").notNull().default(true),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AdminCredential = typeof adminCredentials.$inferSelect;
export type InsertAdminCredential = typeof adminCredentials.$inferInsert;

// --- ADMIN LOGIN LOGS --------------------------------------------------------
export const adminLoginLogs = mysqlTable("admin_login_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  displayName: varchar("displayName", { length: 100 }),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  success: boolean("success").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AdminLoginLog = typeof adminLoginLogs.$inferSelect;

// --- CREDIT REQUESTS (Demandes d'achat de crédits par les compagnies) ----------
export const creditRequests = mysqlTable("credit_requests", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  points: int("points").notNull(), // nombre de points demandés
  amountLocal: decimal("amountLocal", { precision: 12, scale: 2 }).notNull(), // montant total en devise locale
  currency: varchar("currency", { length: 10 }).notNull().default("XOF"),
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull().default("mobile_money"), // "mobile_money" | "bank_transfer" | "cash"
  paymentPhone: varchar("paymentPhone", { length: 30 }), // numéro Mobile Money
  paymentOperator: varchar("paymentOperator", { length: 50 }), // "orange_money" | "mtn_momo" | "moov_money" | "wave"
  paymentRef: varchar("paymentRef", { length: 200 }), // référence de transaction Mobile Money
  status: varchar("status", { length: 30 }).notNull().default("pending"), // "pending" | "payment_confirmed" | "credited" | "rejected"
  rejectionReason: varchar("rejectionReason", { length: 500 }),
  paymentConfirmedAt: timestamp("paymentConfirmedAt"),
  creditedAt: timestamp("creditedAt"),
  validatedBy: varchar("validatedBy", { length: 100 }), // email de l'admin HUB_RESA qui a validé
  notes: varchar("notes", { length: 500 }), // notes internes HUB_RESA
  // CinetPay integration
  cinetpayTransactionId: varchar("cinetpayTransactionId", { length: 100 }), // ID unique CinetPay
  cinetpayPaymentUrl: varchar("cinetpayPaymentUrl", { length: 500 }), // URL de paiement CinetPay
  cinetpayPaymentToken: varchar("cinetpayPaymentToken", { length: 200 }), // token CinetPay
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CreditRequest = typeof creditRequests.$inferSelect;
export type InsertCreditRequest = typeof creditRequests.$inferInsert;

// --- CREDIT PURCHASES (Achats de crédits avec Stripe et Hub2) -------------------
export const creditPurchases = mysqlTable("credit_purchases", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  amountLocal: decimal("amountLocal", { precision: 12, scale: 2 }).notNull(), // montant en devise locale (FCFA)
  creditsGranted: int("creditsGranted").notNull(), // nombre de crédits à accorder (amountLocal / 125)
  paymentMethod: varchar("paymentMethod", { length: 50 }).notNull(), // "stripe" | "hub2_mobile_money" | "bank_transfer" | "cash"
  paymentStatus: varchar("paymentStatus", { length: 30 }).notNull().default("pending"), // "pending" | "processing" | "completed" | "failed" | "cancelled"
  paymentLink: text("paymentLink"), // lien de paiement généré (Stripe ou Hub2)
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }), // ID Stripe PaymentIntent
  hub2TransactionId: varchar("hub2TransactionId", { length: 255 }), // ID transaction Hub2
  hub2PaymentUrl: text("hub2PaymentUrl"), // URL de paiement Hub2
  currency: varchar("currency", { length: 10 }).notNull().default("XOF"),
  reference: varchar("reference", { length: 100 }).unique(), // référence unique pour traçabilité
  notes: varchar("notes", { length: 500 }), // notes admin
  completedAt: timestamp("completedAt"), // date de completion du paiement
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CreditPurchase = typeof creditPurchases.$inferSelect;
export type InsertCreditPurchase = typeof creditPurchases.$inferInsert;

// --- QUOTE REQUESTS (Demandes de devis depuis le carrousel) ----------------------
export const quoteRequests = mysqlTable("quote_requests", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  activityType: mysqlEnum("activityType", ["transport", "restauration", "expedition", "hotel", "boutique", "residence_meuble", "loisirs", "location_vente"]).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "closed"]).notNull().default("new"),
  notes: text("notes"), // notes internes HUB_RESA
  contactedAt: timestamp("contactedAt"),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;


// --- CLIENT BOOKINGS (Réservations/Commandes des clients) ----------------------
export const clientBookings = mysqlTable("client_bookings", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  bookingType: mysqlEnum("bookingType", ["transport", "restaurant", "expedition"]).notNull(),
  bookingRef: varchar("bookingRef", { length: 100 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "confirmed", "completed", "cancelled"]).notNull().default("pending"),
  departureDate: date("departureDate"),
  departureCity: varchar("departureCity", { length: 100 }),
  arrivalCity: varchar("arrivalCity", { length: 100 }),
  companyId: int("companyId"),
  companyName: varchar("companyName", { length: 150 }),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).notNull().default("XOF"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientBooking = typeof clientBookings.$inferSelect;
export type InsertClientBooking = typeof clientBookings.$inferInsert;


// --- ROUTES / LIGNES DE DÉPART -------------------------------------------------------
export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Abidjan - Yamoussoukro"
  departureCity: varchar("departureCity", { length: 100 }).notNull(),
  arrivalCity: varchar("arrivalCity", { length: 100 }).notNull(),
  distance: int("distance"), // en km
  estimatedDuration: int("estimatedDuration"), // en minutes
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("XOF"),
  isActive: boolean("isActive").default(true).notNull(),
  description: text("description"),
  createdBy: int("createdBy"), // userId
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;


// --- BUSES (AUTOBUS) ----------------------------------------------------------
export const buses = mysqlTable("buses", {
  id: int("id").autoincrement().primaryKey(),
  licensePlate: varchar("licensePlate", { length: 50 }).notNull().unique(),
  model: varchar("model", { length: 100 }).notNull(),
  capacity: int("capacity").notNull(), // Nombre de sièges
  companyId: int("companyId"), // Référence à la compagnie
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy"), // userId
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bus = typeof buses.$inferSelect;
export type InsertBus = typeof buses.$inferInsert;

// --- STOPS (ARRÊTS) ----------------------------------------------------------
export const stops = mysqlTable("stops", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Ex: "Gare routière d'Abidjan"
  city: varchar("city", { length: 100 }).notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy"), // userId
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Stop = typeof stops.$inferSelect;
export type InsertStop = typeof stops.$inferInsert;


// --- CASHIER TRANSACTIONS (ENCAISSEMENTS) ------------------------------------
export const cashierTransactions = mysqlTable("cashier_transactions", {
  id: int("id").autoincrement().primaryKey(),
  transactionType: mysqlEnum("transactionType", ["ticket", "shipment", "service", "other"]).notNull(),
  referenceId: int("referenceId"), // ID du billet, expédition, ou service
  referenceType: varchar("referenceType", { length: 50 }), // "ticket", "shipment", "service"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("XOF"),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "card", "mobile_money", "check", "transfer"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  cashierId: int("cashierId"), // userId de la personne qui encaisse
  companyId: int("companyId"), // Compagnie de transport
  stationId: int("stationId"), // Gare routière
  receiptNumber: varchar("receiptNumber", { length: 50 }), // Numéro de reçu généré
  ticketGenerated: boolean("ticketGenerated").default(false), // Billet généré après encaissement
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CashierTransaction = typeof cashierTransactions.$inferSelect;
export type InsertCashierTransaction = typeof cashierTransactions.$inferInsert;

// --- BUSINESS DEVELOPERS (Commerciaux terrain HUB_RESA) ----------------------
export const businessDevelopers = mysqlTable("business_developers", {
  id: int("id").autoincrement().primaryKey(),
  bdId: varchar("bdId", { length: 7 }).notNull().unique(), // ID unique 7 chars ex: BD12345
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  contact: varchar("contact", { length: 100 }), // contact secondaire
  email: varchar("email", { length: 320 }).notNull().unique(),
  whatsapp: varchar("whatsapp", { length: 30 }), // numéro WhatsApp avec indicatif
  loginPhone: varchar("loginPhone", { length: 30 }).notNull().unique(), // login = indicatif + numéro
  countryCode: varchar("countryCode", { length: 5 }).notNull().default("+225"), // indicatif pays
  pinHash: varchar("pinHash", { length: 255 }).notNull(), // bcrypt hash du code PIN 4 chiffres
  status: mysqlEnum("status", ["active", "suspended", "pending"]).default("pending").notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("5.00").notNull(), // Taux de commission en % (défaut 5%)
  referrerBdevId: varchar("referrerBdevId", { length: 7 }), // ID du parrain (BDev qui l'a recruté)
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BusinessDeveloper = typeof businessDevelopers.$inferSelect;
export type InsertBusinessDeveloper = typeof businessDevelopers.$inferInsert;

// Relation : référence le parrain (self-reference)
export const businessDevelopersRelations = relations(businessDevelopers, ({ one }) => ({
  referrer: one(businessDevelopers, {
    fields: [businessDevelopers.referrerBdevId],
    references: [businessDevelopers.bdId],
  }),
}));


// --- FURNISHED RESIDENCES (RÉSIDENCES MEUBLÉES) --------------------------------
export const furnishedResidences = mysqlTable("furnished_residences", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Nom de la résidence
  description: text("description"), // Description détaillée
  address: text("address").notNull(), // Adresse complète
  city: varchar("city", { length: 100 }).notNull(), // Ville
  country: varchar("country", { length: 100 }).notNull(), // Pays
  phone: varchar("phone", { length: 50 }), // Téléphone
  email: varchar("email", { length: 320 }), // Email
  totalRooms: int("totalRooms").notNull().default(1), // Nombre total de chambres
  amenities: text("amenities"), // JSON: équipements (wifi, parking, climatisation, etc.)
  pricePerNight: decimal("pricePerNight", { precision: 10, scale: 2 }).notNull(), // Prix par nuit
  pricePerMonth: decimal("pricePerMonth", { precision: 10, scale: 2 }), // Prix par mois (optionnel)
  minStay: int("minStay").default(1), // Séjour minimum en jours
  maxStay: int("maxStay"), // Séjour maximum en jours (optionnel)
  status: mysqlEnum("status", ["active", "inactive", "maintenance"]).default("active").notNull(),
  images: text("images"), // JSON: URLs des images
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"), // Note moyenne
  reviewCount: int("reviewCount").default(0), // Nombre d'avis
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FurnishedResidence = typeof furnishedResidences.$inferSelect;
export type InsertFurnishedResidence = typeof furnishedResidences.$inferInsert;

// --- ROOM AVAILABILITY (DISPONIBILITÉ DES CHAMBRES) ----------------------------
export const roomAvailability = mysqlTable("room_availability", {
  id: int("id").autoincrement().primaryKey(),
  residenceId: int("residenceId").notNull(),
  date: date("date").notNull(), // Date de disponibilité
  availableRooms: int("availableRooms").notNull(), // Nombre de chambres disponibles
  pricePerNight: decimal("pricePerNight", { precision: 10, scale: 2 }), // Prix spécial pour ce jour (optionnel)
  status: mysqlEnum("status", ["available", "booked", "blocked"]).default("available").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RoomAvailability = typeof roomAvailability.$inferSelect;
export type InsertRoomAvailability = typeof roomAvailability.$inferInsert;

// --- RESERVATIONS (RÉSERVATIONS) -----------------------------------------------
export const residenceReservations = mysqlTable("residence_reservations", {
  id: int("id").autoincrement().primaryKey(),
  residenceId: int("residenceId").notNull(),
  guestName: varchar("guestName", { length: 255 }).notNull(), // Nom du client
  guestEmail: varchar("guestEmail", { length: 320 }).notNull(), // Email du client
  guestPhone: varchar("guestPhone", { length: 50 }), // Téléphone du client
  checkInDate: date("checkInDate").notNull(), // Date d'arrivée
  checkOutDate: date("checkOutDate").notNull(), // Date de départ
  numberOfRooms: int("numberOfRooms").notNull().default(1), // Nombre de chambres réservées
  numberOfGuests: int("numberOfGuests").notNull().default(1), // Nombre de clients
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(), // Prix total
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }).default("0.00"), // Montant payé
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "partial", "paid"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // Méthode de paiement
  reservationStatus: mysqlEnum("reservationStatus", ["pending", "confirmed", "checked_in", "checked_out", "cancelled"]).default("pending").notNull(),
  specialRequests: text("specialRequests"), // Demandes spéciales
  notes: text("notes"), // Notes internes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ResidenceReservation = typeof residenceReservations.$inferSelect;
export type InsertResidenceReservation = typeof residenceReservations.$inferInsert;

// --- GUEST REVIEWS (AVIS DES CLIENTS) ------------------------------------------
export const guestReviews = mysqlTable("guest_reviews", {
  id: int("id").autoincrement().primaryKey(),
  reservationId: int("reservationId").notNull(),
  residenceId: int("residenceId").notNull(),
  guestName: varchar("guestName", { length: 255 }).notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"), // Avis textuel
  cleanliness: int("cleanliness"), // Note sur la propreté (1-5)
  comfort: int("comfort"), // Note sur le confort (1-5)
  amenities: int("amenities"), // Note sur les équipements (1-5)
  service: int("service"), // Note sur le service (1-5)
  verified: boolean("verified").default(false), // Avis vérifié
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GuestReview = typeof guestReviews.$inferSelect;
export type InsertGuestReview = typeof guestReviews.$inferInsert;

// --- RELATIONS ----------------------------------------------------------------
export const furnishedResidencesRelations = relations(furnishedResidences, ({ many }) => ({
  availability: many(roomAvailability),
  reservations: many(residenceReservations),
  reviews: many(guestReviews),
}));

export const roomAvailabilityRelations = relations(roomAvailability, ({ one }) => ({
  residence: one(furnishedResidences, {
    fields: [roomAvailability.residenceId],
    references: [furnishedResidences.id],
  }),
}));

export const residenceReservationsRelations = relations(residenceReservations, ({ one, many }) => ({
  residence: one(furnishedResidences, {
    fields: [residenceReservations.residenceId],
    references: [furnishedResidences.id],
  }),
  reviews: many(guestReviews),
}));

export const guestReviewsRelations = relations(guestReviews, ({ one }) => ({
  residence: one(furnishedResidences, {
    fields: [guestReviews.residenceId],
    references: [furnishedResidences.id],
  }),
  reservation: one(residenceReservations, {
    fields: [guestReviews.reservationId],
    references: [residenceReservations.id],
  }),
}));

// --- LEISURE ACTIVITIES (ACTIVITÉS DE LOISIRS) --------------------------------
export const leisureActivities = mysqlTable("leisure_activities", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // ex: sports, culture, aventure
  location: varchar("location", { length: 255 }).notNull(),
  pricePerPerson: varchar("pricePerPerson", { length: 50 }).notNull(),
  maxCapacity: int("maxCapacity").notNull(),
  duration: varchar("duration", { length: 100 }), // ex: "2 heures", "1 jour"
  image: text("image"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: int("reviewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeisureActivity = typeof leisureActivities.$inferSelect;
export type InsertLeisureActivity = typeof leisureActivities.$inferInsert;

// --- LEISURE BOOKINGS --------------------------------------------------------
export const leisureBookings = mysqlTable("leisure_bookings", {
  id: int("id").autoincrement().primaryKey(),
  activityId: int("activityId").notNull(),
  guestName: varchar("guestName", { length: 255 }).notNull(),
  guestEmail: varchar("guestEmail", { length: 255 }).notNull(),
  guestPhone: varchar("guestPhone", { length: 20 }),
  bookingDate: timestamp("bookingDate").notNull(),
  numberOfPeople: int("numberOfPeople").notNull(),
  totalPrice: varchar("totalPrice", { length: 50 }).notNull(),
  paidAmount: decimal("paidAmount", { precision: 10, scale: 2 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "partial", "paid"]).default("pending"),
  bookingStatus: mysqlEnum("bookingStatus", ["pending", "confirmed", "cancelled", "completed"]).default("pending"),
  specialRequests: text("specialRequests"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeisureBooking = typeof leisureBookings.$inferSelect;
export type InsertLeisureBooking = typeof leisureBookings.$inferInsert;

// --- LEISURE REVIEWS -------------------------------------------------------
export const leisureReviews = mysqlTable("leisure_reviews", {
  id: int("id").autoincrement().primaryKey(),
  activityId: int("activityId").notNull(),
  guestName: varchar("guestName", { length: 255 }).notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LeisureReview = typeof leisureReviews.$inferSelect;
export type InsertLeisureReview = typeof leisureReviews.$inferInsert;

// --- RENTAL PRODUCTS (PRODUITS DE LOCATION & VENTE) ---------------------------
export const rentalProducts = mysqlTable("rental_products", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  pricePerDay: varchar("pricePerDay", { length: 50 }).notNull(),
  pricePerWeek: varchar("pricePerWeek", { length: 50 }),
  pricePerMonth: varchar("pricePerMonth", { length: 50 }),
  depositAmount: varchar("depositAmount", { length: 50 }),
  image: text("image"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: int("reviewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RentalProduct = typeof rentalProducts.$inferSelect;
export type InsertRentalProduct = typeof rentalProducts.$inferInsert;

// --- RENTAL INVENTORY -------------------------------------------------------
export const rentalInventory = mysqlTable("rental_inventory", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  availableQuantity: int("availableQuantity").notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});
export type RentalInventory = typeof rentalInventory.$inferSelect;
export type InsertRentalInventory = typeof rentalInventory.$inferInsert;

// --- SALES ORDERS -----------------------------------------------------------
export const salesOrders = mysqlTable("sales_orders", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 255 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 20 }),
  orderDate: timestamp("orderDate").defaultNow().notNull(),
  totalAmount: varchar("totalAmount", { length: 50 }).notNull(),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "partial", "paid"]).default("pending"),
  orderStatus: mysqlEnum("orderStatus", ["pending", "confirmed", "shipped", "delivered", "cancelled"]).default("pending"),
  deliveryDate: timestamp("deliveryDate"),
  deliveryAddress: text("deliveryAddress"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = typeof salesOrders.$inferInsert;

// --- SALES ORDER ITEMS -------------------------------------------------------
export const salesOrderItems = mysqlTable("sales_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: varchar("unitPrice", { length: 50 }).notNull(),
  totalPrice: varchar("totalPrice", { length: 50 }).notNull(),
});
export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type InsertSalesOrderItem = typeof salesOrderItems.$inferInsert;

// --- RELATIONS ---------------------------------------------------------------
export const leisureActivitiesRelations = relations(leisureActivities, ({ many }) => ({
  bookings: many(leisureBookings),
  reviews: many(leisureReviews),
}));

export const leisureBookingsRelations = relations(leisureBookings, ({ one }) => ({
  activity: one(leisureActivities, {
    fields: [leisureBookings.activityId],
    references: [leisureActivities.id],
  }),
}));

export const leisureReviewsRelations = relations(leisureReviews, ({ one }) => ({
  activity: one(leisureActivities, {
    fields: [leisureReviews.activityId],
    references: [leisureActivities.id],
  }),
}));

export const rentalProductsRelations = relations(rentalProducts, ({ many }) => ({
  inventory: many(rentalInventory),
  orderItems: many(salesOrderItems),
}));

export const rentalInventoryRelations = relations(rentalInventory, ({ one }) => ({
  product: one(rentalProducts, {
    fields: [rentalInventory.productId],
    references: [rentalProducts.id],
  }),
}));

export const salesOrdersRelations = relations(salesOrders, ({ many }) => ({
  items: many(salesOrderItems),
}));

export const salesOrderItemsRelations = relations(salesOrderItems, ({ one }) => ({
  order: one(salesOrders, {
    fields: [salesOrderItems.orderId],
    references: [salesOrders.id],
  }),
  product: one(rentalProducts, {
    fields: [salesOrderItems.productId],
    references: [rentalProducts.id],
  }),
}));


// --- GAS SUPPLIERS -----------------------------------------------------------
export const gasSuppliers = mysqlTable("gas_suppliers", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GasSupplier = typeof gasSuppliers.$inferSelect;
export type InsertGasSupplier = typeof gasSuppliers.$inferInsert;

// --- GAS BOTTLES (Types) ---------------------------------------------------
export const gasBottles = mysqlTable("gas_bottles", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // B6, B12, etc.
  capacity: varchar("capacity", { length: 50 }).notNull(), // 6kg, 12kg, etc.
  priceXOF: decimal("priceXOF", { precision: 12, scale: 2 }).notNull(),
  deliveryFeeXOF: decimal("deliveryFeeXOF", { precision: 12, scale: 2 }).notNull(), // 200 for B6, 300 for B12
  stock: int("stock").default(0).notNull(),
  minStock: int("minStock").default(5).notNull(),
  description: text("description"),
  isAvailable: boolean("isAvailable").default(true).notNull(),
  photoUrl: text("photoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GasBottle = typeof gasBottles.$inferSelect;
export type InsertGasBottle = typeof gasBottles.$inferInsert;

// --- GAS ORDERS -----------------------------------------------------------
export const gasOrders = mysqlTable("gas_orders", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 50 }).notNull().unique(),
  clientName: varchar("clientName", { length: 200 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 50 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  deliveryAddress: text("deliveryAddress").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  supplierId: int("supplierId").notNull(),
  totalAmountXOF: decimal("totalAmountXOF", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "mobile_money", "card", "bank_transfer"]).default("cash"),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "partial", "paid"]).default("pending"),
  orderStatus: mysqlEnum("orderStatus", ["pending", "confirmed", "in_delivery", "delivered", "cancelled"]).default("pending"),
  deliveryDate: timestamp("deliveryDate"),
  estimatedDeliveryTime: varchar("estimatedDeliveryTime", { length: 50 }), // e.g., "30 minutes"
  notes: text("notes"),
  deliverymanId: int("deliverymanId"),
  selectedSupplierId: int("selectedSupplierId"),
  status: mysqlEnum("status", ["pending", "assigned_to_deliveryman", "validated_by_deliveryman", "delivered", "cancelled"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GasOrder = typeof gasOrders.$inferSelect;
export type InsertGasOrder = typeof gasOrders.$inferInsert;

// --- GAS ORDER ITEMS -------------------------------------------------------
export const gasOrderItems = mysqlTable("gas_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  bottleId: int("bottleId").notNull(),
  quantity: int("quantity").notNull(),
  unitPriceXOF: decimal("unitPriceXOF", { precision: 12, scale: 2 }).notNull(),
  deliveryFeeXOF: decimal("deliveryFeeXOF", { precision: 12, scale: 2 }).notNull(),
  subtotalXOF: decimal("subtotalXOF", { precision: 12, scale: 2 }).notNull(),
});
export type GasOrderItem = typeof gasOrderItems.$inferSelect;
export type InsertGasOrderItem = typeof gasOrderItems.$inferInsert;

// --- GAS DELIVERIES -------------------------------------------------------
export const gasDeliveries = mysqlTable("gas_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  driverId: int("driverId"),
  driverName: varchar("driverName", { length: 200 }),
  driverPhone: varchar("driverPhone", { length: 50 }),
  vehicleInfo: varchar("vehicleInfo", { length: 200 }),
  gpsLatitude: varchar("gpsLatitude", { length: 50 }),
  gpsLongitude: varchar("gpsLongitude", { length: 50 }),
  status: mysqlEnum("status", ["pending", "in_transit", "arrived", "completed", "failed"]).default("pending"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GasDelivery = typeof gasDeliveries.$inferSelect;
export type InsertGasDelivery = typeof gasDeliveries.$inferInsert;

// --- GAS RELATIONS ---------------------------------------------------------
export const gasSuppliersRelations = relations(gasSuppliers, ({ many }) => ({
  bottles: many(gasBottles),
  orders: many(gasOrders),
}));

export const gasBottlesRelations = relations(gasBottles, ({ one, many }) => ({
  supplier: one(gasSuppliers, {
    fields: [gasBottles.supplierId],
    references: [gasSuppliers.id],
  }),
  orderItems: many(gasOrderItems),
}));

export const gasOrdersRelations = relations(gasOrders, ({ one, many }) => ({
  supplier: one(gasSuppliers, {
    fields: [gasOrders.supplierId],
    references: [gasSuppliers.id],
  }),
  items: many(gasOrderItems),
  delivery: one(gasDeliveries, {
    fields: [gasOrders.id],
    references: [gasDeliveries.orderId],
  }),
}));

export const gasOrderItemsRelations = relations(gasOrderItems, ({ one }) => ({
  order: one(gasOrders, {
    fields: [gasOrderItems.orderId],
    references: [gasOrders.id],
  }),
  bottle: one(gasBottles, {
    fields: [gasOrderItems.bottleId],
    references: [gasBottles.id],
  }),
}));

export const gasDeliveriesRelations = relations(gasDeliveries, ({ one }) => ({
  order: one(gasOrders, {
    fields: [gasDeliveries.orderId],
    references: [gasOrders.id],
  }),
}));


// --- GAS DELIVERYMEN (LIVREURS) -----------------------------------------------
export const gasDeliverymen = mysqlTable("gas_deliverymen", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GasDeliveryman = typeof gasDeliverymen.$inferSelect;
export type InsertGasDeliveryman = typeof gasDeliverymen.$inferInsert;

// --- GAS ORDER NOTIFICATIONS --------------------------------------------------
export const gasOrderNotifications = mysqlTable("gas_order_notifications", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  recipientType: mysqlEnum("recipientType", ["supplier", "deliveryman"]).notNull(),
  recipientId: int("recipientId").notNull(),
  notificationType: mysqlEnum("notificationType", [
    "new_order",
    "order_assigned",
    "order_validated",
    "order_delivered",
  ]).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GasOrderNotification = typeof gasOrderNotifications.$inferSelect;
export type InsertGasOrderNotification = typeof gasOrderNotifications.$inferInsert;

// --- RELATIONS ----------------------------------------------------------------
export const gasDeliverymenRelations = relations(gasDeliverymen, ({ many }) => ({
  orders: many(gasOrders),
}));

export const gasOrderNotificationsRelations = relations(gasOrderNotifications, ({ one }) => ({
  order: one(gasOrders, {
    fields: [gasOrderNotifications.orderId],
    references: [gasOrders.id],
  }),
}));

export const gasOrdersRelationsUpdated = relations(gasOrders, ({ one, many }) => ({
  supplier: one(gasSuppliers, {
    fields: [gasOrders.supplierId],
    references: [gasSuppliers.id],
  }),
  deliveryman: one(gasDeliverymen, {
    fields: [gasOrders.deliverymanId],
    references: [gasDeliverymen.id],
  }),
  selectedSupplier: one(gasSuppliers, {
    fields: [gasOrders.selectedSupplierId],
    references: [gasSuppliers.id],
  }),
  items: many(gasOrderItems),
  delivery: one(gasDeliveries, {
    fields: [gasOrders.id],
    references: [gasDeliveries.orderId],
  }),
  notifications: many(gasOrderNotifications),
}));


// --- SHOP PRODUCTS (PRODUITS BOUTIQUE) ----------------------------------------
export const shopProducts = mysqlTable("shop_products", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(), // Référence à transportCompanies (ZAZA DÉPÔT, etc.)
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // ex: "Gaz", "Boissons", "Épicerie"
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  stock: int("stock").default(0).notNull(),
  sku: varchar("sku", { length: 100 }).unique(),
  barcode: varchar("barcode", { length: 100 }),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  minStockAlert: int("minStockAlert").default(10),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopProduct = typeof shopProducts.$inferSelect;
export type InsertShopProduct = typeof shopProducts.$inferInsert;

// --- SHOP PRODUCT ORDERS (COMMANDES DE PRODUITS) --------------------------------
export const shopProductOrders = mysqlTable("shop_product_orders", {
  id: int("id").autoincrement().primaryKey(),
  reference: varchar("reference", { length: 50 }).notNull().unique(),
  supplierId: int("supplierId").notNull(),
  clientName: varchar("clientName", { length: 200 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 50 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  deliveryAddress: text("deliveryAddress").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  totalAmountXOF: decimal("totalAmountXOF", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "in_delivery", "delivered", "cancelled"]).default("pending").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "mobile_money", "card", "bank_transfer"]).default("cash"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopProductOrder = typeof shopProductOrders.$inferSelect;
export type InsertShopProductOrder = typeof shopProductOrders.$inferInsert;

// --- SHOP PRODUCT ORDER ITEMS (ARTICLES DE COMMANDE) ----------------------------
export const shopProductOrderItems = mysqlTable("shop_product_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShopProductOrderItem = typeof shopProductOrderItems.$inferSelect;
export type InsertShopProductOrderItem = typeof shopProductOrderItems.$inferInsert;

// --- SHOP PRODUCT STOCK MOVEMENTS (MOUVEMENTS DE STOCK) -------------------------
export const shopProductStockMovements = mysqlTable("shop_product_stock_movements", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  supplierId: int("supplierId").notNull(),
  movementType: mysqlEnum("movementType", ["in", "out", "adjustment", "return"]).notNull(),
  quantity: int("quantity").notNull(),
  reason: varchar("reason", { length: 255 }),
  reference: varchar("reference", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShopProductStockMovement = typeof shopProductStockMovements.$inferSelect;
export type InsertShopProductStockMovement = typeof shopProductStockMovements.$inferInsert;

// --- RELATIONS -----------------------------------------------------------------
export const shopProductsRelations = relations(shopProducts, ({ one, many }) => ({
  supplier: one(transportCompanies, {
    fields: [shopProducts.supplierId],
    references: [transportCompanies.id],
  }),
  orderItems: many(shopProductOrderItems),
  stockMovements: many(shopProductStockMovements),
}));

export const shopProductOrdersRelations = relations(shopProductOrders, ({ one, many }) => ({
  supplier: one(transportCompanies, {
    fields: [shopProductOrders.supplierId],
    references: [transportCompanies.id],
  }),
  items: many(shopProductOrderItems),
}));

export const shopProductOrderItemsRelations = relations(shopProductOrderItems, ({ one }) => ({
  order: one(shopProductOrders, {
    fields: [shopProductOrderItems.orderId],
    references: [shopProductOrders.id],
  }),
  product: one(shopProducts, {
    fields: [shopProductOrderItems.productId],
    references: [shopProducts.id],
  }),
}));

export const shopProductStockMovementsRelations = relations(shopProductStockMovements, ({ one }) => ({
  product: one(shopProducts, {
    fields: [shopProductStockMovements.productId],
    references: [shopProducts.id],
  }),
  supplier: one(transportCompanies, {
    fields: [shopProductStockMovements.supplierId],
    references: [transportCompanies.id],
  }),
}));
