import { getDb } from "./db";
import {
  shopProducts,
  shopProductOrders,
  shopProductOrderItems,
  shopProductStockMovements,
  ShopProduct,
  InsertShopProduct,
  ShopProductOrder,
  InsertShopProductOrder,
  ShopProductOrderItem,
  InsertShopProductOrderItem,
  ShopProductStockMovement,
  InsertShopProductStockMovement,
} from "../drizzle/schema";
import { eq, and, gte, lte, like, desc } from "drizzle-orm";

// --- SHOP PRODUCTS CRUD -------------------------------------------------------

export async function createShopProduct(data: InsertShopProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.insert(shopProducts).values(data);
  return result;
}

export async function getShopProductById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProducts).where(eq(shopProducts.id, id)).limit(1);
}

export async function getShopProductsBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(shopProducts)
    .where(
      and(
        eq(shopProducts.supplierId, supplierId),
        eq(shopProducts.isActive, true)
      )
    )
    .orderBy(desc(shopProducts.createdAt));
}

export async function getShopProductsByCategory(supplierId: number, category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(shopProducts)
    .where(
      and(
        eq(shopProducts.supplierId, supplierId),
        eq(shopProducts.category, category),
        eq(shopProducts.isActive, true)
      )
    )
    .orderBy(desc(shopProducts.createdAt));
}

export async function searchShopProducts(supplierId: number, searchTerm: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(shopProducts)
    .where(
      and(
        eq(shopProducts.supplierId, supplierId),
        like(shopProducts.name, `%${searchTerm}%`),
        eq(shopProducts.isActive, true)
      )
    )
    .orderBy(desc(shopProducts.createdAt));
}

export async function updateShopProduct(id: number, data: Partial<InsertShopProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.update(shopProducts).set(data).where(eq(shopProducts.id, id));
}

export async function deleteShopProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.update(shopProducts).set({ isActive: false }).where(eq(shopProducts.id, id));
}

export async function getShopProductsLowStock(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(shopProducts)
    .where(
      and(
        eq(shopProducts.supplierId, supplierId),
        lte(shopProducts.stock, shopProducts.minStockAlert),
        eq(shopProducts.isActive, true)
      )
    )
    .orderBy(desc(shopProducts.stock));
}

// --- SHOP PRODUCT ORDERS CRUD -------------------------------------------------

export async function createShopProductOrder(data: InsertShopProductOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  const result = await db.insert(shopProductOrders).values(data);
  return result;
}

export async function getShopProductOrderById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.select().from(shopProductOrders).where(eq(shopProductOrders.id, id)).limit(1);
}

export async function getShopProductOrderByReference(reference: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(shopProductOrders)
    .where(eq(shopProductOrders.reference, reference))
    .limit(1);
}

export async function getShopProductOrdersBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(shopProductOrders)
    .where(eq(shopProductOrders.supplierId, supplierId))
    .orderBy(desc(shopProductOrders.createdAt));
}

export async function getShopProductOrdersByStatus(supplierId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(shopProductOrders)
    .where(
      and(
        eq(shopProductOrders.supplierId, supplierId),
        eq(shopProductOrders.status, status as any)
      )
    )
    .orderBy(desc(shopProductOrders.createdAt));
}

export async function updateShopProductOrder(id: number, data: Partial<InsertShopProductOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.update(shopProductOrders).set(data).where(eq(shopProductOrders.id, id));
}

// --- SHOP PRODUCT ORDER ITEMS CRUD -------------------------------------------

export async function createShopProductOrderItem(data: InsertShopProductOrderItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.insert(shopProductOrderItems).values(data);
}

export async function getShopProductOrderItemsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(shopProductOrderItems)
    .where(eq(shopProductOrderItems.orderId, orderId));
}

export async function deleteShopProductOrderItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.delete(shopProductOrderItems).where(eq(shopProductOrderItems.id, id));
}

// --- STOCK MOVEMENTS ---------------------------------------------------------

export async function createStockMovement(data: InsertShopProductStockMovement) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db.insert(shopProductStockMovements).values(data);
}

export async function getStockMovementsByProductId(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(shopProductStockMovements)
    .where(eq(shopProductStockMovements.productId, productId))
    .orderBy(desc(shopProductStockMovements.createdAt));
}

export async function getStockMovementsBySupplierId(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");
  return await db
    .select()
    .from(shopProductStockMovements)
    .where(eq(shopProductStockMovements.supplierId, supplierId))
    .orderBy(desc(shopProductStockMovements.createdAt));
}

// --- HELPER FUNCTIONS --------------------------------------------------------

export async function decreaseProductStock(productId: number, quantity: number) {
  const productList = await getShopProductById(productId);
  const product = Array.isArray(productList) ? productList[0] : productList;
  if (!product) throw new Error("Product not found");

  const currentStock = typeof product.stock === 'string' ? parseInt(product.stock) : (product.stock as number);
  const newStock = Math.max(0, currentStock - quantity);
  await updateShopProduct(productId, { stock: newStock });

  // Record stock movement
  await createStockMovement({
    productId,
    supplierId: (product as any).supplierId,
    movementType: "out",
    quantity,
    reason: "Order",
  });

  return newStock;
}

export async function increaseProductStock(productId: number, quantity: number, reason: string = "Restock") {
  const productList = await getShopProductById(productId);
  const product = Array.isArray(productList) ? productList[0] : productList;
  if (!product) throw new Error("Product not found");

  const currentStock = typeof product.stock === 'string' ? parseInt(product.stock) : (product.stock as number);
  const newStock = currentStock + quantity;
  await updateShopProduct(productId, { stock: newStock });

  // Record stock movement
  await createStockMovement({
    productId,
    supplierId: (product as any).supplierId,
    movementType: "in",
    quantity,
    reason,
  });

  return newStock;
}

export async function generateOrderReference(): Promise<string> {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `PRD-${timestamp}-${random}`;
}
