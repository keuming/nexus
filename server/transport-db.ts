import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { notifyOwner } from "./_core/notification";
import {
  transportBusLines,
  transportBuses,
  transportBookings,
  transportCharges,
  transportCashierProfiles,
  transportCompanies,
  transportCompanyBilling,
  transportDepartures,
  transportRouteFares,
  transportShipments,
  transportStaff,
  transportStations,
  transportTickets,
  transportTrips,
  companyGallery,
  companyReviews,
  onlineOrders,
  companyCredits,
  creditTransactions,
  creditRequests,
  quoteRequests,
} from "../drizzle/schema";

// ─── COMPANIES ────────────────────────────────────────────────────────────────

export async function getCompanyByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(transportCompanies)
    .where(eq(transportCompanies.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

/** Retourne TOUTES les compagnies d'un utilisateur (multi-compagnie) */
export async function getCompaniesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transportCompanies)
    .where(eq(transportCompanies.userId, userId))
    .orderBy(desc(transportCompanies.createdAt));
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(transportCompanies)
    .where(eq(transportCompanies.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getAllCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
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
      activityType: transportCompanies.activityType,
    })
    .from(transportCompanies)
    .orderBy(desc(transportCompanies.createdAt));
}

export async function upsertCompany(
  userId: number,
  data: {
    companyName: string;
    managerName?: string;
    phone?: string;
    email?: string;
    address?: string;
    countryId?: number;
    cityId?: number;
    logoUrl?: string;
    description?: string;
    printHeaderText?: string;
    printFooterText?: string;
    primaryColor?: string;
    activityType?: "transport" | "restauration" | "expedition" | "hotel" | "boutique" | "agence_voyage" | "residence_meuble" | "loisirs" | "location_vente";
    bdId?: string; // ID du Business Développeur recruteur
  },
  companyId?: number // Si fourni, met à jour cette compagnie spécifique
) {
  const db = await getDb();
  if (!db) return null;
  if (companyId) {
    // Mise à jour d'une compagnie spécifique (depuis le dashboard)
    await db
      .update(transportCompanies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(transportCompanies.id, companyId));
    return getCompanyById(companyId);
  } else {
    // Création d'une nouvelle compagnie (inscription)
    await db.insert(transportCompanies).values({ ...data, userId, status: "pending" });
    // Retourner la dernière compagnie créée par cet utilisateur
    const rows = await db
      .select()
      .from(transportCompanies)
      .where(eq(transportCompanies.userId, userId))
      .orderBy(desc(transportCompanies.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }
}

export async function validateCompany(
  companyId: number,
  adminUserId: number,
  action: "active" | "rejected",
  rejectionReason?: string
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(transportCompanies)
    .set({
      status: action,
      validatedAt: action === "active" ? new Date() : null,
      validatedBy: adminUserId,
      rejectionReason: rejectionReason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(transportCompanies.id, companyId));
}

export async function updateCompanyAdmin(
  companyId: number,
  data: {
    companyName?: string;
    managerName?: string;
    phone?: string;
    email?: string;
    address?: string;
    activityType?: "transport" | "restauration" | "expedition" | "hotel" | "boutique" | "agence_voyage" | "residence_meuble" | "loisirs" | "location_vente";
    galleryImageUrl?: string;
  }
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(transportCompanies)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(transportCompanies.id, companyId));
}

export async function suspendCompany(companyId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(transportCompanies)
    .set({ status: "suspended", updatedAt: new Date() })
    .where(eq(transportCompanies.id, companyId));
}

export async function reactivateCompany(companyId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(transportCompanies)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(transportCompanies.id, companyId));
}

export async function deleteCompanyById(companyId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(transportCompanies).where(eq(transportCompanies.id, companyId));
}

// ─── BUS LINES ────────────────────────────────────────────────────────────────

export async function getBusLinesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transportBusLines)
    .where(and(eq(transportBusLines.companyId, companyId), eq(transportBusLines.active, true)))
    .orderBy(transportBusLines.departureCity);
}

export async function upsertBusLine(
  companyId: number,
  data: {
    id?: number;
    departureCity: string;
    arrivalCity: string;
    departureCountryId?: number;
    arrivalCountryId?: number;
    lineType?: "national" | "international";
    distance?: number;
    estimatedDuration?: number;
  }
) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db
      .update(transportBusLines)
      .set({ ...data, companyId })
      .where(and(eq(transportBusLines.id, data.id), eq(transportBusLines.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportBusLines).values({ ...data, companyId });
    return result[0]?.id ?? 0 as number;
  }
}

export async function deleteBusLine(companyId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(transportBusLines)
    .set({ active: false })
    .where(and(eq(transportBusLines.id, id), eq(transportBusLines.companyId, companyId)));
}

// ─── BUSES ────────────────────────────────────────────────────────────────────

export async function getBusesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transportBuses)
    .where(eq(transportBuses.companyId, companyId))
    .orderBy(transportBuses.registration);
}

export async function upsertBus(
  companyId: number,
  data: {
    id?: number;
    registration: string;
    model?: string;
    capacity: number;
    status?: "disponible" | "en_service" | "maintenance";
  }
) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db
      .update(transportBuses)
      .set({ ...data, companyId, updatedAt: new Date() })
      .where(and(eq(transportBuses.id, data.id), eq(transportBuses.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportBuses).values({ ...data, companyId });
    return result[0]?.id ?? 0 as number;
  }
}

export async function deleteBus(companyId: number, id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(transportBuses)
    .where(and(eq(transportBuses.id, id), eq(transportBuses.companyId, companyId)));
}

// ─── TRIPS ────────────────────────────────────────────────────────────────────

export async function getTripsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: transportTrips.id,
      companyId: transportTrips.companyId,
      busLineId: transportTrips.busLineId,
      departureDate: typeof transportTrips.departureDate === "string" ? transportTrips.departureDate : transportTrips.departureDate.toISOString().split("T")[0],
      departureTime: transportTrips.departureTime,
      priceXOF: transportTrips.priceXOF,
      priceGHS: transportTrips.priceGHS,
      totalSeats: transportTrips.totalSeats,
      active: transportTrips.active,
      createdAt: transportTrips.createdAt,
      departureCity: transportBusLines.departureCity,
      arrivalCity: transportBusLines.arrivalCity,
      lineType: transportBusLines.lineType,
    })
    .from(transportTrips)
    .leftJoin(transportBusLines, eq(transportTrips.busLineId, transportBusLines.id))
    .where(eq(transportTrips.companyId, companyId))
    .orderBy(desc(transportTrips.departureDate));
}

