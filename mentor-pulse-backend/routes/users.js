import express from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

console.log('✅ auth.js route file loaded successfully');

// 🔐 Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// 🛠️ SIMPLE ADMIN SETUP
router.post('/setup-admin', asyncHandler(async (req, res) => {
  const adminEmail = 'admin@mentorship.com';
  const adminPassword = 'admin123';
  
  // Check if admin already exists
  const existingAdmin = await User.findOne({ email: adminEmail });
  
  if (existingAdmin) {
    return res.json({
      message: 'Admin account already exists',
      email: adminEmail,
      note: 'Use the existing credentials to login'
    });
  }
  
  // Create admin account
  const admin = await User.create({
    name: 'System Administrator',
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    isVerified: true
  });
  
  res.json({
    message: 'Admin account created successfully!',
    credentials: {
      email: adminEmail,
      password: adminPassword
    },
    instructions: 'Toggle "Admin Mode" ON in login page and use these credentials'
  });
}));

// 🔐 PASSWORD CHANGE
router.put('/change-password', protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const user = await User.findById(req.user.id).select('+password');
  
  // Check current password
  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  res.json({ message: 'Password updated successfully' });
}));

// 📝 Register a new user
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please include all fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user - SET isMentor BASED ON ROLE
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'mentee',
    isMentor: role === 'mentor'
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isMentor: user.isMentor,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
}));

// 🔐 Login user
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please include email and password');
  }

  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
}));

// 👤 Get current user
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    bio: user.bio,
    skills: user.skills,
    designation: user.designation,
    location: user.location,
    website: user.website,
    socialLinks: user.socialLinks
  });
}));

// 👁️ GET Profile - For viewing profile in browser
router.get('/profile', protect, asyncHandler(async (req, res) => {
  try {
    console.log('👁️ GET Profile request received');
    const user = await User.findById(req.user.id).select('-password');
    
    res.json({
      message: 'Profile data retrieved successfully',
      user: user
    });
  } catch (error) {
    console.error('❌ GET Profile error:', error);
    res.status(500).json({ message: error.message });
  }
}));

// ✏️ PUT Profile - For updating profile
router.put('/profile', protect, asyncHandler(async (req, res) => {
  try {
    console.log('🟢 PUT Profile UPDATE STARTED ====================');
    console.log('📋 User ID from auth:', req.user.id);
    console.log('📦 Request body:', req.body);
    
    const { designation, bio, skills, location, website, socialLinks } = req.body;

    // Validate required fields
    if (!req.user.id) {
      console.log('❌ No user ID in request');
      return res.status(400).json({ message: 'User ID is required' });
    }

    console.log('🔄 Updating user in database...');
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        designation,
        bio,
        skills,
        location,
        website,
        socialLinks
      },
      { 
        new: true, 
        runValidators: true,
        context: 'query' 
      }
    ).select('-password');

    if (!user) {
      console.log('❌ User not found with ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User updated successfully:', {
      id: user._id,
      name: user.name,
      designation: user.designation,
      bio: user.bio
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        skills: user.skills,
        designation: user.designation,
        location: user.location,
        website: user.website,
        socialLinks: user.socialLinks
      }
    });

    console.log('🟢 PROFILE UPDATE COMPLETED ====================');

  } catch (error) {
    console.error('❌ PROFILE UPDATE ERROR:', error);
    res.status(400).json({ 
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Update failed'
    });
  }
}));

// 🔍 Get user profile by ID
router.get('/profile/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('name email avatar bio skills role designation location website socialLinks isVerified createdAt');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(user);
}));

// 🧪 Test route to verify auth routes are working
router.get('/test', (req, res) => {
  console.log('✅ /api/auth/test route called');
  res.json({ 
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Log all registered routes in this router
console.log('🔍 Registered auth routes:');
router.stack.forEach((layer) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
    const path = layer.route.path;
    console.log(`   ${methods} ${path}`);
  }
});

export default router;