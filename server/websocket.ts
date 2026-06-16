/**
 * WebSocket Broadcast System
 * Gère les connexions WebSocket et broadcast des notifications en temps réel
 * pour les conversations chatbot
 */

import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

interface ClientConnection {
  ws: WebSocket;
  sessionToken: string;
  userId?: number;
  isAdmin?: boolean;
}

interface BroadcastMessage {
  type: "admin_intervention" | "message" | "session_update" | "chat_message";
  sessionToken: string;
  data: Record<string, unknown>;
  timestamp: number;
}

class ChatbotWebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection[]> = new Map();
  private sessionClients: Map<string, ClientConnection[]> = new Map();

  /**
   * Initialiser le serveur WebSocket
   */
  public init(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws/chatbot" });

    this.wss.on("connection", (ws: WebSocket) => {
      console.log("[WS] Nouvelle connexion WebSocket");

      ws.on("message", (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("[WS] Erreur parsing message:", error);
          ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        this.handleDisconnect(ws);
      });

      ws.on("error", (error) => {
        console.error("[WS] Erreur WebSocket:", error);
      });
    });

    console.log("[WS] Serveur WebSocket initialisé sur /ws/chatbot");
  }

  /**
   * Traiter les messages entrants
   */
  private handleMessage(ws: WebSocket, message: Record<string, unknown>) {
    const { type, sessionToken, userId, isAdmin } = message;

    if (type === "subscribe") {
      // Client s'abonne à une session
      const connection: ClientConnection = {
        ws,
        sessionToken: sessionToken as string,
        userId: userId as number | undefined,
        isAdmin: isAdmin as boolean | undefined,
      };

      if (!this.sessionClients.has(sessionToken as string)) {
        this.sessionClients.set(sessionToken as string, []);
      }
      this.sessionClients.get(sessionToken as string)!.push(connection);

      // Envoyer une confirmation
      ws.send(
        JSON.stringify({
          type: "subscribed",
          sessionToken,
          timestamp: Date.now(),
        })
      );

      console.log(`[WS] Client abonné à session ${sessionToken}`);
    }
  }

  /**
   * Gérer la déconnexion
   */
  private handleDisconnect(ws: WebSocket) {
    // Supprimer le client de toutes les sessions
    const sessionsArray = Array.from(this.sessionClients.entries());
    for (const [sessionToken, connections] of sessionsArray) {
      const index = connections.findIndex((c: ClientConnection) => c.ws === ws);
      if (index !== -1) {
        connections.splice(index, 1);
        console.log(`[WS] Client déconnecté de session ${sessionToken}`);
      }
    }
  }

  /**
   * Broadcaster une notification d'intervention admin
   */
  public broadcastAdminIntervention(
    sessionToken: string,
    adminId: number,
    adminName: string,
    reason: string
  ) {
    const message: BroadcastMessage = {
      type: "admin_intervention",
      sessionToken,
      data: {
        adminId,
        adminName,
        reason,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.broadcastToSession(sessionToken, message);
    console.log(`[WS] Broadcast intervention admin pour session ${sessionToken}`);
  }

  /**
   * Broadcaster un nouveau message
   */
  public broadcastMessage(
    sessionToken: string,
    role: "user" | "assistant" | "csn",
    content: string
  ) {
    const message: BroadcastMessage = {
      type: "message",
      sessionToken,
      data: {
        role,
        content,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.broadcastToSession(sessionToken, message);
  }

  /**
   * Broadcaster un message de chat en temps reel (admin ou visiteur)
   */
  public broadcastChatMessage(
    sessionToken: string,
    messageId: number,
    role: "user" | "csn",
    content: string
  ) {
    const message: BroadcastMessage = {
      type: "chat_message",
      sessionToken,
      data: {
        messageId,
        role,
        content,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    this.broadcastToSession(sessionToken, message);
  }

  /**
   * Broadcaster une mise à jour de session
   */
  public broadcastSessionUpdate(sessionToken: string, status: Record<string, unknown>) {
    const message: BroadcastMessage = {
      type: "session_update",
      sessionToken,
      data: status,
      timestamp: Date.now(),
    };

    this.broadcastToSession(sessionToken, message);
  }

  /**
   * Envoyer un message à tous les clients d'une session
   */
  private broadcastToSession(sessionToken: string, message: BroadcastMessage) {
    const connections = this.sessionClients.get(sessionToken);
    if (!connections || connections.length === 0) {
      console.log(`[WS] Aucun client connecté pour session ${sessionToken}`);
      return;
    }

    const payload = JSON.stringify(message);
    let successCount = 0;

    for (const connection of connections) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(payload, (error) => {
          if (error) {
            console.error(`[WS] Erreur envoi message:`, error);
          } else {
            successCount++;
          }
        });
      }
    }

    console.log(
      `[WS] Message envoyé à ${successCount}/${connections.length} clients de session ${sessionToken}`
    );
  }

  /**
   * Obtenir le nombre de clients connectés pour une session
   */
  public getConnectedClients(sessionToken: string): number {
    const connections = this.sessionClients.get(sessionToken) || [];
    return connections.filter((c: ClientConnection) => c.ws.readyState === WebSocket.OPEN).length;
  }

  /**
   * Obtenir les statistiques globales
   */
  public getStats() {
    let totalConnections = 0;
    let totalSessions = 0;

    const sessionsArray = Array.from(this.sessionClients.entries());
    for (const [, connections] of sessionsArray) {
      totalConnections += connections.filter((c: ClientConnection) => c.ws.readyState === WebSocket.OPEN).length;
      totalSessions++;
    }

    return {
      totalConnections,
      totalSessions,
      timestamp: Date.now(),
    };
  }
}

// Singleton instance
export const wsManager = new ChatbotWebSocketManager();
