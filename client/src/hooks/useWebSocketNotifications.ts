/**
 * WebSocket Notifications Hook
 * Gère la connexion WebSocket et les notifications en temps réel
 * pour les commandes de gaz (fournisseurs, livreurs, clients)
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface NotificationPayload {
  type: 'new_order' | 'order_assigned' | 'order_validated' | 'order_delivered' | 'notification_read' | 'status_update';
  data: Record<string, any>;
  timestamp: number;
  orderId?: string;
}

interface UseWebSocketNotificationsOptions {
  userId: string;
  role: 'supplier' | 'deliveryman' | 'client';
  onNotification?: (notification: NotificationPayload) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocketNotifications({
  userId,
  role,
  onNotification,
  onError,
  onConnectionChange,
  autoReconnect = true,
  reconnectInterval = 3000,
}: UseWebSocketNotificationsOptions) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<NotificationPayload[]>([]);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws/gas`;

      console.log('[WebSocket] Connecting to:', wsUrl);
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnectionChange?.(true);

        // Authenticate
        ws.current?.send(JSON.stringify({ type: 'authenticate', userId, role }));

        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const notification = messageQueueRef.current.shift();
          if (notification) {
            ws.current?.send(JSON.stringify(notification));
          }
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected' || data.type === 'authenticated') {
            console.log('[WebSocket] Authentication successful:', data);
            return;
          }

          // Handle notification
          if (data.type && onNotification) {
            console.log('[WebSocket] Notification received:', data.type);
            onNotification(data as NotificationPayload);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.current.onerror = (event) => {
        const wsError = new Error('WebSocket connection error');
        console.error('[WebSocket] Error:', wsError);
        setError(wsError.message);
        onError?.(wsError);
      };

      ws.current.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
        onConnectionChange?.(false);

        // Attempt to reconnect
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectInterval * reconnectAttemptsRef.current;
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      const wsError = error instanceof Error ? error : new Error('Unknown WebSocket error');
      console.error('[WebSocket] Connection error:', wsError);
      setError(wsError.message);
      onError?.(wsError);
    }
  }, [userId, role, onNotification, onError, onConnectionChange, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendNotification = useCallback((notification: NotificationPayload) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(notification));
    } else {
      // Queue message if not connected
      messageQueueRef.current.push(notification);
    }
  }, []);

  /**
   * Send ping periodically to keep connection alive
   */
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30 seconds

    return () => clearInterval(pingInterval);
  }, []);

  useEffect(() => {
    if (!userId) {
      console.warn('[WebSocket] No userId provided');
      return;
    }

    connect();

    return () => {
      disconnect();
    };
  }, [userId, connect, disconnect]);

  return {
    isConnected,
    error,
    sendNotification,
    disconnect,
    reconnect: connect,
  };
}
