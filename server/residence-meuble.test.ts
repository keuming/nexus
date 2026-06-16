import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Residence Meuble Activity Type", () => {
  it("should accept residence_meuble in carousel sendQuoteRequest", () => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(8),
      activityType: z.enum(["transport", "restauration", "expedition", "hotel", "boutique", "residence_meuble"]),
      message: z.string().min(10),
    });

    const validInput = {
      name: "Test Residence",
      email: "test@example.com",
      phone: "+22512345678",
      activityType: "residence_meuble" as const,
      message: "Je suis intéressé par votre plateforme",
    };

    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should accept residence_meuble in getFilteredPartners", () => {
    const schema = z.object({
      activityType: z.enum(["transport", "restauration", "expedition", "hotel", "boutique", "residence_meuble"]),
      minRating: z.number().min(0).max(5).optional(),
      maxPrice: z.number().optional(),
      maxDistance: z.number().optional(),
    });

    const validInput = {
      activityType: "residence_meuble" as const,
      minRating: 4.0,
    };

    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should accept residence_meuble in transport router updateCompany", () => {
    const schema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      activityType: z.enum(["transport", "restauration", "expedition", "hotel", "boutique", "agence_voyage", "residence_meuble"]).optional(),
      bdId: z.string().optional(),
    });

    const validInput = {
      activityType: "residence_meuble" as const,
    };

    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should accept residence_meuble in createQuoteRequest", () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      activityType: z.enum(["transport", "restauration", "expedition", "hotel", "boutique", "residence_meuble"]),
      message: z.string(),
    });

    const validInput = {
      name: "Résidence Test",
      email: "residence@example.com",
      phone: "+22512345678",
      activityType: "residence_meuble" as const,
      message: "Demande de devis pour résidence meublée",
    };

    expect(() => schema.parse(validInput)).not.toThrow();
  });

  it("should have residence_meuble in translations", () => {
    const translations = {
      transport: { fr: "Transport", en: "Transport", es: "Transporte" },
      restaurant: { fr: "Restauration", en: "Restaurant", es: "Restaurante" },
      expedition: { fr: "Expédition", en: "Expedition", es: "Expedición" },
      hotel: { fr: "Hôtel", en: "Hotel", es: "Hotel" },
      boutique: { fr: "Boutique", en: "Boutique", es: "Boutique" },
      agenceVoyage: { fr: "Agence de Voyage", en: "Travel Agency", es: "Agencia de Viajes" },
      residenceMeuble: { fr: "Résidence Meublée", en: "Furnished Residence", es: "Residencia Amueblada" },
    };

    expect(translations.residenceMeuble).toBeDefined();
    expect(translations.residenceMeuble.fr).toBe("Résidence Meublée");
    expect(translations.residenceMeuble.en).toBe("Furnished Residence");
    expect(translations.residenceMeuble.es).toBe("Residencia Amueblada");
  });
});