export async function getPublicTripsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: transportTrips.id,
      companyId: transportTrips.companyId,
      busLineId: transportTrips.busLineId,
      departureDate: typeof transportTrips.departureDate === "string" ? transportTrips.departureDate : transportTrips.departureDate.toISOString().split("T")[0],
      departureTime: transportTrips.departureTime,
      priceXOF: transportTrips.priceXOF,
      priceGHS: transportTrips.priceGHS,
      totalSeats: transportTrips.totalSeats,
      departureCity: transportBusLines.departureCity,
      arrivalCity: transportBusLines.arrivalCity,
      lineType: transportBusLines.lineType,
    })
    .from(transportTrips)
    .leftJoin(transportBusLines, eq(transportTrips.busLineId, transportBusLines.id))
    .where(and(eq(transportTrips.companyId, companyId), eq(transportTrips.active, true)))
    .orderBy(transportTrips.departureDate, transportTrips.departureTime);
}

export async function getPublicTripsByCountry(countryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: transportTrips.id,
      companyId: transportTrips.companyId,
      busLineId: transportTrips.busLineId,
      departureDate: typeof transportTrips.departureDate === "string" ? transportTrips.departureDate : transportTrips.departureDate.toISOString().split("T")[0],
      departureTime: transportTrips.departureTime,
      priceXOF: transportTrips.priceXOF,
      priceGHS: transportTrips.priceGHS,
      totalSeats: transportTrips.totalSeats,
      departureCity: transportBusLines.departureCity,
      arrivalCity: transportBusLines.arrivalCity,
      lineType: transportBusLines.lineType,
      companyName: transportCompanies.companyName,
      companyLogo: transportCompanies.logoUrl,
    })
    .from(transportTrips)
    .leftJoin(transportBusLines, eq(transportTrips.busLineId, transportBusLines.id))
    .leftJoin(transportCompanies, eq(transportTrips.companyId, transportCompanies.id))
    .where(
      and(
        eq(transportTrips.active, true),
        eq(transportCompanies.status, "active"),
        eq(transportBusLines.departureCountryId, countryId)
      )
    )
    .orderBy(transportTrips.departureDate, transportTrips.departureTime);
}

export async function upsertTrip(
  companyId: number,
  data: {
    id?: number;
    busLineId: number;
    departureDate: string;
    departureTime: string;
    priceXOF?: string;
    priceGHS?: string;
    totalSeats: number;
    active?: boolean;
  }
) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db
      .update(transportTrips)
      .set({ ...data, departureDate: new Date(data.departureDate).toISOString().split("T")[0], companyId, updatedAt: new Date() })
      .where(and(eq(transportTrips.id, data.id), eq(transportTrips.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportTrips).values({ ...data, departureDate: new Date(data.departureDate).toISOString().split("T")[0], companyId });
    return result[0]?.id ?? 0 as number;
  }
}

// ─── DEPARTURES ───────────────────────────────────────────────────────────────

export async function getDeparturesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: transportDepartures.id,
      companyId: transportDepartures.companyId,
      busLineId: transportDepartures.busLineId,
      busId: transportDepartures.busId,
      tripId: transportDepartures.tripId,
      departureDate: typeof transportDepartures.departureDate === "string" ? transportDepartures.departureDate : transportDepartures.departureDate.toISOString().split("T")[0],
      departureTime: transportDepartures.departureTime,
      driverName: transportDepartures.driverName,
      status: transportDepartures.status,
      notes: transportDepartures.notes,
      createdAt: transportDepartures.createdAt,
      departureCity: transportBusLines.departureCity,
      arrivalCity: transportBusLines.arrivalCity,
      busRegistration: transportBuses.registration,
      busCapacity: transportBuses.capacity,
    })
    .from(transportDepartures)
    .leftJoin(transportBusLines, eq(transportDepartures.busLineId, transportBusLines.id))
    .leftJoin(transportBuses, eq(transportDepartures.busId, transportBuses.id))
    .where(eq(transportDepartures.companyId, companyId))
    .orderBy(desc(transportDepartures.departureDate), desc(transportDepartures.departureTime));
}

export async function getDepartureById(id: number, companyId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      id: transportDepartures.id,
      companyId: transportDepartures.companyId,
      busLineId: transportDepartures.busLineId,
      busId: transportDepartures.busId,
      tripId: transportDepartures.tripId,
      departureDate: typeof transportDepartures.departureDate === "string" ? transportDepartures.departureDate : transportDepartures.departureDate.toISOString().split("T")[0],
      departureTime: transportDepartures.departureTime,
      driverName: transportDepartures.driverName,
      status: transportDepartures.status,
      notes: transportDepartures.notes,
      createdAt: transportDepartures.createdAt,
      departureCity: transportBusLines.departureCity,
      arrivalCity: transportBusLines.arrivalCity,
      busRegistration: transportBuses.registration,
      busCapacity: transportBuses.capacity,
    })
    .from(transportDepartures)
    .leftJoin(transportBusLines, eq(transportDepartures.busLineId, transportBusLines.id))
    .leftJoin(transportBuses, eq(transportDepartures.busId, transportBuses.id))
    .where(and(eq(transportDepartures.id, id), eq(transportDepartures.companyId, companyId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertDeparture(
  companyId: number,
  data: {
    id?: number;
    busLineId: number;
    busId?: number;
    tripId?: number;
    departureDate: string;
    departureTime: string;
    driverName?: string;
    status?: "programme" | "embarquement" | "en_route" | "arrive" | "annule";
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db
      .update(transportDepartures)
      .set({ ...data, departureDate: new Date(data.departureDate).toISOString().split("T")[0], companyId, updatedAt: new Date() })
      .where(and(eq(transportDepartures.id, data.id), eq(transportDepartures.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportDepartures).values({ ...data, departureDate: new Date(data.departureDate).toISOString().split("T")[0], companyId });
    return result[0]?.id ?? 0 as number;
  }
}

export async function updateDepartureStatus(
  companyId: number,
  id: number,
  status: "programme" | "embarquement" | "en_route" | "arrive" | "annule"
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(transportDepartures)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(transportDepartures.id, id), eq(transportDepartures.companyId, companyId)));
}

// ─── TICKETS ──────────────────────────────────────────────────────────────────

function generateTicketNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "TK-";
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

export async function getTicketsByDeparture(companyId: number, departureId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transportTickets)
    .where(
      and(
        eq(transportTickets.companyId, companyId),
        eq(transportTickets.departureId, departureId)
      )
    )
    .orderBy(transportTickets.seatNumber);
}

export async function getTicketsByCompany(companyId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
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
      departureDate: typeof transportDepartures.departureDate === "string" ? transportDepartures.departureDate : transportDepartures.departureDate.toISOString().split("T")[0],
      departureTime: transportDepartures.departureTime,
      departureCity: transportBusLines.departureCity,
      arrivalCity: transportBusLines.arrivalCity,
    })
    .from(transportTickets)
    .leftJoin(transportDepartures, eq(transportTickets.departureId, transportDepartures.id))
    .leftJoin(transportBusLines, eq(transportDepartures.busLineId, transportBusLines.id))
    .where(eq(transportTickets.companyId, companyId))
    .orderBy(desc(transportTickets.createdAt))
    .limit(limit);
}

