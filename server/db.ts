import { and, count, desc, eq, gte, lte, sql, like, or, notInArray, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  rooms, roomTypes, clients, reservations, services,
  reservationServices, invoices, payments, employees,
  housekeepingTasks, inventoryCategories, inventoryItems,
  inventoryMovements, hotelSettings,
  InsertRoom, InsertClient, InsertReservation, InsertEmployee,
  reviews, InsertReview,
  roomPhotos,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      console.error("[Database] DATABASE_URL not set");
      return null;
    }
    try {
      _db = drizzle(process.env.DATABASE_URL);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ───────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Promouvoir un utilisateur existant au rôle admin par son email.
 * Utilisé lors du callback OAuth pour les emails pré-autorisés.
 */
export async function promoteToAdminByEmail(email: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.email, email));
}

// ─── HOTEL SETTINGS ──────────────────────────────────────────────────────────
export async function getHotelSettings() {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(hotelSettings).limit(1);
  if (result.length === 0) {
    await db.insert(hotelSettings).values({ name: "Grand Hôtel", stars: 4, currency: "FCFA" });
    const r2 = await db.select().from(hotelSettings).limit(1);
    return r2[0] ?? null;
  }
  return result[0];
}

export async function updateHotelSettings(data: Partial<typeof hotelSettings.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(hotelSettings).limit(1);
  if (existing.length === 0) {
    await db.insert(hotelSettings).values({ name: "Grand Hôtel", stars: 4, currency: "FCFA", ...data });
  } else {
    await db.update(hotelSettings).set(data).where(eq(hotelSettings.id, existing[0].id));
  }
}

// ─── ROOM TYPES ──────────────────────────────────────────────────────────────
export async function getRoomTypes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(roomTypes).orderBy(roomTypes.name);
}

export async function createRoomType(data: typeof roomTypes.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(roomTypes).values(data);
}

export async function updateRoomType(id: number, data: Partial<typeof roomTypes.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(roomTypes).set(data).where(eq(roomTypes.id, id));
}

export async function deleteRoomType(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(roomTypes).where(eq(roomTypes.id, id));
}

// ─── ROOMS ───────────────────────────────────────────────────────────────────
export async function getRooms() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: rooms.id,
      number: rooms.number,
      floor: rooms.floor,
      roomTypeId: rooms.roomTypeId,
      status: rooms.status,
      priceOverride: rooms.priceOverride,
      notes: rooms.notes,
      createdAt: rooms.createdAt,
      updatedAt: rooms.updatedAt,
      typeName: roomTypes.name,
      basePrice: roomTypes.basePrice,
      capacity: roomTypes.capacity,
    })
    .from(rooms)
    .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .orderBy(rooms.floor, rooms.number);
}

export async function getRoomById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createRoom(data: InsertRoom) {
  const db = await getDb();
  if (!db) return;
  await db.insert(rooms).values(data);
}

export async function updateRoom(id: number, data: Partial<InsertRoom>) {
  const db = await getDb();
  if (!db) return;
  await db.update(rooms).set(data).where(eq(rooms.id, id));
}

export async function deleteRoom(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(rooms).where(eq(rooms.id, id));
}

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
export async function getClients(search?: string) {
  const db = await getDb();
  if (!db) return [];
  let baseClients;
  if (search) {
    baseClients = await db.select().from(clients).where(
      or(
        like(clients.firstName, `%${search}%`),
        like(clients.lastName, `%${search}%`),
        like(clients.email, `%${search}%`),
        like(clients.phone, `%${search}%`)
      )
    ).orderBy(desc(clients.createdAt));
  } else {
    baseClients = await db.select().from(clients).orderBy(desc(clients.createdAt));
  }
  // Enrich with stats
  const enriched = await Promise.all(baseClients.map(async (c) => {
    const stats = await db.select({
      totalStays: count(reservations.id),
      totalRevenue: sql<string>`COALESCE(SUM(${reservations.totalAmount}), 0)`,
    }).from(reservations).where(eq(reservations.clientId, c.id));
    return {
      ...c,
      totalStays: Number(stats[0]?.totalStays ?? 0),
      totalRevenue: stats[0]?.totalRevenue ?? "0",
    };
  }));
  return enriched;
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(clients).values(data);
  return { id: (result as any).insertId as number };
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) return;
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(clients).where(eq(clients.id, id));
}

