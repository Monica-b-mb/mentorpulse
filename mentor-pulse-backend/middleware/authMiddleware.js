import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// Protect routes
const protect = asyncHandler(async (req, res, next) => {
  console.log('🛡️ Protect middleware called for:', req.path);
  
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔑 Token extracted, length:', token ? token.length : 0);

      if (!token) {
        console.error('❌ No token provided');
        res.status(401);
        return res.json({ error: 'Not authorized, no token' });
      }

      console.log('🔐 Verifying token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decoded, user ID:', decoded.id);

      console.log('🔍 Finding user in database...');
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.error('❌ User not found for ID:', decoded.id);
        res.status(401);
        return res.json({ error: 'Not authorized, user not found' });
      }
      
      console.log('✅ User authenticated:', req.user.email);
      next();
    } catch (error) {
      console.error('❌ Auth middleware error details:');
      console.error('   Error name:', error.name);
      console.error('   Error message:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        console.error('   Reason: Invalid token signature');
        res.status(401);
        return res.json({ error: 'Invalid token' });
      } else if (error.name === 'TokenExpiredError') {
        console.error('   Reason: Token expired');
        res.status(401);
        return res.json({ error: 'Token expired' });
      } else {
        console.error('   Reason: Unknown error');
        res.status(401);
        return res.json({ error: 'Not authorized' });
      }
    }
  } else {
    console.error('❌ No Authorization header or Bearer token');
    console.error('   Headers:', req.headers);
    res.status(401);
    return res.json({ error: 'Not authorized, no token provided' });
  }
});

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      return res.json({ error: 'Not authorized, no user' });
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return res.json({ error: `User role ${req.user.role} is not authorized to access this route` });
    }
    next();
  };
};

export { protect, authorize };