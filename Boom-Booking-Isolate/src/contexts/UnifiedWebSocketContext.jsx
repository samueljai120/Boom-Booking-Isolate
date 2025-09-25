/**
 * Unified WebSocket Context
 * 
 * This provides complete real-time communication functionality
 * with automatic connection management and tenant-aware subscriptions.
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useTenant } from './SimplifiedTenantContext';
import { io } from 'socket.io-client';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const eventListenersRef = useRef(new Map());
  const { currentTenant } = useTenant();

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 1000; // Start with 1 second

  // WebSocket URL configuration
  const getWebSocketUrl = () => {
    // In development, connect directly to backend server
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    // In production, use the same host as the frontend
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  };

  // Connect to WebSocket
  const connect = useCallback(() => {
    // Temporarily disable WebSocket for localhost development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('🔌 WebSocket disabled for localhost development');
      return;
    }
    
    if (wsRef.current?.connected || connecting) {
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const wsUrl = getWebSocketUrl();
      console.log('🔌 Connecting to Socket.IO:', wsUrl);
      
      const socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });
      wsRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
        setConnected(true);
        setConnecting(false);
        setReconnectAttempts(0);
        setError(null);

        // Join tenant room if tenant is available
        if (currentTenant?.id) {
          joinRoom(currentTenant.id);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO disconnected:', reason);
        setConnected(false);
        setConnecting(false);
        
        // Attempt to reconnect if not a clean close
        if (reason !== 'io client disconnect' && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY * Math.pow(2, reconnectAttempts);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          setError('Failed to reconnect after maximum attempts');
        }
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error);
        setError('Socket.IO connection error');
        setConnecting(false);
      });

      // Handle custom events
      socket.onAny((eventName, ...args) => {
        console.log('📨 Socket.IO message received:', eventName, args);
        
        // Handle different message types
        if (eventListenersRef.current.has(eventName)) {
          const listeners = eventListenersRef.current.get(eventName);
          listeners.forEach(listener => {
            try {
              listener({ type: eventName, data: args[0] });
            } catch (error) {
              console.error('Error in Socket.IO listener:', error);
            }
          });
        }
      });

    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      setError('Failed to create Socket.IO connection');
      setConnecting(false);
    }
  }, [currentTenant, connecting, reconnectAttempts]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }

    setConnected(false);
    setConnecting(false);
    setReconnectAttempts(0);
    setError(null);
  }, []);

  // Send message through WebSocket
  const sendMessage = useCallback((message) => {
    if (wsRef.current?.connected) {
      try {
        wsRef.current.emit(message.type, message);
        console.log('📤 Socket.IO message sent:', message);
        return true;
      } catch (error) {
        console.error('Error sending Socket.IO message:', error);
        return false;
      }
    } else {
      console.warn('Socket.IO not connected, cannot send message');
      return false;
    }
  }, []);

  // Join a room (tenant-specific)
  const joinRoom = useCallback((roomId) => {
    if (wsRef.current?.connected) {
      wsRef.current.emit('join-room', roomId);
      console.log('📤 Joined room:', roomId);
      return true;
    }
    return false;
  }, []);

  // Leave a room
  const leaveRoom = useCallback((roomId) => {
    if (wsRef.current?.connected) {
      wsRef.current.emit('leave-room', roomId);
      console.log('📤 Left room:', roomId);
      return true;
    }
    return false;
  }, []);

  // Subscribe to specific events
  const subscribe = useCallback((eventType, callback) => {
    if (!eventListenersRef.current.has(eventType)) {
      eventListenersRef.current.set(eventType, new Set());
    }
    
    eventListenersRef.current.get(eventType).add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = eventListenersRef.current.get(eventType);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          eventListenersRef.current.delete(eventType);
        }
      }
    };
  }, []);

  // Subscribe to booking changes
  const subscribeToBookingChanges = useCallback((callback) => {
    return subscribe('booking-changed', callback);
  }, [subscribe]);

  // Subscribe to room changes
  const subscribeToRoomChanges = useCallback((callback) => {
    return subscribe('room-changed', callback);
  }, [subscribe]);

  // Subscribe to tenant updates
  const subscribeToTenantUpdates = useCallback((callback) => {
    return subscribe('tenant-updated', callback);
  }, [subscribe]);

  // Initialize connection when tenant is available
  useEffect(() => {
    if (currentTenant?.id && !connected && !connecting) {
      connect();
    }
  }, [currentTenant, connected, connecting, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const value = {
    // State
    connected,
    connecting,
    error,
    reconnectAttempts,
    
    // Actions
    connect,
    disconnect,
    sendMessage,
    joinRoom,
    leaveRoom,
    
    // Subscriptions
    subscribe,
    subscribeToBookingChanges,
    subscribeToRoomChanges,
    subscribeToTenantUpdates
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};