'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { logger } from '@/lib/logger';

export interface HybridConfig {
  pollingInterval?: number;
  websocketEnabled?: boolean;
  fallbackDelay?: number; // How long to wait before falling back to polling
  enableFeatureFlag?: boolean;
}

export interface UpdateSource {
  type: 'websocket' | 'polling';
  lastUpdate: number;
  isHealthy: boolean;
}

export function useHybridUpdates<T>(
  fetchFunction: () => Promise<T>,
  userId: string,
  config: HybridConfig = {}
) {
  const {
    pollingInterval = 5000,
    websocketEnabled = true,
    fallbackDelay = 15000,
    enableFeatureFlag = true
  } = config;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateSource, setUpdateSource] = useState<UpdateSource>({
    type: 'polling',
    lastUpdate: 0,
    isHealthy: true
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout>();
  const fallbackTimeoutRef = useRef<NodeJS.Timeout>();
  const lastWebSocketMessage = useRef(Date.now());

  // WebSocket connection
  const webSocket = useWebSocket(userId, {
    reconnectInterval: 3000,
    maxReconnectAttempts: 3
  });

  // Feature flag check (you can integrate with your feature flag system)
  const shouldUseWebSocket = websocketEnabled && enableFeatureFlag && userId;

  // Fetch data function with error handling
  const fetchData = useCallback(async (source: 'websocket' | 'polling' = 'polling') => {
    try {
      setError(null);
      const result = await fetchFunction();
      setData(result);
      setUpdateSource(prev => ({
        ...prev,
        type: source,
        lastUpdate: Date.now(),
        isHealthy: true
      }));
      
      if (loading) {
        setLoading(false);
      }
      
      logger.debug(`Data updated via ${source}`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setUpdateSource(prev => ({
        ...prev,
        isHealthy: false
      }));
      logger.error(`Failed to fetch data via ${source}`, { error: err });
      throw err;
    }
  }, [fetchFunction, loading]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    logger.info('Starting polling updates');
    
    // Initial fetch
    fetchData('polling').catch(() => {
      // Error already handled in fetchData
    });

    // Set up interval
    pollingIntervalRef.current = setInterval(() => {
      fetchData('polling').catch(() => {
        // Error already handled in fetchData
      });
    }, pollingInterval);
  }, [fetchData, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = undefined;
      logger.info('Stopped polling updates');
    }
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!shouldUseWebSocket) return;

    const handleWebSocketMessage = (event: CustomEvent) => {
      const { message, userId: messageUserId } = event.detail;
      
      // Only process messages for this user
      if (messageUserId !== userId) return;

      lastWebSocketMessage.current = Date.now();

      // Handle different message types
      switch (message.type) {
        case 'progress_update':
        case 'queue_update':
        case 'notification':
          // Refresh data when we receive relevant updates
          fetchData('websocket').catch(() => {
            // If WebSocket update fails, fallback to polling
            logger.warn('WebSocket update failed, falling back to polling');
            setUpdateSource(prev => ({ ...prev, type: 'polling' }));
          });
          break;
        
        case 'data_update':
          // Direct data update from server
          if (message.data) {
            setData(message.data);
            setUpdateSource(prev => ({
              ...prev,
              type: 'websocket',
              lastUpdate: Date.now(),
              isHealthy: true
            }));
          }
          break;
      }
    };

    window.addEventListener('websocket-message', handleWebSocketMessage as EventListener);
    
    return () => {
      window.removeEventListener('websocket-message', handleWebSocketMessage as EventListener);
    };
  }, [shouldUseWebSocket, userId, fetchData]);

  // WebSocket health monitoring
  useEffect(() => {
    if (!shouldUseWebSocket || updateSource.type !== 'websocket') return;

    const healthCheck = setInterval(() => {
      const timeSinceLastMessage = Date.now() - lastWebSocketMessage.current;
      
      // If no WebSocket activity for fallbackDelay, switch to polling
      if (timeSinceLastMessage > fallbackDelay) {
        logger.warn(`No WebSocket activity for ${fallbackDelay}ms, falling back to polling`);
        setUpdateSource(prev => ({ 
          ...prev, 
          type: 'polling',
          isHealthy: false 
        }));
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(healthCheck);
  }, [shouldUseWebSocket, updateSource.type, fallbackDelay]);

  // Main update source logic
  useEffect(() => {
    if (!shouldUseWebSocket) {
      // WebSocket disabled, use polling only
      startPolling();
      return () => stopPolling();
    }

    if (webSocket.isConnected && updateSource.type === 'polling') {
      // WebSocket connected, switch from polling to WebSocket
      logger.info('Switching from polling to WebSocket updates');
      stopPolling();
      setUpdateSource(prev => ({ 
        ...prev, 
        type: 'websocket',
        isHealthy: true 
      }));
      
      // Initial data fetch via WebSocket path
      fetchData('websocket').catch(() => {
        // If initial WebSocket fetch fails, fallback to polling
        startPolling();
      });
      
    } else if (!webSocket.isConnected && updateSource.type === 'websocket') {
      // WebSocket disconnected, fallback to polling
      logger.info('WebSocket disconnected, falling back to polling');
      setUpdateSource(prev => ({ 
        ...prev, 
        type: 'polling',
        isHealthy: false 
      }));
      startPolling();
    } else if (updateSource.type === 'polling' && !webSocket.isConnected) {
      // Start polling if not already active
      startPolling();
    }

    return () => {
      stopPolling();
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current);
      }
    };
  }, [
    shouldUseWebSocket,
    webSocket.isConnected,
    updateSource.type,
    startPolling,
    stopPolling,
    fetchData
  ]);

  // Force refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await fetchData(updateSource.type);
    } finally {
      setLoading(false);
    }
  }, [fetchData, updateSource.type]);

  // Switch to polling manually (for debugging/fallback)
  const switchToPolling = useCallback(() => {
    logger.info('Manually switching to polling');
    setUpdateSource(prev => ({ ...prev, type: 'polling' }));
  }, []);

  // Get connection statistics
  const getConnectionStats = useCallback(() => {
    return {
      updateSource: updateSource.type,
      websocketStatus: webSocket.connectionStatus,
      websocketReconnectAttempts: webSocket.reconnectAttempts,
      lastUpdate: updateSource.lastUpdate,
      isHealthy: updateSource.isHealthy,
      timeSinceLastUpdate: Date.now() - updateSource.lastUpdate
    };
  }, [updateSource, webSocket]);

  return {
    data,
    loading,
    error,
    updateSource: updateSource.type,
    isHealthy: updateSource.isHealthy,
    websocketStatus: webSocket.connectionStatus,
    refresh,
    switchToPolling,
    getConnectionStats,
    // WebSocket controls
    connectWebSocket: webSocket.connect,
    disconnectWebSocket: webSocket.disconnect,
  };
}