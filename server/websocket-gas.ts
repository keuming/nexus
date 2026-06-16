import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface NotificationPayload {
  type: 'new_order' | 'order_assigned' | 'order_validated' | 'order_delivered' | 'notification_read';
  data: Record<string, any>;
  timestamp: number;
}

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  role?: 'supplier' | 'deliveryman' | 'client';
  isAlive: boolean;
}

class GasWebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set of connection IDs

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/api/ws/gas' });
    this.setupServer();
    this.startHeartbeat();
  }

  private setupServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      const connectionId = this.generateConnectionId();
      const client: ClientConnection = { ws, isAlive: true };
      this.clients.set(connectionId, client);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(connectionId, data, client);
        } catch (error) {
          console.error('[GasWS] Invalid message:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('close', () => {
        this.handleDisconnect(connectionId, client);
      });

      ws.on('error', (error) => {
        console.error('[GasWS] Error:', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({ type: 'connected', connectionId }));
    });
  }

  private handleMessage(connectionId: string, data: any, client: ClientConnection) {
    const { type, userId, role } = data;

    if (type === 'authenticate') {
      client.userId = userId;
      client.role = role;

      // Track user connections
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connectionId);

      // Send confirmation
      client.ws.send(JSON.stringify({ type: 'authenticated', userId, role }));
      console.log(`[GasWS] User ${userId} (${role}) authenticated`);
    }
  }

  private handleDisconnect(connectionId: string, client: ClientConnection) {
    if (client.userId && this.userConnections.has(client.userId)) {
      this.userConnections.get(client.userId)!.delete(connectionId);
      if (this.userConnections.get(client.userId)!.size === 0) {
        this.userConnections.delete(client.userId);
      }
    }
    this.clients.delete(connectionId);
    console.log(`[GasWS] Connection ${connectionId} closed`);
  }

  private startHeartbeat() {
    setInterval(() => {
      this.clients.forEach((client, connectionId) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.handleDisconnect(connectionId, client);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000); // 30 seconds
  }

  private generateConnectionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for sending notifications

  /**
   * Notify all suppliers who have a specific bottle type
   */
  public notifySuppliersByBottleType(bottleType: string, notification: NotificationPayload) {
    this.broadcastToRole('supplier', notification);
    console.log(`[GasWS] Notified suppliers for bottle type ${bottleType}`);
  }

  /**
   * Notify all deliverymen
   */
  public notifyAllDeliverymen(notification: NotificationPayload) {
    this.broadcastToRole('deliveryman', notification);
    console.log('[GasWS] Notified all deliverymen');
  }

  /**
   * Notify a specific user
   */
  public notifyUser(userId: string, notification: NotificationPayload) {
    const connectionIds = this.userConnections.get(userId);
    if (connectionIds) {
      connectionIds.forEach((connectionId) => {
        const client = this.clients.get(connectionId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(JSON.stringify(notification));
        }
      });
      console.log(`[GasWS] Notified user ${userId}`);
    }
  }

  /**
   * Broadcast to all users with a specific role
   */
  private broadcastToRole(role: 'supplier' | 'deliveryman' | 'client', notification: NotificationPayload) {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(notification));
        count++;
      }
    });
    console.log(`[GasWS] Broadcast to ${count} ${role}s`);
  }

  /**
   * Broadcast to all connected clients
   */
  public broadcast(notification: NotificationPayload) {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(notification));
        count++;
      }
    });
    console.log(`[GasWS] Broadcast to ${count} clients`);
  }

  /**
   * Get connection stats
   */
  public getStats() {
    return {
      totalConnections: this.clients.size,
      totalUsers: this.userConnections.size,
      suppliers: Array.from(this.clients.values()).filter((c) => c.role === 'supplier').length,
      deliverymen: Array.from(this.clients.values()).filter((c) => c.role === 'deliveryman').length,
      clients: Array.from(this.clients.values()).filter((c) => c.role === 'client').length,
    };
  }
}

export default GasWebSocketManager;
