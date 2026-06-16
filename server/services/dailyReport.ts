/**
 * Service de rapport journalier automatique NEXUS
 * Envoyé chaque soir au propriétaire via notifyOwner
 */
import { getDb } from "../db";
import { notifyOwner } from "../_core/notification";
import {
  transportTickets,
  transportCompanies,
  onlineOrders,
  transportShipments,
  commercialCandidates,
  internalMessages,
  chatbotSessions,
} from "../../drizzle/schema";
import { sql, gte, and, eq } from "drizzle-orm";

export async function sendDailyReport(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[DailyReport] DB non disponible, rapport annulé");
    return;
  }

  // Début et fin de la journée (UTC)
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const startTs = startOfDay.getTime();

  try {
    // 1. Billets vendus aujourd'hui
    const ticketsResult = await db
      .select({
        count: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`COALESCE(SUM(${transportTickets.priceXOF}), 0)`,
      })
      .from(transportTickets)
      .where(gte(transportTickets.createdAt, startOfDay));

    const ticketCount = Number(ticketsResult[0]?.count ?? 0);
    const ticketRevenue = Number(ticketsResult[0]?.totalRevenue ?? 0);

    // 2. Commandes restauration aujourd'hui
    const ordersResult = await db
      .select({
        count: sql<number>`COUNT(*)`,
        totalRevenue: sql<number>`COALESCE(SUM(${onlineOrders.totalXOF}), 0)`,
      })
      .from(onlineOrders)
      .where(gte(onlineOrders.createdAt, startOfDay));

    const orderCount = Number(ordersResult[0]?.count ?? 0);
    const orderRevenue = Number(ordersResult[0]?.totalRevenue ?? 0);

    // 3. Expéditions enregistrées aujourd'hui
    const shipmentsResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transportShipments)
      .where(gte(transportShipments.createdAt, startOfDay));

    const shipmentCount = Number(shipmentsResult[0]?.count ?? 0);

    // 4. Nouvelles compagnies inscrites aujourd'hui
    const newCompaniesResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(transportCompanies)
      .where(gte(transportCompanies.createdAt, startOfDay));

    const newCompanyCount = Number(newCompaniesResult[0]?.count ?? 0);

    // 5. Nouveaux candidats commerciaux aujourd'hui
    const candidatesResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(commercialCandidates)
      .where(gte(commercialCandidates.createdAt, startOfDay));

    const candidateCount = Number(candidatesResult[0]?.count ?? 0);

    // 6. Messages non traités (compagnie → NEXUS)
    const unreadMsgResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(internalMessages)
      .where(and(eq(internalMessages.isRead, false), eq(internalMessages.senderType, "company")));

    const unreadMsgCount = Number(unreadMsgResult[0]?.count ?? 0);

    // 7. Sessions chatbot ouvertes non résolues
    const openChatResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(chatbotSessions)
      .where(eq(chatbotSessions.status, "open"));

    const openChatCount = Number(openChatResult[0]?.count ?? 0);

    // Calcul du revenu total
    const totalRevenue = ticketRevenue + orderRevenue;

    // Construction du rapport
    const dateStr = now.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Africa/Abidjan",
    });

    const reportLines: string[] = [
      `📊 RAPPORT JOURNALIER NEXUS — ${dateStr.toUpperCase()}`,
      ``,
      `💰 REVENUS DU JOUR`,
      `  • Billets vendus : ${ticketCount} billet${ticketCount > 1 ? "s" : ""} — ${ticketRevenue.toLocaleString("fr-FR")} FCFA`,
      `  • Commandes restauration : ${orderCount} commande${orderCount > 1 ? "s" : ""} — ${orderRevenue.toLocaleString("fr-FR")} FCFA`,
      `  • Total estimé : ${totalRevenue.toLocaleString("fr-FR")} FCFA`,
      ``,
      `🚚 ACTIVITÉ`,
      `  • Expéditions enregistrées : ${shipmentCount}`,
      `  • Nouvelles compagnies inscrites : ${newCompanyCount}`,
      `  • Nouveaux candidats commerciaux : ${candidateCount}`,
      ``,
      `⚠️ ALERTES`,
      `  • Messages compagnies non traités : ${unreadMsgCount}`,
      `  • Sessions chatbot en attente : ${openChatCount}`,
      ``,
      `Rapport généré automatiquement par NEXUS à ${now.toLocaleTimeString("fr-FR", { timeZone: "Africa/Abidjan" })}`,
    ];

    const reportContent = reportLines.join("\n");

    const sent = await notifyOwner({
      title: `📊 Rapport journalier NEXUS — ${now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}`,
      content: reportContent,
    });

    if (sent) {
      console.log(`[DailyReport] Rapport envoyé avec succès (${ticketCount} billets, ${totalRevenue} FCFA)`);
    } else {
      console.warn("[DailyReport] Envoi échoué — service de notification indisponible");
    }
  } catch (err) {
    console.error("[DailyReport] Erreur lors de la génération du rapport:", err);
  }
}
