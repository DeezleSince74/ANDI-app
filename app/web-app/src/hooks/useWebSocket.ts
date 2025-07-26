'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

export interface WebSocketConfig {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface WebSocketState {
  socket: WebSocket | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempts: number;
  lastError?: string;
}

export function useWebSocket(
  userId: string, 
  config: WebSocketConfig = {}
) {
  const {
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000
  } = config;

  const [state, setState] = useState<WebSocketState>({
    socket: null,
    connectionStatus: 'disconnected',
    reconnectAttempts: 0
  });

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const isManualClose = useRef(false);

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/api/ws?userId=${encodeURIComponent(userId)}`;
  }, [userId]);

  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }
  }, []);

  const setupHeartbeat = useCallback((ws: WebSocket) => {
    heartbeatIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  const connect = useCallback(() => {
    if (state.reconnectAttempts >= maxReconnectAttempts) {
      logger.warn(`Max reconnection attempts (${maxReconnectAttempts}) reached for user ${userId}`);
      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'error',
        lastError: 'Max reconnection attempts reached'
      }));
      return;
    }

    clearTimeouts();
    
    setState(prev => ({ 
      ...prev, 
      connectionStatus: 'connecting'
    }));

    try {
      const ws = new WebSocket(getWebSocketUrl());

      ws.onopen = () => {
        logger.info(`WebSocket connected for user ${userId}`);
        setState(prev => ({
          socket: ws,
          connectionStatus: 'connected',
          reconnectAttempts: 0, // Reset on successful connection
          lastError: undefined
        }));

        // Send authentication message
        ws.send(JSON.stringify({
          type: 'auth',
          userId,
          timestamp: Date.now()
        }));

        setupHeartbeat(ws);
      };

      ws.onclose = (event) => {
        logger.info(`WebSocket closed for user ${userId}`, { 
          code: event.code, 
          reason: event.reason,
          wasClean: event.wasClean 
        });

        clearTimeouts();
        setState(prev => ({ 
          ...prev, 
          socket: null, 
          connectionStatus: 'disconnected' 
        }));

        // Only attempt reconnection if this wasn't a manual close
        if (!isManualClose.current && state.reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(
            reconnectInterval * Math.pow(2, state.reconnectAttempts), 
            30000
          );
          
          logger.info(`Reconnecting WebSocket in ${delay}ms (attempt ${state.reconnectAttempts + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setState(prev => ({ 
              ...prev, 
              reconnectAttempts: prev.reconnectAttempts + 1 
            }));
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        logger.error('WebSocket error for user ' + userId, { error });
        setState(prev => ({ 
          ...prev, 
          connectionStatus: 'error',
          lastError: 'Connection error occurred'
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle pong responses
          if (message.type === 'pong') {
            logger.debug('Received pong from server');
            return;
          }

          // Dispatch custom event for message handling
          window.dispatchEvent(new CustomEvent('websocket-message', {
            detail: { message, userId }
          }));
          
        } catch (error) {
          logger.error('Failed to parse WebSocket message', { error, data: event.data });
        }
      };

    } catch (error) {
      logger.error('Failed to create WebSocket connection', { error, userId });
      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'error',
        lastError: 'Failed to create connection'
      }));
    }
  }, [
    userId, 
    state.reconnectAttempts, 
    maxReconnectAttempts, 
    reconnectInterval, 
    getWebSocketUrl, 
    setupHeartbeat, 
    clearTimeouts
  ]);

  const disconnect = useCallback(() => {
    isManualClose.current = true;
    clearTimeouts();
    
    if (state.socket) {
      state.socket.close();
    }
    
    setState({
      socket: null,
      connectionStatus: 'disconnected',
      reconnectAttempts: 0
    });
  }, [state.socket, clearTimeouts]);

  const sendMessage = useCallback((message: any) => {
    if (state.socket && state.connectionStatus === 'connected') {
      try {
        state.socket.send(JSON.stringify({
          ...message,
          userId,
          timestamp: Date.now()
        }));
        return true;
      } catch (error) {
        logger.error('Failed to send WebSocket message', { error, message });
        return false;
      }
    }
    return false;
  }, [state.socket, state.connectionStatus, userId]);

  // Auto-connect when hook mounts
  useEffect(() => {
    if (userId) {
      isManualClose.current = false;
      connect();
    }

    return () => {
      isManualClose.current = true;
      clearTimeouts();
      if (state.socket) {
        state.socket.close();
      }
    };
  }, [userId]); // Only reconnect when userId changes

  // Handle reconnection attempts
  useEffect(() => {
    if (state.reconnectAttempts > 0 && state.connectionStatus === 'disconnected') {
      // This effect will trigger the reconnection logic
    }
  }, [state.reconnectAttempts]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    isConnected: state.connectionStatus === 'connected',
    isConnecting: state.connectionStatus === 'connecting',
    hasError: state.connectionStatus === 'error'
  };
}