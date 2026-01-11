import express from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

console.log('✅ auth.js route file loaded successfully');
console.log('🔍 Router initialized:', router ? 'Yes' : 'No');

// 🔐 Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// 📝 Register a new user
router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please include all fields');
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

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

// 🔐 Admin Login
router.post('/admin/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || user.role !== 'admin' || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid admin credentials');
  }

  res.json({
    success: true,
    message: 'Admin login successful',
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isVerified: true,
      isActive: true
    },
    token: generateToken(user._id)
  });
}));

// 👤 Get user profile - ADD DIRECT LOGGING TO THIS ROUTE
router.get('/profile', (req, res, next) => {
  console.log('🎯 /api/auth/profile GET route HIT!');
  console.log('   Method:', req.method);
  console.log('   URL:', req.originalUrl);
  console.log('   Headers:', req.headers);
  next();
}, protect, asyncHandler(async (req, res) => {
  console.log('✅ Profile GET route handler executing...');
  console.log('   Authenticated user:', req.user?.email);
  
  const user = await User.findById(req.user._id).select('-password');
  
  if (!user) {
    console.error('❌ User not found in database');
    res.status(404);
    throw new Error('User not found');
  }
  
  console.log('✅ User found:', user.email);
  
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    designation: user.designation || '',
    bio: user.bio || '',
    skills: user.skills || [],
    experience: user.experience || '',
    company: user.company || '',
    location: user.location || '',
    website: user.website || '',
    socialLinks: user.socialLinks || { linkedin: '', github: '', twitter: '' },
    isMentor: user.isMentor,
    isVerified: user.isVerified || false,
    isActive: user.isActive || true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  });
  
  console.log('✅ Profile response sent successfully');
}));

// ✏️ Update user profile - ADD DIRECT LOGGING
router.put('/profile', (req, res, next) => {
  console.log('🎯 /api/auth/profile PUT route HIT!');
  console.log('   Method:', req.method);
  console.log('   URL:', req.originalUrl);
  console.log('   Body:', req.body);
  next();
}, protect, asyncHandler(async (req, res) => {
  console.log('✅ Profile PUT route handler executing...');
  
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Update only provided fields
  user.name = req.body.name || user.name;
  user.designation = req.body.designation || user.designation;
  user.bio = req.body.bio || user.bio;
  user.skills = req.body.skills || user.skills;
  user.experience = req.body.experience || user.experience;
  user.company = req.body.company || user.company;
  user.location = req.body.location || user.location;
  user.website = req.body.website || user.website;
  user.socialLinks = req.body.socialLinks || user.socialLinks;
  
  // Only admins can change role
  if (req.body.role && req.user.role === 'admin') {
    user.role = req.body.role;
    user.isMentor = req.body.role === 'mentor';
  }
  
  const updatedUser = await user.save();
  
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    avatar: updatedUser.avatar,
    designation: updatedUser.designation,
    bio: updatedUser.bio,
    skills: updatedUser.skills,
    experience: updatedUser.experience,
    company: updatedUser.company,
    location: updatedUser.location,
    website: updatedUser.website,
    socialLinks: updatedUser.socialLinks,
    isMentor: updatedUser.isMentor,
    isVerified: updatedUser.isVerified,
    isActive: updatedUser.isActive,
    message: 'Profile updated successfully'
  });
}));

// 🛠️ Admin setup/reset routes
router.post('/setup-admin', asyncHandler(async (req, res) => {
  const adminEmail = 'admin@mentorship.com';
  const adminPassword = 'admin123';
  try {
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      existingAdmin.password = adminPassword;
      existingAdmin.isActive = true;
      existingAdmin.isVerified = true;
      await existingAdmin.save();
      return res.json({ success: true, message: 'Admin reset successfully!' });
    }
    const admin = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
      isMentor: false
    });
    res.json({ success: true, message: 'NEW Admin account created!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Admin setup failed: ' + error.message });
  }
}));

router.post('/nuclear-admin-reset', asyncHandler(async (req, res) => {
  const adminEmail = 'admin@mentorship.com';
  const adminPassword = 'admin123';
  try {
    await User.deleteMany({ $or: [{ email: adminEmail }, { role: 'admin' }] });
    const admin = await User.create({
      name: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isVerified: true,
      isActive: true,
      isMentor: false
    });
    res.json({ success: true, message: 'COMPLETE admin reset performed!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Nuclear reset failed: ' + error.message });
  }
}));

router.post('/activate-admin', asyncHandler(async (req, res) => {
  const adminEmail = 'admin@mentorship.com';
  try {
    const admin = await User.findOne({ email: adminEmail });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    admin.isActive = true;
    admin.isVerified = true;
    await admin.save();
    res.json({ success: true, message: 'Admin activated!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Activation failed: ' + error.message });
  }
}));

router.get('/admin-status', asyncHandler(async (req, res) => {
  const admin = await User.findOne({ email: 'admin@mentorship.com' });
  if (!admin) return res.json({ exists: false, message: 'Admin not found' });
  res.json({ exists: true, admin, canLogin: true });
}));

// 📸 Avatar Upload Route
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

router.post('/upload-avatar', protect, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }
  
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Clean up old avatar if exists and not default
  if (user.avatar && !user.avatar.includes('default-avatar')) {
    const oldPath = path.join(process.cwd(), user.avatar);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }
  
  user.avatar = `/uploads/${req.file.filename}`;
  await user.save();
  
  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    avatar: user.avatar,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      designation: user.designation,
      bio: user.bio,
      skills: user.skills,
      experience: user.experience,
      company: user.company,
      location: user.location,
      website: user.website,
      socialLinks: user.socialLinks,
      isMentor: user.isMentor,
      isVerified: user.isVerified,
      isActive: user.isActive
    }
  });
}));

// ADD TEST ROUTES
router.get('/test-public', (req, res) => {
  console.log('✅ /api/auth/test-public route hit');
  res.json({
    success: true,
    message: 'Public test route works!',
    timestamp: new Date().toISOString()
  });
});

router.get('/test-protected', protect, (req, res) => {
  console.log('✅ /api/auth/test-protected route hit');
  res.json({
    success: true,
    message: 'Protected test route works!',
    user: req.user ? req.user.email : 'no user'
  });
});

console.log('📋 Routes registered in auth.js:');
router.stack.forEach((layer) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
    const path = layer.route.path;
    console.log(`   ${methods} ${path}`);
  }
});

export default router;