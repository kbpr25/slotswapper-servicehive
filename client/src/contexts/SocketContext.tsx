import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection established
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      // Join user's personal room
      newSocket.emit('join', user.id);
    });

    // Connection error
    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    // Disconnection
    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    // Listen for new swap request notifications
    newSocket.on('new_swap_request', (data) => {
      console.log('🔔 New swap request received:', data);
      toast.success('🔔 You have a new swap request!', {
        duration: 5000,
        position: 'top-right'
      });
      // Play notification sound (optional)
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    });

    // Listen for swap acceptance notifications
    newSocket.on('swap_accepted', (data) => {
      console.log('✅ Swap accepted:', data);
      toast.success('🎉 Your swap request was accepted!', {
        duration: 5000,
        position: 'top-right'
      });
    });

    // Listen for swap rejection notifications
    newSocket.on('swap_rejected', (data) => {
      console.log('❌ Swap rejected:', data);
      toast.error('😔 Your swap request was rejected', {
        duration: 4000,
        position: 'top-right'
      });
    });

    setSocket(newSocket);

    // Cleanup function - disconnect socket when component unmounts
    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.off('connect');
      newSocket.off('connect_error');
      newSocket.off('disconnect');
      newSocket.off('new_swap_request');
      newSocket.off('swap_accepted');
      newSocket.off('swap_rejected');
      newSocket.disconnect();
    };
  }, [user, API_URL]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
