import { getDb } from "./db";
import {
  gasSuppliers,
  gasBottles,
  gasOrders,
  gasOrderItems,
  gasDeliveries,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

// --- GAS SUPPLIERS ---
export async function createGasSupplier(data: {
  companyId: number;
  businessName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  logoUrl?: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gasSuppliers).values(data);
  return result;
}

export async function getGasSupplierById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasSuppliers).where(eq(gasSuppliers.id, id)).limit(1);
}

export async function getGasSuppliersByCompanyId(companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasSuppliers).where(eq(gasSuppliers.companyId, companyId));
}

export async function updateGasSupplier(id: number, data: Partial<typeof gasSuppliers.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(gasSuppliers).set(data).where(eq(gasSuppliers.id, id));
}

// --- GAS BOTTLES ---
export async function createGasBottle(data: {
  supplierId: number;
  type: string;
  capacity: string;
  priceXOF: number | string;
  deliveryFeeXOF: number | string;
  stock?: number;
  minStock?: number;
  description?: string;
  photoUrl?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const price = typeof data.priceXOF === "string" ? data.priceXOF : data.priceXOF.toString();
  const deliveryFee = typeof data.deliveryFeeXOF === "string" ? data.deliveryFeeXOF : data.deliveryFeeXOF.toString();
  return await db.insert(gasBottles).values({
    supplierId: data.supplierId,
    type: data.type,
    capacity: data.capacity,
    priceXOF: price as any,
    deliveryFeeXOF: deliveryFee as any,
    stock: data.stock,
    minStock: data.minStock,
    description: data.description,
    photoUrl: data.photoUrl,
  });
}

export async function getGasBottleById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasBottles).where(eq(gasBottles.id, id)).limit(1);
}

export async function getGasBottlesBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasBottles).where(eq(gasBottles.supplierId, supplierId));
}

export async function getAvailableGasBottles(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(gasBottles)
    .where(and(eq(gasBottles.supplierId, supplierId), eq(gasBottles.isAvailable, true)));
}

export async function updateGasBottle(id: number, data: Partial<typeof gasBottles.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(gasBottles).set(data).where(eq(gasBottles.id, id));
}

export async function decreaseGasBottleStock(id: number, quantity: number) {
  const bottle = await getGasBottleById(id);
  if (!bottle || bottle.length === 0) throw new Error("Bouteille non trouvée");
  
  const newStock = Math.max(0, (bottle[0].stock || 0) - quantity);
  return await updateGasBottle(id, { stock: newStock });
}

export async function increaseGasBottleStock(id: number, quantity: number) {
  const bottle = await getGasBottleById(id);
  if (!bottle || bottle.length === 0) throw new Error("Bouteille non trouvée");
  
  const newStock = (bottle[0].stock || 0) + quantity;
  return await updateGasBottle(id, { stock: newStock });
}

// --- GAS ORDERS ---
export async function createGasOrder(data: {
  reference: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  deliveryAddress: string;
  city: string;
  supplierId: number;
  totalAmountXOF: number | string;
  paymentMethod?: string;
  estimatedDeliveryTime?: string;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const totalAmount = typeof data.totalAmountXOF === "string" ? data.totalAmountXOF : data.totalAmountXOF.toString();
  return await db.insert(gasOrders).values({
    reference: data.reference,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    clientEmail: data.clientEmail,
    deliveryAddress: data.deliveryAddress,
    city: data.city,
    supplierId: data.supplierId,
    totalAmountXOF: totalAmount as any,
    paymentMethod: (data.paymentMethod as any) || "cash",
    estimatedDeliveryTime: data.estimatedDeliveryTime,
    notes: data.notes,
  });
}

export async function getGasOrderById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasOrders).where(eq(gasOrders.id, id)).limit(1);
}

export async function getGasOrderByReference(reference: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasOrders).where(eq(gasOrders.reference, reference)).limit(1);
}

export async function getGasOrdersBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(gasOrders)
    .where(eq(gasOrders.supplierId, supplierId))
    .orderBy(desc(gasOrders.createdAt));
}

export async function getGasOrdersByStatus(supplierId: number, status: "pending" | "confirmed" | "in_delivery" | "delivered" | "cancelled") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(gasOrders)
    .where(and(eq(gasOrders.supplierId, supplierId), eq(gasOrders.orderStatus, status)))
    .orderBy(desc(gasOrders.createdAt));
}

export async function updateGasOrder(id: number, data: Partial<typeof gasOrders.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(gasOrders).set(data).where(eq(gasOrders.id, id));
}

export async function generateOrderReference(): Promise<string> {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `GAZ-${timestamp}-${random}`;
}

// --- GAS ORDER ITEMS ---
export async function createGasOrderItem(data: {
  orderId: number;
  bottleId: number;
  quantity: number;
  unitPriceXOF: number | string;
  deliveryFeeXOF: number | string;
  subtotalXOF: number | string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const unitPrice = typeof data.unitPriceXOF === "string" ? data.unitPriceXOF : data.unitPriceXOF.toString();
  const deliveryFee = typeof data.deliveryFeeXOF === "string" ? data.deliveryFeeXOF : data.deliveryFeeXOF.toString();
  const subtotal = typeof data.subtotalXOF === "string" ? data.subtotalXOF : data.subtotalXOF.toString();
  return await db.insert(gasOrderItems).values({
    orderId: data.orderId,
    bottleId: data.bottleId,
    quantity: data.quantity,
    unitPriceXOF: unitPrice as any,
    deliveryFeeXOF: deliveryFee as any,
    subtotalXOF: subtotal as any,
  });
}

export async function getGasOrderItemsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasOrderItems).where(eq(gasOrderItems.orderId, orderId));
}

export async function deleteGasOrderItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(gasOrderItems).where(eq(gasOrderItems.id, id));
}

// --- GAS DELIVERIES ---
export async function createGasDelivery(data: {
  orderId: number;
  driverId?: number;
  driverName?: string;
  driverPhone?: string;
  vehicleInfo?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(gasDeliveries).values(data);
}

export async function getGasDeliveryByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(gasDeliveries).where(eq(gasDeliveries.orderId, orderId)).limit(1);
}

export async function updateGasDelivery(id: number, data: Partial<typeof gasDeliveries.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(gasDeliveries).set(data).where(eq(gasDeliveries.id, id));
}

export async function getGasDeliveriesByStatus(status: "pending" | "in_transit" | "arrived" | "completed" | "failed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(gasDeliveries)
    .where(eq(gasDeliveries.status, status))
    .orderBy(desc(gasDeliveries.createdAt));
}

// --- STATISTICS ---
export async function getGasSupplierStats(supplierId: number) {
  const orders = await getGasOrdersBySupplierId(supplierId);
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum: number, order: any) => {
    return sum + (typeof order.totalAmountXOF === "string" ? parseFloat(order.totalAmountXOF) : order.totalAmountXOF);
  }, 0);
  const deliveredOrders = orders.filter((o: any) => o.orderStatus === "delivered").length;
  const pendingOrders = orders.filter((o: any) => o.orderStatus === "pending").length;

  return {
    totalOrders,
    totalRevenue,
    deliveredOrders,
    pendingOrders,
    conversionRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(2) : "0",
  };
}
