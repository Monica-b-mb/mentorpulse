import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateSocket = async (socket, next) => {
  try {
    // Try to get token from handshake auth or headers
    const token = socket.handshake.auth?.token || 
                  socket.handshake.headers?.authorization?.replace('Bearer ', '');
    
    console.log('🔐 Socket auth attempt - Token present:', !!token);
    
    if (!token) {
      console.log('❌ No token provided for socket connection');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('❌ User not found for socket connection');
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.userId = user._id.toString();
    socket.user = user;
    
    console.log(`✅ Socket authenticated for user: ${user.name}`);
    next();
  } catch (error) {
    console.error('❌ Socket authentication error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};