// ─── RESERVATIONS ────────────────────────────────────────────────────────────
function generateReference(): string {
  const prefix = "RES";
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `${prefix}${year}${rand}`;
}

export async function getReservations(filters?: { status?: string; search?: string; from?: Date; to?: Date }) {
  const db = await getDb();
  if (!db) return [];
  const query = db
    .select({
      id: reservations.id,
      reference: reservations.reference,
      clientId: reservations.clientId,
      roomId: reservations.roomId,
      checkInDate: reservations.checkInDate,
      checkOutDate: reservations.checkOutDate,
      actualCheckIn: reservations.actualCheckIn,
      actualCheckOut: reservations.actualCheckOut,
      adults: reservations.adults,
      children: reservations.children,
      status: reservations.status,
      totalAmount: reservations.totalAmount,
      paidAmount: reservations.paidAmount,
      source: reservations.source,
      notes: reservations.notes,
      createdAt: reservations.createdAt,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
      clientEmail: clients.email,
      clientPhone: clients.phone,
      roomNumber: rooms.number,
      roomFloor: rooms.floor,
      roomTypeName: roomTypes.name,
    })
    .from(reservations)
    .leftJoin(clients, eq(reservations.clientId, clients.id))
    .leftJoin(rooms, eq(reservations.roomId, rooms.id))
    .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .orderBy(desc(reservations.createdAt));
  return query;
}

export async function getReservationById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: reservations.id,
      reference: reservations.reference,
      clientId: reservations.clientId,
      roomId: reservations.roomId,
      checkInDate: reservations.checkInDate,
      checkOutDate: reservations.checkOutDate,
      actualCheckIn: reservations.actualCheckIn,
      actualCheckOut: reservations.actualCheckOut,
      adults: reservations.adults,
      children: reservations.children,
      status: reservations.status,
      totalAmount: reservations.totalAmount,
      paidAmount: reservations.paidAmount,
      source: reservations.source,
      notes: reservations.notes,
      createdAt: reservations.createdAt,
      updatedAt: reservations.updatedAt,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
      clientEmail: clients.email,
      clientPhone: clients.phone,
      roomNumber: rooms.number,
      roomFloor: rooms.floor,
      roomTypeName: roomTypes.name,
      basePrice: roomTypes.basePrice,
    })
    .from(reservations)
    .leftJoin(clients, eq(reservations.clientId, clients.id))
    .leftJoin(rooms, eq(reservations.roomId, rooms.id))
    .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(eq(reservations.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createReservation(data: Omit<InsertReservation, "reference">) {
  const db = await getDb();
  if (!db) return null;
  const reference = generateReference();
  await db.insert(reservations).values({ ...data, reference });
  return reference;
}

export async function updateReservation(id: number, data: Partial<InsertReservation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(reservations).set(data).where(eq(reservations.id, id));
}

export async function getClientReservations(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: reservations.id,
      reference: reservations.reference,
      checkInDate: reservations.checkInDate,
      checkOutDate: reservations.checkOutDate,
      status: reservations.status,
      totalAmount: reservations.totalAmount,
      roomNumber: rooms.number,
      roomTypeName: roomTypes.name,
    })
    .from(reservations)
    .leftJoin(rooms, eq(reservations.roomId, rooms.id))
    .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(eq(reservations.clientId, clientId))
    .orderBy(desc(reservations.createdAt));
}

// ─── SERVICES ────────────────────────────────────────────────────────────────
export async function getServices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(services).orderBy(services.category, services.name);
}

export async function createService(data: typeof services.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(services).values(data);
}

export async function updateService(id: number, data: Partial<typeof services.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(services).set(data).where(eq(services.id, id));
}

export async function deleteService(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(services).where(eq(services.id, id));
}

export async function getReservationServices(reservationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: reservationServices.id,
      reservationId: reservationServices.reservationId,
      serviceId: reservationServices.serviceId,
      quantity: reservationServices.quantity,
      unitPrice: reservationServices.unitPrice,
      totalPrice: reservationServices.totalPrice,
      date: reservationServices.date,
      notes: reservationServices.notes,
      serviceName: services.name,
      serviceCategory: services.category,
    })
    .from(reservationServices)
    .leftJoin(services, eq(reservationServices.serviceId, services.id))
    .where(eq(reservationServices.reservationId, reservationId));
}

