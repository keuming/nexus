import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createActivity,
  getActivitiesByCompany,
  getActivityById,
  updateActivity,
  deleteActivity,
  getActivitiesByCategory,
  getActivitiesByLocation,
  createBooking,
  getBookingsByActivity,
  getBookingById,
  updateBookingStatus,
  updatePaymentStatus,
  getBookingsByDateRange,
  getBookingsByCompany,
  createReview,
  getReviewsByActivity,
  getAverageRating,
  deleteReview,
  getActivityStatistics,
  getCompanyStatistics,
} from "../loisirs-db";
import { getCompanyByUserId } from "../transport-db";

export const leisureRouter = router({
  // ─── ACTIVITIES ──────────────────────────────────────────────────────────

  createActivity: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().min(1),
        location: z.string().min(1),
        pricePerPerson: z.union([z.string(), z.number()]),
        maxCapacity: z.number().min(1),
        duration: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      return createActivity({
        companyId: company.id,
        ...input,
      });
    }),

  getActivities: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
    }

    return getActivitiesByCompany(company.id);
  }),

  getActivityById: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ input }) => {
      return getActivityById(input.activityId);
    }),

  updateActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        location: z.string().optional(),
        pricePerPerson: z.union([z.string(), z.number()]).optional(),
        maxCapacity: z.number().optional(),
        duration: z.string().optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const activity = await getActivityById(input.activityId);
      if (!activity || activity.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      const { activityId, ...updateData } = input;
      // Convertir les prix en strings pour la base de données
      const cleanData: any = { ...updateData };
      if (cleanData.pricePerPerson !== undefined) cleanData.pricePerPerson = String(cleanData.pricePerPerson);
      return updateActivity(activityId, cleanData);
    }),

  deleteActivity: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const activity = await getActivityById(input.activityId);
      if (!activity || activity.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      await deleteActivity(input.activityId);
      return { success: true };
    }),

  getActivitiesByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      return getActivitiesByCategory(company.id, input.category);
    }),

  getActivitiesByLocation: protectedProcedure
    .input(z.object({ location: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      return getActivitiesByLocation(company.id, input.location);
    }),

  // ─── BOOKINGS ────────────────────────────────────────────────────────────

  createBooking: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
        guestName: z.string().min(1),
        guestEmail: z.string().email(),
        guestPhone: z.string().optional(),
        bookingDate: z.date(),
        numberOfPeople: z.number().min(1),
        totalPrice: z.union([z.string(), z.number()]),
        paymentStatus: z.enum(["pending", "partial", "paid"]).optional(),
        specialRequests: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createBooking(input);
    }),

  getBookingsByActivity: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const activity = await getActivityById(input.activityId);
      if (!activity || activity.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      return getBookingsByActivity(input.activityId);
    }),

  getBookingById: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ input }) => {
      return getBookingById(input.bookingId);
    }),

  updateBookingStatus: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      })
    )
    .mutation(async ({ input }) => {
      return updateBookingStatus(input.bookingId, input.status);
    }),

  updatePaymentStatus: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        paymentStatus: z.enum(["pending", "partial", "paid"]),
        paidAmount: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return updatePaymentStatus(input.bookingId, input.paymentStatus, input.paidAmount);
    }),

  getBookingsByDateRange: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const activity = await getActivityById(input.activityId);
      if (!activity || activity.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      return getBookingsByDateRange(input.activityId, input.startDate, input.endDate);
    }),

  getCompanyBookings: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
    }

    return getBookingsByCompany(company.id);
  }),

  // ─── REVIEWS ─────────────────────────────────────────────────────────────

  createReview: protectedProcedure
    .input(
      z.object({
        activityId: z.number(),
        guestName: z.string().min(1),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return createReview(input);
    }),

  getReviewsByActivity: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ input }) => {
      return getReviewsByActivity(input.activityId);
    }),

  getAverageRating: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ input }) => {
      return getAverageRating(input.activityId);
    }),

  deleteReview: protectedProcedure
    .input(z.object({ reviewId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteReview(input.reviewId);
      return { success: true };
    }),

  // ─── STATISTICS ──────────────────────────────────────────────────────────

  getActivityStatistics: protectedProcedure
    .input(z.object({ activityId: z.number() }))
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const activity = await getActivityById(input.activityId);
      if (!activity || activity.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      return getActivityStatistics(input.activityId);
    }),

  getCompanyStatistics: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
    }

    return getCompanyStatistics(company.id);
  }),
});
