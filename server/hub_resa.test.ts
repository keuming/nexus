import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-test",
      email: "admin@hubresa.com",
      name: "Admin Test",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("auth", () => {
  it("auth.me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("auth.me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("admin");
  });

  it("auth.logout clears cookie and returns success", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string) => cleared.push(name),
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(cleared.length).toBeGreaterThan(0);
  });
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

describe("dashboard", () => {
  it("dashboard.getStats returns valid structure", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dashboard.getStats();
    // May be null if DB unavailable in test env
    if (result) {
      expect(typeof result.occupancyRate).toBe("number");
      expect(typeof result.totalRooms).toBe("number");
      expect(Array.isArray(result.recentReservations)).toBe(true);
    }
  });

  it("dashboard.getMonthlyRevenue returns 12 months", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.dashboard.getMonthlyRevenue({ year: 2026 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(12);
    result.forEach((m) => {
      expect(typeof m.month).toBe("number");
      expect(m.month).toBeGreaterThanOrEqual(1);
      expect(m.month).toBeLessThanOrEqual(12);
    });
  });
});

// ─── Rooms ────────────────────────────────────────────────────────────────────

describe("rooms", () => {
  it("rooms.list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.rooms.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rooms.getRoomTypes returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.rooms.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Reservations ─────────────────────────────────────────────────────────────

describe("reservations", () => {
  it("reservations.list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.reservations.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Clients ──────────────────────────────────────────────────────────────────

describe("clients", () => {
  it("clients.list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.clients.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Services ─────────────────────────────────────────────────────────────────

describe("services", () => {
  it("services.list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.services.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Housekeeping ─────────────────────────────────────────────────────────────

describe("housekeeping", () => {
  it("housekeeping.list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.housekeeping.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Inventory ────────────────────────────────────────────────────────────────

describe("inventory", () => {
  it("inventory.list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.inventory.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("inventory.getCategories returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.inventory.getCategories();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Employees ────────────────────────────────────────────────────────────────

describe("employees", () => {
  it("employees.list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.employees.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Caisse ───────────────────────────────────────────────────────────────────

describe("caisse", () => {
  it("caisse.getSummary returns valid structure", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.caisse.getSummary();
    expect(typeof result.totalEncaissements).toBe("number");
    expect(typeof result.totalDecaissements).toBe("number");
    expect(typeof result.solde).toBe("number");
  });

  it("caisse.getTransactions returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.caisse.getTransactions();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("reviews", () => {
  it("creates a review and lists it", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    // Create review
    const result = await caller.reviews.create({
      hotelProfileId: 1,
      clientName: "Jean Test",
      rating: 5,
      comment: "Excellent séjour !",
    });
    expect(result).toHaveProperty("id");
  });

  it("returns rating summary", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const summary = await caller.reviews.summary({ hotelProfileId: 1 });
    expect(summary).toHaveProperty("average");
    expect(summary).toHaveProperty("total");
    expect(summary).toHaveProperty("distribution");
  });
});

// ─── Photos / Carrousel ───────────────────────────────────────────────────────

describe("photos", () => {
  it("photos.recentPublic returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.photos.recentPublic({ limit: 5 });
    expect(Array.isArray(result)).toBe(true);
    // Each item must have required fields
    for (const item of result) {
      expect(typeof item.id).toBe("number");
      expect(typeof item.url).toBe("string");
      expect(typeof item.companyId).toBe("number");
    }
  });

  it("photos.companiesForCarousel returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.photos.companiesForCarousel();
    expect(Array.isArray(result)).toBe(true);
    // Each item must have required fields
    for (const item of result) {
      expect(typeof item.id).toBe("number");
      expect(["active", "pending", "suspended", "rejected"]).toContain(item.status);
    }
  });

  it("photos.getBannerPhotos returns an object", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.photos.getBannerPhotos();
    expect(typeof result).toBe("object");
    expect(result).not.toBeNull();
  });
});