export async function addReservationService(data: typeof reservationServices.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(reservationServices).values(data);
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export async function getPayments(reservationId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (reservationId) {
    return db
      .select({
        id: payments.id,
        amount: payments.amount,
        method: payments.method,
        reference: payments.reference,
        status: payments.status,
        paidAt: payments.paidAt,
        notes: payments.notes,
        clientFirstName: clients.firstName,
        clientLastName: clients.lastName,
      })
      .from(payments)
      .leftJoin(clients, eq(payments.clientId, clients.id))
      .where(eq(payments.reservationId, reservationId))
      .orderBy(desc(payments.paidAt));
  }
  return db
    .select({
      id: payments.id,
      reservationId: payments.reservationId,
      clientId: payments.clientId,
      amount: payments.amount,
      method: payments.method,
      reference: payments.reference,
      status: payments.status,
      paidAt: payments.paidAt,
      notes: payments.notes,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
    })
    .from(payments)
    .leftJoin(clients, eq(payments.clientId, clients.id))
    .orderBy(desc(payments.paidAt));
}

export async function createPayment(data: typeof payments.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(payments).values(data);
  if (data.reservationId) {
    const total = await db
      .select({ total: sql<string>`SUM(amount)` })
      .from(payments)
      .where(and(eq(payments.reservationId, data.reservationId), eq(payments.status, "complete")));
    const paid = parseFloat(total[0]?.total ?? "0");
    await db.update(reservations).set({ paidAmount: paid.toString() }).where(eq(reservations.id, data.reservationId));
  }
}

// ─── INVOICES ────────────────────────────────────────────────────────────────
function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `FAC${y}${m}${rand}`;
}

export async function getInvoices() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: invoices.id,
      number: invoices.number,
      reservationId: invoices.reservationId,
      clientId: invoices.clientId,
      amount: invoices.amount,
      taxAmount: invoices.taxAmount,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      issuedAt: invoices.issuedAt,
      dueAt: invoices.dueAt,
      notes: invoices.notes,
      clientFirstName: clients.firstName,
      clientLastName: clients.lastName,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.issuedAt));
}

export async function createInvoice(data: Omit<typeof invoices.$inferInsert, "number">) {
  const db = await getDb();
  if (!db) return null;
  const number = generateInvoiceNumber();
  await db.insert(invoices).values({ ...data, number });
  return number;
}

export async function updateInvoice(id: number, data: Partial<typeof invoices.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(invoices).set(data).where(eq(invoices.id, id));
}

// ─── EMPLOYEES ───────────────────────────────────────────────────────────────
export async function getEmployees() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).orderBy(employees.lastName);
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) return;
  await db.insert(employees).values(data);
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) return;
  await db.update(employees).set(data).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(employees).where(eq(employees.id, id));
}

// ─── HOUSEKEEPING ─────────────────────────────────────────────────────────────
export async function getHousekeepingTasks(filters?: { status?: string; assignedTo?: number }) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: housekeepingTasks.id,
      roomId: housekeepingTasks.roomId,
      assignedTo: housekeepingTasks.assignedTo,
      type: housekeepingTasks.type,
      status: housekeepingTasks.status,
      priority: housekeepingTasks.priority,
      scheduledAt: housekeepingTasks.scheduledAt,
      startedAt: housekeepingTasks.startedAt,
      completedAt: housekeepingTasks.completedAt,
      notes: housekeepingTasks.notes,
      createdAt: housekeepingTasks.createdAt,
      roomNumber: rooms.number,
      roomFloor: rooms.floor,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
    })
    .from(housekeepingTasks)
    .leftJoin(rooms, eq(housekeepingTasks.roomId, rooms.id))
    .leftJoin(employees, eq(housekeepingTasks.assignedTo, employees.id))
    .orderBy(desc(housekeepingTasks.createdAt));
}

export async function createHousekeepingTask(data: typeof housekeepingTasks.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(housekeepingTasks).values(data);
}

export async function updateHousekeepingTask(id: number, data: Partial<typeof housekeepingTasks.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(housekeepingTasks).set(data).where(eq(housekeepingTasks.id, id));
}

// ─── INVENTORY ───────────────────────────────────────────────────────────────
export async function getInventoryCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inventoryCategories).orderBy(inventoryCategories.name);
}