export async function createTicket(
  companyId: number,
  data: {
    departureId: number;
    seatNumber: number;
    firstName: string;
    lastName: string;
    phone?: string;
    idType?: "cni" | "passeport" | "carte_consulaire" | "carte_resident" | "laissez_passer";
    idNumber?: string;
    gender?: "M" | "F";
    nationality?: string;
    dropOffCity?: string;
    priceXOF?: string;
    paymentMethod?: "cash" | "mobile_money" | "virement";
    soldBy?: number;
  }
) {
  const db = await getDb();
  if (!db) return "";
  const ticketNumber = generateTicketNumber();
  await db.insert(transportTickets).values({ ...data, companyId, ticketNumber });
  // Debit 1 credit for ticket creation
  await debitCredit(companyId, `Billet ${ticketNumber} — ${data.firstName ?? ''} ${data.lastName ?? ''}`, "ticket", ticketNumber).catch(() => {});
  return ticketNumber;
}

export async function updateTicketStatus(
  companyId: number,
  ticketId: number,
  updates: {
    ticketStatus?: "actif" | "utilise" | "annule";
    cashStatus?: "en_attente" | "encaisse";
    boardingStatus?: "non_embarque" | "embarque";
  }
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(transportTickets)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(transportTickets.id, ticketId), eq(transportTickets.companyId, companyId)));
}

export async function verifyTicketByNumber(ticketNumber: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
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
      departureDate: typeof transportDepartures.departureDate === "string" ? transportDepartures.departureDate : transportDepartures.departureDate.toISOString().split("T")[0],
      departureTime: transportDepartures.departureTime,
      departureCity: transportBusLines.departureCity,
      arrivalCity: transportBusLines.arrivalCity,
      companyName: transportCompanies.companyName,
    })
    .from(transportTickets)
    .leftJoin(transportDepartures, eq(transportTickets.departureId, transportDepartures.id))
    .leftJoin(transportBusLines, eq(transportDepartures.busLineId, transportBusLines.id))
    .leftJoin(transportCompanies, eq(transportTickets.companyId, transportCompanies.id))
    .where(eq(transportTickets.ticketNumber, ticketNumber))
    .limit(1);
  return rows[0] ?? null;
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

function generateBookingRef(): string {
  return "BK-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

export async function getBookingsByCompany(companyId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
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
      departureDate: typeof transportTrips.departureDate === "string" ? transportTrips.departureDate : transportTrips.departureDate.toISOString().split("T")[0],
      departureTime: transportTrips.departureTime,
      departureCity: transportBusLines.departureCity,
      arrivalCity: transportBusLines.arrivalCity,
    })
    .from(transportBookings)
    .leftJoin(transportTrips, eq(transportBookings.tripId, transportTrips.id))
    .leftJoin(transportBusLines, eq(transportTrips.busLineId, transportBusLines.id))
    .where(eq(transportBookings.companyId, companyId))
    .orderBy(desc(transportBookings.createdAt))
    .limit(limit);
}

export async function createBooking(
  companyId: number,
  data: {
    tripId: number;
    seatNumber: number;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    priceXOF?: string;
  }
) {
  const db = await getDb();
  if (!db) return "";
  const bookingRef = generateBookingRef();
  await db.insert(transportBookings).values({ ...data, companyId, bookingRef });
  // Debit 1 credit for booking creation
  await debitCredit(companyId, `Réservation ${bookingRef} — ${data.firstName ?? ''} ${data.lastName ?? ''}`, "booking", bookingRef).catch(() => {});
  return bookingRef;
}

export async function updateBookingStatus(
  companyId: number,
  bookingId: number,
  status: "en_attente" | "confirme" | "annule"
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(transportBookings)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(transportBookings.id, bookingId), eq(transportBookings.companyId, companyId)));
}

export async function getOccupiedSeatsByTrip(tripId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ seatNumber: transportBookings.seatNumber })
    .from(transportBookings)
    .where(
      and(
        eq(transportBookings.tripId, tripId),
        sql`${transportBookings.status} != 'annule'`
      )
    );
  return rows.map((r) => r.seatNumber);
}

export async function getOccupiedSeatsByDeparture(departureId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ seatNumber: transportTickets.seatNumber })
    .from(transportTickets)
    .where(
      and(
        eq(transportTickets.departureId, departureId),
        sql`${transportTickets.ticketStatus} != 'annule'`
      )
    );
  return rows.map((r) => r.seatNumber);
}

// ─── SHIPMENTS ────────────────────────────────────────────────────────────────

function generateTrackingNumber(): string {
  return "EXP-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 4).toUpperCase();
}

export async function getShipmentsByCompany(companyId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transportShipments)
    .where(eq(transportShipments.companyId, companyId))
    .orderBy(desc(transportShipments.createdAt))
    .limit(limit);
}

export async function createShipment(
  companyId: number,
  data: {
    senderName: string;
    senderPhone?: string;
    senderCity?: string;
    receiverName: string;
    receiverPhone?: string;
    receiverCity?: string;
    description?: string;
    weight?: string;
    priceXOF?: string;
    photoUrl?: string;
    photoKey?: string;
    registeredBy?: number;
  }
) {
  const db = await getDb();
  if (!db) return "";
  const trackingNumber = generateTrackingNumber();
  await db.insert(transportShipments).values({ ...data, companyId, trackingNumber });
  // Debit 1 credit for shipment registration
  await debitCredit(companyId, `Colis ${trackingNumber} — ${data.senderName ?? ''} → ${data.receiverName ?? ''}`, "shipment", trackingNumber).catch(() => {});
  return trackingNumber;
}

export async function updateShipmentStatus(
  companyId: number,
  shipmentId: number,
  status: "enregistre" | "en_transit" | "arrive" | "livre",
  cashStatus?: "en_attente" | "encaisse"
) {
  const db = await getDb();
  if (!db) return;
  const updates: Record<string, unknown> = { status, updatedAt: new Date() };
  if (cashStatus) updates.cashStatus = cashStatus;
  await db
    .update(transportShipments)
    .set(updates as any)
    .where(and(eq(transportShipments.id, shipmentId), eq(transportShipments.companyId, companyId)));
}

