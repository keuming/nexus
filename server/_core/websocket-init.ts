/**
 * Initialisation du serveur WebSocket
 * À appeler dans server.ts après la création du serveur HTTP
 */

import { Server } from "http";
import { wsManager } from "../websocket";

export function initWebSocket(httpServer: Server) {
  wsManager.init(httpServer);
  console.log("[WebSocket] Serveur WebSocket initialisé");
}

export { wsManager };
