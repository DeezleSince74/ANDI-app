/**
 * PostgreSQL NOTIFY Listener for Real-time WebSocket Events
 * Listens to database notifications and forwards them to WebSocket connections
 */

import postgres from 'postgres';
import { logger } from '~/lib/logger';
import { getWebSocketManager } from '~/app/api/ws/route';

export interface NotificationPayload {
  eventType: string;
  userId: string;
  sessionId?: string;
  [key: string]: any;
}

export class PostgreSQLNotifyListener {
  private static instance: PostgreSQLNotifyListener;
  private client: postgres.Sql | null = null;
  private wsManager: any;
  private isConnected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private readonly maxReconnectAttempts = 10;
  private reconnectAttempts = 0;

  // Channels to listen to
  private readonly channels = [
    'recording_progress_update',
    'queue_status_update', 
    'queue_item_added',
    'user_notification',
    'notification_status_update',
    'recording_session_created',
    'ai_job_update',
    'test_notification'
  ];

  static getInstance(): PostgreSQLNotifyListener {
    if (!PostgreSQLNotifyListener.instance) {
      PostgreSQLNotifyListener.instance = new PostgreSQLNotifyListener();
    }
    return PostgreSQLNotifyListener.instance;
  }

  constructor() {
    try {
      this.wsManager = getWebSocketManager();
    } catch (error) {
      logger.warn('WebSocket manager not available for PG listener', { error });
      this.wsManager = null;
    }
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      // Create dedicated client for listening
      this.client = postgres(process.env.DATABASE_URL!, {
        max: 1, // Single connection for listening
        onnotify: this.handleNotification.bind(this),
        onclose: this.handleDisconnect.bind(this),
        onnotice: (notice) => {
          logger.debug('PostgreSQL notice', { notice });
        }
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Listen to all channels
      for (const channel of this.channels) {
        await this.client.unsafe(`LISTEN ${channel}`);
        logger.info(`Listening to PostgreSQL channel: ${channel}`);
      }

      logger.info('PostgreSQL NOTIFY listener connected successfully');

    } catch (error) {
      logger.error('Failed to connect PostgreSQL NOTIFY listener', { error });
      this.handleReconnect();
      throw error;
    }
  }

  private handleNotification(msg: any): void {
    try {
      const payload: NotificationPayload = JSON.parse(msg.payload);
      
      logger.debug('Received PostgreSQL notification', {
        channel: msg.channel,
        eventType: payload.eventType,
        userId: payload.userId,
        sessionId: payload.sessionId
      });

      // Forward to appropriate users via WebSocket
      this.forwardToWebSocket(msg.channel, payload);

    } catch (error) {
      logger.error('Failed to handle PostgreSQL notification', {
        channel: msg.channel,
        payload: msg.payload,
        error
      });
    }
  }

  private forwardToWebSocket(channel: string, payload: NotificationPayload): void {
    if (!this.wsManager) {
      logger.debug('WebSocket manager not available, skipping notification');
      return;
    }

    try {
      // Determine which users to notify based on event type
      const usersToNotify = this.getUsersToNotify(payload);

      usersToNotify.forEach(userId => {
        this.wsManager.broadcast(userId, {
          type: payload.eventType,
          channel,
          ...payload,
          serverTimestamp: Date.now()
        });
      });

      logger.debug(`Forwarded notification to ${usersToNotify.length} users`, {
        eventType: payload.eventType,
        users: usersToNotify.length
      });

    } catch (error) {
      logger.error('Failed to forward notification to WebSocket', {
        channel,
        payload,
        error
      });
    }
  }

  private getUsersToNotify(payload: NotificationPayload): string[] {
    const users: string[] = [];

    // Always notify the primary user
    if (payload.userId) {
      users.push(payload.userId);
    }

    // Add additional users based on event type
    switch (payload.eventType) {
      case 'queue_update':
      case 'queue_item_added':
        // For queue events, we might want to notify all users in the future
        // For now, just the owner
        break;

      case 'notification_created':
      case 'notification_read_status':
        // Notification events are user-specific
        break;

      case 'progress_update':
      case 'recording_created':
      case 'ai_job_update':
        // Recording events are user-specific
        break;

      case 'test':
        // Test notifications go to specified user
        break;

      default:
        logger.warn('Unknown event type for user notification', {
          eventType: payload.eventType
        });
    }

    return users.filter(userId => userId); // Remove any null/undefined values
  }

  private handleError(error: Error): void {
    logger.error('PostgreSQL NOTIFY listener error', { error });
    this.isConnected = false;
    this.handleReconnect();
  }

  private handleDisconnect(): void {
    logger.warn('PostgreSQL NOTIFY listener disconnected');
    this.isConnected = false;
    this.handleReconnect();
  }

  private handleReconnect(): void {
    if (this.reconnectTimeout) {
      return; // Already attempting to reconnect
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached for PostgreSQL listener');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    logger.info(`Attempting to reconnect PostgreSQL listener in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null;
      
      try {
        if (this.client) {
          this.client.removeAllListeners();
          this.client.end();
        }
        this.client = null;
        
        await this.connect();
        
      } catch (error) {
        logger.error('PostgreSQL listener reconnection failed', { error });
        this.handleReconnect();
      }
    }, delay);
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client) {
      try {
        // Unlisten from all channels
        for (const channel of this.channels) {
          await this.client.unsafe(`UNLISTEN ${channel}`);
        }
        
        await this.client.end();
      } catch (error) {
        logger.error('Error disconnecting PostgreSQL listener', { error });
      } finally {
        this.client = null;
        this.isConnected = false;
      }
    }