export async function getInventoryItems() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      categoryId: inventoryItems.categoryId,
      unit: inventoryItems.unit,
      currentStock: inventoryItems.currentStock,
      minStock: inventoryItems.minStock,
      maxStock: inventoryItems.maxStock,
      unitCost: inventoryItems.unitCost,
      supplier: inventoryItems.supplier,
      location: inventoryItems.location,
      updatedAt: inventoryItems.updatedAt,
      categoryName: inventoryCategories.name,
    })
    .from(inventoryItems)
    .leftJoin(inventoryCategories, eq(inventoryItems.categoryId, inventoryCategories.id))
    .orderBy(inventoryItems.name);
}

export async function createInventoryItem(data: typeof inventoryItems.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(inventoryItems).values(data);
}

export async function updateInventoryItem(id: number, data: Partial<typeof inventoryItems.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(inventoryItems).set(data).where(eq(inventoryItems.id, id));
}

export async function addInventoryMovement(data: typeof inventoryMovements.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(inventoryMovements).values(data);
  const item = await db.select().from(inventoryItems).where(eq(inventoryItems.id, data.itemId)).limit(1);
  if (item[0]) {
    const current = parseFloat(item[0].currentStock ?? "0");
    const qty = parseFloat(data.quantity as string);
    const newStock = data.type === "entree" ? current + qty : data.type === "sortie" ? current - qty : qty;
    await db.update(inventoryItems).set({ currentStock: newStock.toString() }).where(eq(inventoryItems.id, data.itemId));
  }
}

// ─── DASHBOARD / ANALYTICS ───────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startStr = startOfMonth.toISOString().split("T")[0];
  const endStr = endOfMonth.toISOString().split("T")[0];

  const [
    totalRooms,
    roomStatuses,
    monthReservations,
    totalRevenue,
    recentReservations,
    lowStockItems,
  ] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(rooms),
    db.select({ status: rooms.status, count: sql<number>`COUNT(*)` }).from(rooms).groupBy(rooms.status),
    db.select({ count: sql<number>`COUNT(*)` }).from(reservations).where(
      sql`checkInDate >= ${startStr} AND checkInDate <= ${endStr}`
    ),
    db.select({ total: sql<string>`SUM(totalAmount)` }).from(reservations).where(
      sql`checkInDate >= ${startStr} AND checkInDate <= ${endStr} AND status IN ('confirmee','checkin','checkout')`
    ),
    db
      .select({
        id: reservations.id,
        reference: reservations.reference,
        checkInDate: reservations.checkInDate,
        checkOutDate: reservations.checkOutDate,
        status: reservations.status,
        totalAmount: reservations.totalAmount,
        clientFirstName: clients.firstName,
        clientLastName: clients.lastName,
        roomNumber: rooms.number,
        roomTypeName: roomTypes.name,
      })
      .from(reservations)
      .leftJoin(clients, eq(reservations.clientId, clients.id))
      .leftJoin(rooms, eq(reservations.roomId, rooms.id))
      .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .orderBy(desc(reservations.createdAt))
      .limit(10),
    db.select({ count: sql<number>`COUNT(*)` }).from(inventoryItems).where(
      sql`currentStock <= minStock`
    ),
  ]);

  const total = Number(totalRooms[0]?.count ?? 0);
  const occupied = Number(roomStatuses.find((r) => r.status === "occupee")?.count ?? 0);
  const libre = Number(roomStatuses.find((r) => r.status === "libre")?.count ?? 0);
  const maintenance = Number(roomStatuses.find((r) => r.status === "maintenance")?.count ?? 0);
  const reservee = Number(roomStatuses.find((r) => r.status === "reservee")?.count ?? 0);
  const nettoyage = Number(roomStatuses.find((r) => r.status === "nettoyage")?.count ?? 0);
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const caTotal = parseFloat(totalRevenue[0]?.total ?? "0");
  const nbReservations = Number(monthReservations[0]?.count ?? 0);
  const adr = occupied > 0 ? caTotal / occupied : 0;
  const revpar = total > 0 ? caTotal / total : 0;
  const avgBasket = nbReservations > 0 ? caTotal / nbReservations : 0;

  return {
    occupancyRate,
    revpar,
    adr,
    caTotal,
    totalRooms: total,
    occupiedRooms: occupied,
    freeRooms: libre,
    maintenanceRooms: maintenance,
    reservedRooms: reservee,
    cleaningRooms: nettoyage,
    monthReservations: nbReservations,
    avgBasket,
    lowStockItems: Number(lowStockItems[0]?.count ?? 0),
    recentReservations,
    roomStatuses,
  };
}

