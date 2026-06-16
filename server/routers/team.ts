import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companyMembers, internalMessages } from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { getCompanyByUserId } from "../transport-db";
import * as bcrypt from "bcryptjs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function getMembersByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(companyMembers)
    .where(eq(companyMembers.companyId, companyId))
    .orderBy(asc(companyMembers.role), asc(companyMembers.lastName));
}

export async function getMemberById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(companyMembers)
    .where(eq(companyMembers.id, id))
    .limit(1);
  return result[0] ?? null;
}

// ─── Messages helpers ─────────────────────────────────────────────────────────

export async function getMessagesByCompany(companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(internalMessages)
    .where(eq(internalMessages.companyId, companyId))
    .orderBy(asc(internalMessages.createdAt));
}

export async function getUnreadCountForCompany(companyId: number, senderType: "company" | "csn") {
  const db = await getDb();
  if (!db) return 0;
  // Count messages NOT sent by senderType that are unread (i.e., messages to read by the other side)
  const { count } = await import("drizzle-orm");
  const result = await db
    .select({ cnt: count() })
    .from(internalMessages)
    .where(
      and(
        eq(internalMessages.companyId, companyId),
        eq(internalMessages.isRead, false),
        eq(internalMessages.senderType, senderType === "company" ? "csn" : "company")
      )
    );
  return Number(result[0]?.cnt ?? 0);
}

export async function getTotalUnreadForCsn() {
  const db = await getDb();
  if (!db) return 0;
  const { count } = await import("drizzle-orm");
  const result = await db
    .select({ cnt: count() })
    .from(internalMessages)
    .where(
      and(
        eq(internalMessages.isRead, false),
        eq(internalMessages.senderType, "company")
      )
    );
  return Number(result[0]?.cnt ?? 0);
}

// ─── Company-scoped middleware ─────────────────────────────────────────────────

const companyProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const company = await getCompanyByUserId(ctx.user.id);
  if (!company) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Aucune compagnie associée à ce compte" });
  }
  if (company.status !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Votre compte compagnie n'est pas encore activé" });
  }
  return next({ ctx: { ...ctx, company } });
});

const csnProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé à l'administrateur HUB_RESA" });
  }
  return next({ ctx });
});

// ─── Router ───────────────────────────────────────────────────────────────────

