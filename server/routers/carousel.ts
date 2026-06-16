import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import { createQuoteRequest, getQuoteRequests, updateQuoteRequestStatus } from "../transport-db";

export const carouselRouter = router({
  // Send quote request
  sendQuoteRequest: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
        email: z.string().email("Email invalide"),
        phone: z.string().min(8, "Téléphone invalide"),
        activityType: z.enum(["transport", "restauration", "expedition", "hotel", "boutique", "residence_meuble"]),
        message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Save quote request to database
        await createQuoteRequest({
          name: input.name,
          email: input.email,
          phone: input.phone,
          activityType: input.activityType,
          message: input.message,
        });

        // Send notification to owner
        await notifyOwner({
          title: `Nouvelle demande de devis - ${input.activityType}`,
          content: `De: ${input.name}\nEmail: ${input.email}\nTéléphone: ${input.phone}\n\nMessage:\n${input.message}`,
        });

        return {
          success: true,
          message: "Demande de devis envoyée avec succès",
        };
      } catch (error) {
        console.error("Error sending quote request:", error);
        throw new Error("Erreur lors de l'envoi de la demande");
      }
    }),

  // Get real-time statistics
  getStatistics: publicProcedure.query(async () => {
    try {
      // Return mock statistics for now
      // In production, these would be fetched from the database
      return {
        activeTrips: 12,
        openRestaurants: 8,
        inTransitShipments: 5,
      };
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return {
        activeTrips: 0,
        openRestaurants: 0,
        inTransitShipments: 0,
      };
    }
  }),

  // Get filtered partners
  getFilteredPartners: publicProcedure
    .input(
      z.object({
        activityType: z.enum(["transport", "restauration", "expedition", "hotel", "boutique", "residence_meuble"]),
        minRating: z.number().min(0).max(5).optional(),
        maxPrice: z.number().optional(),
        maxDistance: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        // This is a placeholder implementation
        // In a real scenario, you would query the database for partners
        // filtered by the provided criteria

        return {
          partners: [
            {
              id: "1",
              name: "Partner 1",
              rating: 4.5,
              price: 5000,
              distance: 2.5,
            },
            {
              id: "2",
              name: "Partner 2",
              rating: 4.8,
              price: 6000,
              distance: 3.2,
            },
          ],
        };
      } catch (error) {
        console.error("Error fetching filtered partners:", error);
        return { partners: [] };
      }
    }),

  // Global search for trips, restaurants, shipments
  globalSearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        // Placeholder implementation
        // In production, this would search across trips, restaurants, and shipments
        return {
          results: [],
        };
      } catch (error) {
        console.error("Error in global search:", error);
        return { results: [] };
      }
    }),

  // List quote requests (admin only)
  listQuoteRequests: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        activityType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Accès réservé à l'administrateur");
      }
      try {
        return await getQuoteRequests(input);
      } catch (error) {
        console.error("Error fetching quote requests:", error);
        return [];
      }
    }),

  // Update quote request status (admin only)
  updateQuoteRequestStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "closed"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Accès réservé à l'administrateur");
      }
      try {
        return await updateQuoteRequestStatus(input.id, input.status, input.notes);
      } catch (error) {
        console.error("Error updating quote request:", error);
        throw error;
      }
    }),
});