export async function getMonthlyRevenue(year: number) {
  const db = await getDb();
  if (!db) return [];
  const results = [];
  for (let m = 1; m <= 12; m++) {
    const start = `${year}-${m.toString().padStart(2, "0")}-01`;
    const end = new Date(year, m, 0).toISOString().split("T")[0];
    const [hebergement, servicesRev] = await Promise.all([
      db.select({ total: sql<string>`COALESCE(SUM(totalAmount),0)` }).from(reservations).where(
        sql`checkInDate >= ${start} AND checkInDate <= ${end} AND status IN ('confirmee','checkin','checkout')`
      ),
      db.select({ total: sql<string>`COALESCE(SUM(totalPrice),0)` }).from(reservationServices).where(
        and(gte(reservationServices.date, new Date(year, m - 1, 1)), lte(reservationServices.date, new Date(year, m, 0)))
      ),
    ]);
    results.push({
      month: m,
      hebergement: parseFloat(hebergement[0]?.total ?? "0"),
      services: parseFloat(servicesRev[0]?.total ?? "0"),
    });
  }
  return results;
}

// ─── CAISSE ──────────────────────────────────────────────────────────────────
function getPeriodDates(period?: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "week") {
    const day = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  }
  return { start, end };
}

export async function getCaisseSummary(period?: string) {
  const db = await getDb();
  if (!db) return { totalEncaissements: 0, totalDecaissements: 0, solde: 0 };
  const { start, end } = getPeriodDates(period);

  const [enc, dec] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(and(
        sql`type = 'encaissement' OR type IS NULL`,
        gte(payments.paidAt, start),
        lte(payments.paidAt, end)
      )),
    db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
      .from(payments)
      .where(and(
        sql`type = 'decaissement'`,
        gte(payments.paidAt, start),
        lte(payments.paidAt, end)
      )),
  ]);

  const totalEncaissements = parseFloat(enc[0]?.total ?? "0");
  const totalDecaissements = parseFloat(dec[0]?.total ?? "0");
  return {
    totalEncaissements,
    totalDecaissements,
    solde: totalEncaissements - totalDecaissements,
  };
}

export async function getCaisseTransactions(period?: string) {
  const db = await getDb();
  if (!db) return [];
  const { start, end } = getPeriodDates(period);

  return db.select({
    id: payments.id,
    type: payments.type,
    amount: payments.amount,
    method: payments.method,
    description: payments.description,
    notes: payments.notes,
    reference: payments.reference,
    paidAt: payments.paidAt,
  })
    .from(payments)
    .where(and(gte(payments.paidAt, start), lte(payments.paidAt, end)))
    .orderBy(desc(payments.paidAt));
}

export async function createCaisseTransaction(data: {
  type: "encaissement" | "decaissement";
  amount: string;
  method?: string;
  description?: string;
  reservationId?: number;
}) {
  const db = await getDb();
  if (!db) return null;

  // Find clientId if reservationId provided
  let clientId = 1; // default
  if (data.reservationId) {
    const res = await db.select({ clientId: reservations.clientId }).from(reservations).where(eq(reservations.id, data.reservationId)).limit(1);
    if (res[0]) clientId = res[0].clientId;
  }

  await db.insert(payments).values({
    clientId,
    reservationId: data.reservationId ?? undefined,
    amount: data.amount,
    method: (data.method as any) ?? "especes",
    type: data.type as any,
    description: data.description ?? undefined,
    status: "complete",
    paidAt: new Date(),
  });

  // Update reservation paidAmount if linked
  if (data.reservationId && data.type === "encaissement") {
    const res = await db.select({ paidAmount: reservations.paidAmount }).from(reservations).where(eq(reservations.id, data.reservationId)).limit(1);
    if (res[0]) {
      const newPaid = parseFloat(res[0].paidAmount ?? "0") + parseFloat(data.amount);
      await db.update(reservations).set({ paidAmount: newPaid.toString() }).where(eq(reservations.id, data.reservationId));
    }
  }

  return true;
}

// ─── COUNTRIES & CITIES ──────────────────────────────────────────────────────
import { countries, cities, hotelProfiles, InsertHotelProfile } from "../drizzle/schema";

export async function getCountries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(countries).orderBy(countries.name);
}

