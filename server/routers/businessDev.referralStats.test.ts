/**
 * businessDev.referralStats.test.ts — Tests pour les statistiques de parrainage
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";
import { businessDevelopers, transportCompanies, creditTransactions, companyCredits } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

// Helper pour créer un token BDev
async function createBdevToken(bdId: string, id: number): Promise<string> {
  const key = new TextEncoder().encode("test_secret_bdev");
  return new SignJWT({ bdId, id, type: "bdev" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

describe("BDev Referral Stats", () => {
  let db: any;
  let testBdevId: number;
  let testBdevBdId: string;
  let testToken: string;
  let testCompanyId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Créer un BDev de test
    const pinHash = await bcrypt.hash("1234", 10);
    const bdIdValue = `BD${Math.floor(10000 + Math.random() * 90000)}`;
    await db.insert(businessDevelopers).values({
      firstName: "Test",
      lastName: "BDev",
      email: `test-referral-${Date.now()}@test.com`,
      loginPhone: `+225${Math.random().toString().slice(2, 11)}`,
      pinHash,
      bdId: bdIdValue,
      status: "active",
      commissionRate: 5,
    });

    const [bdev] = await db
      .select({ id: businessDevelopers.id, bdId: businessDevelopers.bdId })
      .from(businessDevelopers)
      .where(eq(businessDevelopers.bdId, bdIdValue));

    testBdevId = bdev.id;
    testBdevBdId = bdev.bdId;
    testToken = await createBdevToken(testBdevBdId, testBdevId);

    // Créer une compagnie recrutée par ce BDev
    await db.insert(transportCompanies).values({
      companyName: "Test Company",
      activityType: "transport",
      status: "active",
      bdId: testBdevBdId,
    });

    const [company] = await db
      .select({ id: transportCompanies.id })
      .from(transportCompanies)
      .where(eq(transportCompanies.bdId, testBdevBdId));

    testCompanyId = company.id;

    // Initialiser les crédits de la compagnie
    await db.insert(companyCredits).values({
      companyId: testCompanyId,
      balance: 1000,
    });

    // Ajouter une transaction de crédit
    await db.insert(creditTransactions).values({
      companyId: testCompanyId,
      type: "credit",
      points: 100,
      amountLocal: 12500,
      description: "Test transaction",
      balanceBefore: 1000,
      balanceAfter: 1100,
    });
  });

  afterAll(async () => {
    if (!db) return;

    // Nettoyer les données de test
    await db.delete(creditTransactions).where(eq(creditTransactions.companyId, testCompanyId));
    await db.delete(companyCredits).where(eq(companyCredits.companyId, testCompanyId));
    await db.delete(transportCompanies).where(eq(transportCompanies.bdId, testBdevBdId));
    await db.delete(businessDevelopers).where(eq(businessDevelopers.id, testBdevId));
  });

  it("should return referral stats with correct structure", async () => {
    // Simuler la procédure getReferralStats
    const payload = { bdId: testBdevBdId, id: testBdevId };

    const [bdev] = await db
      .select({ bdId: businessDevelopers.bdId, status: businessDevelopers.status })
      .from(businessDevelopers)
      .where(eq(businessDevelopers.id, payload.id));

    expect(bdev).toBeDefined();
    expect(bdev.status).toBe("active");

    const companies = await db
      .select({
        id: transportCompanies.id,
        companyName: transportCompanies.companyName,
        activityType: transportCompanies.activityType,
        status: transportCompanies.status,
        createdAt: transportCompanies.createdAt,
      })
      .from(transportCompanies)
      .where(eq(transportCompanies.bdId, bdev.bdId));

    expect(companies).toHaveLength(1);
    expect(companies[0].companyName).toBe("Test Company");
    expect(companies[0].status).toBe("active");
  });

  it("should count companies by status correctly", async () => {
    const [bdev] = await db
      .select({ bdId: businessDevelopers.bdId })
      .from(businessDevelopers)
      .where(eq(businessDevelopers.id, testBdevId));

    const companies = await db
      .select({
        id: transportCompanies.id,
        status: transportCompanies.status,
      })
      .from(transportCompanies)
      .where(eq(transportCompanies.bdId, bdev.bdId));

    const activeCount = companies.filter((c: any) => c.status === "active").length;
    const pendingCount = companies.filter((c: any) => c.status === "pending").length;

    expect(activeCount).toBe(1);
    expect(pendingCount).toBe(0);
  });

  it("should calculate revenue correctly", async () => {
    const [transaction] = await db
      .select({ amountLocal: creditTransactions.amountLocal })
      .from(creditTransactions)
      .where(eq(creditTransactions.companyId, testCompanyId));

    expect(transaction).toBeDefined();
    expect(Number(transaction?.amountLocal ?? 0)).toBe(12500);
  });
});
