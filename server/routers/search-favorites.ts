import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const searchFavoritesRouter = router({
  // Global search across all services
  globalSearch: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        type: z.enum(["all", "transport", "restaurant", "expedition"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const { query, type = "all" } = input;
      const results: any[] = [];

      // Mock search results
      if (type === "all" || type === "transport") {
        results.push(
          {
            id: "t1",
            type: "transport",
            name: "Trans-Côte d'Ivoire",
            description: "Abidjan → Yamoussoukro",
            price: 5000,
          },
          {
            id: "t2",
            type: "transport",
            name: "Garantie Express",
            description: "Abidjan → Bouaké",
            price: 8000,
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
            cuisine: "Ivoirienne",
          },
          {
            id: "r2",
            type: "restaurant",
            name: "Saveurs d'Afrique",
            description: "Yamoussoukro",
            cuisine: "Africaine",
          }
        );
      }

      if (type === "all" || type === "expedition") {
        results.push({
          id: "e1",
          type: "expedition",
          name: "Abidjan → Yamoussoukro",
          description: "Expédition standard",
          status: "En transit",
        });
      }

      return results.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.description.toLowerCase().includes(query.toLowerCase())
      );
    }),

  // Add to favorites
  addFavorite: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        itemType: z.enum(["transport", "restaurant", "expedition"]),
        itemName: z.string(),
        itemDescription: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      return {
        success: true,
        message: "Added to favorites",
        favorite: {
          itemId: input.itemId,
          itemType: input.itemType,
          itemName: input.itemName,
          addedAt: new Date(),
        },
      };
    }),

  // Remove from favorites
  removeFavorite: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        itemType: z.enum(["transport", "restaurant", "expedition"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      return {
        success: true,
        message: "Removed from favorites",
      };
    }),

  // Get user's favorites
  getFavorites: protectedProcedure
    .input(
      z.object({
        type: z.enum(["all", "transport", "restaurant", "expedition"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      const mockFavorites = [
        {
          id: "1",
          type: "transport",
          name: "Trans-Côte d'Ivoire",
          description: "Abidjan → Yamoussoukro",
          price: 5000,
        },
        {
          id: "2",
          type: "restaurant",
          name: "Le Plateau Gourmand",
          description: "Abidjan",
          cuisine: "Ivoirienne",
        },
      ];

      if (input?.type && input.type !== "all") {
        return mockFavorites.filter((f) => f.type === input.type);
      }

      return mockFavorites;
    }),

  // Check if item is favorited
  isFavorited: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        itemType: z.enum(["transport", "restaurant", "expedition"]),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("Not authenticated");

      return false;
    }),
});