export async function getCitiesByCountry(countryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cities).where(eq(cities.countryId, countryId)).orderBy(cities.name);
}

export async function seedCountriesAndCities() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(countries).limit(1);
  if (existing.length > 0) return; // already seeded

  const data = [
    { code: "BJ", name: "Bénin", flag: "🇧🇯", cities: ["Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", "Bohicon", "Natitingou"] },
    { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", cities: ["Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro", "Korhogo"] },
    { code: "SN", name: "Sénégal", flag: "🇸🇳", cities: ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor", "Kaolack", "Mbour"] },
    { code: "ML", name: "Mali", flag: "🇲🇱", cities: ["Bamako", "Sikasso", "Mopti", "Ségou", "Kayes", "Gao"] },
    { code: "BF", name: "Burkina Faso", flag: "🇧🇫", cities: ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", "Kaya"] },
    { code: "TG", name: "Togo", flag: "🇹🇬", cities: ["Lomé", "Sokodé", "Kara", "Atakpamé", "Kpalimé", "Tsévié"] },
    { code: "GH", name: "Ghana", flag: "🇬🇭", cities: ["Accra", "Kumasi", "Tamale", "Cape Coast", "Sekondi-Takoradi", "Tema"] },
    { code: "NG", name: "Nigeria", flag: "🇳🇬", cities: ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City"] },
    { code: "CM", name: "Cameroun", flag: "🇨🇲", cities: ["Douala", "Yaoundé", "Garoua", "Bamenda", "Maroua", "Bafoussam"] },
    { code: "GN", name: "Guinée", flag: "🇬🇳", cities: ["Conakry", "Nzérékoré", "Kankan", "Kindia", "Labé", "Mamou"] },
    { code: "FR", name: "France", flag: "🇫🇷", cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Bordeaux"] },
    { code: "MA", name: "Maroc", flag: "🇲🇦", cities: ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir"] },
    { code: "TN", name: "Tunisie", flag: "🇹🇳", cities: ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès"] },
    { code: "DZ", name: "Algérie", flag: "🇩🇿", cities: ["Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna"] },
    { code: "GA", name: "Gabon", flag: "🇬🇦", cities: ["Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda", "Mouila"] },
  ];

  for (const country of data) {
    const [inserted] = await db.insert(countries).values({ code: country.code, name: country.name, flag: country.flag });
    const countryId = (inserted as any).insertId;
    if (countryId) {
      for (const cityName of country.cities) {
        await db.insert(cities).values({ name: cityName, countryId });
      }
    }
  }
}

// ─── HOTEL PROFILES ──────────────────────────────────────────────────────────
export async function getHotelProfiles(filters?: { countryId?: number; cityId?: number; type?: "hotel" | "restaurant"; maxPrice?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(hotelProfiles.isActive, true)];
  if (filters?.countryId) conditions.push(eq(hotelProfiles.countryId, filters.countryId));
  if (filters?.cityId) conditions.push(eq(hotelProfiles.cityId, filters.cityId));
  if (filters?.type) conditions.push(eq(hotelProfiles.type, filters.type));
  const allResults = await db
    .select({
      id: hotelProfiles.id,
      userId: hotelProfiles.userId,
      hotelName: hotelProfiles.hotelName,
      managerName: hotelProfiles.managerName,
      phone: hotelProfiles.phone,
      email: hotelProfiles.email,
      address: hotelProfiles.address,
      countryId: hotelProfiles.countryId,
      cityId: hotelProfiles.cityId,
      type: hotelProfiles.type,
      stars: hotelProfiles.stars,
      logoUrl: hotelProfiles.logoUrl,
      description: hotelProfiles.description,
      countryName: countries.name,
      countryFlag: countries.flag,
      cityName: cities.name,
    })
    .from(hotelProfiles)
    .leftJoin(countries, eq(hotelProfiles.countryId, countries.id))
    .leftJoin(cities, eq(hotelProfiles.cityId, cities.id))
    .where(and(...conditions))
    .orderBy(hotelProfiles.hotelName);

  // Enrich each hotel with avgRating, reviewCount and minPrice
  const enriched = await Promise.all(allResults.map(async (hotel) => {
    const roomsForHotel = await getPublicRoomsByHotelUserId(hotel.userId);
    const prices = roomsForHotel
      .map((r) => r.priceOverride ? parseFloat(r.priceOverride) : (r.basePrice ? parseFloat(r.basePrice) : Infinity))
      .filter((p) => isFinite(p));
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;

    const ratingRows = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(and(eq(reviews.hotelProfileId, hotel.id), eq(reviews.approved, true)));
    const reviewCount = ratingRows.length;
    const avgRating = reviewCount > 0
      ? Math.round((ratingRows.reduce((s, r) => s + r.rating, 0) / reviewCount) * 10) / 10
      : null;

    return { ...hotel, minPrice, avgRating, reviewCount };
  }));

  // If maxPrice filter is set, keep only hotels that have at least one room <= maxPrice
  if (!filters?.maxPrice) return enriched;

  const maxP = filters.maxPrice;
  return enriched.filter((h) => h.minPrice !== null && h.minPrice <= maxP);
}

export async function getHotelProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(hotelProfiles).where(eq(hotelProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getHotelProfileById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select({
      id: hotelProfiles.id,
      userId: hotelProfiles.userId,
      hotelName: hotelProfiles.hotelName,
      managerName: hotelProfiles.managerName,
      phone: hotelProfiles.phone,
      email: hotelProfiles.email,
      address: hotelProfiles.address,
      countryId: hotelProfiles.countryId,
      cityId: hotelProfiles.cityId,
      type: hotelProfiles.type,
      stars: hotelProfiles.stars,
      logoUrl: hotelProfiles.logoUrl,
      description: hotelProfiles.description,
      countryName: countries.name,
      countryFlag: countries.flag,
      cityName: cities.name,
    })
    .from(hotelProfiles)
    .leftJoin(countries, eq(hotelProfiles.countryId, countries.id))
    .leftJoin(cities, eq(hotelProfiles.cityId, cities.id))
    .where(eq(hotelProfiles.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertHotelProfile(userId: number, data: Partial<InsertHotelProfile>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select({ id: hotelProfiles.id }).from(hotelProfiles).where(eq(hotelProfiles.userId, userId)).limit(1);
  if (existing[0]) {
    await db.update(hotelProfiles).set({ ...data, updatedAt: new Date() }).where(eq(hotelProfiles.userId, userId));
    return existing[0].id;
  } else {
    const [res] = await db.insert(hotelProfiles).values({ userId, hotelName: data.hotelName ?? "Mon Hôtel", ...data });
    return (res as any).insertId as number;
  }
}

export async function getPublicRoomsByHotelUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: rooms.id,
      number: rooms.number,
      floor: rooms.floor,
      status: rooms.status,
      priceOverride: rooms.priceOverride,
      notes: rooms.notes,
      typeName: roomTypes.name,
      typeDescription: roomTypes.description,
      basePrice: roomTypes.basePrice,
      capacity: roomTypes.capacity,
      amenities: roomTypes.amenities,
    })
    .from(rooms)
    .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(eq(rooms.status, "libre"))
    .orderBy(rooms.number);
}

/// ─── REVIEWS ────────────────────────────────────────────────────────────────

export async function getReviewsByHotel(hotelProfileId: number, approvedOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(reviews.hotelProfileId, hotelProfileId)];
  if (approvedOnly) conditions.push(eq(reviews.approved, true));
  return db
    .select()
    .from(reviews)
    .where(and(...conditions))
    .orderBy(desc(reviews.createdAt));
}

export async function getHotelRatingSummary(hotelProfileId: number) {
  const db = await getDb();
  if (!db) return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const rows = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(and(eq(reviews.hotelProfileId, hotelProfileId), eq(reviews.approved, true)));
  if (!rows.length) return { average: 0, total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of rows) {
    distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
    sum += r.rating;
  }
  return {
    average: Math.round((sum / rows.length) * 10) / 10,
    total: rows.length,
    distribution,
  };
}

export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [res] = await db.insert(reviews).values(data);
  return { id: (res as any).insertId as number };
}

export async function approveReview(id: number, approved: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(reviews).set({ approved }).where(eq(reviews.id, id));
}

export async function deleteReview(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(reviews).where(eq(reviews.id, id));
}

export async function getAllReviewsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: reviews.id,
      hotelProfileId: reviews.hotelProfileId,
      clientName: reviews.clientName,
      clientEmail: reviews.clientEmail,
      rating: reviews.rating,
      comment: reviews.comment,
      approved: reviews.approved,
      createdAt: reviews.createdAt,
      hotelName: hotelProfiles.hotelName,
    })
    .from(reviews)
    .leftJoin(hotelProfiles, eq(reviews.hotelProfileId, hotelProfiles.id))
    .orderBy(desc(reviews.createdAt));
}

// ─── SPECIAL OFFERS ──────────────────────────────────────────────────────────
import { specialOffers, InsertSpecialOffer } from "../drizzle/schema";

/** List all offers for a hotel (admin view — all statuses) */
export async function getOffersByHotel(hotelProfileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(specialOffers)
    .where(eq(specialOffers.hotelProfileId, hotelProfileId))
    .orderBy(desc(specialOffers.createdAt));
}

/** List only active & currently valid offers (public view) */
export async function getActiveOffersByHotel(hotelProfileId: number) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const rows = await db
    .select()
    .from(specialOffers)
    .where(eq(specialOffers.hotelProfileId, hotelProfileId))
    .orderBy(desc(specialOffers.createdAt));
  // Filter active + within validity window
  return rows.filter((o) => {
    if (!o.active) return false;
    if (o.validFrom && new Date(o.validFrom) > now) return false;
    if (o.validUntil && new Date(o.validUntil) < now) return false;
    return true;
  });
}

/** Create a new offer */
export async function createOffer(data: InsertSpecialOffer) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(specialOffers).values(data);
  return { id: (result as any).insertId as number };
}

