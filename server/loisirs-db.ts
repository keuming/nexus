import { getDb } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { leisureActivities, leisureBookings, leisureReviews } from "../drizzle/schema";

// Types
export interface LeisureActivity {
  id: number;
  companyId: number;
  name: string;
  description: string | null | undefined;
  category: string;
  location: string;
  pricePerPerson: string;
  maxCapacity: number;
  duration: string | null | undefined;
  image: string | null | undefined;
  rating: string | number | null | undefined;
  reviewCount: number | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeisureBooking {
  id: number;
  activityId: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null | undefined;
  bookingDate: Date;
  numberOfPeople: number;
  totalPrice: string;
  paymentStatus: "pending" | "partial" | "paid" | null | undefined;
  bookingStatus: "pending" | "confirmed" | "cancelled" | "completed" | null | undefined;
  specialRequests: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeisureReview {
  id: number;
  activityId: number;
  guestName: string;
  rating: number;
  comment: string | null | undefined;
  createdAt: Date;
}

// ─── LEISURE ACTIVITIES ───────────────────────────────────────────────────────

export async function createActivity(data: {
  companyId: number;
  name: string;
  description?: string;
  category: string;
  location: string;
  pricePerPerson: string | number;
  maxCapacity: number;
  duration?: string;
  image?: string;
}): Promise<LeisureActivity | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(leisureActivities).values([{
    ...data,
    pricePerPerson: String(data.pricePerPerson),
  }]);
  return null;
}

export async function getActivitiesByCompany(companyId: number): Promise<LeisureActivity[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(leisureActivities)
    .where(eq(leisureActivities.companyId, companyId));
}

export async function getActivityById(activityId: number): Promise<LeisureActivity | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(leisureActivities)
    .where(eq(leisureActivities.id, activityId))
    .limit(1);
  return result[0] as any;
}

export async function updateActivity(
  activityId: number,
  data: Partial<LeisureActivity>
): Promise<LeisureActivity | null> {
  const db = await getDb();
  if (!db) return null;

  // Convertir les prix en strings
  const cleanData: any = { ...data };
  if (cleanData.pricePerPerson !== undefined) cleanData.pricePerPerson = String(cleanData.pricePerPerson);
  if (cleanData.rating !== undefined && cleanData.rating !== null) cleanData.rating = String(cleanData.rating);

  await db
    .update(leisureActivities)
    .set(cleanData)
    .where(eq(leisureActivities.id, activityId));
  return null;
}

export async function deleteActivity(activityId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(leisureActivities).where(eq(leisureActivities.id, activityId));
}

export async function getActivitiesByCategory(
  companyId: number,
  category: string
): Promise<LeisureActivity[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(leisureActivities)
    .where(
      and(
        eq(leisureActivities.companyId, companyId),
        eq(leisureActivities.category, category)
      )
    );
}

export async function getActivitiesByLocation(
  companyId: number,
  location: string
): Promise<LeisureActivity[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(leisureActivities)
    .where(
      and(
        eq(leisureActivities.companyId, companyId),
        eq(leisureActivities.location, location)
      )
    );
}

// ─── LEISURE BOOKINGS ────────────────────────────────────────────────────────

export async function createBooking(data: {
  activityId: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  bookingDate: Date;
  numberOfPeople: number;
  totalPrice: string | number;
  paymentStatus?: "pending" | "partial" | "paid";
  specialRequests?: string;
}): Promise<LeisureBooking | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(leisureBookings).values([{
    ...data,
    totalPrice: String(data.totalPrice),
    paymentStatus: data.paymentStatus || "pending",
    bookingStatus: "pending",
  }]);
  return null;
}

export async function getBookingsByActivity(activityId: number): Promise<LeisureBooking[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(leisureBookings)
    .where(eq(leisureBookings.activityId, activityId))
    .orderBy(desc(leisureBookings.createdAt));
}

export async function getBookingById(bookingId: number): Promise<LeisureBooking | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(leisureBookings)
    .where(eq(leisureBookings.id, bookingId))
    .limit(1);
  return result[0] as any;
}