    logger.info('PostgreSQL NOTIFY listener disconnected');
  }

  // Test function to verify the listener is working
  async testNotification(userId: string, message: string = 'Test notification'): Promise<void> {
    if (!this.client || !this.isConnected) {
      throw new Error('PostgreSQL listener not connected');
    }

    try {
      await this.client`SELECT test_websocket_notification(${userId}, ${message})`;
      logger.info('Test notification sent', { userId, message });
    } catch (error) {
      logger.error('Failed to send test notification', { userId, message, error });
      throw error;
    }
  }

  // Get connection status
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      channelsListening: this.channels.length,
      hasWebSocketManager: !!this.wsManager
    };
  }

  // Get statistics
  async getStatistics() {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const result = await this.client`
        SELECT 
          trigger_name,
          COUNT(*) as execution_count,
          MAX(created_at) as last_execution
        FROM andi_web_trigger_log
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        GROUP BY trigger_name
        ORDER BY execution_count DESC
      `;

      return {
        status: this.getStatus(),
        triggerStats: result,
        websocketStats: this.wsManager?.getStats() || null
      };
    } catch (error) {
      logger.error('Failed to get listener statistics', { error });
      return { status: this.getStatus(), error: error.message };
    }
  }
}

// Global instance
let pgListener: PostgreSQLNotifyListener | null = null;

export function getPostgreSQLListener(): PostgreSQLNotifyListener {
  if (!pgListener) {
    pgListener = PostgreSQLNotifyListener.getInstance();
  }
  return pgListener;
}

// Auto-start the listener when the module is imported
export async function startPostgreSQLListener(): Promise<void> {
  try {
    const listener = getPostgreSQLListener();
    await listener.connect();
    logger.info('PostgreSQL NOTIFY listener started');
  } catch (error) {
    logger.error('Failed to start PostgreSQL NOTIFY listener', { error });
    // Don't throw - let the application continue without real-time updates
  }
}

// Graceful shutdown
export async function stopPostgreSQLListener(): Promise<void> {
  if (pgListener) {
    await pgListener.disconnect();
    pgListener = null;
  }
}

// Handle process shutdown
process.on('SIGTERM', stopPostgreSQLListener);
process.on('SIGINT', stopPostgreSQLListener);
process.on('beforeExit', stopPostgreSQLListener);