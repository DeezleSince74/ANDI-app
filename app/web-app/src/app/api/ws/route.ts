import { NextRequest } from 'next/server';
import { WebSocketServer, WebSocket } from 'ws';
import { auth } from '@/server/auth';
import { logger } from '@/lib/logger';

// Global WebSocket manager instance
let wsManager: WebSocketManager | null = null;

class WebSocketManager {
  private wss: WebSocketServer;
  private connections = new Map<string, Set<WebSocket>>(); // userId -> Set of WebSockets
  private heartbeatInterval: NodeJS.Timeout;

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.setupHeartbeat();
    this.setupCleanup();
  }

  private setupHeartbeat() {
    // Send ping every 30 seconds to keep connections alive
    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((connections, userId) => {
        connections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          } else {
            this.removeConnection(userId, ws);
          }
        });
      });
    }, 30000);
  }

  private setupCleanup() {
    // Clean up dead connections every 5 minutes
    setInterval(() => {
      this.connections.forEach((connections, userId) => {
        const activeConnections = new Set<WebSocket>();
        connections.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            activeConnections.add(ws);
          }
        });
        
        if (activeConnections.size === 0) {
          this.connections.delete(userId);
        } else {
          this.connections.set(userId, activeConnections);
        }
      });
      
      logger.info(`WebSocket connections: ${this.getTotalConnections()}`);
    }, 300000);
  }

  addConnection(userId: string, ws: WebSocket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    
    this.connections.get(userId)!.add(ws);
    
    // Set up connection handlers
    ws.on('close', () => {
      this.removeConnection(userId, ws);
    });
    
    ws.on('error', (error) => {
      logger.error('WebSocket error', { userId, error });
      this.removeConnection(userId, ws);
    });
    
    ws.on('pong', () => {
      // Connection is alive
    });

    logger.info(`WebSocket connection added for user ${userId}`);
  }

  removeConnection(userId: string, ws: WebSocket) {
    const userConnections = this.connections.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  broadcast(userId: string, message: any) {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    const messageStr = JSON.stringify({
      ...message,
      timestamp: Date.now()
    });

    let sentCount = 0;
    userConnections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          sentCount++;
        } catch (error) {
          logger.error('Failed to send WebSocket message', { userId, error });
          this.removeConnection(userId, ws);
        }
      }
    });

    if (sentCount > 0) {
      logger.debug(`Broadcast message to ${sentCount} connections for user ${userId}`);
    }
  }

  broadcastToAll(message: any) {
    this.connections.forEach((connections, userId) => {
      this.broadcast(userId, message);
    });
  }

  getUserConnections(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  getTotalConnections(): number {
    let total = 0;
    this.connections.forEach(connections => {
      total += connections.size;
    });
    return total;
  }

  getStats() {
    return {
      totalUsers: this.connections.size,
      totalConnections: this.getTotalConnections(),
      userStats: Array.from(this.connections.entries()).map(([userId, connections]) => ({
        userId,
        connections: connections.size
      }))
    };
  }

  close() {
    clearInterval(this.heartbeatInterval);
    this.connections.forEach((connections) => {
      connections.forEach(ws => ws.close());
    });
    this.connections.clear();
    this.wss.close();
  }
}

// Get or create global WebSocket manager
function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}

export async function GET(request: NextRequest) {
  try {
    // Check if this is a WebSocket upgrade request
    if (request.headers.get('upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 400 });
    }

    // Get user session (you might need to parse cookies manually here)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return new Response('Missing userId parameter', { status: 400 });
    }

    // In a real implementation, you'd verify the user session here
    // For now, we'll trust the userId parameter

    const manager = getWebSocketManager();
    
    // Handle the WebSocket upgrade
    // Note: Next.js App Router doesn't have built-in WebSocket support
    // You'll need to use a custom server or deploy with a WebSocket-capable platform
    
    return new Response('WebSocket endpoint ready', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    logger.error('WebSocket route error', { error });
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Export the manager for use in other parts of the application
export { getWebSocketManager };

// Handle process cleanup
process.on('SIGTERM', () => {
  if (wsManager) {
    wsManager.close();
  }
});

process.on('SIGINT', () => {
  if (wsManager) {
    wsManager.close();
  }
});