export async function updateBookingStatus(
  bookingId: number,
  status: "pending" | "confirmed" | "cancelled" | "completed"
): Promise<LeisureBooking | null> {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(leisureBookings)
    .set({ bookingStatus: status })
    .where(eq(leisureBookings.id, bookingId));
  return null;
}

export async function updatePaymentStatus(
  bookingId: number,
  paymentStatus: "pending" | "partial" | "paid",
  paidAmount?: number
): Promise<LeisureBooking | null> {
  const db = await getDb();
  if (!db) return null;

  const updates: any = { paymentStatus };
  if (paidAmount !== undefined) {
    updates.paidAmount = paidAmount;
  }
  await db
    .update(leisureBookings)
    .set(updates)
    .where(eq(leisureBookings.id, bookingId));
  return null;
}

export async function getBookingsByDateRange(
  activityId: number,
  startDate: Date,
  endDate: Date
): Promise<LeisureBooking[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(leisureBookings)
    .where(
      and(
        eq(leisureBookings.activityId, activityId),
        gte(leisureBookings.bookingDate, startDate),
        lte(leisureBookings.bookingDate, endDate)
      )
    )
    .orderBy(desc(leisureBookings.bookingDate));
}

export async function getBookingsByCompany(companyId: number): Promise<LeisureBooking[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select()
    .from(leisureBookings)
    .innerJoin(leisureActivities, eq(leisureBookings.activityId, leisureActivities.id))
    .where(eq(leisureActivities.companyId, companyId));
  
  return results.map(r => r.leisure_bookings);
}

// ─── LEISURE REVIEWS ─────────────────────────────────────────────────────────

export async function createReview(data: {
  activityId: number;
  guestName: string;
  rating: number;
  comment?: string;
}): Promise<LeisureReview | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(leisureReviews).values([data]);
  return null;
}

export async function getReviewsByActivity(activityId: number): Promise<LeisureReview[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(leisureReviews)
    .where(eq(leisureReviews.activityId, activityId))
    .orderBy(desc(leisureReviews.createdAt));
}

export async function getAverageRating(activityId: number): Promise<number> {
  const reviews = await getReviewsByActivity(activityId);
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}

export async function deleteReview(reviewId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(leisureReviews).where(eq(leisureReviews.id, reviewId));
}

// ─── STATISTICS ──────────────────────────────────────────────────────────────

export async function getActivityStatistics(activityId: number) {
  const db = await getDb();
  if (!db) return null;

  const bookings = await getBookingsByActivity(activityId);
  const reviews = await getReviewsByActivity(activityId);
  const activity = await getActivityById(activityId);

  if (!activity) return null;

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.bookingStatus === "confirmed").length;
  const totalPeople = bookings.reduce((acc, b) => acc + b.numberOfPeople, 0);
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === "paid")
    .reduce((acc, b) => acc + parseFloat(b.totalPrice), 0);
  const averageRating = await getAverageRating(activityId);
  const occupancyRate = (totalPeople / (activity.maxCapacity * totalBookings)) * 100 || 0;

  return {
    totalBookings,
    confirmedBookings,
    totalPeople,
    totalRevenue,
    averageRating,
    occupancyRate,
    reviewCount: reviews.length,
  };
}

export async function getCompanyStatistics(companyId: number) {
  const db = await getDb();
  if (!db) return null;

  const activities = await getActivitiesByCompany(companyId);
  const bookings = await getBookingsByCompany(companyId);

  const totalActivities = activities.length;
  const totalBookings = bookings.length;
  const totalRevenue = bookings
    .filter(b => b.paymentStatus === "paid")
    .reduce((acc, b) => acc + parseFloat(b.totalPrice), 0);
  const totalPeople = bookings.reduce((acc, b) => acc + b.numberOfPeople, 0);
  const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  return {
    totalActivities,
    totalBookings,
    totalRevenue,
    totalPeople,
    averageBookingValue,
  };
}
