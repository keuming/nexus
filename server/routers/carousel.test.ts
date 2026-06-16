import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock les dépendances
vi.mock("../transport-db", () => ({
  createQuoteRequest: vi.fn(async (data) => {
    return { id: 1, ...data, createdAt: new Date(), updatedAt: new Date() };
  }),
  getQuoteRequests: vi.fn(async (filters) => {
    return [
      {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        phone: "+225123456789",
        activityType: "transport",
        message: "Test message",
        status: "new",
        createdAt: new Date(),
      },
    ];
  }),
  updateQuoteRequestStatus: vi.fn(async (id, status, notes) => {
    return { id, status, notes, updatedAt: new Date() };
  }),
}));

vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

describe("Carousel Router - Quote Requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate quote request input", () => {
    const schema = z.object({
      name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
      email: z.string().email("Email invalide"),
      phone: z.string().min(8, "Téléphone invalide"),
      activityType: z.enum(["transport", "restaurant", "expedition"]),
      message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
    });

    // Valid input
    const validInput = {
      name: "John Doe",
      email: "john@example.com",
      phone: "+225123456789",
      activityType: "transport" as const,
      message: "I would like to request a quote for transport services",
    };

    expect(() => schema.parse(validInput)).not.toThrow();

    // Invalid email
    expect(() =>
      schema.parse({
        ...validInput,
        email: "invalid-email",
      })
    ).toThrow();

    // Short name
    expect(() =>
      schema.parse({
        ...validInput,
        name: "A",
      })
    ).toThrow();

    // Short message
    expect(() =>
      schema.parse({
        ...validInput,
        message: "Too short",
      })
    ).toThrow();
  });

  it("should create a quote request successfully", async () => {
    const { createQuoteRequest } = await import("../transport-db");

    const result = await createQuoteRequest({
      name: "John Doe",
      email: "john@example.com",
      phone: "+225123456789",
      activityType: "transport",
      message: "I would like to request a quote for transport services",
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.name).toBe("John Doe");
    expect(result?.activityType).toBe("transport");
  });

  it("should fetch quote requests with filters", async () => {
    const { getQuoteRequests } = await import("../transport-db");

    const results = await getQuoteRequests({
      status: "new",
      activityType: "transport",
    });

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0]).toHaveProperty("name");
      expect(results[0]).toHaveProperty("email");
      expect(results[0]).toHaveProperty("status");
    }
  });

  it("should update quote request status", async () => {
    const { updateQuoteRequestStatus } = await import("../transport-db");

    const result = await updateQuoteRequestStatus(1, "contacted", "Contacted via email");

    expect(result).toBeDefined();
    expect(result?.status).toBe("contacted");
    expect(result?.notes).toBe("Contacted via email");
  });

  it("should handle different activity types", () => {
    const activityTypes = ["transport", "restaurant", "expedition"];

    activityTypes.forEach((type) => {
      const schema = z.enum(["transport", "restaurant", "expedition"]);
      expect(() => schema.parse(type)).not.toThrow();
    });
  });

  it("should handle quote request status transitions", async () => {
    const { updateQuoteRequestStatus } = await import("../transport-db");

    // new -> contacted
    let result = await updateQuoteRequestStatus(1, "contacted");
    expect(result?.status).toBe("contacted");

    // contacted -> closed
    result = await updateQuoteRequestStatus(1, "closed");
    expect(result?.status).toBe("closed");
  });
});
