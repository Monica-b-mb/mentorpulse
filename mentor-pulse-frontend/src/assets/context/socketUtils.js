import { io } from 'socket.io-client';

// Socket instance creation
export const createSocket = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return io(apiUrl);
};

// Socket event handlers
export const setupSocketEvents = (socket, setIsConnected) => {
  socket.on('connect', () => {
    setIsConnected(true);
    console.log('✅ Socket connected');
  });

  socket.on('disconnect', () => {
    setIsConnected(false);
    console.log('❌ Socket disconnected');
  });

  return () => {
    socket.off('connect');
    socket.off('disconnect');
  };
};