export async function trackShipment(trackingNumber: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
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
      companyName: transportCompanies.companyName,
    })
    .from(transportShipments)
    .leftJoin(transportCompanies, eq(transportShipments.companyId, transportCompanies.id))
    .where(eq(transportShipments.trackingNumber, trackingNumber))
    .limit(1);
  return rows[0] ?? null;
}

// ─── STAFF ────────────────────────────────────────────────────────────────────

export async function getStaffByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transportStaff)
    .where(and(eq(transportStaff.companyId, companyId), eq(transportStaff.active, true)))
    .orderBy(transportStaff.lastName);
}

export async function upsertStaff(
  companyId: number,
  data: {
    id?: number;
    firstName: string;
    lastName: string;
    phone?: string;
    role: "chauffeur" | "agent_billetterie" | "agent_expedition" | "caissier" | "superviseur" | "directeur";
    station?: string;
    active?: boolean;
  }
) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db
      .update(transportStaff)
      .set({ ...data, companyId, updatedAt: new Date() })
      .where(and(eq(transportStaff.id, data.id), eq(transportStaff.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportStaff).values({ ...data, companyId });
    return result[0]?.id ?? 0 as number;
  }
}

// ─── STATIONS ─────────────────────────────────────────────────────────────────

export async function getStationsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transportStations)
    .where(and(eq(transportStations.companyId, companyId), eq(transportStations.active, true)));
}

export async function upsertStation(
  companyId: number,
  data: { id?: number; name: string; city: string; countryId?: number; address?: string }
) {
  const db = await getDb();
  if (!db) return 0;
  if (data.id) {
    await db
      .update(transportStations)
      .set({ ...data, companyId })
      .where(and(eq(transportStations.id, data.id), eq(transportStations.companyId, companyId)));
    return data.id;
  } else {
    const result = await db.insert(transportStations).values({ ...data, companyId });
    return result[0]?.id ?? 0 as number;
  }
}

// ─── CHARGES ──────────────────────────────────────────────────────────────────

export async function getChargesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transportCharges)
    .where(eq(transportCharges.companyId, companyId))
    .orderBy(desc(transportCharges.chargeDate));
}

export async function createCharge(
  companyId: number,
  data: {
    category: "carburant" | "maintenance" | "salaire" | "frais_divers";
    description?: string;
    amount: string;
    station?: string;
    chargeDate: string;
  }
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(transportCharges).values({
    companyId,
    category: data.category,
    description: data.description,
    amount: data.amount,
    station: data.station,
    chargeDate: new Date(data.chargeDate).toISOString().split("T")[0],
  });
}

// ─── ROUTE FARES ──────────────────────────────────────────────────────────────

export async function getRouteFaresByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transportRouteFares)
    .where(eq(transportRouteFares.companyId, companyId));
}

export async function upsertRouteFare(
  companyId: number,
  data: {
    id?: number;
    busLineId: number;
    fromCity: string;
    toCity: string;
    priceXOF?: string;
    priceGHS?: string;
  }
) {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    await db
      .update(transportRouteFares)
      .set({ ...data, companyId, updatedAt: new Date() })
      .where(and(eq(transportRouteFares.id, data.id), eq(transportRouteFares.companyId, companyId)));
  } else {
    await db.insert(transportRouteFares).values({ ...data, companyId });
  }
}

// ─── BILLING (NEXUS) ────────────────────────────────────────────────────────────

export async function getBillingByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transportCompanyBilling)
    .where(eq(transportCompanyBilling.companyId, companyId))
    .orderBy(desc(transportCompanyBilling.billingPeriod));
}

export async function getAllBilling() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
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
      companyName: transportCompanies.companyName,
    })
    .from(transportCompanyBilling)
    .leftJoin(transportCompanies, eq(transportCompanyBilling.companyId, transportCompanies.id))
    .orderBy(desc(transportCompanyBilling.billingPeriod));
}

export async function generateMonthlyBilling(companyId: number, period: string) {
  const db = await getDb();
  if (!db) return null;
  const [year, month] = period.split("-").map(Number);
  const startDate = `${period}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const ticketRows = await db
    .select({
      count: sql<number>`count(*)`,
      cashed: sql<number>`SUM(CASE WHEN ${transportTickets.cashStatus} = 'encaisse' THEN 1 ELSE 0 END)`,
    })
    .from(transportTickets)
    .where(
      and(
        eq(transportTickets.companyId, companyId),
        sql`DATE(${transportTickets.createdAt}) BETWEEN ${startDate} AND ${endDate}`,
        sql`${transportTickets.ticketStatus} != 'annule'`
      )
    );

  const ticketsSold = Number(ticketRows[0]?.count ?? 0);
  const ticketsCashed = Number(ticketRows[0]?.cashed ?? 0);

  const shipmentRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(transportShipments)
    .where(
      and(
        eq(transportShipments.companyId, companyId),
        eq(transportShipments.cashStatus, "encaisse"),
        sql`DATE(${transportShipments.updatedAt}) BETWEEN ${startDate} AND ${endDate}`
      )
    );
  const shipmentsCashed = Number(shipmentRows[0]?.count ?? 0);

  const ticketFeeXOF = (ticketsSold * 200).toFixed(2);
  const shipmentFeeXOF = (shipmentsCashed * 100).toFixed(2);
  const totalFeeXOF = (ticketsSold * 200 + shipmentsCashed * 100).toFixed(2);

  const existing = await db
    .select({ id: transportCompanyBilling.id })
    .from(transportCompanyBilling)
    .where(
      and(
        eq(transportCompanyBilling.companyId, companyId),
        eq(transportCompanyBilling.billingPeriod, period)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(transportCompanyBilling)
      .set({ ticketsSold, ticketsCashed, shipmentsCashed, ticketFeeXOF, shipmentFeeXOF, totalFeeXOF })
      .where(eq(transportCompanyBilling.id, existing[0].id));
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
      status: "en_attente",
    });
  }
  return { ticketsSold, ticketsCashed, shipmentsCashed, ticketFeeXOF, shipmentFeeXOF, totalFeeXOF };
}

export async function updateBillingStatus(
  billingId: number,
  status: "en_attente" | "facture" | "paye"
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(transportCompanyBilling)
    .set({ status, paidAt: status === "paye" ? new Date() : null })
    .where(eq(transportCompanyBilling.id, billingId));
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

export async function getCompanyDashboardStats(companyId: number) {
  const db = await getDb();
  if (!db) return { ticketsSoldToday: 0, ticketsRevenueToday: 0, shipmentsToday: 0, shipmentsRevenueToday: 0, departuresToday: 0, pendingBookings: 0 };
  const today = new Date().toISOString().split("T")[0];

  const [ticketStats, shipmentStats, departureStats, bookingStats] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)`, revenue: sql<number>`COALESCE(SUM(${transportTickets.priceXOF}), 0)` })
      .from(transportTickets)
      .where(
        and(
          eq(transportTickets.companyId, companyId),
          sql`DATE(${transportTickets.createdAt}) = ${today}`,
          sql`${transportTickets.ticketStatus} != 'annule'`
        )
      ),
    db
      .select({ count: sql<number>`count(*)`, revenue: sql<number>`COALESCE(SUM(${transportShipments.priceXOF}), 0)` })
      .from(transportShipments)
      .where(
        and(
          eq(transportShipments.companyId, companyId),
          sql`DATE(${transportShipments.createdAt}) = ${today}`
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transportDepartures)
      .where(
        and(
          eq(transportDepartures.companyId, companyId),
          sql`${transportDepartures.departureDate} = ${today}`
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transportBookings)
      .where(
        and(
          eq(transportBookings.companyId, companyId),
          eq(transportBookings.status, "en_attente")
        )
      ),
  ]);

  return {
    ticketsSoldToday: Number(ticketStats[0]?.count ?? 0),
    ticketsRevenueToday: Number(ticketStats[0]?.revenue ?? 0),
    shipmentsToday: Number(shipmentStats[0]?.count ?? 0),
    shipmentsRevenueToday: Number(shipmentStats[0]?.revenue ?? 0),
    departuresToday: Number(departureStats[0]?.count ?? 0),
    pendingBookings: Number(bookingStats[0]?.count ?? 0),
  };
}

