/**
 * chatbot.ts — Chatbot IA public + prise en main par l'agent HUB_RESA
 *
 * Flux :
 *  1. Visiteur démarre une session (startSession) → token unique
 *  2. Visiteur envoie un message (sendMessage) → réponse IA automatique via invokeLLM
 *  3. Si csnTookOver = true, les messages suivants sont marqués "pending_csn"
 *  4. Agent HUB_RESA voit les sessions ouvertes (listSessions) et répond (replyAsCSN)
 *  5. Agent HUB_RESA peut fermer la session (markClosed)
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { chatbotSessions, chatbotMessages } from "../../drizzle/schema";
import { desc, eq, and, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";
import crypto from "crypto";

const SYSTEM_PROMPT = `Tu es l'agent virtuel de HUB_RESA, la plateforme de réservation de transport en Afrique de l'Ouest gérée par HUB_RESA (Conseil Supérieur du Numérique).

Ton rôle :
- Accueillir chaleureusement les visiteurs en français
- Répondre aux questions sur HUB_RESA : réservation de billets, compagnies partenaires, expédition de colis, restauration
- Orienter les visiteurs vers les bonnes sections du site
- Informer sur le programme de recrutement des Business Développeurs si demandé
- Inviter les compagnies à rejoindre la plateforme via "Créer un compte compagnie"
- Rester concis (max 3 phrases par réponse), professionnel et bienveillant
- Si la question dépasse tes compétences, proposer de mettre en relation avec un agent HUB_RESA

### INFORMATIONS ESSENTIELLES SUR HUB_RESA

**Système de crédits :**
- 1 crédit = 125 FCFA
- 1 réservation = 1 crédit consommé
- Minimum requis pour recevoir des réservations : 1 crédit
- Montant minimum initial : 10 000 FCFA (= 80 crédits)

**Frais de mise en service pour les compagnies :**
- Frais unique : 100 000 FCFA
- Répartition : 75% pour HUB_RESA, 25% (25 000 FCFA) pour le Business Développeur qui a recruté

**Business Développeurs (BDev) :**
- Inscription gratuite
- Prime de recrutement : 25 000 FCFA par compagnie inscrite
- Commission : 25 FCFA par crédit acheté par les compagnies recrutées (20% du montant)
- Salaire de base : 250 000 FCFA/mois après 100 compagnies recrutées

**Processus d'obtention et de partage de l'ID BDev :**
1. Un Business Développeur clique sur "Devenir BDev" dans le carousel Recrutement
2. Il remplit son formulaire d'inscription (nom, prénoms, contact, email, WhatsApp, login, code PIN)
3. Après validation, il reçoit automatiquement un ID unique (format : BD-XXXXX)
4. Le BDev accède à son dashboard et peut consulter son ID
5. Le BDev partage cet ID avec ses clients potentiels
6. Chaque client qui s'inscrit entre l'ID du BDev dans le champ dédié du formulaire d'inscription
7. Tous les achats de crédits du client sont rattachés au BDev pour les commissions

**Processus d'inscription compagnie :**
1. Cliquez sur "Créer un compte compagnie"
2. Remplissez le formulaire (raison sociale, contact, adresse, secteur)
3. Entrez l'ID du Business Développeur (optionnel, format BD-XXXXX) - si vous avez été recruté par un BDev
4. Validez et accédez à votre dashboard
5. Tous vos achats de crédits seront automatiquement associés au BDev si vous avez fourni son ID

**Processus d'inscription Business Développeur :**
1. Cliquez sur "Devenir BDev" dans le carousel Recrutement
2. Remplissez vos informations personnelles
3. Définissez votre login et code PIN 4 chiffres
4. Recevez automatiquement votre ID unique (BD-XXXXX)
5. Accédez à votre dashboard BDev
6. Consultez votre ID et partagez-le avec vos clients

Ne jamais inventer de tarifs, horaires ou informations spécifiques sur les compagnies.
Toujours répondre en français sauf si le visiteur écrit dans une autre langue.
Pour les questions détaillées sur les conditions, proposer de consulter le document complet ou de contacter support@hubresa.cloud.`;;;

export const chatbotRouter = {
  // ── PUBLIC : démarrer une session ───────────────────────────────────────────
  startSession: publicProcedure
    .input(z.object({
      visitorName: z.string().min(1).max(100).default("Visiteur"),
      visitorEmail: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const token = crypto.randomBytes(32).toString("hex");
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
          content: `Bonjour ${input.visitorName} ! 👋 Je suis l'agent virtuel de **HUB_RESA**. Comment puis-je vous aider aujourd'hui ? Vous pouvez me poser des questions sur nos services de transport, d'expédition, de restauration, ou sur comment rejoindre notre réseau de compagnies partenaires.`,
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
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

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

      let aiContent = "Je suis désolé, je rencontre une difficulté technique. Un agent HUB_RESA va prendre le relais.";
      try {
        const llmResponse = await invokeLLM({ messages });
        const rawContent = llmResponse?.choices?.[0]?.message?.content;
        if (typeof rawContent === "string") aiContent = rawContent;
      } catch {
        // Fallback silencieux
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

  // ── ADMIN : répondre en tant qu'agent HUB_RESA ──────────────────────────────────
  replyAsCSN: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Marquer que HUB_RESA a pris en charge
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
        content: "Un agent HUB_RESA a pris le relais. Vous etes maintenant en conversation directe avec notre equipe.",
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
        content: "L'assistant IA HUB_RESA reprend la conversation. Comment puis-je vous aider ?",
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
        content: `Un agent HUB_RESA spécialisé a pris le relais pour mieux vous aider. Motif : ${input.reason}. Merci de votre patience.`,
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
        isRead: input.senderRole === "csn", // Les messages HUB_RESA sont lus
      }).$returningId();

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
