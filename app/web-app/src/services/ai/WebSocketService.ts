import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { auth } from '@/server/auth';
import type { AnalysisSession, JobStatus } from './types';

export interface WebSocketEvents {
  // Client events
  'join-session': (sessionId: string) => void;
  'leave-session': (sessionId: string) => void;
  'subscribe-user-sessions': (userId: string) => void;
  'unsubscribe-user-sessions': (userId: string) => void;

  // Server events
  'session-progress': (session: AnalysisSession) => void;
  'session-complete': (sessionId: string, result: any) => void;
  'session-error': (sessionId: string, error: string) => void;
  'job-progress': (job: JobStatus) => void;
  'job-complete': (jobId: string, result: any) => void;
  'job-error': (jobId: string, error: string) => void;
  'realtime-insight': (sessionId: string, insight: any) => void;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients = new Map<string, Socket>();
  private sessionSubscriptions = new Map<string, Set<string>>(); // sessionId -> Set of socketIds
  private userSubscriptions = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor() {
    // Constructor is called when service is initialized
    // Server attachment happens when initialize() is called
  }

  /**
   * Initialize WebSocket server with HTTP server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      path: '/api/socket.io',
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`WebSocket client connected: ${socket.id}`);
      this.handleConnection(socket);
    });

    console.log('WebSocket service initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(socket: Socket): Promise<void> {
    try {
      // Authenticate the user
      const session = await this.authenticateSocket(socket);
      if (!session?.user?.id) {
        socket.emit('error', 'Authentication required');
        socket.disconnect();
        return;
      }

      const userId = session.user.id;
      this.connectedClients.set(socket.id, socket);

      // Set up event handlers
      this.setupEventHandlers(socket, userId);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);
        this.handleDisconnection(socket.id);
      });

      socket.emit('connected', { userId, socketId: socket.id });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      socket.emit('error', 'Connection failed');
      socket.disconnect();
    }
  }

  /**
   * Authenticate socket connection using session data
   */
  private async authenticateSocket(socket: Socket): Promise<any> {
    try {
      // Extract session token from handshake
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      
      if (!token) {
        throw new Error('No authentication token provided');
      }

      // Note: This is a simplified authentication approach
      // In production, you would verify the JWT token properly
      // For now, we'll rely on the Next.js session validation
      
      // You could also pass the session from the client side
      const sessionData = socket.handshake.auth?.session;
      return sessionData;

    } catch (error) {
      console.error('Socket authentication error:', error);
      return null;
    }
  }

  /**
   * Set up event handlers for a socket
   */
  private setupEventHandlers(socket: Socket, userId: string): void {
    // Join specific session room
    socket.on('join-session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      
      // Track subscription
      if (!this.sessionSubscriptions.has(sessionId)) {
        this.sessionSubscriptions.set(sessionId, new Set());
      }
      this.sessionSubscriptions.get(sessionId)!.add(socket.id);
      
      console.log(`User ${userId} joined session ${sessionId}`);
    });