export async function getCsnDashboardStats() {
  const db = await getDb();
  if (!db) return { totalCompanies: 0, activeCompanies: 0, pendingCompanies: 0, ticketsToday: 0, shipmentsToday: 0, pendingBillingXOF: 0 };

  const [companyStats, ticketStats, shipmentStats, billingStats, orderStats] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`SUM(CASE WHEN ${transportCompanies.status} = 'active' THEN 1 ELSE 0 END)`,
        pending: sql<number>`SUM(CASE WHEN ${transportCompanies.status} = 'pending' THEN 1 ELSE 0 END)`,
      })
      .from(transportCompanies),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transportTickets)
      .where(sql`DATE(${transportTickets.createdAt}) = CURDATE()`),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transportShipments)
      .where(sql`DATE(${transportShipments.createdAt}) = CURDATE()`),
    db
      .select({ total: sql<number>`COALESCE(SUM(${transportCompanyBilling.totalFeeXOF}), 0)` })
      .from(transportCompanyBilling)
      .where(eq(transportCompanyBilling.status, "en_attente")),
    db
      .select({
        count: sql<number>`count(*)`,
        revenue: sql<number>`COALESCE(SUM(${onlineOrders.totalXOF}), 0)`,
      })
      .from(onlineOrders)
      .where(sql`DATE(${onlineOrders.createdAt}) = CURDATE()`),
  ]);

  return {
    totalCompanies: Number(companyStats[0]?.total ?? 0),
    activeCompanies: Number(companyStats[0]?.active ?? 0),
    pendingCompanies: Number(companyStats[0]?.pending ?? 0),
    ticketsToday: Number(ticketStats[0]?.count ?? 0),
    shipmentsToday: Number(shipmentStats[0]?.count ?? 0),
    pendingBillingXOF: Number(billingStats[0]?.total ?? 0),
    ordersToday: Number(orderStats[0]?.count ?? 0),
    orderRevenueToday: Number(orderStats[0]?.revenue ?? 0),
  };
}

// ─── PUBLIC SEARCH (Interface publique unifiée) ───────────────────────────────

export async function getCompaniesByCountry(countryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: transportCompanies.id,
      companyName: transportCompanies.companyName,
      logoUrl: transportCompanies.logoUrl,
      countryId: transportCompanies.countryId,
      cityId: transportCompanies.cityId,
      description: transportCompanies.description,
    })
    .from(transportCompanies)
    .where(
      and(
        eq(transportCompanies.status, "active"),
        eq(transportCompanies.countryId, countryId)
      )
    )
    .orderBy(transportCompanies.companyName);
}

