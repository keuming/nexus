import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Bootstrap Admin Promotion", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should verify BOOTSTRAP_SECRET is set", () => {
    const secret = process.env.BOOTSTRAP_SECRET;
    expect(secret).toBeDefined();
    expect(secret).not.toBe("");
    expect(secret?.length).toBeGreaterThan(0);
  });

  it("should find keumingo@gmail.com user in database", async () => {
    if (!db) {
      console.warn("Database not available, skipping test");
      return;
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, "keumingo@gmail.com"))
      .limit(1);

    expect(user).toBeDefined();
    if (user) {
      console.log(`✓ Found user: ${user.email} (ID: ${user.id}, Role: ${user.role})`);
    }
  });
});