/** Update an existing offer */
export async function updateOffer(id: number, data: Partial<InsertSpecialOffer>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(specialOffers).set(data).where(eq(specialOffers.id, id));
  return { success: true };
}

/** Delete an offer */
export async function deleteOffer(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(specialOffers).where(eq(specialOffers.id, id));
  return { success: true };
}

// ─── ROOM PHOTOS ──────────────────────────────────────────────────────────────

export async function getPhotosByRoom(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(roomPhotos)
    .where(eq(roomPhotos.roomId, roomId))
    .orderBy(roomPhotos.sortOrder);
}

export async function updatePhotoCaption(photoId: number, caption: string | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(roomPhotos).set({ caption }).where(eq(roomPhotos.id, photoId));
}

export async function reorderPhotos(photos: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) return;
  for (const p of photos) {
    await db.update(roomPhotos).set({ sortOrder: p.sortOrder }).where(eq(roomPhotos.id, p.id));
  }
}

export async function deleteRoomPhoto(photoId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(roomPhotos).where(eq(roomPhotos.id, photoId));
}

// ─── AVAILABILITY BY DATES ───────────────────────────────────────────────────
/**
 * Returns rooms for a given hotel (userId) that are NOT booked (confirmed/checkin)
 * during the requested period [checkIn, checkOut).
 * A conflict exists when: reservation.checkInDate < checkOut AND reservation.checkOutDate > checkIn
 */