export async function searchPublicTrips(params: {
  countryId?: number;
  companyId?: number;
  departureCity?: string;
  arrivalCity?: string;
  date?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [
    eq(transportCompanies.status, "active"),
    eq(transportTrips.active, true),
  ];

  if (params.countryId) {
    conditions.push(eq(transportBusLines.departureCountryId, params.countryId));
  }
  if (params.companyId) {
    conditions.push(eq(transportTrips.companyId, params.companyId));
  }
  if (params.departureCity) {
    conditions.push(sql`LOWER(${transportBusLines.departureCity}) LIKE LOWER(${"%" + params.departureCity + "%"})`);
  }
  if (params.arrivalCity) {
    conditions.push(sql`LOWER(${transportBusLines.arrivalCity}) LIKE LOWER(${"%" + params.arrivalCity + "%"})`);
  }
  if (params.date) {
    conditions.push(sql`DATE(${transportTrips.departureDate}) = ${params.date}`);
  }
  const rows = await db
    .select({
      id: transportTrips.id,
      companyId: transportTrips.companyId,
      companyName: transportCompanies.companyName,
      logoUrl: transportCompanies.logoUrl,
      departureCity: transportBusLines.departureCity,
      arrivalCity: transportBusLines.arrivalCity,
      lineType: transportBusLines.lineType,
      departureDate: typeof transportTrips.departureDate === "string" ? transportTrips.departureDate : transportTrips.departureDate.toISOString().split("T")[0],
      departureTime: transportTrips.departureTime,
      priceXOF: transportTrips.priceXOF,
      totalSeats: transportTrips.totalSeats,
    })
    .from(transportTrips)
    .leftJoin(transportBusLines, eq(transportTrips.busLineId, transportBusLines.id))
    .leftJoin(transportCompanies, eq(transportTrips.companyId, transportCompanies.id))
    .where(and(...conditions))
    .orderBy(transportTrips.departureDate, transportTrips.departureTime);

  if (rows.length === 0) return [];

  // Count occupied seats per trip
  const tripIds = rows.map((r) => r.id);
  const occupiedCounts = await db
    .select({
      tripId: transportBookings.tripId,
      count: sql<number>`COUNT(*)`,
    })
    .from(transportBookings)
    .where(
      and(
        sql`${transportBookings.tripId} IN (${sql.join(tripIds.map((id) => sql`${id}`), sql`, `)})`,
        sql`${transportBookings.status} IN ('en_attente', 'confirme')`
      )
    )
    .groupBy(transportBookings.tripId);

  const occupiedMap = new Map(occupiedCounts.map((r) => [r.tripId, Number(r.count)]));

  return rows.map((r) => ({
    ...r,
    availableSeats: Math.max(0, r.totalSeats - (occupiedMap.get(r.id) ?? 0)),
  }));
}

export async function createPublicBooking(data: {
  companyId: number;
  tripId: number;
  seatNumber: number;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  gender?: string;
  nationality?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Check seat not already taken
  const existing = await db
    .select({ id: transportBookings.id })
    .from(transportBookings)
    .where(
      and(
        eq(transportBookings.tripId, data.tripId),
        eq(transportBookings.seatNumber, data.seatNumber),
        sql`${transportBookings.status} IN ('en_attente', 'confirme')`
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Ce siège est déjà réservé. Veuillez en choisir un autre.");
  }

  // Get trip info for price and companyId
  const trip = await db
    .select({ priceXOF: transportTrips.priceXOF, companyId: transportTrips.companyId })
    .from(transportTrips)
    .where(eq(transportTrips.id, data.tripId))
    .limit(1);

  if (!trip[0]) throw new Error("Départ introuvable.");

  const bookingRef = generateBookingRef();

  await db.insert(transportBookings).values({
    companyId: trip[0].companyId,
    tripId: data.tripId,
    seatNumber: data.seatNumber,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    email: data.email,
    priceXOF: trip[0].priceXOF ?? undefined,
    bookingRef,
    status: "en_attente",
  });

  return { bookingRef };
}

// --- COMPANY GALLERY ----------------------------------------------------------
export async function getGalleryByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyGallery)
    .where(eq(companyGallery.companyId, companyId))
    .orderBy(companyGallery.displayOrder, companyGallery.createdAt);
}

export async function addGalleryImage(data: {
  companyId: number;
  imageUrl: string;
  caption?: string;
  displayOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(companyGallery).values({
    companyId: data.companyId,
    imageUrl: data.imageUrl,
    caption: data.caption ?? null,
    displayOrder: data.displayOrder ?? 0,
  });
  return { success: true };
}

export async function deleteGalleryImage(imageId: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(companyGallery)
    .where(and(eq(companyGallery.id, imageId), eq(companyGallery.companyId, companyId)));
  return { success: true };
}

// --- COMPANY REVIEWS ----------------------------------------------------------
export async function getReviewsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(companyReviews)
    .where(eq(companyReviews.companyId, companyId))
    .orderBy(desc(companyReviews.createdAt));
}

export async function createCompanyReview(data: {
  companyId: number;
  authorName: string;
  rating: number;
  comment?: string;
  activityType: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(companyReviews).values({
    companyId: data.companyId,
    authorName: data.authorName,
    rating: Math.min(5, Math.max(1, data.rating)),
    comment: data.comment ?? null,
    activityType: data.activityType,
  });
  return { success: true };
}

export async function getAverageRating(companyId: number) {
  const db = await getDb();
  if (!db) return { avg: 0, count: 0 };
  const rows = await db.select({
    avg: sql<number>`AVG(${companyReviews.rating})`,
    count: sql<number>`COUNT(*)`,
  }).from(companyReviews).where(eq(companyReviews.companyId, companyId));
  return { avg: Number(rows[0]?.avg ?? 0), count: Number(rows[0]?.count ?? 0) };
}

// --- ALL COMPANIES (for directory) -------------------------------------------
export async function getAllActiveCompanies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transportCompanies)
    .where(eq(transportCompanies.status, "active"))
    .orderBy(transportCompanies.companyName);
}

// ─── CREDITS NEXUS ─────────────────────────────────────────────────────────

// Taux de conversion : 1 point = 125 FCFA (XOF). Devise et taux par pays.
const COUNTRY_CURRENCY: Record<string, { currency: string; rate: number; symbol: string }> = {
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
  NG: { currency: "NGN", rate: 200, symbol: "₦" },
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
  ER: { currency: "ERN", rate: 1.9, symbol: "ERN" },
};

export function getCountryCurrency(countryCode: string) {
  return COUNTRY_CURRENCY[countryCode] ?? COUNTRY_CURRENCY["CI"];
}

export async function getCompanyCredits(companyId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(companyCredits).where(eq(companyCredits.companyId, companyId));
  if (rows.length > 0) return rows[0];
  // Créer un compte crédit par défaut si inexistant
  await db.insert(companyCredits).values({ companyId, balance: 0, countryCode: "CI", currency: "XOF", pointPriceLocal: "125.00" });
  const created = await db.select().from(companyCredits).where(eq(companyCredits.companyId, companyId));
  return created[0] ?? null;
}

export async function addCredits(companyId: number, points: number, amountLocal: number, description: string) {
  const db = await getDb();
  if (!db) return null;
  const current = await getCompanyCredits(companyId);
  if (!current) return null;
  const newBalance = current.balance + points;
  await db.update(companyCredits).set({ balance: newBalance }).where(eq(companyCredits.companyId, companyId));
  await db.insert(creditTransactions).values({
    companyId,
    type: "credit",
    points,
    amountLocal: String(amountLocal),
    description,
    refType: "purchase",
    refId: null,
    balanceAfter: newBalance,
  });
  return newBalance;
}

export async function debitCredit(companyId: number, description: string, refType: string, refId: string) {
  const db = await getDb();
  if (!db) return { success: false, balance: 0, insufficient: false };
  const current = await getCompanyCredits(companyId);
  if (!current) return { success: false, balance: 0, insufficient: false };
  if (current.balance <= 0) return { success: false, balance: current.balance, insufficient: true };
  const newBalance = current.balance - 1;
  await db.update(companyCredits).set({ balance: newBalance }).where(eq(companyCredits.companyId, companyId));
  await db.insert(creditTransactions).values({
    companyId,
    type: "debit",
    points: 1,
    amountLocal: null,
    description,
    refType,
    refId,
    balanceAfter: newBalance,
  });
  // Alerte solde critique : notifier le propriétaire si solde < 5 points
  if (newBalance < 5) {
    const company = await db
      .select({ companyName: transportCompanies.companyName, email: transportCompanies.email })
      .from(transportCompanies)
      .where(eq(transportCompanies.id, companyId))
      .limit(1);
    const name = company[0]?.companyName ?? `Compagnie #${companyId}`;
    const email = company[0]?.email ?? "non renseigné";
    notifyOwner({
      title: `⚠️ Solde critique — ${name}`,
      content: `La compagnie **${name}** (ID: ${companyId}) ne dispose plus que de **${newBalance} crédit(s)** NEXUS.\n\nSi le solde atteint 0, les nouvelles transactions seront bloquées.\n\nContact : ${email}`,
    }).catch(() => {});
  }
  return { success: true, balance: newBalance, insufficient: false };
}