export const teamRouter = router({
  // ─── TEAM MANAGEMENT ─────────────────────────────────────────────────────────

  // List all members of a company
  listMembers: companyProcedure.query(async ({ ctx }) => {
    const members = await getMembersByCompany(ctx.company.id);
    // Never return pinHash
    return members.map(({ pinHash: _ph, ...m }) => m);
  }),

  // Add a new member (gérant only)
  addMember: companyProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        phone: z.string().max(50).optional(),
        email: z.string().email().max(320).optional(),
        role: z.enum(["caissier", "employe"]),
        pin: z.string().length(4).regex(/^\d{4}$/, "Le PIN doit être 4 chiffres"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const pinHash = await hashPin(input.pin);
      await db.insert(companyMembers).values({
        companyId: ctx.company.id,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        email: input.email ?? null,
        role: input.role,
        pinHash,
        isActive: true,
      });
      return { success: true };
    }),

  // Update member role or status
  updateMember: companyProcedure
    .input(
      z.object({
        memberId: z.number(),
        role: z.enum(["caissier", "employe"]).optional(),
        isActive: z.boolean().optional(),
        phone: z.string().max(50).optional(),
        email: z.string().email().max(320).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await getMemberById(input.memberId);
      if (!member || member.companyId !== ctx.company.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
      }
      const { memberId, ...updates } = input;
      await db
        .update(companyMembers)
        .set(updates)
        .where(eq(companyMembers.id, memberId));
      return { success: true };
    }),

  // Reset PIN for a member
  resetPin: companyProcedure
    .input(
      z.object({
        memberId: z.number(),
        newPin: z.string().length(4).regex(/^\d{4}$/, "Le PIN doit être 4 chiffres"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await getMemberById(input.memberId);
      if (!member || member.companyId !== ctx.company.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
      }
      const pinHash = await hashPin(input.newPin);
      await db
        .update(companyMembers)
        .set({ pinHash })
        .where(eq(companyMembers.id, input.memberId));
      return { success: true };
    }),

  // Delete a member
  deleteMember: companyProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const member = await getMemberById(input.memberId);
      if (!member || member.companyId !== ctx.company.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable" });
      }
      await db
        .delete(companyMembers)
        .where(eq(companyMembers.id, input.memberId));
      return { success: true };
    }),

  // Verify PIN for a member (for cashier login)
  verifyMemberPin: publicProcedure
    .input(
      z.object({
        companyId: z.number(),
        memberId: z.number(),
        pin: z.string().length(4),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const result = await db
        .select()
        .from(companyMembers)
        .where(
          and(
            eq(companyMembers.id, input.memberId),
            eq(companyMembers.companyId, input.companyId),
            eq(companyMembers.isActive, true)
          )
        )
        .limit(1);
      const member = result[0];
      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Membre introuvable ou inactif" });
      if (!member.pinHash) throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun PIN configuré" });
      const valid = await verifyPin(input.pin, member.pinHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN incorrect" });
      // Update lastLoginAt
      await db
        .update(companyMembers)
        .set({ lastLoginAt: new Date() })
        .where(eq(companyMembers.id, input.memberId));
      const { pinHash: _ph, ...memberData } = member;
      return { success: true, member: memberData };
    }),

  // Get members by companyId (public, for PIN login screen)
  listMembersPublic: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const members = await getMembersByCompany(input.companyId);
      return members
        .filter((m) => m.isActive)
        .map(({ pinHash: _ph, ...m }) => ({ id: m.id, firstName: m.firstName, lastName: m.lastName, role: m.role }));
    }),

  // ─── INTERNAL MESSAGES ───────────────────────────────────────────────────────

  // Send a message (company side)
  sendMessageAsCompany: companyProcedure
    .input(z.object({ content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(internalMessages).values({
        companyId: ctx.company.id,
        senderType: "company",
        senderId: ctx.user.id,
        senderName: ctx.company.companyName,
        content: input.content,
        isRead: false,
      });
      return { success: true };
    }),

  // Send a message (HUB_RESA side)
  sendMessageAsCsn: csnProcedure
    .input(z.object({ companyId: z.number(), content: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(internalMessages).values({
        companyId: input.companyId,
        senderType: "csn",
        senderId: ctx.user.id,
        senderName: "Support HUB_RESA HUB_RESA",
        content: input.content,
        isRead: false,
      });
      return { success: true };
    }),

  // List messages for a company (company side)
  listMessagesForCompany: companyProcedure.query(async ({ ctx }) => {
    const messages = await getMessagesByCompany(ctx.company.id);
    return messages;
  }),

  // List messages for a company (HUB_RESA side)
  listMessagesForCsn: csnProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return getMessagesByCompany(input.companyId);
    }),

  // Mark messages as read (company marks HUB_RESA messages as read)
  markReadAsCompany: companyProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    await db
      .update(internalMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(internalMessages.companyId, ctx.company.id),
          eq(internalMessages.senderType, "csn"),
          eq(internalMessages.isRead, false)
        )
      );
    return { success: true };
  }),

  // Mark messages as read (HUB_RESA marks company messages as read)
  markReadAsCsn: csnProcedure
    .input(z.object({ companyId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(internalMessages)
        .set({ isRead: true })
        .where(
          and(
            eq(internalMessages.companyId, input.companyId),
            eq(internalMessages.senderType, "company"),
            eq(internalMessages.isRead, false)
          )
        );
      return { success: true };
    }),

  // Get unread count for company (messages from HUB_RESA not yet read)
  unreadCountForCompany: companyProcedure.query(async ({ ctx }) => {
    return getUnreadCountForCompany(ctx.company.id, "company");
  }),

  // Get total unread count for HUB_RESA (messages from all companies)
  totalUnreadForCsn: csnProcedure.query(async () => {
    return getTotalUnreadForCsn();
  }),

  // Get list of companies with message count (for HUB_RESA inbox)
  companiesWithMessages: csnProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const { transportCompanies } = await import("../../drizzle/schema");
    const { count, sql } = await import("drizzle-orm");
    // Get all companies with their unread message count
    const companies = await db
      .select({
        id: transportCompanies.id,
        companyName: transportCompanies.companyName,
        activityType: transportCompanies.activityType,
        logoUrl: transportCompanies.logoUrl,
      })
      .from(transportCompanies)
      .where(eq(transportCompanies.status, "active"))
      .orderBy(asc(transportCompanies.companyName));

    // Get unread counts per company
    const unreadCounts = await db
      .select({
        companyId: internalMessages.companyId,
        unread: count(),
      })
      .from(internalMessages)
      .where(
        and(
          eq(internalMessages.isRead, false),
          eq(internalMessages.senderType, "company")
        )
      )
      .groupBy(internalMessages.companyId);

    const unreadMap = new Map(unreadCounts.map((u) => [u.companyId, Number(u.unread)]));

    // Get last message per company
    const lastMessages = await db
      .select({
        companyId: internalMessages.companyId,
        content: internalMessages.content,
        createdAt: internalMessages.createdAt,
      })
      .from(internalMessages)
      .orderBy(desc(internalMessages.createdAt));

    const lastMessageMap = new Map<number, { content: string; createdAt: Date }>();
    for (const msg of lastMessages) {
      if (!lastMessageMap.has(msg.companyId)) {
        lastMessageMap.set(msg.companyId, { content: msg.content, createdAt: msg.createdAt });
      }
    }

    return companies.map((c) => ({
      ...c,
      unreadCount: unreadMap.get(c.id) ?? 0,
      lastMessage: lastMessageMap.get(c.id) ?? null,
    }));
  }),
});
