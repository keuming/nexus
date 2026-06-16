/**
 * chatbot.ts — Chatbot IA public + prise en main par l'agent NEXUS
 *
 * Flux :
 *  1. Visiteur démarre une session (startSession) → token unique
 *  2. Visiteur envoie un message (sendMessage) → réponse IA automatique via invokeLLM
 *  3. Si csnTookOver = true, les messages suivants sont marqués "pending_csn"
 *  4. Agent NEXUS voit les sessions ouvertes (listSessions) et répond (replyAsCSN)
 *  5. Agent NEXUS peut fermer la session (markClosed)
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { chatbotSessions, chatbotMessages } from "../../drizzle/schema";
import { desc, eq, and, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import { nanoid } from "nanoid";

const SYSTEM_PROMPT = `Tu es l'agent virtuel de NEXUS, la plateforme multi-services en Afrique de l'Ouest.

Ton rôle :
- Accueillir chaleureusement les visiteurs
- Répondre aux questions sur NEXUS : transport, hôtel, restauration, expédition de colis, boutique, agences de voyage
- Orienter les visiteurs vers les bonnes sections du site
- Informer sur le programme de recrutement des Business Développeurs si demandé
- Inviter les compagnies à rejoindre la plateforme via "Inscrire mon entreprise"
- Rester concis (max 3 phrases par réponse), professionnel et bienveillant
- Si la question dépasse tes compétences, proposer de mettre en relation avec un agent NEXUS

### INFORMATIONS ESSENTIELLES SUR NEXUS

**Système de crédits :**
- 1 crédit = 125 FCFA
- 1 réservation = 1 crédit consommé
- Minimum requis pour recevoir des réservations : 1 crédit
- Montant minimum initial : 10 000 FCFA (= 80 crédits)

**Frais de mise en service pour les compagnies :**
- Frais unique : 100 000 FCFA
- Répartition : 75% pour NEXUS, 25% (25 000 FCFA) pour le Business Développeur qui a recruté

**Business Développeurs (BDev) :**
- Inscription gratuite
- Prime de recrutement : 25 000 FCFA par compagnie inscrite
- Commission : 25 FCFA par crédit acheté par les compagnies recrutées
- Salaire de base : 250 000 FCFA/mois après 100 compagnies recrutées

**Contact :**
- Téléphone : +225 0504921096 / 0701578857
- Email : support@nexus.africa
- Siège : Abidjan, Cocody Rivièra 2`;
export const chatbotRouter = {
  // ── PUBLIC : démarrer une session ───────────────────────────────────────────
  startSession: publicProcedure
    .input(z.object({
      visitorName: z.string().min(1).max(100).default("Visiteur"),
      visitorEmail: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        // DB non configurée - retourner une session locale de fallback
        return { 
          token: nanoid(64), 
          sessionId: undefined,
          fallback: true 
        };
      }

      const token = nanoid(64);
      await db.insert(chatbotSessions).values({
        sessionToken: token,
        visitorName: input.visitorName,
        visitorEmail: input.visitorEmail ?? null,
        status: "open",
        csnTookOver: false,
      });

      // Message de bienvenue automatique
      const session = await db
        .select()
        .from(chatbotSessions)
        .where(eq(chatbotSessions.sessionToken, token))
        .then((r) => r[0]);

      if (session) {
        await db.insert(chatbotMessages).values({
          sessionId: session.id,
          role: "assistant",
          content: `Bonjour ${input.visitorName} ! 👋 Je suis l'agent virtuel de **NEXUS**. Comment puis-je vous aider aujourd'hui ? Vous pouvez me poser des questions sur nos services de transport, d'expédition, de restauration, ou sur comment rejoindre notre réseau de compagnies partenaires.`,
          isRead: true,
        });
      }

      return { token, sessionId: session?.id };
    }),

  // ── PUBLIC : envoyer un message (réponse IA automatique) ───────────────────
  sendMessage: publicProcedure
    .input(z.object({
      token: z.string().length(64),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { 
          aiResponse: "Je suis l'assistant NEXUS. La base de données n'est pas encore configurée. Contactez-nous directement au +225 0504921096 ou par email à support@nexus.africa.", 
          waitingForCSN: false 
        };
      }

      const session = await db
        .select()
        .from(chatbotSessions)
        .where(eq(chatbotSessions.sessionToken, input.token))
        .then((r) => r[0]);

      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session introuvable" });
      if (session.status === "closed") throw new TRPCError({ code: "BAD_REQUEST", message: "Session fermée" });

      // Enregistrer le message du visiteur
      await db.insert(chatbotMessages).values({
        sessionId: session.id,
        role: "user",
        content: input.content,
        isRead: false,
      });

      // Mettre à jour le statut de la session
      await db
        .update(chatbotSessions)
        .set({ status: "pending_csn", updatedAt: new Date() })
        .where(eq(chatbotSessions.id, session.id));

      // Si l'agent humain a pris le relais actif, ne pas répondre par IA
      if (session.humanTakeoverActive) {
        return { aiResponse: null, waitingForCSN: true, humanTakeover: true };
      }

      // Récupérer l'historique pour le contexte IA
      const history = await db
        .select()
        .from(chatbotMessages)
        .where(eq(chatbotMessages.sessionId, session.id))
        .orderBy(chatbotMessages.createdAt)
        .limit(20);

      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: SYSTEM_PROMPT },
        ...history
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
      ];

      let aiContent = "Bonjour ! Je suis l'assistant NEXUS. Je ne suis pas encore connecté à l'IA complète, mais un agent humain peut vous aider. Contactez-nous au +225 0504921096 ou via support@nexus.africa.";
      try {
        const llmResponse = await invokeLLM({ messages });
        const rawContent = llmResponse?.choices?.[0]?.message?.content;
        if (typeof rawContent === "string") aiContent = rawContent;
      } catch (err) {
        console.warn("[Chatbot] LLM non disponible:", String(err));
        // Garder le fallback informatif
      }

      // Enregistrer la réponse IA
      await db.insert(chatbotMessages).values({
        sessionId: session.id,
        role: "assistant",
        content: aiContent,
        isRead: true,
      });

      return { aiResponse: aiContent, waitingForCSN: false };
    }),

  // ── PUBLIC : récupérer les messages d'une session ──────────────────────────
  getMessages: publicProcedure
    .input(z.object({ token: z.string().length(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const session = await db
        .select()
        .from(chatbotSessions)
        .where(eq(chatbotSessions.sessionToken, input.token))
        .then((r) => r[0]);

      if (!session) return [];

      return db
        .select()
        .from(chatbotMessages)
        .where(eq(chatbotMessages.sessionId, session.id))
        .orderBy(chatbotMessages.createdAt);
    }),

  // ── PUBLIC : obtenir le statut d'une session ───────────────────────────────
  getSession: publicProcedure
    .input(z.object({ token: z.string().length(64) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      return db
        .select()
        .from(chatbotSessions)
        .where(eq(chatbotSessions.sessionToken, input.token))
        .then((r) => r[0] ?? null);
    }),

  // ── ADMIN : liste des sessions (ouvertes en priorité) ─────────────────────
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];

    const sessions = await db
      .select()
      .from(chatbotSessions)
      .orderBy(desc(chatbotSessions.updatedAt));

    // Compter les messages non lus par session
    const allUnread = await db
      .select()
      .from(chatbotMessages)
      .where(and(eq(chatbotMessages.role, "user"), eq(chatbotMessages.isRead, false)));

    return sessions.map((s) => ({
      ...s,
      unreadCount: allUnread.filter((m) => m.sessionId === s.id).length,
    }));
  }),

  // ── ADMIN : messages d'une session ─────────────────────────────────────────
  getSessionMessages: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) return [];

      // Marquer les messages visiteur comme lus
      await db
        .update(chatbotMessages)
        .set({ isRead: true })
        .where(and(eq(chatbotMessages.sessionId, input.sessionId), eq(chatbotMessages.role, "user")));

      return db
        .select()
        .from(chatbotMessages)
        .where(eq(chatbotMessages.sessionId, input.sessionId))
        .orderBy(chatbotMessages.createdAt);
    }),

  // ── ADMIN : répondre en tant qu'agent NEXUS ──────────────────────────────────
  replyAsCSN: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Marquer que NEXUS a pris en charge
      await db
        .update(chatbotSessions)
        .set({ csnTookOver: true, status: "open", updatedAt: new Date() })
        .where(eq(chatbotSessions.id, input.sessionId));

      await db.insert(chatbotMessages).values({
        sessionId: input.sessionId,
        role: "csn",
        content: input.content,
        isRead: true,
      });

      return { success: true };
    }),

  // ── ADMIN : prendre le relais de l'IA (suspendre l'IA) ──────────────────────────────────────────────────────────────────────
  takeoverSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(chatbotSessions)
        .set({
          humanTakeoverActive: true,
          humanTakeoverAt: new Date(),
          csnTookOver: true,
          status: "open",
          updatedAt: new Date(),
        })
        .where(eq(chatbotSessions.id, input.sessionId));
      // Message systeme pour informer le visiteur
      await db.insert(chatbotMessages).values({
        sessionId: input.sessionId,
        role: "csn",
        content: "Un agent NEXUS a pris le relais. Vous etes maintenant en conversation directe avec notre equipe.",
        isRead: true,
      });
      return { success: true };
    }),
  // ── ADMIN : rendre la main a l'IA ─────────────────────────────────────────────────────────────────────────────────────
  releaseSession: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(chatbotSessions)
        .set({
          humanTakeoverActive: false,
          updatedAt: new Date(),
        })
        .where(eq(chatbotSessions.id, input.sessionId));
      // Message systeme pour informer le visiteur
      await db.insert(chatbotMessages).values({
        sessionId: input.sessionId,
        role: "assistant",
        content: "L'assistant IA NEXUS reprend la conversation. Comment puis-je vous aider ?",
        isRead: true,
      });
      return { success: true };
    }),
  // ── ADMIN : fermer une session ──────────────────────────────────────────────
  markClosed: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(chatbotSessions)
        .set({ status: "closed", updatedAt: new Date() })
        .where(eq(chatbotSessions.id, input.sessionId));
      return { success: true };
    }),

  //  // ── ADMIN : compteur de sessions non lues ──────────────────────────────
  unreadSessionsCount: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") return 0;
    const db = await getDb();
    if (!db) return 0;

    const unread = await db
      .select()
      .from(chatbotMessages)
      .where(and(eq(chatbotMessages.role, "user"), eq(chatbotMessages.isRead, false)));

    // Compter les sessions distinctes avec des messages non lus
    const sessionIds = new Set(unread.map((m) => m.sessionId));
    return sessionIds.size;
  }),

  // ── ADMIN : intervenir et envoyer un message admin ──────────────────────
  sendAdminMessage: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      content: z.string().min(1).max(2000),
      reason: z.string().optional(), // motif de l'intervention
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Mettre à jour la session pour marquer l'intervention admin
      await db
        .update(chatbotSessions)
        .set({
          adminInterventionActive: true,
          adminId: ctx.user.id,
          adminInterventionAt: new Date(),
          adminInterventionReason: input.reason ?? null,
          humanTakeoverActive: true, // Suspension de l'IA
          csnTookOver: true,
          status: "open",
          updatedAt: new Date(),
        })
        .where(eq(chatbotSessions.id, input.sessionId));

      // Enregistrer le message admin
      await db.insert(chatbotMessages).values({
        sessionId: input.sessionId,
        role: "csn",
        content: input.content,
        isRead: true,
      });

      return { success: true };
    }),

  // ── ADMIN : escalader vers un agent humain ────────────────────────────────
  escalateToHuman: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(chatbotSessions)
        .set({
          adminInterventionActive: true,
          adminId: ctx.user.id,
          adminInterventionAt: new Date(),
          adminInterventionReason: input.reason,
          humanTakeoverActive: true,
          csnTookOver: true,
          status: "open",
          updatedAt: new Date(),
        })
        .where(eq(chatbotSessions.id, input.sessionId));

      // Message système pour notifier le visiteur
      await db.insert(chatbotMessages).values({
        sessionId: input.sessionId,
        role: "csn",
        content: `Un agent NEXUS spécialisé a pris le relais pour mieux vous aider. Motif : ${input.reason}. Merci de votre patience.`,
        isRead: true,
      });

      return { success: true };
    }),

  // ── ADMIN : libérer la session (rendre à l'IA) ────────────────────────────
  releaseFromAdmin: protectedProcedure
    .input(z.object({ sessionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(chatbotSessions)
        .set({
          adminInterventionActive: false,
          humanTakeoverActive: false,
          updatedAt: new Date(),
        })
        .where(eq(chatbotSessions.id, input.sessionId));

      // Message système
      await db.insert(chatbotMessages).values({
        sessionId: input.sessionId,
        role: "assistant",
        content: "L'assistant IA reprend la conversation. Comment puis-je vous aider ?",
        isRead: true,
      });

      return { success: true };
    }),

  // ── CHAT EN TEMPS RÉEL : envoyer un message (visiteur ou admin) ─────────────
  sendChatMessage: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      message: z.string().min(1).max(2000),
      senderRole: z.enum(["user", "csn"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Récupérer la session
      const sessions = await db
        .select()
        .from(chatbotSessions)
        .where(eq(chatbotSessions.sessionToken, input.sessionToken));
      const session = sessions[0];
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session non trouvée" });

      // Insérer le message
      const msg = await db.insert(chatbotMessages).values({
        sessionId: session.id,
        role: input.senderRole,
        content: input.message,
        isRead: input.senderRole === "csn", // Les messages NEXUS sont lus
      }).returning({ id: chatbotMessages.id });

      return {
        messageId: msg[0].id,
        sessionId: session.id,
        timestamp: new Date(),
      };
    }),

  // ── CHAT EN TEMPS RÉEL : récupérer l'historique des messages ───────────────
  getChatMessages: publicProcedure
    .input(z.object({
      sessionToken: z.string(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Récupérer la session
      const sessions = await db
        .select()
        .from(chatbotSessions)
        .where(eq(chatbotSessions.sessionToken, input.sessionToken));
      const session = sessions[0];
      if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Session non trouvée" });

      // Récupérer les messages
      const messages = await db
        .select()
        .from(chatbotMessages)
        .where(eq(chatbotMessages.sessionId, session.id))
        .orderBy(desc(chatbotMessages.createdAt))
        .limit(input.limit);

      return messages.reverse(); // Ordre chronologique
    }),

  // ── ADMIN : marquer les messages comme lus ────────────────────────────────
  markMessagesAsRead: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db
        .update(chatbotMessages)
        .set({ isRead: true })
        .where(and(
          eq(chatbotMessages.sessionId, input.sessionId),
          eq(chatbotMessages.role, "user")
        ));

      return { success: true };
    }),
};
