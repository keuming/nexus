// @ts-nocheck
import { getDb } from "./db";
import { eq, and, gte, lte, desc, like } from "drizzle-orm";
import { rentalProducts, rentalInventory, salesOrders, salesOrderItems } from "../drizzle/schema";

// Types
export interface RentalProduct {
  id: number;
  companyId: number;
  name: string;
  description: string | null | undefined;
  category: string;
  pricePerDay: string;
  pricePerWeek: string | null | undefined;
  pricePerMonth: string | null | undefined;
  depositAmount: string | null | undefined;
  image: string | null | undefined;
  rating: string | number | null | undefined;
  reviewCount: number | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface RentalInventory {
  id: number;
  productId: number;
  quantity: number;
  availableQuantity: number;
  lastUpdated: Date;
}

export interface SalesOrder {
  id: number;
  companyId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null | undefined;
  orderDate: Date;
  totalAmount: string;
  paymentStatus: "pending" | "partial" | "paid" | null | undefined;
  orderStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | null | undefined;
  deliveryDate: Date | null | undefined;
  deliveryAddress: string | null | undefined;
  notes: string | null | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

// ─── RENTAL PRODUCTS ─────────────────────────────────────────────────────────

export async function createRentalProduct(data: {
  companyId: number;
  name: string;
  description?: string;
  category: string;
  pricePerDay: string | number;
  pricePerWeek?: string | number;
  pricePerMonth?: string | number;
  depositAmount?: string | number;
  image?: string;
}): Promise<RentalProduct | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(rentalProducts).values([{
    ...data,
    pricePerDay: String(data.pricePerDay),
    pricePerWeek: data.pricePerWeek ? String(data.pricePerWeek) : undefined,
    pricePerMonth: data.pricePerMonth ? String(data.pricePerMonth) : undefined,
    depositAmount: data.depositAmount ? String(data.depositAmount) : undefined,
  }]);
  return null;
}

export async function getProductsByCompany(companyId: number): Promise<RentalProduct[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(rentalProducts)
    .where(eq(rentalProducts.companyId, companyId));
}

export async function getProductById(productId: number): Promise<RentalProduct | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(rentalProducts)
    .where(eq(rentalProducts.id, productId))
    .limit(1);
  return result[0] as any;
}

export async function updateProduct(
  productId: number,
  data: Partial<RentalProduct>
): Promise<RentalProduct | null> {
  const db = await getDb();
  if (!db) return null;

  // Convertir les prix en strings
  const cleanData: any = { ...data };
  if (cleanData.pricePerDay !== undefined) cleanData.pricePerDay = String(cleanData.pricePerDay);
  if (cleanData.pricePerWeek !== undefined) cleanData.pricePerWeek = String(cleanData.pricePerWeek);
  if (cleanData.pricePerMonth !== undefined) cleanData.pricePerMonth = String(cleanData.pricePerMonth);
  if (cleanData.depositAmount !== undefined) cleanData.depositAmount = String(cleanData.depositAmount);

  await db
    .update(rentalProducts)
    .set(cleanData)
    .where(eq(rentalProducts.id, productId));
  return null;
}

export async function deleteProduct(productId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(rentalProducts).where(eq(rentalProducts.id, productId));
}

export async function searchProducts(
  companyId: number,
  searchTerm: string
): Promise<RentalProduct[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(rentalProducts)
    .where(
      and(
        eq(rentalProducts.companyId, companyId),
        like(rentalProducts.name, `%${searchTerm}%`)
      )
    );
}

export async function getProductsByCategory(
  companyId: number,
  category: string
): Promise<RentalProduct[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(rentalProducts)
    .where(
      and(
        eq(rentalProducts.companyId, companyId),
        eq(rentalProducts.category, category)
      )
    );
}

// ─── RENTAL INVENTORY ────────────────────────────────────────────────────────

export async function updateInventory(
  productId: number,
  quantity: number
): Promise<RentalInventory | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await db
    .select()
    .from(rentalInventory)
    .where(eq(rentalInventory.productId, productId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(rentalInventory)
      .set({
        quantity,
        availableQuantity: quantity,
        lastUpdated: new Date(),
      })
      .where(eq(rentalInventory.productId, productId));
  } else {
    await db.insert(rentalInventory).values([{
      productId,
      quantity,
      availableQuantity: quantity,
      lastUpdated: new Date(),
    }]);
  }
  return null;
}

export async function getInventory(productId: number): Promise<RentalInventory | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(rentalInventory)
    .where(eq(rentalInventory.productId, productId))
    .limit(1);
  return result[0] as any;
}

