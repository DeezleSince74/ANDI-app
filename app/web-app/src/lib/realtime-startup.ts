/**
 * Real-time System Startup
 * Initializes PostgreSQL NOTIFY listener and WebSocket connections
 */

import { logger } from '@/lib/logger';
import { startPostgreSQLListener } from '@/lib/database/pg-notify-listener';

let isInitialized = false;

export async function initializeRealtimeSystem(): Promise<void> {
  if (isInitialized) {
    logger.info('Real-time system already initialized');
    return;
  }

  try {
    logger.info('Initializing real-time system...');

    // Start PostgreSQL NOTIFY listener
    await startPostgreSQLListener();

    isInitialized = true;
    logger.info('✅ Real-time system initialized successfully');

  } catch (error) {
    logger.error('❌ Failed to initialize real-time system', { error });
    
    // Don't throw - allow application to continue without real-time features
    // The hybrid system will fallback to polling automatically
    logger.warn('Application will continue with polling-only mode');
  }
}

export function isRealtimeInitialized(): boolean {
  return isInitialized;
}

// Auto-initialize when this module is imported (for server-side usage)
if (typeof window === 'undefined') {
  // Only run on server-side
  initializeRealtimeSystem().catch(error => {
    logger.error('Auto-initialization of real-time system failed', { error });
  });
}