export async function getCreditTransactions(companyId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions)
    .where(eq(creditTransactions.companyId, companyId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
}

// ─── CREDITS STATS (NEXUS) ─────────────────────────────────────────────────────

export async function getAllCreditsStats() {
  const db = await getDb();
  if (!db) return [];
  // Récupère toutes les compagnies avec leur solde et stats de transactions
  const companies = await db
    .select({
      id: transportCompanies.id,
      companyName: transportCompanies.companyName,
      email: transportCompanies.email,
      activityType: transportCompanies.activityType,
      status: transportCompanies.status,
    })
    .from(transportCompanies)
    .orderBy(transportCompanies.companyName);

  const results = await Promise.all(
    companies.map(async (c) => {
      const credits = await db
        .select()
        .from(companyCredits)
        .where(eq(companyCredits.companyId, c.id))
        .limit(1);
      const balance = credits[0]?.balance ?? 0;
      const currency = credits[0]?.currency ?? "XOF";

      // Total acheté (somme des crédits)
      const bought = await db
        .select({ total: sql<number>`COALESCE(SUM(${creditTransactions.points}), 0)` })
        .from(creditTransactions)
        .where(and(eq(creditTransactions.companyId, c.id), eq(creditTransactions.type, "credit")));
      const totalBought = Number(bought[0]?.total ?? 0);

      // Total dépensé
      const spent = await db
        .select({ total: sql<number>`COALESCE(SUM(${creditTransactions.points}), 0)` })
        .from(creditTransactions)
        .where(and(eq(creditTransactions.companyId, c.id), eq(creditTransactions.type, "debit")));
      const totalSpent = Number(spent[0]?.total ?? 0);

      // Montant total encaissé (en devise locale)
      const revenue = await db
        .select({ total: sql<number>`COALESCE(SUM(${creditTransactions.amountLocal}), 0)` })
        .from(creditTransactions)
        .where(and(eq(creditTransactions.companyId, c.id), eq(creditTransactions.type, "credit")));
      const totalRevenue = Number(revenue[0]?.total ?? 0);

      // Dernière transaction
      const lastTx = await db
        .select({ createdAt: creditTransactions.createdAt })
        .from(creditTransactions)
        .where(eq(creditTransactions.companyId, c.id))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(1);

      return {
        ...c,
        balance,
        currency,
        totalBought,
        totalSpent,
        totalRevenue,
        lastActivity: lastTx[0]?.createdAt ?? null,
      };
    })
  );
  return results;
}

// ─── CREDIT REQUESTS (Demandes d'achat de crédits) ────────────────────────────

export async function createCreditRequest(data: {
  companyId: number;
  points: number;
  amountLocal: number;
  currency: string;
  paymentMethod: string;
  paymentPhone?: string;
  paymentOperator?: string;
  paymentRef?: string;
  notes?: string;
}) {
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
    status: "pending",
  });
  const id = result[0]?.id ?? 0 as number;
  // Notifier NEXUS d'une nouvelle demande
  const company = await getCompanyById(data.companyId);
  notifyOwner({
    title: `💳 Nouvelle demande de crédit — ${company?.companyName ?? `#${data.companyId}`}`,
    content: `**${company?.companyName ?? "Compagnie"}** demande **${data.points} points** (${data.amountLocal.toLocaleString()} ${data.currency}) via **${data.paymentMethod}**.\n\nRéférence paiement : ${data.paymentRef ?? "non renseignée"}\nTéléphone : ${data.paymentPhone ?? "non renseigné"}`,
  }).catch(() => {});
  return id;
}

export async function getAllCreditRequests(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
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
      companyPhone: transportCompanies.phone,
    })
    .from(creditRequests)
    .leftJoin(transportCompanies, eq(creditRequests.companyId, transportCompanies.id))
    .orderBy(desc(creditRequests.createdAt));
  if (status) return rows.filter((r) => r.status === status);
  return rows;
}

export async function getCreditRequestsByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(creditRequests)
    .where(eq(creditRequests.companyId, companyId))
    .orderBy(desc(creditRequests.createdAt));
}

export async function confirmCreditRequestPayment(
  requestId: number,
  validatedBy: string
) {
  const db = await getDb();
  if (!db) return null;
  // 1. Mettre à jour le statut de la demande
  await db
    .update(creditRequests)
    .set({
      status: "payment_confirmed",
      paymentConfirmedAt: new Date(),
      validatedBy,
      updatedAt: new Date(),
    })
    .where(eq(creditRequests.id, requestId));
  // 2. Récupérer la demande pour créditer le compte
  const rows = await db.select().from(creditRequests).where(eq(creditRequests.id, requestId)).limit(1);
  const req = rows[0];
  if (!req) return null;
  // 3. Créditer automatiquement le compte
  const newBalance = await addCredits(
    req.companyId,
    req.points,
    Number(req.amountLocal),
    `Achat de ${req.points} point(s) — paiement ${req.paymentMethod} confirmé (réf: ${req.paymentRef ?? "N/A"})`
  );
  // 4. Marquer comme crédité
  await db
    .update(creditRequests)
    .set({ status: "credited", creditedAt: new Date(), updatedAt: new Date() })
    .where(eq(creditRequests.id, requestId));
  // 5. Notifier la compagnie
  const company = await getCompanyById(req.companyId);
  notifyOwner({
    title: `✅ Crédit validé — ${company?.companyName ?? `#${req.companyId}`}`,
    content: `**${req.points} points** ont été crédités sur le compte de **${company?.companyName ?? "la compagnie"}**.\nNouveau solde : **${newBalance} points**`,
  }).catch(() => {});
  return { success: true, newBalance, requestId };
}

export async function rejectCreditRequest(
  requestId: number,
  validatedBy: string,
  reason: string
) {
  const db = await getDb();
  if (!db) return null;
  await db
    .update(creditRequests)
    .set({
      status: "rejected",
      rejectionReason: reason,
      validatedBy,
      updatedAt: new Date(),
    })
    .where(eq(creditRequests.id, requestId));
  return { success: true };
}

export async function autoValidateMobileMoneyPayment(
  requestId: number,
  paymentRef: string,
  operator: string
) {
  const db = await getDb();
  if (!db) return null;
  // Mettre à jour la référence de paiement
  await db
    .update(creditRequests)
    .set({ paymentRef, paymentOperator: operator, updatedAt: new Date() })
    .where(eq(creditRequests.id, requestId));
  // Valider automatiquement
  return confirmCreditRequestPayment(requestId, "système_mobile_money");
}

// ─── Hub2 Payment Integration ─────────────────────────────────────────────────

/**
 * Trouver une demande de crédit par sa référence d'achat Hub2 (purchaseReference)
 * Format attendu : "NEXUS-CR-{requestId}-{timestamp}"
 */
