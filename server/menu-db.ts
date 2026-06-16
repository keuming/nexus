import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { menuCategories, menuItems } from "../drizzle/schema";
import { storagePut } from "./storage";

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

export async function getCategoriesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.companyId, companyId))
    .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name));
}

export async function createCategory(data: {
  companyId: number;
  name: string;
  description?: string;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(menuCategories).values({
    companyId: data.companyId,
    name: data.name,
    description: data.description,
    sortOrder: data.sortOrder ?? 0,
  }).returning({ id: menuCategories.id });
  return { id: result[0]?.id ?? 0 };
}

export async function updateCategory(
  id: number,
  companyId: number,
  data: { name?: string; description?: string; sortOrder?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(menuCategories)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(menuCategories.id, id), eq(menuCategories.companyId, companyId)));
  return { success: true };
}

export async function deleteCategory(id: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  // Delete items first
  await db
    .delete(menuItems)
    .where(and(eq(menuItems.categoryId, id), eq(menuItems.companyId, companyId)));
  await db
    .delete(menuCategories)
    .where(and(eq(menuCategories.id, id), eq(menuCategories.companyId, companyId)));
  return { success: true };
}

// ─── ITEMS ────────────────────────────────────────────────────────────────────

export async function getItemsByCompany(companyId: number, categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(menuItems.companyId, companyId)];
  if (categoryId) conditions.push(eq(menuItems.categoryId, categoryId));
  return db
    .select()
    .from(menuItems)
    .where(and(...conditions))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.name));
}

export async function createItem(data: {
  companyId: number;
  categoryId: number;
  name: string;
  description?: string;
  priceXOF: string;
  available?: boolean;
  preparationTime?: number;
  sortOrder?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(menuItems).values({
    companyId: data.companyId,
    categoryId: data.categoryId,
    name: data.name,
    description: data.description,
    priceXOF: data.priceXOF,
    available: data.available ?? true,
    preparationTime: data.preparationTime ?? 15,
    sortOrder: data.sortOrder ?? 0,
  }).returning({ id: menuItems.id });
  return { id: result[0]?.id ?? 0 };
}

export async function updateItem(
  id: number,
  companyId: number,
  data: {
    name?: string;
    description?: string;
    priceXOF?: string;
    categoryId?: number;
    available?: boolean;
    preparationTime?: number;
    sortOrder?: number;
    photoUrl?: string;
    photoKey?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(menuItems)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(menuItems.id, id), eq(menuItems.companyId, companyId)));
  return { success: true };
}

export async function deleteItem(id: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .delete(menuItems)
    .where(and(eq(menuItems.id, id), eq(menuItems.companyId, companyId)));
  return { success: true };
}

export async function uploadItemPhoto(
  id: number,
  companyId: number,
  fileBuffer: Buffer,
  mimeType: string,
  originalName: string
) {
  const ext = originalName.split(".").pop() ?? "jpg";
  const key = `menu/${companyId}/${id}-${Date.now()}.${ext}`;
  const { url } = await storagePut(key, fileBuffer, mimeType);
  await updateItem(id, companyId, { photoUrl: url, photoKey: key });
  return { url, key };
}

// ─── PUBLIC MENU (lecture seule, plats disponibles) ──────────────────────────

export async function getPublicMenu(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  const cats = await db
    .select()
    .from(menuCategories)
    .where(eq(menuCategories.companyId, companyId))
    .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.name));

  const items = await db
    .select()
    .from(menuItems)
    .where(and(eq(menuItems.companyId, companyId), eq(menuItems.available, true)))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.name));

  return cats.map((cat) => ({
    ...cat,
    items: items.filter((item) => item.categoryId === cat.id),
  }));
}

// ─── ONLINE ORDERS ────────────────────────────────────────────────────────────
import { onlineOrders } from "../drizzle/schema";

function generateOrderRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "CMD-";
  for (let i = 0; i < 8; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

export async function createOnlineOrder(data: {
  companyId: number;
  customerName: string;
  customerPhone: string;
  deliveryType: string;
  deliveryAddress?: string;
  notes?: string;
  items: { itemId: number; name: string; qty: number; priceXOF: number; preparationTime?: number }[];
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const totalXOF = data.items.reduce((sum, i) => sum + i.priceXOF * i.qty, 0);
  const estimatedPrepTime = Math.max(...data.items.map((i) => (i.preparationTime ?? 15)));
  const orderRef = generateOrderRef();
  await db.insert(onlineOrders).values({
    companyId: data.companyId,
    orderRef,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    deliveryType: data.deliveryType,
    deliveryAddress: data.deliveryAddress ?? null,
    notes: data.notes ?? null,
    itemsJson: JSON.stringify(data.items),
    totalXOF: String(totalXOF),
    estimatedPrepTime,
    status: "nouvelle",
  });
  return { orderRef, totalXOF, estimatedPrepTime };
}

export async function getOnlineOrdersByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(onlineOrders)
    .where(eq(onlineOrders.companyId, companyId))
    .orderBy(desc(onlineOrders.createdAt));
}

export async function updateOnlineOrderStatus(orderId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(onlineOrders).set({ status }).where(eq(onlineOrders.id, orderId));
  return { success: true };
}

// ─── DELIVERY ZONES ───────────────────────────────────────────────────────────
import { deliveryZones } from "../drizzle/schema";

export async function getDeliveryZonesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(deliveryZones)
    .where(eq(deliveryZones.companyId, companyId))
    .orderBy(asc(deliveryZones.name));
}

export async function upsertDeliveryZone(data: {
  id?: number;
  companyId: number;
  name: string;
  description?: string;
  extraMinutes: number;
  active?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  if (data.id) {
    await db
      .update(deliveryZones)
      .set({ name: data.name, description: data.description, extraMinutes: data.extraMinutes, active: data.active ?? true })
      .where(and(eq(deliveryZones.id, data.id), eq(deliveryZones.companyId, data.companyId)));
    return { id: data.id };
  } else {
    const result = await db.insert(deliveryZones).values({
      companyId: data.companyId,
      name: data.name,
      description: data.description,
      extraMinutes: data.extraMinutes,
      active: data.active ?? true,
    }).returning({ id: deliveryZones.id });
    return { id: result[0]?.id ?? 0 };
  }
}

export async function deleteDeliveryZone(id: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(deliveryZones).where(and(eq(deliveryZones.id, id), eq(deliveryZones.companyId, companyId)));
  return { success: true };
}

export async function getPublicDeliveryZones(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(deliveryZones)
    .where(and(eq(deliveryZones.companyId, companyId), eq(deliveryZones.active, true)))
    .orderBy(asc(deliveryZones.name));
}

// ─── STATS RESTAURATION ───────────────────────────────────────────────────────
export async function getRestaurantStatsToday(companyId: number) {
  const db = await getDb();
  if (!db) return { caToday: 0, ordersDelivered: 0, avgBasket: 0, ordersTotal: 0 };
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const orders = await db
    .select()
    .from(onlineOrders)
    .where(and(eq(onlineOrders.companyId, companyId)));
  const todayOrders = orders.filter((o) => new Date(o.createdAt) >= todayStart);
  const delivered = todayOrders.filter((o) => o.status === "livree");
  const caToday = todayOrders.reduce((sum, o) => sum + Number(o.totalXOF), 0);
  const avgBasket = todayOrders.length > 0 ? Math.round(caToday / todayOrders.length) : 0;
  return {
    caToday,
    ordersDelivered: delivered.length,
    avgBasket,
    ordersTotal: todayOrders.length,
  };
}
