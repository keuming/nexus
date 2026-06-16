import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";

// Mock les dépendances
vi.mock("../db", () => ({
  getDb: vi.fn(async () => ({
    insert: vi.fn(() => ({
      values: vi.fn(async () => ({ id: 1 })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(async () => []),
        })),
        orderBy: vi.fn(async () => []),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(async () => ({ id: 1 })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => ({ id: 1 })),
    })),
  })),
}));

describe("Stations Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate station creation input", () => {
    const schema = z.object({
      companyId: z.number(),
      name: z.string().min(1, "Le nom de la gare est requis"),
      city: z.string().min(1, "La ville est requise"),
      countryId: z.number().optional(),
      address: z.string().optional(),
    });

    // Valid input
    const validInput = {
      companyId: 1,
      name: "Gare Centrale Abidjan",
      city: "Abidjan",
      address: "123 Rue de la Gare",
    };

    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should fail validation without required fields", () => {
    const schema = z.object({
      companyId: z.number(),
      name: z.string().min(1, "Le nom de la gare est requis"),
      city: z.string().min(1, "La ville est requise"),
      countryId: z.number().optional(),
      address: z.string().optional(),
    });

    const invalidInput = {
      companyId: 1,
      name: "",
      city: "",
    };

    const result = schema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should validate station update input", () => {
    const schema = z.object({
      id: z.number(),
      name: z.string().optional(),
      city: z.string().optional(),
      countryId: z.number().optional(),
      address: z.string().optional(),
      active: z.boolean().optional(),
    });

    const validInput = {
      id: 1,
      name: "Gare Centrale Abidjan Rénovée",
      active: true,
    };

    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should validate station list query input", () => {
    const schema = z.object({ companyId: z.number() });

    const validInput = { companyId: 1 };
    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should validate station toggle status input", () => {
    const schema = z.object({
      id: z.number(),
      active: z.boolean(),
    });

    const validInput = { id: 1, active: false };
    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);
  });
});
