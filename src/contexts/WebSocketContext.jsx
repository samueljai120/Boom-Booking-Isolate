import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const enableWsLogging = import.meta.env.VITE_DEBUG_WS === 'true';

  useEffect(() => {
    // Check if we're in development mode with mock backend
    const isDevelopment = import.meta.env.DEV;
    const isMockBackend = import.meta.env.VITE_API_BASE_URL?.includes('localhost:4000') || 
                         !import.meta.env.VITE_API_BASE_URL;
    
    // Skip WebSocket connection in development with mock backend
    if (isDevelopment && isMockBackend) {
      if (enableWsLogging) console.debug('WebSocket disabled in development mode with mock backend');
      setConnected(false);
      return;
    }

    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8002';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      if (enableWsLogging) console.debug('WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      if (enableWsLogging) console.debug('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      if (enableWsLogging) console.debug('WebSocket connection error:', error);
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinRoom = (room) => {
    if (socket && connected) {
      socket.emit('join-room', room);
    }
  };

  const leaveRoom = (room) => {
    if (socket && connected) {
      socket.emit('leave-room', room);
    }
  };

  const subscribeToBookingChanges = (callback) => {
    if (socket && connected) {
      socket.on('booking-changed', callback);
      return () => socket.off('booking-changed', callback);
    }
    return () => {};
  };

  const subscribeToRoomChanges = (roomId, callback) => {
    if (socket && connected) {
      socket.on('room-booking-changed', callback);
      return () => socket.off('room-booking-changed', callback);
    }
    return () => {};
  };

  const subscribeToDateChanges = (date, callback) => {
    if (socket && connected) {
      socket.on('date-booking-changed', callback);
      return () => socket.off('date-booking-changed', callback);
    }
    return () => {};
  };

  const value = {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    subscribeToBookingChanges,
    subscribeToRoomChanges,
    subscribeToDateChanges,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};