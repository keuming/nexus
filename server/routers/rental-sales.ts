import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createRentalProduct,
  getProductsByCompany,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  updateInventory,
  getInventory,
  decreaseInventory,
  increaseInventory,
  createOrder,
  getOrdersByCompany,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  getOrdersByDateRange,
  addOrderItem,
  getOrderItems,
  deleteOrderItem,
  getOrderStatistics,
  getProductStatistics,
} from "../rental-sales-db";
import { getCompanyByUserId } from "../transport-db";

export const rentalSalesRouter = router({
  // ─── RENTAL PRODUCTS ─────────────────────────────────────────────────────

  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().min(1),
        pricePerDay: z.union([z.string(), z.number()]),
        pricePerWeek: z.union([z.string(), z.number()]).optional(),
        pricePerMonth: z.union([z.string(), z.number()]).optional(),
        depositAmount: z.union([z.string(), z.number()]).optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      return createRentalProduct({
        companyId: company.id,
        ...input,
      });
    }),

  getProducts: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
    }

    return getProductsByCompany(company.id);
  }),

  getProductById: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return getProductById(input.productId);
    }),

  updateProduct: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        pricePerDay: z.union([z.string(), z.number()]).optional(),
        pricePerWeek: z.union([z.string(), z.number()]).optional(),
        pricePerMonth: z.union([z.string(), z.number()]).optional(),
        depositAmount: z.union([z.string(), z.number()]).optional(),
        image: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const product = await getProductById(input.productId);
      if (!product || product.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      const { productId, ...updateData } = input;
      // Convertir les prix en strings pour la base de données
      const cleanData: any = { ...updateData };
      if (cleanData.pricePerDay !== undefined) cleanData.pricePerDay = String(cleanData.pricePerDay);
      if (cleanData.pricePerWeek !== undefined) cleanData.pricePerWeek = String(cleanData.pricePerWeek);
      if (cleanData.pricePerMonth !== undefined) cleanData.pricePerMonth = String(cleanData.pricePerMonth);
      if (cleanData.depositAmount !== undefined) cleanData.depositAmount = String(cleanData.depositAmount);
      return updateProduct(productId, cleanData);
    }),

  deleteProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const product = await getProductById(input.productId);
      if (!product || product.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      await deleteProduct(input.productId);
      return { success: true };
    }),

  searchProducts: protectedProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      return searchProducts(company.id, input.searchTerm);
    }),

  getProductsByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      return getProductsByCategory(company.id, input.category);
    }),

  // ─── INVENTORY ───────────────────────────────────────────────────────────

  updateInventory: protectedProcedure
    .input(z.object({ productId: z.number(), quantity: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const product = await getProductById(input.productId);
      if (!product || product.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      return updateInventory(input.productId, input.quantity);
    }),

  getInventory: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return getInventory(input.productId);
    }),

  decreaseInventory: protectedProcedure
    .input(z.object({ productId: z.number(), quantity: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const product = await getProductById(input.productId);
      if (!product || product.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      const success = await decreaseInventory(input.productId, input.quantity);
      if (!success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Stock insuffisant" });
      }
      return { success: true };
    }),

  increaseInventory: protectedProcedure
    .input(z.object({ productId: z.number(), quantity: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const product = await getProductById(input.productId);
      if (!product || product.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      await increaseInventory(input.productId, input.quantity);
      return { success: true };
    }),

  // ─── SALES ORDERS ────────────────────────────────────────────────────────

  createOrder: protectedProcedure
    .input(
      z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        totalAmount: z.union([z.string(), z.number()]),
        paymentStatus: z.enum(["pending", "partial", "paid"]).optional(),
        deliveryDate: z.date().optional(),
        deliveryAddress: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      return createOrder({
        companyId: company.id,
        ...input,
      });
    }),

  getOrders: protectedProcedure.query(async ({ ctx }) => {
    const company = await getCompanyByUserId(ctx.user.id);
    if (!company) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
    }

    return getOrdersByCompany(company.id);
  }),

  getOrderById: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const order = await getOrderById(input.orderId);
      if (!order || order.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      return order;
    }),

  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const order = await getOrderById(input.orderId);
      if (!order || order.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      return updateOrderStatus(input.orderId, input.status);
    }),

  updatePaymentStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        paymentStatus: z.enum(["pending", "partial", "paid"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const order = await getOrderById(input.orderId);
      if (!order || order.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      return updatePaymentStatus(input.orderId, input.paymentStatus);
    }),

  getOrdersByDateRange: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      return getOrdersByDateRange(company.id, input.startDate, input.endDate);
    }),

  // ─── ORDER ITEMS ─────────────────────────────────────────────────────────

  addOrderItem: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        productId: z.number(),
        quantity: z.number().min(1),
        unitPrice: z.union([z.string(), z.number()]),
        totalPrice: z.union([z.string(), z.number()]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const order = await getOrderById(input.orderId);
      if (!order || order.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      return addOrderItem(input);
    }),

  getOrderItems: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const order = await getOrderById(input.orderId);
      if (!order || order.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      return getOrderItems(input.orderId);
    }),

  deleteOrderItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteOrderItem(input.itemId);
      return { success: true };
    }),

  // ─── STATISTICS ──────────────────────────────────────────────────────────

  getOrderStatistics: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      return getOrderStatistics(company.id, input.startDate, input.endDate);
    }),

  getProductStatistics: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Compagnie non trouvée" });
      }

      const product = await getProductById(input.productId);
      if (!product || product.companyId !== company.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Accès refusé" });
      }

      return getProductStatistics(input.productId);
    }),
});
