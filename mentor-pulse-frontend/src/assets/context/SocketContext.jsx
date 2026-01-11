import React, { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping socket connection');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'https://mentorpulse.onrender.com/api';
    
    console.log('🔌 Attempting socket connection to:', apiUrl);
    
    const newSocket = io(apiUrl, {
      auth: {
        token: token
      },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      timeout: 10000
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Socket connected successfully, ID:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('❌ Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        console.log('🧹 Cleaning up socket connection');
        newSocket.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketProvider };
