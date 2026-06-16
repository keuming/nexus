import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  createGasSupplier,
  getGasSupplierById,
  getGasSuppliersByCompanyId,
  updateGasSupplier,
  createGasBottle,
  getGasBottleById,
  getGasBottlesBySupplierId,
  getAvailableGasBottles,
  updateGasBottle,
  decreaseGasBottleStock,
  createGasOrder,
  getGasOrderById,
  getGasOrderByReference,
  getGasOrdersBySupplierId,
  getGasOrdersByStatus,
  updateGasOrder,
  generateOrderReference,
  createGasOrderItem,
  getGasOrderItemsByOrderId,
  deleteGasOrderItem,
  createGasDelivery,
  getGasDeliveryByOrderId,
  updateGasDelivery,
  getGasDeliveriesByStatus,
  getGasSupplierStats,
} from "../gas-db";
import {
  createDeliveryman,
  getDeliverymanById,
  getDeliverymanByUserId,
  listActiveDeliverymen,
  listDeliverymenByLocation,
  updateDeliveryman,
  createNotification,
  notifySuppliersByBottleType,
  notifyAllDeliverymen,
  getUnreadNotificationsForSupplier,
  getUnreadNotificationsForDeliveryman,
  markNotificationAsRead,
  getOrdersAssignedToDeliveryman,
  getPendingOrdersForSupplier,
  assignOrderToDeliveryman,
  validateOrderByDeliveryman,
  confirmDelivery,
} from "../gas-deliverymen-db";

export const gasRouter = router({
  // --- GAS SUPPLIERS ---
  suppliers: router({
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getGasSupplierById(input)),

    getByCompanyId: protectedProcedure
      .input(z.number())
      .query(({ input }) => getGasSuppliersByCompanyId(input)),

    create: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        businessName: z.string(),
        phone: z.string(),
        email: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        logoUrl: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(({ input }) => createGasSupplier(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        businessName: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        logoUrl: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateGasSupplier(id, data);
      }),
  }),

  // --- GAS BOTTLES ---
  bottles: router({
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getGasBottleById(input)),

    getBySupplierId: publicProcedure
      .input(z.number())
      .query(({ input }) => getGasBottlesBySupplierId(input)),

    getAvailable: publicProcedure
      .input(z.number())
      .query(({ input }) => getAvailableGasBottles(input)),

    create: protectedProcedure
      .input(z.object({
        supplierId: z.number(),
        type: z.string(), // B6, B12, etc.
        capacity: z.string(), // 6kg, 12kg, etc.
        priceXOF: z.number(),
        deliveryFeeXOF: z.number(),
        stock: z.number().optional(),
        minStock: z.number().optional(),
        description: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(({ input }) => createGasBottle(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.string().optional(),
        capacity: z.string().optional(),
        priceXOF: z.number().optional(),
        deliveryFeeXOF: z.number().optional(),
        stock: z.number().optional(),
        minStock: z.number().optional(),
        description: z.string().optional(),
        photoUrl: z.string().optional(),
        isAvailable: z.boolean().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.priceXOF !== undefined) updateData.priceXOF = data.priceXOF.toString();
        if (data.deliveryFeeXOF !== undefined) updateData.deliveryFeeXOF = data.deliveryFeeXOF.toString();
        return updateGasBottle(id, updateData);
      }),

    decreaseStock: protectedProcedure
      .input(z.object({
        bottleId: z.number(),
        quantity: z.number(),
      }))
      .mutation(({ input }) => decreaseGasBottleStock(input.bottleId, input.quantity)),
  }),

  // --- GAS ORDERS ---
  orders: router({
    getById: publicProcedure
      .input(z.number())
      .query(({ input }) => getGasOrderById(input)),

    getByReference: publicProcedure
      .input(z.string())
      .query(({ input }) => getGasOrderByReference(input)),

    getBySupplierId: protectedProcedure
      .input(z.number())
      .query(({ input }) => getGasOrdersBySupplierId(input)),

    getByStatus: protectedProcedure
      .input(z.object({
        supplierId: z.number(),
        status: z.enum(["pending", "confirmed", "in_delivery", "delivered", "cancelled"]),
      }))
      .query(({ input }) => getGasOrdersByStatus(input.supplierId, input.status)),

    create: publicProcedure
      .input(z.object({
        clientName: z.string(),
        clientPhone: z.string(),
        clientEmail: z.string().optional(),
        deliveryAddress: z.string(),
        city: z.string(),
        supplierId: z.number(),
        items: z.array(z.object({
          bottleId: z.number(),
          quantity: z.number(),
          unitPriceXOF: z.number(),
          deliveryFeeXOF: z.number(),
        })),
        paymentMethod: z.enum(["cash", "mobile_money", "card", "bank_transfer"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const reference = await generateOrderReference();
        const totalAmountXOF = input.items.reduce((sum, item) => {
          return sum + (item.unitPriceXOF * item.quantity + item.deliveryFeeXOF);
        }, 0);

        const orderResult = await createGasOrder({
          reference,
          clientName: input.clientName,
          clientPhone: input.clientPhone,
          clientEmail: input.clientEmail,
          deliveryAddress: input.deliveryAddress,
          city: input.city,
          supplierId: input.supplierId,
          totalAmountXOF,
          paymentMethod: input.paymentMethod,
          notes: input.notes,
        });

        // Create order items
        for (const item of input.items) {
          const subtotal = item.unitPriceXOF * item.quantity + item.deliveryFeeXOF;
          await createGasOrderItem({
            orderId: (orderResult as any).insertId || 0,
            bottleId: item.bottleId,
            quantity: item.quantity,
            unitPriceXOF: item.unitPriceXOF,
            deliveryFeeXOF: item.deliveryFeeXOF,
            subtotalXOF: subtotal,
          });

          // Decrease bottle stock
          await decreaseGasBottleStock(item.bottleId, item.quantity);
        }

        // Create delivery
        await createGasDelivery({
          orderId: (orderResult as any).insertId || 0,
        });

        // Notify all suppliers with this bottle type
        const orderId = (orderResult as any).insertId || 0;
        const bottleType = input.items[0]?.bottleId; // Get first bottle type
        if (bottleType) {
          await notifySuppliersByBottleType(orderId, "B6"); // TODO: Get actual bottle type
        }

        // Notify all active deliverymen
        await notifyAllDeliverymen(orderId);

        return { reference, totalAmountXOF };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        orderStatus: z.enum(["pending", "confirmed", "in_delivery", "delivered", "cancelled"]).optional(),
        paymentStatus: z.enum(["pending", "partial", "paid"]).optional(),
        deliveryDate: z.date().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateGasOrder(id, data);
      }),
  }),

  // --- GAS ORDER ITEMS ---
  orderItems: router({
    getByOrderId: publicProcedure
      .input(z.number())
      .query(({ input }) => getGasOrderItemsByOrderId(input)),

    delete: protectedProcedure
      .input(z.number())
      .mutation(({ input }) => deleteGasOrderItem(input)),
  }),

  // --- GAS DELIVERIES ---
  deliveries: router({
    getByOrderId: publicProcedure
      .input(z.number())
      .query(({ input }) => getGasDeliveryByOrderId(input)),

    getByStatus: protectedProcedure
      .input(z.enum(["pending", "in_transit", "arrived", "completed", "failed"]))
      .query(({ input }) => getGasDeliveriesByStatus(input)),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "in_transit", "arrived", "completed", "failed"]).optional(),
        driverName: z.string().optional(),
        driverPhone: z.string().optional(),
        vehicleInfo: z.string().optional(),
        gpsLatitude: z.string().optional(),
        gpsLongitude: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return updateGasDelivery(id, data);
      }),
  }),

  // --- STATISTICS ---
  stats: router({
    getSupplierStats: protectedProcedure
      .input(z.number())
      .query(({ input }) => getGasSupplierStats(input)),
  }),

  // --- DELIVERYMEN ---
  deliverymen: router({
    getById: protectedProcedure
      .input(z.number())
      .query(({ input }) => getDeliverymanById(input)),

    getByUserId: protectedProcedure
      .input(z.number())
      .query(({ input }) => getDeliverymanByUserId(input)),

    listActive: publicProcedure
      .query(() => listActiveDeliverymen()),

    listByLocation: publicProcedure
      .input(z.object({
        latitude: z.number(),
        longitude: z.number(),
        radiusKm: z.number().optional(),
      }))
      .query(({ input }) => listDeliverymenByLocation(input.latitude, input.longitude, input.radiusKm)),
  }),

  // --- NOTIFICATIONS ---
  notifications: router({
    getUnreadForSupplier: protectedProcedure
      .input(z.number())
      .query(({ input }) => getUnreadNotificationsForSupplier(input)),

    getUnreadForDeliveryman: protectedProcedure
      .input(z.number())
      .query(({ input }) => getUnreadNotificationsForDeliveryman(input)),

    markAsRead: protectedProcedure
      .input(z.number())
      .mutation(({ input }) => markNotificationAsRead(input)),
  }),

  // --- ORDER WORKFLOW ---
  workflow: router({
    getAssignedToDeliveryman: protectedProcedure
      .input(z.number())
      .query(({ input }) => getOrdersAssignedToDeliveryman(input)),

    getPendingForSupplier: protectedProcedure
      .input(z.number())
      .query(({ input }) => getPendingOrdersForSupplier(input)),

    assignToDeliveryman: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        deliverymanId: z.number(),
      }))
      .mutation(({ input }) => assignOrderToDeliveryman(input.orderId, input.deliverymanId)),

    validateByDeliveryman: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        supplierId: z.number(),
      }))
      .mutation(({ input }) => validateOrderByDeliveryman(input.orderId, input.supplierId)),

    confirmDelivery: protectedProcedure
      .input(z.number())
      .mutation(({ input }) => confirmDelivery(input)),
  }),
});
