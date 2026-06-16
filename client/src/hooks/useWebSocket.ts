/**
 * Hook useWebSocket — Gère la connexion WebSocket pour les notifications en temps réel
 * Inclut reconnexion automatique, heartbeat, et gestion des messages
 */

import { useEffect, useRef, useCallback, useState } from "react";

interface WebSocketMessage {
  type: "subscribed" | "admin_intervention" | "message" | "session_update" | "error";
  sessionToken?: string;
  data?: Record<string, unknown>;
  message?: string;
  timestamp?: number;
}

interface UseWebSocketOptions {
  sessionToken: string;
  userId?: number;
  isAdmin?: boolean;
  onAdminIntervention?: (data: Record<string, unknown>) => void;
  onMessage?: (data: Record<string, unknown>) => void;
  onSessionUpdate?: (data: Record<string, unknown>) => void;
  onError?: (error: string) => void;
}

export function useWebSocket({
  sessionToken,
  userId,
  isAdmin,
  onAdminIntervention,
  onMessage,
  onSessionUpdate,
  onError,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Déterminer l'URL WebSocket
  const getWebSocketURL = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/ws/chatbot`;
  }, []);

  // Connecter au serveur WebSocket
  const connect = useCallback(() => {
    try {
      // Ne pas tenter la connexion si pas de sessionToken valide
      if (!sessionToken || sessionToken.trim() === "") {
        console.log("[WS] Pas de sessionToken, connexion WebSocket ignorée");
        return;
      }

      // Vérifier si WebSocket est supporté
      if (typeof WebSocket === "undefined") {
        console.warn("[WS] WebSocket non supporté par le navigateur");
        if (onError) {
          onError("WebSocket non supporté");
        }
        return;
      }

      const wsURL = getWebSocketURL();
      console.log("[WS] Tentative de connexion à", wsURL);

      const ws = new WebSocket(wsURL);

      ws.onopen = () => {
        console.log("[WS] Connecté au serveur WebSocket");
        setIsConnected(true);
        setReconnectAttempts(0);

        // Envoyer le message de souscription
        ws.send(
          JSON.stringify({
            type: "subscribe",
            sessionToken,
            userId,
            isAdmin,
          })
        );

        // Démarrer le heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000); // Heartbeat toutes les 30s
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log("[WS] Message reçu:", message.type);

          switch (message.type) {
            case "subscribed":
              console.log("[WS] Abonnement confirmé pour session", message.sessionToken);
              break;

            case "admin_intervention":
              if (onAdminIntervention && message.data) {
                onAdminIntervention(message.data);
              }
              break;

            case "message":
              if (onMessage && message.data) {
                onMessage(message.data);
              }
              break;

            case "session_update":
              if (onSessionUpdate && message.data) {
                onSessionUpdate(message.data);
              }
              break;

            case "error":
              console.error("[WS] Erreur du serveur:", message.message);
              if (onError) {
                onError(message.message || "Erreur WebSocket");
              }
              break;

            default:
              console.warn("[WS] Type de message inconnu:", message.type);
          }
        } catch (error) {
          console.error("[WS] Erreur parsing message:", error);
        }
      };

      ws.onerror = (event) => {
        const errorMsg =
          event instanceof Event
            ? `Erreur de connexion WebSocket (${event.type})`
            : `Erreur de connexion WebSocket: ${String(event)}`;
        console.error("[WS]", errorMsg);
        if (onError) {
          onError(errorMsg);
        }
      };

      ws.onclose = () => {
        console.log("[WS] Déconnecté du serveur WebSocket");
        setIsConnected(false);

        // Arrêter le heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Tenter une reconnexion avec backoff exponentiel (seulement si sessionToken valide)
        if (sessionToken && sessionToken.trim() !== "") {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`[WS] Reconnexion dans ${delay}ms (tentative ${reconnectAttempts + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[WS] Erreur création WebSocket:", errorMsg);
      if (onError) {
        onError(`Impossible de créer la connexion WebSocket: ${errorMsg}`);
      }
      // Tenter une reconnexion seulement si sessionToken valide
      if (sessionToken && sessionToken.trim() !== "") {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connect();
        }, delay);
      }
    }
  }, [sessionToken, userId, isAdmin, getWebSocketURL, onAdminIntervention, onMessage, onSessionUpdate, onError, reconnectAttempts]);

  // Envoyer un message
  const send = useCallback((message: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn("[WS] WebSocket non connecté, impossible d'envoyer le message");
    return false;
  }, []);

  // Déconnecter
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    setIsConnected(false);
  }, []);

  // Connecter au montage, déconnecter au démontage
  // ⚠️ IMPORTANT: Ne connecter que si sessionToken est valide
  useEffect(() => {
    if (!sessionToken || sessionToken.trim() === "") {
      console.log("[WS] sessionToken vide, connexion WebSocket non initiée");
      return;
    }
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect, sessionToken]);

  return {
    isConnected,
    send,
    disconnect,
    reconnectAttempts,
  };
}
