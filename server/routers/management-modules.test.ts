import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTRPCMsw } from "msw-trpc";
import { appRouter } from "../routers";

// Mock database functions
vi.mock("../transport-db", () => ({
  getTransportCharges: vi.fn(),
  createTransportCharge: vi.fn(),
  getBoardingStatus: vi.fn(),
  getPassengersForBoarding: vi.fn(),
  updatePassengerBoarding: vi.fn(),
  getManifestPassengers: vi.fn(),
}));

describe("Management Modules - Finance, Embarquement, Manifeste", () => {
  describe("Finance Module", () => {
    it("should get daily financial summary", () => {
      const caller = appRouter.createCaller({
        user: { id: 1, email: "test@test.com", role: "admin" },
        db: {} as any,
      });

      expect(caller.management.finance).toBeDefined();
      expect(caller.management.finance.getDailySummary).toBeDefined();
    });

    it("should get monthly financial summary", () => {
      const caller = appRouter.createCaller({
        user: { id: 1, email: "test@test.com", role: "admin" },
        db: {} as any,
      });

      expect(caller.management.finance.getMonthlySummary).toBeDefined();
    });

    it("should create a charge", () => {
      const caller = appRouter.createCaller({
        user: { id: 1, email: "test@test.com", role: "admin" },
        db: {} as any,
      });

      expect(caller.management.finance.createCharge).toBeDefined();
    });

    it("should get charges history", () => {
      const caller = appRouter.createCaller({
        user: { id: 1, email: "test@test.com", role: "admin" },
        db: {} as any,
      });

      expect(caller.management.finance.getChargesHistory).toBeDefined();
    });
  });

  describe("Embarquement Module", () => {
    it("should get boarding status", () => {
      const caller = appRouter.createCaller({
        user: { id: 1, email: "test@test.com", role: "admin" },
        db: {} as any,
      });

      expect(caller.management.embarquement).toBeDefined();
      expect(caller.management.embarquement.getBoardingStatus).toBeDefined();
    });

    it("should get passengers list for boarding", () => {
      const caller = appRouter.createCaller({
        user: { id: 1, email: "test@test.com", role: "admin" },
        db: {} as any,
      });

      expect(caller.management.embarquement.getPassengersList).toBeDefined();
    });

    it("should update boarding status", () => {
      const caller = appRouter.createCaller({
        user: { id: 1, email: "test@test.com", role: "admin" },
        db: {} as any,
      });

      expect(
        caller.management.embarquement.updateBoardingStatus
      ).toBeDefined();
    });
  });

  describe("Manifeste Module", () => {
    it("should get manifest", () => {
      const caller = appRouter.createCaller({
        user: { id: 1, email: "test@test.com", role: "admin" },
        db: {} as any,
      });

      expect(caller.management.manifeste).toBeDefined();
      expect(caller.management.manifeste.getManifest).toBeDefined();
    });

    it("should get manifest for print", () => {
      const caller = appRouter.createCaller({
        user: { id: 1, email: "test@test.com", role: "admin" },
        db: {} as any,
      });

      expect(caller.management.manifeste.getManifestForPrint).toBeDefined();
    });
  });

  describe("Protected Procedures", () => {
    it("should require authentication for finance operations", async () => {
      const caller = appRouter.createCaller({
        user: null,
        db: {} as any,
      });

      try {
        await caller.management.finance.getDailySummary({});
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should require authentication for embarquement operations", async () => {
      const caller = appRouter.createCaller({
        user: null,
        db: {} as any,
      });

      try {
        await caller.management.embarquement.getBoardingStatus({});
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should require authentication for manifeste operations", async () => {
      const caller = appRouter.createCaller({
        user: null,
        db: {} as any,
      });

      try {
        await caller.management.manifeste.getManifest({});
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
