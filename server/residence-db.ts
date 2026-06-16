import { getDb } from "./db";
import {
  furnishedResidences,
  roomAvailability,
  residenceReservations,
  guestReviews,
  FurnishedResidence,
  ResidenceReservation,
  RoomAvailability,
  GuestReview,
} from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// ─── FURNISHED RESIDENCES ────────────────────────────────────────────────────

export async function createResidence(data: {
  companyId: number;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  totalRooms: number;
  amenities?: string;
  pricePerNight: string | number;
  pricePerMonth?: string | number;
  minStay?: number;
  maxStay?: number;
}): Promise<FurnishedResidence | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db
    .insert(furnishedResidences)
    .values([{
      ...data,
      pricePerNight: String(data.pricePerNight),
      pricePerMonth: data.pricePerMonth ? String(data.pricePerMonth) : undefined,
      amenities: data.amenities ? JSON.stringify(data.amenities) : null,
    }]);
  return null;
}

export async function getResidencesByCompany(companyId: number): Promise<FurnishedResidence[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(furnishedResidences)
    .where(eq(furnishedResidences.companyId, companyId));
}

export async function getResidenceById(residenceId: number): Promise<FurnishedResidence | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(furnishedResidences)
    .where(eq(furnishedResidences.id, residenceId))
    .limit(1);
  return result[0];
}

export async function updateResidence(
  residenceId: number,
  data: Partial<FurnishedResidence>
): Promise<FurnishedResidence | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db
    .update(furnishedResidences)
    .set(data)
    .where(eq(furnishedResidences.id, residenceId));
  return null;
}

export async function deleteResidence(residenceId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(furnishedResidences).where(eq(furnishedResidences.id, residenceId));
}

// ─── ROOM AVAILABILITY ────────────────────────────────────────────────────────

export async function setRoomAvailability(data: {
  residenceId: number;
  date: Date;
  availableRooms: number;
  pricePerNight?: string | number;
  status?: "available" | "booked" | "blocked";
}): Promise<RoomAvailability | null> {
  const db = await getDb();
  if (!db) return null;
  
  const existingAvailabilityResult = await db
    .select()
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.residenceId, data.residenceId),
        eq(roomAvailability.date, data.date)
      )
    )
    .limit(1);
  
  const existingAvailability = existingAvailabilityResult[0];

  if (existingAvailability) {
    await db
      .update(roomAvailability)
      .set({
        availableRooms: data.availableRooms,
        pricePerNight: data.pricePerNight ? String(data.pricePerNight) : undefined,
        status: data.status,
      })
      .where(eq(roomAvailability.id, existingAvailability.id));
    return null;
  }

  await db
    .insert(roomAvailability)
    .values([{
      ...data,
      pricePerNight: data.pricePerNight ? String(data.pricePerNight) : undefined,
    }]);
  return null;
}

export async function getAvailabilityRange(
  residenceId: number,
  startDate: Date,
  endDate: Date
): Promise<RoomAvailability[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(roomAvailability)
    .where(
      and(
        eq(roomAvailability.residenceId, residenceId),
        gte(roomAvailability.date, startDate),
        lte(roomAvailability.date, endDate)
      )
    );
}

export async function blockDates(
  residenceId: number,
  startDate: Date,
  endDate: Date
): Promise<void> {
  // Générer toutes les dates entre startDate et endDate
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Bloquer chaque date
  for (const date of dates) {
    await setRoomAvailability({
      residenceId,
      date,
      availableRooms: 0,
      status: "blocked",
    });
  }
}

// ─── RESERVATIONS ────────────────────────────────────────────────────────────

export async function createReservation(data: {
  residenceId: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfRooms: number;
  numberOfGuests: number;
  totalPrice: string | number;
  paymentMethod?: string;
  specialRequests?: string;
  notes?: string;
}): Promise<ResidenceReservation | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db
    .insert(residenceReservations)
    .values([{
      ...data,
      totalPrice: String(data.totalPrice),
    }]);
  return null;
}

export async function getReservationsByResidence(residenceId: number): Promise<ResidenceReservation[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(residenceReservations)
    .where(eq(residenceReservations.residenceId, residenceId))
    .orderBy(desc(residenceReservations.createdAt));
}

export async function getReservationById(reservationId: number): Promise<ResidenceReservation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(residenceReservations)
    .where(eq(residenceReservations.id, reservationId))
    .limit(1);
  return result[0];
}

export async function updateReservationStatus(
  reservationId: number,
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled"
): Promise<ResidenceReservation | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db
    .update(residenceReservations)
    .set({ reservationStatus: status })
    .where(eq(residenceReservations.id, reservationId));
  return null;
}

export async function updatePaymentStatus(
  reservationId: number,
  paymentStatus: "pending" | "partial" | "paid",
  paidAmount?: number
): Promise<ResidenceReservation | null> {
  const db = await getDb();
  if (!db) return null;
  
  const updates: any = { paymentStatus };
  if (paidAmount !== undefined) {
    updates.paidAmount = paidAmount;
  }
  await db
    .update(residenceReservations)
    .set(updates)
    .where(eq(residenceReservations.id, reservationId));
  return null;
}

export async function getReservationsByDateRange(
  residenceId: number,
  startDate: Date,
  endDate: Date
): Promise<ResidenceReservation[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(residenceReservations)
    .where(
      and(
        eq(residenceReservations.residenceId, residenceId),
        gte(residenceReservations.checkInDate, startDate),
        lte(residenceReservations.checkOutDate, endDate)
      )
    );
}

// ─── GUEST REVIEWS ───────────────────────────────────────────────────────────

export async function createReview(data: {
  reservationId: number;
  residenceId: number;
  guestName: string;
  rating: number;
  comment?: string;
  cleanliness?: number;
  comfort?: number;
  amenities?: number;
  service?: number;
}): Promise<GuestReview | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db
    .insert(guestReviews)
    .values(data);
  return { ...data, id: 0 } as GuestReview;
}

export async function getReviewsByResidence(residenceId: number): Promise<GuestReview[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(guestReviews)
    .where(eq(guestReviews.residenceId, residenceId))
    .orderBy(desc(guestReviews.createdAt));
}

export async function getAverageRating(residenceId: number): Promise<number> {
  const reviews = await getReviewsByResidence(residenceId);
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}
export async function updateReview(
  reviewId: number,
  updates: Partial<GuestReview>
): Promise<GuestReview | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db
    .update(guestReviews)
    .set(updates)
    .where(eq(guestReviews.id, reviewId));
  return null;
}

// ─── STATISTICS ──────────────────────────────────────────────────────────────

export async function getResidenceStatistics(residenceId: number, monthStart: Date, monthEnd: Date) {
  const reservations = await getReservationsByDateRange(residenceId, monthStart, monthEnd);
  const reviews = await getReviewsByResidence(residenceId);

  const totalReservations = reservations.length;
  const confirmedReservations = reservations.filter((r) => r.reservationStatus === "confirmed").length;
  const totalRevenue = reservations.reduce((sum, r) => sum + parseFloat(r.totalPrice.toString()), 0);
  const averageRating = await getAverageRating(residenceId);
  const occupancyRate =
    reservations.length > 0
      ? (confirmedReservations / totalReservations) * 100
      : 0;

  return {
    totalReservations,
    confirmedReservations,
    totalRevenue,
    averageRating,
    occupancyRate,
    reviewCount: reviews.length,
  };
}
