import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { gasOrders, gasBottles, gasSuppliers } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const supplierDashboardRouter = router({
  // Get supplier dashboard overview
  getOverview: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(async ({ input, ctx }: any) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }

      // Verify supplier access
      const supplier = await database
        .select()
        .from(gasSuppliers)
        .where(eq(gasSuppliers.id, input.supplierId))
        .limit(1);

      if (!supplier.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Supplier not found" });
      }

      // Get order statistics
      const totalOrders = await database
        .select({ count: sql`COUNT(*)` })
        .from(gasOrders)
        .where(eq(gasOrders.supplierId, input.supplierId));

      const pendingOrders = await database
        .select({ count: sql`COUNT(*)` })
        .from(gasOrders)
        .where(
          and(
            eq(gasOrders.supplierId, input.supplierId),
            eq(gasOrders.status, "pending")
          )
        );

      const completedOrders = await database
        .select({ count: sql`COUNT(*)` })
        .from(gasOrders)
        .where(
          and(
            eq(gasOrders.supplierId, input.supplierId),
            eq(gasOrders.status, "delivered")
          )
        );

      // Get total revenue
      const revenue = await database
        .select({ total: sql`SUM(CAST(totalAmountXOF AS DECIMAL(12,2)))` })
        .from(gasOrders)
        .where(
          and(
            eq(gasOrders.supplierId, input.supplierId),
            eq(gasOrders.status, "delivered")
          )
        );

      // Get stock levels
      const stocks = await database
        .select()
        .from(gasBottles)
        .where(eq(gasBottles.supplierId, input.supplierId));

      return {
        supplier: supplier[0],
        stats: {
          totalOrders: Number((totalOrders[0] as any)?.count || 0),
          pendingOrders: Number((pendingOrders[0] as any)?.count || 0),
          completedOrders: Number((completedOrders[0] as any)?.count || 0),
          totalRevenue: parseFloat((revenue[0] as any)?.total || 0),
        },
        stocks,
      };
    }),

  // Get all orders for supplier
  getOrders: protectedProcedure
    .input(
      z.object({
        supplierId: z.number(),
        status: z.enum(["pending", "confirmed", "in_transit", "delivered", "cancelled"]).optional(),
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }: any) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      const offset = (input.page - 1) * input.limit;

      let query: any = database
        .select()
        .from(gasOrders)
        .where(eq(gasOrders.supplierId, input.supplierId));

      if (input.status) {
        query = query.where(eq(gasOrders.status, input.status));
      }

      const orders = await query
        .orderBy(desc(gasOrders.createdAt))
        .limit(input.limit)
        .offset(offset);

      return orders;
    }),

  // Update order status
  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum(["pending", "confirmed", "in_transit", "delivered", "cancelled"]),
        supplierId: z.number(),
      })
    )
    .mutation(async ({ input }: any) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }

      // Verify order belongs to supplier
      const order = await database
        .select()
        .from(gasOrders)
        .where(
          and(
            eq(gasOrders.id, input.orderId),
            eq(gasOrders.supplierId, input.supplierId)
          )
        )
        .limit(1);

      if (!order.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found or access denied",
        });
      }

      const updated = await database
        .update(gasOrders)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(gasOrders.id, input.orderId));

      return { success: true, orderId: input.orderId, newStatus: input.status };
    }),

  // Update stock levels
  updateStock: protectedProcedure
    .input(
      z.object({
        bottleId: z.number(),
        newStock: z.number().min(0),
        supplierId: z.number(),
      })
    )
    .mutation(async ({ input }: any) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }

      // Verify bottle belongs to supplier
      const bottle = await database
        .select()
        .from(gasBottles)
        .where(
          and(
            eq(gasBottles.id, input.bottleId),
            eq(gasBottles.supplierId, input.supplierId)
          )
        )
        .limit(1);

      if (!bottle.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bottle not found or access denied",
        });
      }

      const updated = await database
        .update(gasBottles)
        .set({
          stock: input.newStock,
          updatedAt: new Date(),
        })
        .where(eq(gasBottles.id, input.bottleId));

      return {
        success: true,
        bottleId: input.bottleId,
        newStock: input.newStock,
      };
    }),

  // Get order details with items
  getOrderDetails: protectedProcedure
    .input(z.object({ orderId: z.number(), supplierId: z.number() }))
    .query(async ({ input }: any) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }

      const order = await database
        .select()
        .from(gasOrders)
        .where(
          and(
            eq(gasOrders.id, input.orderId),
            eq(gasOrders.supplierId, input.supplierId)
          )
        )
        .limit(1);

      if (!order.length) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      return order[0];
    }),

  // Get supplier performance metrics
  getPerformanceMetrics: protectedProcedure
    .input(z.object({ supplierId: z.number(), days: z.number().default(30) }))
    .query(async ({ input }: any) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Daily orders count
      const dailyOrders = await database
        .select({
          date: sql`DATE(createdAt)`,
          count: sql`COUNT(*)`,
          revenue: sql`SUM(CAST(totalAmountXOF AS DECIMAL(12,2)))`,
        })
        .from(gasOrders)
        .where(
          and(
            eq(gasOrders.supplierId, input.supplierId),
            sql`createdAt >= ${startDate}`
          )
        )
        .groupBy(sql`DATE(createdAt)`)
        .orderBy(sql`DATE(createdAt)`);

      // Top selling bottles
      const topBottles = await database
        .select({
          type: gasBottles.type,
          capacity: gasBottles.capacity,
          totalSold: sql`COUNT(*)` as any,
        })
        .from(gasBottles)
        .where(eq(gasBottles.supplierId, input.supplierId))
        .groupBy(gasBottles.id)
        .orderBy(sql`COUNT(*) DESC`)
        .limit(5);

      return {
        dailyOrders,
        topBottles,
      };
    }),

  // Get low stock alerts
  getLowStockAlerts: protectedProcedure
    .input(z.object({ supplierId: z.number(), threshold: z.number().default(10) }))
    .query(async ({ input }: any) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
      }

      const lowStockBottles = await database
        .select()
        .from(gasBottles)
        .where(
          and(
            eq(gasBottles.supplierId, input.supplierId),
            sql`stock <= ${input.threshold}`
          )
        );

      return lowStockBottles;
    }),
});