    // Leave specific session room
    socket.on('leave-session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      
      // Remove from subscription tracking
      const sessionSubs = this.sessionSubscriptions.get(sessionId);
      if (sessionSubs) {
        sessionSubs.delete(socket.id);
        if (sessionSubs.size === 0) {
          this.sessionSubscriptions.delete(sessionId);
        }
      }
      
      console.log(`User ${userId} left session ${sessionId}`);
    });

    // Subscribe to all user sessions
    socket.on('subscribe-user-sessions', (targetUserId: string) => {
      // Only allow users to subscribe to their own sessions
      if (userId !== targetUserId) {
        socket.emit('error', 'Cannot subscribe to other user sessions');
        return;
      }

      socket.join(`user:${userId}`);
      
      // Track subscription
      if (!this.userSubscriptions.has(userId)) {
        this.userSubscriptions.set(userId, new Set());
      }
      this.userSubscriptions.get(userId)!.add(socket.id);
      
      console.log(`User ${userId} subscribed to their sessions`);
    });

    // Unsubscribe from user sessions
    socket.on('unsubscribe-user-sessions', (targetUserId: string) => {
      if (userId !== targetUserId) {
        return;
      }

      socket.leave(`user:${userId}`);
      
      // Remove from subscription tracking
      const userSubs = this.userSubscriptions.get(userId);
      if (userSubs) {
        userSubs.delete(socket.id);
        if (userSubs.size === 0) {
          this.userSubscriptions.delete(userId);
        }
      }
      
      console.log(`User ${userId} unsubscribed from their sessions`);
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(socketId: string): void {
    this.connectedClients.delete(socketId);

    // Clean up subscriptions
    for (const [sessionId, sockets] of this.sessionSubscriptions.entries()) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.sessionSubscriptions.delete(sessionId);
      }
    }

    for (const [userId, sockets] of this.userSubscriptions.entries()) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSubscriptions.delete(userId);
      }
    }
  }

  /**
   * Emit session progress update
   */
  emitSessionProgress(session: AnalysisSession): void {
    if (!this.io) return;

    this.io.to(`session:${session.sessionId}`).emit('session-progress', session);
    this.io.to(`user:${session.userId}`).emit('session-progress', session);
  }

  /**
   * Emit session completion
   */
  emitSessionComplete(sessionId: string, userId: string, result: any): void {
    if (!this.io) return;

    this.io.to(`session:${sessionId}`).emit('session-complete', sessionId, result);
    this.io.to(`user:${userId}`).emit('session-complete', sessionId, result);
  }

  /**
   * Emit session error
   */
  emitSessionError(sessionId: string, userId: string, error: string): void {
    if (!this.io) return;

    this.io.to(`session:${sessionId}`).emit('session-error', sessionId, error);
    this.io.to(`user:${userId}`).emit('session-error', sessionId, error);
  }

  /**
   * Emit job progress update
   */
  emitJobProgress(job: JobStatus): void {
    if (!this.io) return;

    // Emit to session subscribers if job has sessionId
    if (job.sessionId) {
      this.io.to(`session:${job.sessionId}`).emit('job-progress', job);
    }
    
    // Emit to user subscribers
    if (job.userId) {
      this.io.to(`user:${job.userId}`).emit('job-progress', job);
    }
  }

  /**
   * Emit job completion
   */
  emitJobComplete(jobId: string, sessionId: string | undefined, userId: string, result: any): void {
    if (!this.io) return;

    if (sessionId) {
      this.io.to(`session:${sessionId}`).emit('job-complete', jobId, result);
    }
    this.io.to(`user:${userId}`).emit('job-complete', jobId, result);
  }

  /**
   * Emit job error
   */
  emitJobError(jobId: string, sessionId: string | undefined, userId: string, error: string): void {
    if (!this.io) return;

    if (sessionId) {
      this.io.to(`session:${sessionId}`).emit('job-error', jobId, error);
    }
    this.io.to(`user:${userId}`).emit('job-error', jobId, error);
  }

  /**
   * Emit real-time insight
   */
  emitRealtimeInsight(sessionId: string, userId: string, insight: any): void {
    if (!this.io) return;

    this.io.to(`session:${sessionId}`).emit('realtime-insight', sessionId, insight);
    this.io.to(`user:${userId}`).emit('realtime-insight', sessionId, insight);
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get session subscribers count
   */
  getSessionSubscribersCount(sessionId: string): number {
    return this.sessionSubscriptions.get(sessionId)?.size || 0;
  }

  /**
   * Get user subscribers count
   */
  getUserSubscribersCount(userId: string): number {
    return this.userSubscriptions.get(userId)?.size || 0;
  }

  /**
   * Health check
   */
  healthCheck(): { healthy: boolean; connectedClients: number; activeSessions: number } {
    return {
      healthy: this.io !== null,
      connectedClients: this.connectedClients.size,
      activeSessions: this.sessionSubscriptions.size,
    };
  }

  /**
   * Close WebSocket server
   */
  close(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
    this.connectedClients.clear();
    this.sessionSubscriptions.clear();
    this.userSubscriptions.clear();
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();