export async function decreaseInventory(
  productId: number,
  quantity: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const inventory = await getInventory(productId);
  if (!inventory || inventory.availableQuantity < quantity) {
    return false;
  }

  await db
    .update(rentalInventory)
    .set({
      availableQuantity: inventory.availableQuantity - quantity,
      lastUpdated: new Date(),
    })
    .where(eq(rentalInventory.productId, productId));

  return true;
}

export async function increaseInventory(
  productId: number,
  quantity: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const inventory = await getInventory(productId);
  if (inventory) {
    await db
      .update(rentalInventory)
      .set({
        availableQuantity: inventory.availableQuantity + quantity,
        lastUpdated: new Date(),
      })
      .where(eq(rentalInventory.productId, productId));
  }
}

// ─── SALES ORDERS ────────────────────────────────────────────────────────────

export async function createOrder(data: {
  companyId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalAmount: string | number;
  paymentStatus?: "pending" | "partial" | "paid";
  deliveryDate?: Date;
  deliveryAddress?: string;
  notes?: string;
}): Promise<SalesOrder | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(salesOrders).values([{
    ...data,
    totalAmount: String(data.totalAmount),
    paymentStatus: data.paymentStatus || "pending",
    orderStatus: "pending",
    orderDate: new Date(),
  }]);
  return null;
}

export async function getOrdersByCompany(companyId: number): Promise<SalesOrder[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(salesOrders)
    .where(eq(salesOrders.companyId, companyId))
    .orderBy(desc(salesOrders.orderDate));
}

export async function getOrderById(orderId: number): Promise<SalesOrder | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(salesOrders)
    .where(eq(salesOrders.id, orderId))
    .limit(1);
  return result[0] as any;
}

export async function updateOrderStatus(
  orderId: number,
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
): Promise<SalesOrder | null> {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(salesOrders)
    .set({ orderStatus: status })
    .where(eq(salesOrders.id, orderId));
  return null;
}

export async function updatePaymentStatus(
  orderId: number,
  paymentStatus: "pending" | "partial" | "paid"
): Promise<SalesOrder | null> {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(salesOrders)
    .set({ paymentStatus })
    .where(eq(salesOrders.id, orderId));
  return null;
}

export async function getOrdersByDateRange(
  companyId: number,
  startDate: Date,
  endDate: Date
): Promise<SalesOrder[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(salesOrders)
    .where(
      and(
        eq(salesOrders.companyId, companyId),
        gte(salesOrders.orderDate, startDate),
        lte(salesOrders.orderDate, endDate)
      )
    )
    .orderBy(desc(salesOrders.orderDate));
}

// ─── SALES ORDER ITEMS ───────────────────────────────────────────────────────

export async function addOrderItem(data: {
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
}): Promise<SalesOrderItem | null> {
  const db = await getDb();
  if (!db) return null;

  await db.insert(salesOrderItems).values([{
    ...data,
    unitPrice: String(data.unitPrice),
    totalPrice: String(data.totalPrice),
  }]);
  return null;
}

export async function getOrderItems(orderId: number): Promise<SalesOrderItem[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(salesOrderItems)
    .where(eq(salesOrderItems.orderId, orderId));
}

export async function deleteOrderItem(itemId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(salesOrderItems).where(eq(salesOrderItems.id, itemId));
}

// ─── STATISTICS ──────────────────────────────────────────────────────────────

export async function getOrderStatistics(companyId: number, monthStart: Date, monthEnd: Date) {
  const db = await getDb();
  if (!db) return null;

  const orders = await getOrdersByDateRange(companyId, monthStart, monthEnd);

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.orderStatus === "delivered").length;
  const totalRevenue = orders
    .filter(o => o.paymentStatus === "paid")
    .reduce((acc, o) => acc + parseFloat(o.totalAmount), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingPayments = orders
    .filter(o => o.paymentStatus !== "paid")
    .reduce((acc, o) => acc + parseFloat(o.totalAmount), 0);

  return {
    totalOrders,
    completedOrders,
    totalRevenue,
    averageOrderValue,
    pendingPayments,
  };
}

export async function getProductStatistics(productId: number) {
  const db = await getDb();
  if (!db) return null;

  const product = await getProductById(productId);
  const inventory = await getInventory(productId);

  if (!product) return null;

  return {
    productName: product.name,
    category: product.category,
    totalStock: inventory?.quantity || 0,
    availableStock: inventory?.availableQuantity || 0,
    pricePerDay: product.pricePerDay,
    pricePerWeek: product.pricePerWeek,
    pricePerMonth: product.pricePerMonth,
  };
}
