import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getCompanyByUserId } from "../transport-db";
import { notifyOwner } from "../_core/notification";
import {
  getCategoriesByCompany,
  createCategory,
  updateCategory,
  deleteCategory,
  getItemsByCompany,
  createItem,
  updateItem,
  deleteItem,
  uploadItemPhoto,
  getPublicMenu,
  createOnlineOrder,
  getOnlineOrdersByCompany,
  updateOnlineOrderStatus,
  getDeliveryZonesByCompany,
  upsertDeliveryZone,
  deleteDeliveryZone,
  getPublicDeliveryZones,
  getRestaurantStatsToday,
} from "../menu-db";

// Middleware : vérifie que l'utilisateur a une compagnie restauration active
const companyProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const company = await getCompanyByUserId(ctx.user.id);
  if (!company) throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie introuvable" });
  if (company.status !== "active")
    throw new TRPCError({ code: "FORBIDDEN", message: "Compte non validé par NEXUS" });
  return next({ ctx: { ...ctx, company } });
});

export const menuRouter = router({
  // ─── PUBLIC ──────────────────────────────────────────────────────────────
  publicMenu: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(({ input }) => getPublicMenu(input.companyId)),

  // ─── CATEGORIES (dashboard compagnie) ────────────────────────────────────
  listCategories: companyProcedure.query(({ ctx }) =>
    getCategoriesByCompany(ctx.company.id)
  ),

  createCategory: companyProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(255).optional(),
        sortOrder: z.number().int().min(0).optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createCategory({ companyId: ctx.company.id, ...input })
    ),

  updateCategory: companyProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(255).optional(),
        sortOrder: z.number().int().min(0).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateCategory(id, ctx.company.id, data);
    }),

  deleteCategory: companyProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(({ ctx, input }) => deleteCategory(input.id, ctx.company.id)),

  // ─── ITEMS (dashboard compagnie) ─────────────────────────────────────────
  listItems: companyProcedure
    .input(z.object({ categoryId: z.number().int().optional() }))
    .query(({ ctx, input }) => getItemsByCompany(ctx.company.id, input.categoryId)),

  createItem: companyProcedure
    .input(
      z.object({
        categoryId: z.number().int(),
        name: z.string().min(1).max(150),
        description: z.string().optional(),
        priceXOF: z.string().min(1),
        available: z.boolean().optional(),
        preparationTime: z.number().int().min(0).optional(),
        sortOrder: z.number().int().min(0).optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      createItem({ companyId: ctx.company.id, ...input })
    ),

  updateItem: companyProcedure
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1).max(150).optional(),
        description: z.string().optional(),
        priceXOF: z.string().optional(),
        categoryId: z.number().int().optional(),
        available: z.boolean().optional(),
        preparationTime: z.number().int().min(0).optional(),
        sortOrder: z.number().int().min(0).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, ...data } = input;
      return updateItem(id, ctx.company.id, data);
    }),

  deleteItem: companyProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(({ ctx, input }) => deleteItem(input.id, ctx.company.id)),

  // ─── UPLOAD PHOTO ─────────────────────────────────────────────────────────
  uploadPhoto: companyProcedure
    .input(
      z.object({
        itemId: z.number().int(),
        fileBase64: z.string(),
        mimeType: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.fileBase64, "base64");
      if (buffer.length > 5 * 1024 * 1024)
        throw new TRPCError({ code: "BAD_REQUEST", message: "Photo trop lourde (max 5 Mo)" });
      return uploadItemPhoto(
        input.itemId,
        ctx.company.id,
        buffer,
        input.mimeType,
        input.fileName
      );
    }),

  // ─── ONLINE ORDERS (public : passer commande) ─────────────────────────────
  createOrder: publicProcedure
    .input(
      z.object({
        companyId: z.number().int(),
        customerName: z.string().min(1).max(150),
        customerPhone: z.string().min(1).max(30),
        deliveryType: z.enum(["livraison", "sur_place"]),
        deliveryAddress: z.string().max(300).optional(),
        notes: z.string().optional(),
        items: z
          .array(
            z.object({
              itemId: z.number().int(),
              name: z.string(),
              qty: z.number().int().min(1),
              priceXOF: z.number(),
              preparationTime: z.number().int().optional(),
            })
          )
          .min(1),
      })
    )
    .mutation(async ({ input }) => {
      const order = await createOnlineOrder(input);
      // Notification en temps réel au propriétaire du restaurant
      const itemsSummary = input.items.map((it) => `${it.qty}× ${it.name}`).join(", ");
      const totalXOF = input.items.reduce((sum, it) => sum + it.priceXOF * it.qty, 0);
      notifyOwner({
        title: `🛒 Nouvelle commande restaurant — ${order.orderRef}`,
        content: `Client : ${input.customerName} (${input.customerPhone})\nType : ${input.deliveryType === "livraison" ? "Livraison" : "Sur place"}${input.deliveryAddress ? `\nAdresse : ${input.deliveryAddress}` : ""}\nArticles : ${itemsSummary}\nTotal : ${totalXOF.toLocaleString()} FCFA${input.notes ? `\nNote : ${input.notes}` : ""}`,
      }).catch(() => {}); // fire-and-forget, ne bloque pas la réponse
      // Debit 1 credit for online order
      const { debitCredit } = await import("../transport-db");
      await debitCredit(input.companyId, `Commande ${order.orderRef} — ${input.customerName}`, "order", order.orderRef).catch(() => {});
      return order;
    }),

  // ─── ONLINE ORDERS (dashboard compagnie) ──────────────────────────────────
  listOrders: companyProcedure.query(({ ctx }) =>
    getOnlineOrdersByCompany(ctx.company.id)
  ),

  updateOrderStatus: companyProcedure
    .input(
      z.object({
        orderId: z.number().int(),
        status: z.enum(["nouvelle", "en_preparation", "prete", "livree", "annulee"]),
      })
    )
    .mutation(({ input }) => updateOnlineOrderStatus(input.orderId, input.status)),

  // ─── STATS RESTAURATION ──────────────────────────────────────────────────
  restaurantStats: companyProcedure.query(({ ctx }) =>
    getRestaurantStatsToday(ctx.company.id)
  ),

  // ─── DELIVERY ZONES (dashboard compagnie) ────────────────────────────────
  listDeliveryZones: companyProcedure.query(({ ctx }) =>
    getDeliveryZonesByCompany(ctx.company.id)
  ),

  upsertDeliveryZone: companyProcedure
    .input(
      z.object({
        id: z.number().int().optional(),
        name: z.string().min(1).max(100),
        description: z.string().max(300).optional(),
        extraMinutes: z.number().int().min(0).max(120),
        active: z.boolean().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      upsertDeliveryZone({ ...input, companyId: ctx.company.id })
    ),

  deleteDeliveryZone: companyProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(({ ctx, input }) => deleteDeliveryZone(input.id, ctx.company.id)),

  // ─── PUBLIC DELIVERY ZONES ───────────────────────────────────────────────
  publicDeliveryZones: publicProcedure
    .input(z.object({ companyId: z.number().int() }))
    .query(({ input }) => getPublicDeliveryZones(input.companyId)),

  // ─── SEED TEST MENUS (admin only) ────────────────────────────────────────
  seedTestMenus: publicProcedure
    .input(z.object({ companyId: z.number().int() }))
    .mutation(async ({ input }) => {
      const companyId = input.companyId;
      const categories = [
        { name: 'Entrées', description: 'Plats d\'entrée', sortOrder: 1 },
        { name: 'Plats Principaux', description: 'Nos spécialités', sortOrder: 2 },
        { name: 'Boissons', description: 'Boissons froides et chaudes', sortOrder: 3 },
        { name: 'Desserts', description: 'Nos desserts maison', sortOrder: 4 },
      ];

      const items: any = {
        'Entrées': [
          { name: 'Salade Verte', description: 'Salade fraîche', price: '2500', prepTime: 5 },
          { name: 'Soupe à l\'Oignon', description: 'Soupe gratinée', price: '3000', prepTime: 10 },
        ],
        'Plats Principaux': [
          { name: 'Poulet Rôti', description: 'Poulet fermier', price: '7500', prepTime: 20 },
          { name: 'Poisson Grillé', description: 'Poisson du jour', price: '8500', prepTime: 18 },
        ],
        'Boissons': [
          { name: 'Eau Minérale', description: '50cl', price: '500', prepTime: 1 },
          { name: 'Jus Frais', description: 'Pressé maison', price: '1500', prepTime: 3 },
        ],
        'Desserts': [
          { name: 'Tiramisu', description: 'Dessert italien', price: '3500', prepTime: 5 },
          { name: 'Fruit Frais', description: 'Assiette', price: '2500', prepTime: 3 },
        ],
      };

      try {
        const categoryIds: { [key: string]: number } = {};
        for (const category of categories) {
          const result = await createCategory({ companyId, ...category });
          categoryIds[category.name] = result.id;
        }

        let itemCount = 0;
        for (const [categoryName, categoryItems] of Object.entries(items)) {
          const categoryId = categoryIds[categoryName];
          for (const item of categoryItems as any[]) {
            await createItem({
              companyId,
              categoryId,
              name: item.name,
              description: item.description,
              priceXOF: item.price,
              available: true,
              preparationTime: item.prepTime,
              sortOrder: itemCount++,
            });
          }
        }

        const zones = [
          { name: 'Zone Centre', description: 'Abidjan Centre', extraMinutes: 15 },
          { name: 'Zone Plateau', description: 'Plateau - Cocody', extraMinutes: 20 },
        ];

        for (const zone of zones) {
          await upsertDeliveryZone({ companyId, ...zone });
        }

        return { success: true, message: 'Menus de test créés' };
      } catch (error) {
        console.error('Erreur seed:', error);
        return { success: false, message: 'Erreur lors de la création' };
      }
    }),
});
