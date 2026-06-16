import { describe, it, expect, beforeAll } from "vitest";
import {
  getGasBottlesBySupplierId,
  getAvailableGasBottles,
  getGasSupplierById,
} from "./gas-db";

describe("Gas Stock Synchronization - Database to Frontend", () => {
  const ZAZA_DEPOT_ID = 3;

  describe("ZAZA DEPOT Stock Availability", () => {
    it("should return ZAZA DEPOT supplier with correct info", async () => {
      const supplier = await getGasSupplierById(ZAZA_DEPOT_ID);
      expect(supplier).toBeDefined();
      expect(supplier.length).toBeGreaterThan(0);
      expect(supplier[0].businessName).toBe("ZAZA DEPOT");
    });

    it("should return all gas bottles for ZAZA DEPOT", async () => {
      const bottles = await getGasBottlesBySupplierId(ZAZA_DEPOT_ID);
      expect(bottles).toBeDefined();
      expect(bottles.length).toBeGreaterThan(0);
      expect(bottles.length).toBe(3); // B6, B12, B25
    });

    it("should return only available bottles for ZAZA DEPOT", async () => {
      const availableBottles = await getAvailableGasBottles(ZAZA_DEPOT_ID);
      expect(availableBottles).toBeDefined();
      expect(availableBottles.length).toBeGreaterThan(0);
      
      // All bottles should be marked as available
      availableBottles.forEach((bottle) => {
        expect(bottle.isAvailable).toBe(true);
      });
    });

    it("should have correct stock quantities for each bottle type", async () => {
      const bottles = await getGasBottlesBySupplierId(ZAZA_DEPOT_ID);
      
      const bottleMap = new Map(bottles.map((b) => [b.type, b]));
      
      // Verify B6 bottle
      const b6 = bottleMap.get("B6");
      expect(b6).toBeDefined();
      expect(b6?.stock).toBe(50);
      expect(b6?.capacity).toBe("6kg");
      expect(b6?.priceXOF).toBe("3500.00");
      
      // Verify B12 bottle
      const b12 = bottleMap.get("B12");
      expect(b12).toBeDefined();
      expect(b12?.stock).toBe(35);
      expect(b12?.capacity).toBe("12kg");
      expect(b12?.priceXOF).toBe("6500.00");
      
      // Verify B25 bottle
      const b25 = bottleMap.get("B25");
      expect(b25).toBeDefined();
      expect(b25?.stock).toBe(20);
      expect(b25?.capacity).toBe("25kg");
      expect(b25?.priceXOF).toBe("12000.00");
    });

    it("should have correct delivery fees", async () => {
      const bottles = await getGasBottlesBySupplierId(ZAZA_DEPOT_ID);
      
      const bottleMap = new Map(bottles.map((b) => [b.type, b]));
      
      // Verify delivery fees
      expect(parseFloat(bottleMap.get("B6")?.deliveryFeeXOF || "0")).toBe(500);
      expect(parseFloat(bottleMap.get("B12")?.deliveryFeeXOF || "0")).toBe(800);
      expect(parseFloat(bottleMap.get("B25")?.deliveryFeeXOF || "0")).toBe(1200);
    });

    it("should have minimum stock thresholds set", async () => {
      const bottles = await getGasBottlesBySupplierId(ZAZA_DEPOT_ID);
      
      bottles.forEach((bottle) => {
        expect(bottle.minStock).toBe(5);
      });
    });

    it("should have all bottles with stock above minimum", async () => {
      const bottles = await getGasBottlesBySupplierId(ZAZA_DEPOT_ID);
      
      bottles.forEach((bottle) => {
        expect(bottle.stock).toBeGreaterThanOrEqual(bottle.minStock);
      });
    });

    it("should display stock status correctly for frontend", async () => {
      const bottles = await getAvailableGasBottles(ZAZA_DEPOT_ID);
      
      // All bottles should have stock > 0 for display
      bottles.forEach((bottle) => {
        expect(bottle.stock).toBeGreaterThan(0);
        // Frontend checks: bottle.stock > 0 to show "En stock" badge
        // and bottle.stock <= 0 to disable "Ajouter au Panier" button
      });
    });
  });

  describe("Stock Synchronization Integrity", () => {
    it("should maintain data consistency between queries", async () => {
      const bottles1 = await getGasBottlesBySupplierId(ZAZA_DEPOT_ID);
      const bottles2 = await getGasBottlesBySupplierId(ZAZA_DEPOT_ID);
      
      expect(bottles1.length).toBe(bottles2.length);
      
      // Verify same data is returned
      bottles1.forEach((bottle1, index) => {
        const bottle2 = bottles2[index];
        expect(bottle1.id).toBe(bottle2.id);
        expect(bottle1.stock).toBe(bottle2.stock);
        expect(bottle1.priceXOF).toBe(bottle2.priceXOF);
      });
    });

    it("should have all required fields for order creation", async () => {
      const bottles = await getAvailableGasBottles(ZAZA_DEPOT_ID);
      
      bottles.forEach((bottle) => {
        // Fields required for GasOrder creation
        expect(bottle.id).toBeDefined();
        expect(bottle.type).toBeDefined();
        expect(bottle.capacity).toBeDefined();
        expect(bottle.priceXOF).toBeDefined();
        expect(bottle.deliveryFeeXOF).toBeDefined();
        expect(bottle.stock).toBeDefined();
        expect(bottle.supplierId).toBe(ZAZA_DEPOT_ID);
      });
    });
  });

  describe("Frontend Display Requirements", () => {
    it("should provide data for bottle cards display", async () => {
      const bottles = await getAvailableGasBottles(ZAZA_DEPOT_ID);
      
      bottles.forEach((bottle) => {
        // Verify all fields needed for GasOrder.tsx bottle card
        expect(bottle.type).toMatch(/^B\d+$/); // B6, B12, B25
        expect(bottle.capacity).toMatch(/\d+kg/); // 6kg, 12kg, 25kg
        expect(parseFloat(bottle.priceXOF)).toBeGreaterThan(0);
        expect(parseFloat(bottle.deliveryFeeXOF)).toBeGreaterThan(0);
        expect(bottle.stock).toBeGreaterThanOrEqual(0);
        expect(bottle.isAvailable).toBe(true);
      });
    });

    it("should enable add-to-cart button when stock > 0", async () => {
      const bottles = await getAvailableGasBottles(ZAZA_DEPOT_ID);
      
      bottles.forEach((bottle) => {
        // Frontend logic: disabled={bottle.stock <= 0}
        const shouldBeEnabled = bottle.stock > 0;
        expect(shouldBeEnabled).toBe(true);
      });
    });

    it("should display stock status badge correctly", async () => {
      const bottles = await getAvailableGasBottles(ZAZA_DEPOT_ID);
      
      bottles.forEach((bottle) => {
        // Frontend logic: {bottle.stock > 0 && <span>En stock</span>}
        const shouldShowBadge = bottle.stock > 0;
        expect(shouldShowBadge).toBe(true);
      });
    });
  });
});