export async function getCreditRequestByHub2PurchaseRef(purchaseRef: string) {
  const db = await getDb();
  if (!db) return null;

  // Extraire l'ID de la demande depuis la référence (ex: "NEXUS-CR-42-1711234567890")
  const match = purchaseRef.match(/^NEXUS-CR-(\d+)-/);
  if (!match) return null;

  const requestId = parseInt(match[1], 10);
  if (isNaN(requestId)) return null;

  const rows = await db
    .select()
    .from(creditRequests)
    .where(eq(creditRequests.id, requestId))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Sauvegarder les informations Hub2 sur une demande de crédit
 * (intentId, token JWT, purchaseRef) après création de l'intention de paiement
 */
export async function saveHub2PaymentIntent(
  requestId: number,
  hub2IntentId: string,
  hub2PurchaseRef: string,
  hub2Token: string
) {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(creditRequests)
    .set({
      cinetpayTransactionId: hub2IntentId,
      cinetpayPaymentToken: hub2Token,
      cinetpayPaymentUrl: hub2PurchaseRef,
      updatedAt: new Date(),
    })
    .where(eq(creditRequests.id, requestId));

  return { success: true };
}

// ─── Crédit manuel par l'admin NEXUS ──────────────────────────────────────────
export async function adminCreditCompany(
  companyId: number,
  points: number,
  motif: string,
  reference: string | null,
  adminEmail: string
): Promise<{ success: boolean; newBalance: number; balanceBefore: number; companyName: string }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const current = await getCompanyCredits(companyId);
  if (!current) throw new Error("Compagnie introuvable ou crédits non initialisés");

  const company = await getCompanyById(companyId);
  const companyName = company?.companyName ?? `Compagnie #${companyId}`;

  const balanceBefore = current.balance;
  const newBalance = balanceBefore + points;

  // Mettre à jour le solde
  await db
    .update(companyCredits)
    .set({ balance: newBalance })
    .where(eq(companyCredits.companyId, companyId));

  // Enregistrer la transaction avec balanceBefore, reference et adminNote
  await db.insert(creditTransactions).values({
    companyId,
    type: "credit",
    points,
    amountLocal: null,
    description: `Crédit manuel NEXUS — ${motif}`,
    refType: "manual_admin",
    refId: reference ?? null,
    balanceBefore,
    balanceAfter: newBalance,
    reference: reference ?? null,
    adminNote: `Crédité par ${adminEmail} — ${motif}`,
  });

  // Notifier le propriétaire
  await notifyOwner({
    title: `Crédit manuel NEXUS — ${companyName}`,
    content: `L'admin ${adminEmail} a crédité ${points} point(s) à "${companyName}".\nMotif : ${motif}\nRéférence : ${reference ?? "—"}\nSolde avant : ${balanceBefore} pts → Solde après : ${newBalance} pts`,
  });

  return { success: true, newBalance, balanceBefore, companyName };
}


// ─── TRENDING DATA (30 jours) ─────────────────────────────────────────────────
export async function getTrendingData(days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  
  const data = await db.execute(sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as tickets,
      COALESCE(SUM(CASE WHEN status = 'confirmed' THEN price_xof ELSE 0 END), 0) as revenue
    FROM transport_tickets
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `);
  
  return (data as any[]).map((row: any) => ({
    date: row.date,
    tickets: Number(row.tickets ?? 0),
    revenue: Number(row.revenue ?? 0),
  }));
}

// ─── COMPANIES DETAILED STATS ──────────────────────────────────────────────────
export async function getCompaniesDetailedStats() {
  const db = await getDb();
  if (!db) return [];
  
  const companies = await db
    .select({
      id: transportCompanies.id,
      companyName: transportCompanies.companyName,
      status: transportCompanies.status,
      createdAt: transportCompanies.createdAt,
    })
    .from(transportCompanies)
    .orderBy(desc(transportCompanies.createdAt));
  
  const stats = await Promise.all(
    companies.map(async (company) => {
      const ticketStats = await db
        .select({
          count: sql<number>`COUNT(*)`,
          revenue: sql<number>`COALESCE(SUM(${transportTickets.priceXOF}), 0)`,
        })
        .from(transportTickets)
        .where(eq(transportTickets.companyId, company.id));
      
      const shipmentStats = await db
        .select({
          count: sql<number>`COUNT(*)`,
          revenue: sql<number>`COALESCE(SUM(${transportShipments.priceXOF}), 0)`,
        })
        .from(transportShipments)
        .where(eq(transportShipments.companyId, company.id));
      
      const totalRevenue = 
        (Number(ticketStats[0]?.revenue ?? 0) || 0) + 
        (Number(shipmentStats[0]?.revenue ?? 0) || 0);
      
      const totalTransactions = 
        (Number(ticketStats[0]?.count ?? 0) || 0) + 
        (Number(shipmentStats[0]?.count ?? 0) || 0);
      
      return {
        id: company.id,
        companyName: company.companyName,
        status: company.status,
        tickets: Number(ticketStats[0]?.count ?? 0),
        shipments: Number(shipmentStats[0]?.count ?? 0),
        totalTransactions,
        totalRevenue,
        activityRate: totalTransactions > 0 ? ((totalTransactions / 30) * 100).toFixed(1) : "0",
        createdAt: company.createdAt,
      };
    })
  );
  
  return stats;
}


// ─── QUOTE REQUESTS ───────────────────────────────────────────────────────────

export async function createQuoteRequest(data: {
  name: string;
  email: string;
  phone: string;
  activityType: "transport" | "restauration" | "expedition" | "hotel" | "boutique" | "residence_meuble";
  message: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(quoteRequests).values({
    ...data,
    status: "new",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return result;
}

export async function getQuoteRequests(filters?: {
  status?: string;
  activityType?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(quoteRequests) as any;
  
  if (filters?.status) {
    query = query.where(eq(quoteRequests.status, filters.status as any));
  }
  
  if (filters?.activityType) {
    query = query.where(eq(quoteRequests.activityType, filters.activityType as any));
  }
  
  return query.orderBy(desc(quoteRequests.createdAt));
}

export async function updateQuoteRequestStatus(id: number, status: string, notes?: string) {
  const db = await getDb();
  if (!db) return null;
  
  const updateData: any = {
    status: status as any,
    updatedAt: new Date(),
  };
  
  if (status === "contacted") {
    updateData.contactedAt = new Date();
  } else if (status === "closed") {
    updateData.closedAt = new Date();
  }
  
  if (notes) {
    updateData.notes = notes;
  }
  
  await db
    .update(quoteRequests)
    .set(updateData)
    .where(eq(quoteRequests.id, id));
  
  return db.select().from(quoteRequests).where(eq(quoteRequests.id, id)).limit(1);
}
