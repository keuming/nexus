import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import {
  createShopProduct,
  getShopProductById,
  getShopProductsBySupplierId,
  getShopProductsByCategory,
  searchShopProducts,
  updateShopProduct,
  deleteShopProduct,
  getShopProductsLowStock,
  createShopProductOrder,
  getShopProductOrderById,
  getShopProductOrderByReference,
  getShopProductOrdersBySupplierId,
  getShopProductOrdersByStatus,
  updateShopProductOrder,
  createShopProductOrderItem,
  getShopProductOrderItemsByOrderId,
  deleteShopProductOrderItem,
  createStockMovement,
  getStockMovementsByProductId,
  getStockMovementsBySupplierId,
  decreaseProductStock,
  increaseProductStock,
  generateOrderReference,
} from "../shop-db";
import { TRPCError } from "@trpc/server";

// --- SHOP PRODUCTS CRUD -------------------------------------------------------

export const shopRouter = router({
  // Create product
  createProduct: protectedProcedure
    .input(
      z.object({
        supplierId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().min(0),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        imageUrl: z.string().optional(),
        minStockAlert: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const result = await createShopProduct({
          ...input,
          isActive: true,
        });
        return { success: true, productId: (result as any).insertId || 0 };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create product",
        });
      }
    }),

  // Get product by ID
  getProduct: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }: any) => {
      const product = await getShopProductById(input.id);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      return product;
    }),

  // Get products by supplier
  getProductsBySupplier: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(async ({ input }: any) => {
      return await getShopProductsBySupplierId(input.supplierId);
    }),

  // Get products by category
  getProductsByCategory: protectedProcedure
    .input(z.object({ supplierId: z.number(), category: z.string() }))
    .query(async ({ input }: any) => {
      return await getShopProductsByCategory(input.supplierId, input.category);
    }),

  // Search products
  searchProducts: protectedProcedure
    .input(z.object({ supplierId: z.number(), searchTerm: z.string() }))
    .query(async ({ input }: any) => {
      return await searchShopProducts(input.supplierId, input.searchTerm);
    }),

  // Update product
  updateProduct: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        price: z.number().positive().optional(),
        stock: z.number().min(0).optional(),
        sku: z.string().optional(),
        barcode: z.string().optional(),
        imageUrl: z.string().optional(),
        isActive: z.boolean().optional(),
        minStockAlert: z.number().min(0).optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      const { id, ...data } = input;
      await updateShopProduct(id, data);
      return { success: true };
    }),

  // Delete product (soft delete)
  deleteProduct: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: any) => {
      await deleteShopProduct(input.id);
      return { success: true };
    }),

  // Get low stock products
  getLowStockProducts: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(async ({ input }: any) => {
      return await getShopProductsLowStock(input.supplierId);
    }),

  // --- SHOP PRODUCT ORDERS CRUD -----------------------------------------------

  // Create order
  createOrder: protectedProcedure
    .input(
      z.object({
        supplierId: z.number(),
        clientName: z.string().min(1),
        clientPhone: z.string().min(1),
        clientEmail: z.string().email().optional(),
        deliveryAddress: z.string().min(1),
        city: z.string().min(1),
        totalAmountXOF: z.number().positive(),
        paymentMethod: z.enum(["cash", "mobile_money", "card", "bank_transfer"]).optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number().positive(),
            unitPrice: z.number().positive(),
          })
        ),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        const reference = await generateOrderReference();
        
        const orderResult = await createShopProductOrder({
          reference,
          supplierId: input.supplierId,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          clientEmail: input.clientEmail,
          deliveryAddress: input.deliveryAddress,
          city: input.city,
          totalAmountXOF: input.totalAmountXOF,
          paymentMethod: input.paymentMethod || "cash",
          notes: input.notes,
          status: "pending",
        });

        const orderId = (orderResult as any).insertId || 0;

        // Create order items and decrease stock
        for (const item of input.items) {
          const subtotal = (item.quantity * item.unitPrice).toString();
          await createShopProductOrderItem({
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            subtotal,
          });

          // Decrease product stock
          await decreaseProductStock(item.productId, item.quantity);
        }

        return { success: true, reference, orderId };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order",
        });
      }
    }),

  // Get order by ID
  getOrder: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }: any) => {
      const order = await getShopProductOrderById(input.id);
      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }
      return order;
    }),

  // Get order by reference
  getOrderByReference: protectedProcedure
    .input(z.object({ reference: z.string() }))
    .query(async ({ input }: any) => {
      const order = await getShopProductOrderByReference(input.reference);
      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }
      return order;
    }),

  // Get orders by supplier
  getOrdersBySupplier: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(async ({ input }: any) => {
      return await getShopProductOrdersBySupplierId(input.supplierId);
    }),

  // Get orders by status
  getOrdersByStatus: protectedProcedure
    .input(z.object({ supplierId: z.number(), status: z.string() }))
    .query(async ({ input }: any) => {
      return await getShopProductOrdersByStatus(input.supplierId, input.status);
    }),

  // Update order status
  updateOrderStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "in_delivery", "delivered", "cancelled"]),
      })
    )
    .mutation(async ({ input }: any) => {
      await updateShopProductOrder(input.id, { status: input.status });
      return { success: true };
    }),

  // --- STOCK MOVEMENTS -------------------------------------------------------

  // Get stock movements by product
  getStockMovementsByProduct: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }: any) => {
      return await getStockMovementsByProductId(input.productId);
    }),

  // Get stock movements by supplier
  getStockMovementsBySupplier: protectedProcedure
    .input(z.object({ supplierId: z.number() }))
    .query(async ({ input }: any) => {
      return await getStockMovementsBySupplierId(input.supplierId);
    }),

  // Adjust stock
  adjustStock: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input }: any) => {
      try {
        if (input.quantity > 0) {
          await increaseProductStock(input.productId, input.quantity, input.reason);
        } else if (input.quantity < 0) {
          await decreaseProductStock(input.productId, Math.abs(input.quantity));
        }
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to adjust stock",
        });
      }
    }),
});
