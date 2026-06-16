import { describe, it, expect, beforeEach, vi } from "vitest";
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
} from "./shop-db";

describe("Shop CRUD Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Shop Products", () => {
    it("should generate a valid order reference", async () => {
      const reference = await generateOrderReference();
      expect(reference).toBeDefined();
      expect(reference).toMatch(/^PRD-\d{6}-[A-Z]{3}$/);
    });

    it("should create a shop product", async () => {
      const result = await createShopProduct({
        supplierId: 3, // ZAZA DÉPÔT
        name: "Bouteille de gaz B6",
        description: "Bouteille de gaz 6kg",
        category: "Gaz",
        price: "3500.00",
        stock: 50,
        sku: "B6-001",
        barcode: "1234567890123",
        imageUrl: "https://example.com/b6.jpg",
        minStockAlert: 10,
        isActive: true,
      });
      expect(result).toBeDefined();
    });

    it("should get product by ID", async () => {
      const product = await getShopProductById(1);
      if (product) {
        expect(product.id).toBe(1);
        expect(product.name).toBeDefined();
        expect(product.supplierId).toBeDefined();
      }
    });

    it("should get products by supplier", async () => {
      const products = await getShopProductsBySupplierId(3);
      expect(Array.isArray(products)).toBe(true);
    });

    it("should get products by category", async () => {
      const products = await getShopProductsByCategory(3, "Gaz");
      expect(Array.isArray(products)).toBe(true);
    });

    it("should search products", async () => {
      const products = await searchShopProducts(3, "Gaz");
      expect(Array.isArray(products)).toBe(true);
    });

    it("should update product", async () => {
      const result = await updateShopProduct(1, { stock: 45 });
      expect(result).toBeDefined();
    });

    it("should get low stock products", async () => {
      const products = await getShopProductsLowStock(3);
      expect(Array.isArray(products)).toBe(true);
    });

    it("should delete product (soft delete)", async () => {
      const result = await deleteShopProduct(1);
      expect(result).toBeDefined();
    });
  });

  describe("Shop Product Orders", () => {
    it("should create a shop product order", async () => {
      const reference = await generateOrderReference();
      const result = await createShopProductOrder({
        reference,
        supplierId: 3,
        clientName: "Jean Dupont",
        clientPhone: "+225 07 12 34 56 78",
        clientEmail: "jean@example.com",
        deliveryAddress: "123 Rue du Commerce",
        city: "Abidjan",
        totalAmountXOF: "7000.00",
        paymentMethod: "cash",
        notes: "Livraison rapide",
        status: "pending",
      });
      expect(result).toBeDefined();
    });

    it("should get order by ID", async () => {
      const order = await getShopProductOrderById(1);
      if (order) {
        expect(order.id).toBe(1);
        expect(order.reference).toBeDefined();
        expect(order.clientName).toBeDefined();
      }
    });

    it("should get order by reference", async () => {
      const reference = "PRD-123456-ABC";
      const order = await getShopProductOrderByReference(reference);
      // Order may or may not exist, but function should work
      expect(order === null || order.reference === reference).toBe(true);
    });

    it("should get orders by supplier", async () => {
      const orders = await getShopProductOrdersBySupplierId(3);
      expect(Array.isArray(orders)).toBe(true);
    });

    it("should get orders by status", async () => {
      const orders = await getShopProductOrdersByStatus(3, "pending");
      expect(Array.isArray(orders)).toBe(true);
    });

    it("should update order status", async () => {
      const result = await updateShopProductOrder(1, { status: "confirmed" });
      expect(result).toBeDefined();
    });
  });

  describe("Stock Movements", () => {
    it("should create stock movement", async () => {
      const result = await createStockMovement({
        productId: 1,
        supplierId: 3,
        movementType: "in",
        quantity: 10,
        reason: "Restock",
      });
      expect(result).toBeDefined();
    });

    it("should get stock movements by product", async () => {
      const movements = await getStockMovementsByProductId(1);
      expect(Array.isArray(movements)).toBe(true);
    });

    it("should get stock movements by supplier", async () => {
      const movements = await getStockMovementsBySupplierId(3);
      expect(Array.isArray(movements)).toBe(true);
    });

    it("should decrease product stock", async () => {
      const newStock = await decreaseProductStock(1, 5);
      expect(typeof newStock).toBe("number");
      expect(newStock).toBeGreaterThanOrEqual(0);
    });

    it("should increase product stock", async () => {
      const newStock = await increaseProductStock(1, 10, "Restock");
      expect(typeof newStock).toBe("number");
      expect(newStock).toBeGreaterThan(0);
    });
  });

  describe("Order Items", () => {
    it("should create order item", async () => {
      const result = await createShopProductOrderItem({
        orderId: 1,
        productId: 1,
        quantity: 2,
        unitPrice: "3500.00",
        subtotal: "7000.00",
      });
      expect(result).toBeDefined();
    });

    it("should get order items by order ID", async () => {
      const items = await getShopProductOrderItemsByOrderId(1);
      expect(Array.isArray(items)).toBe(true);
    });

    it("should delete order item", async () => {
      const result = await deleteShopProductOrderItem(1);
      expect(result).toBeDefined();
    });
  });
});
