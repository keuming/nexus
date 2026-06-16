import { getDb } from "./db";
import { gasDeliverymen, gasOrderNotifications, gasOrders, gasSuppliers } from "../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * Créer un profil de livreur
 */
export async function createDeliveryman(data: {
  userId: number;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  latitude?: string | number;
  longitude?: string | number;
}) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(gasDeliverymen).values(data as any).returning({ id: gasDeliverymen.id });
  return result[0];
}

/**
 * Récupérer un livreur par ID
 */
export async function getDeliverymanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.select().from(gasDeliverymen).where(eq(gasDeliverymen.id, id));
  return result[0];
}

/**
 * Récupérer un livreur par userId
 */
export async function getDeliverymanByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.select().from(gasDeliverymen).where(eq(gasDeliverymen.userId, userId));
  return result[0];
}

/**
 * Lister tous les livreurs actifs
 */
export async function listActiveDeliverymen() {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(gasDeliverymen).where(eq(gasDeliverymen.isActive, true));
  return results;
}

/**
 * Lister les livreurs par localisation (rayon en km)
 */
export async function listDeliverymenByLocation(latitude: number, longitude: number, radiusKm: number = 5) {
  const db = await getDb();
  if (!db) return [];
  // Approximation simple: 1 degré ≈ 111 km
  const latDelta = radiusKm / 111;
  const lonDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

  const results = await db
    .select()
    .from(gasDeliverymen)
    .where(
      and(
        eq(gasDeliverymen.isActive, true),
        // Latitude entre latitude - latDelta et latitude + latDelta
        // Longitude entre longitude - lonDelta et longitude + lonDelta
      ),
    );

  return results.filter((d) => {
    if (!d.latitude || !d.longitude) return false;
    const lat = parseFloat(d.latitude.toString());
    const lon = parseFloat(d.longitude.toString());
    return (
      Math.abs(lat - latitude) <= latDelta &&
      Math.abs(lon - longitude) <= lonDelta
    );
  });
}

/**
 * Mettre à jour le profil d'un livreur
 */
export async function updateDeliveryman(id: number, data: Partial<{
  phone: string;
  email: string;
  address: string;
  city: string;
  latitude: string | number;
  longitude: string | number;
  isActive: boolean;
}>) {
  const db = await getDb();
  if (!db) return;
  await db.update(gasDeliverymen).set(data as any).where(eq(gasDeliverymen.id, id));
  return getDeliverymanById(id);
}

/**
 * Créer une notification pour un fournisseur ou livreur
 */
export async function createNotification(data: {
  orderId: number;
  recipientType: "supplier" | "deliveryman";
  recipientId: number;
  notificationType: "new_order" | "order_assigned" | "order_validated" | "order_delivered";
}) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(gasOrderNotifications).values(data).returning({ id: gasOrderNotifications.id });
  return result[0];
}

/**
 * Notifier tous les fournisseurs ayant un type de bouteille
 */
export async function notifySuppliersByBottleType(orderId: number, bottleType: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Récupérer tous les fournisseurs actifs
  const suppliers = await db.select().from(gasSuppliers).where(eq(gasSuppliers.isActive, true));

  // Créer une notification pour chaque fournisseur
  const supplierIds = suppliers.map((s: any) => s.id);
  
  for (const supplierId of supplierIds) {
    await createNotification({
      orderId,
      recipientType: "supplier",
      recipientId: supplierId,
      notificationType: "new_order",
    });
  }

  return supplierIds;
}

/**
 * Notifier tous les livreurs d'une nouvelle commande
 */
export async function notifyAllDeliverymen(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Récupérer tous les livreurs actifs
  const deliverymen = await listActiveDeliverymen();

  // Créer une notification pour chaque livreur
  for (const deliveryman of deliverymen) {
    await createNotification({
      orderId,
      recipientType: "deliveryman",
      recipientId: (deliveryman as any).id as number,
      notificationType: "new_order",
    });
  }

  return deliverymen.map((d) => d.id);
}

/**
 * Récupérer les notifications non lues d'un fournisseur
 */
export async function getUnreadNotificationsForSupplier(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db
    .select()
    .from(gasOrderNotifications)
    .where(
      and(
        eq(gasOrderNotifications.recipientType, "supplier"),
        eq(gasOrderNotifications.recipientId, supplierId),
        eq(gasOrderNotifications.isRead, false),
      ),
    );
  return results;
}

/**
 * Récupérer les notifications non lues d'un livreur
 */
export async function getUnreadNotificationsForDeliveryman(deliverymanId: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db
    .select()
    .from(gasOrderNotifications)
    .where(
      and(
        eq(gasOrderNotifications.recipientType, "deliveryman"),
        eq(gasOrderNotifications.recipientId, deliverymanId),
        eq(gasOrderNotifications.isRead, false),
      ),
    );
  return results;
}

/**
 * Marquer une notification comme lue
 */
export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(gasOrderNotifications)
    .set({ isRead: true })
    .where(eq(gasOrderNotifications.id, notificationId));
}

/**
 * Récupérer les commandes assignées à un livreur
 */
export async function getOrdersAssignedToDeliveryman(deliverymanId: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db
    .select()
    .from(gasOrders)
    .where(
      and(
        eq(gasOrders.deliverymanId, deliverymanId),
        inArray(gasOrders.status, ["assigned_to_deliveryman", "validated_by_deliveryman"]),
      ),
    );
  return results;
}

/**
 * Récupérer les commandes en attente pour un fournisseur
 */
export async function getPendingOrdersForSupplier(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db
    .select()
    .from(gasOrders)
    .where(
      and(
        eq(gasOrders.supplierId, supplierId),
        eq(gasOrders.status, "pending"),
      ),
    );
  return results;
}

/**
 * Assigner une commande à un livreur
 */
export async function assignOrderToDeliveryman(orderId: number, deliverymanId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(gasOrders)
    .set({
      deliverymanId,
      status: "assigned_to_deliveryman",
    })
    .where(eq(gasOrders.id, orderId));

  // Créer une notification pour le livreur
  await createNotification({
    orderId,
    recipientType: "deliveryman",
    recipientId: deliverymanId,
    notificationType: "order_assigned",
  });
}

/**
 * Valider une commande (livreur sélectionne le fournisseur)
 */
export async function validateOrderByDeliveryman(orderId: number, supplierId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(gasOrders)
    .set({
      selectedSupplierId: supplierId,
      status: "validated_by_deliveryman",
    })
    .where(eq(gasOrders.id, orderId));

  // Créer une notification pour le fournisseur
  await createNotification({
    orderId,
    recipientType: "supplier",
    recipientId: supplierId,
    notificationType: "order_validated",
  });
}

/**
 * Confirmer la livraison
 */
export async function confirmDelivery(orderId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(gasOrders)
    .set({
      status: "delivered",
    })
    .where(eq(gasOrders.id, orderId));

  // Créer une notification pour le fournisseur
  const order = await db.select().from(gasOrders).where(eq(gasOrders.id, orderId));
  if (order.length > 0 && order[0].selectedSupplierId) {
    await createNotification({
      orderId,
      recipientType: "supplier",
      recipientId: order[0].selectedSupplierId,
      notificationType: "order_delivered",
    });
  }
}