export async function getAvailableRoomsByDates(
  userId: number,
  checkIn: string,
  checkOut: string,
) {
  const db = await getDb();
  if (!db) return [];

  // Find room IDs that have conflicting confirmed reservations
  const conflicting = await db
    .select({ roomId: reservations.roomId })
    .from(reservations)
    .where(
      and(
        // Only confirmed or checked-in reservations block availability
        or(
          eq(reservations.status, "confirmee"),
          eq(reservations.status, "checkin"),
        ),
        // Overlap condition: resCheckIn < checkOut AND resCheckOut > checkIn
        sql`${reservations.checkInDate} < ${checkOut}`,
        sql`${reservations.checkOutDate} > ${checkIn}`,
      ),
    );

  const blockedRoomIds = conflicting.map((r) => r.roomId);

  // Build base conditions: all rooms (mono-tenant), status libre or reservee
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseConditions: any[] = [];
  if (blockedRoomIds.length > 0) {
    baseConditions.push(notInArray(rooms.id, blockedRoomIds));
  }

  return db
    .select({
      id: rooms.id,
      number: rooms.number,
      floor: rooms.floor,
      status: rooms.status,
      priceOverride: rooms.priceOverride,
      notes: rooms.notes,
      typeName: roomTypes.name,
      typeDescription: roomTypes.description,
      basePrice: roomTypes.basePrice,
      capacity: roomTypes.capacity,
      amenities: roomTypes.amenities,
    })
    .from(rooms)
    .leftJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
    .where(and(...baseConditions, or(eq(rooms.status, "libre"), eq(rooms.status, "reservee"))))
    .orderBy(rooms.number);
}
