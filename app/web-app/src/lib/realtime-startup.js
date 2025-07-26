/**
 * Real-time System Initialization
 * Starts PostgreSQL NOTIFY listener and WebSocket connections
 */

import { startPostgreSQLListener } from './database/pg-notify-listener.js';

export async function initializeRealtimeSystem() {
  console.log('🚀 Initializing real-time system...');
  
  try {
    // Start PostgreSQL NOTIFY listener
    await startPostgreSQLListener();
    console.log('✓ PostgreSQL NOTIFY listener started');
    
    console.log('✓ Real-time system initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize real-time system:', error);
    throw error;
  }
}