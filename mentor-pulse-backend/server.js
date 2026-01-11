import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { authenticateSocket } from './middleware/socketAuth.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import mentorRoutes from './routes/mentors.js';
import mentorshipRoutes from './routes/mentorship.js';
import sessionRoutes from './routes/sessions.js';
import availabilityRoutes from './routes/availability.js';
import chatRoutes from './routes/chatRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import skillRoutes from './routes/skills.js';
import achievementRoutes from './routes/achievements.js';
import sessionAnalyticsRoutes from './routes/sessionAnalytics.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration - More permissive for development
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ];
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Preflight requests
app.options('*', cors());

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
import fs from 'fs';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Serve static files
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/analytics/sessions', sessionAnalyticsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    message: 'MentorPulse API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      profile: '/api/auth/profile',
      mentors: '/api/mentors',
      sessions: '/api/sessions',
      chat: '/api/chat',
      feedback: '/api/feedback',
      admin: '/api/admin'
    }
  });
});

// Profile route test
app.get('/api/profile/test', (req, res) => {
  res.json({
    message: 'Profile API is accessible!',
    note: 'Use /api/auth/profile for actual profile data with authentication'
  });
});

// Debug chat route
app.get('/api/chat/test', (req, res) => {
  res.json({
    message: 'Chat API is working!',
    routes: [
      'GET /api/chat/user/chats',
      'GET /api/chat/users/available',
      'POST /api/chat/get-or-create',
      'GET /api/chat/:chatId/messages',
      'PATCH /api/chat/:chatId/read'
    ]
  });
});

// Create HTTP server
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "http://127.0.0.1:5173", 
      "http://localhost:3000",
      "http://localhost:5174"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket authentication
io.use(authenticateSocket);

const connectedUsers = new Map();

// Make io accessible to routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`✅ User ${socket.user?.name} connected with socket ID: ${socket.id}`);

  connectedUsers.set(socket.userId, {
    socketId: socket.id,
    user: socket.user
  });

  // Join user's personal room
  socket.join(socket.userId);
  console.log(`👤 ${socket.user?.name} joined personal room: ${socket.userId}`);

  // Handle joining chat rooms
  socket.on('join-chat', (chatId) => {
    console.log(`👥 ${socket.user?.name} joining chat room: ${chatId}`);
    socket.join(chatId);
  });

  // Handle leaving chat rooms
  socket.on('leave-chat', (chatId) => {
    console.log(`👥 ${socket.user?.name} leaving chat room: ${chatId}`);
    socket.leave(chatId);
  });

  // Handle typing indicators
  socket.on('typing-start', ({ chatId }) => {
    console.log(`⌨️ ${socket.user?.name} started typing in chat: ${chatId}`);
    socket.to(chatId).emit('user-typing', {
      userId: socket.userId,
      name: socket.user?.name,
      isTyping: true
    });
  });

  socket.on('typing-stop', ({ chatId }) => {
    console.log(`⌨️ ${socket.user?.name} stopped typing in chat: ${chatId}`);
    socket.to(chatId).emit('user-typing', {
      userId: socket.userId,
      name: socket.user?.name,
      isTyping: false
    });
  });

  // Handle sending messages via socket
  socket.on('send-message', async (data) => {
    try {
      const { chatId, content, messageType = 'text' } = data;
      console.log(`📤 Socket message from ${socket.user?.name} to chat ${chatId}: ${content}`);

      // Dynamically import models
      const Chat = (await import('./models/Chat.js')).default;
      const Message = (await import('./models/Message.js')).default;
      const User = (await import('./models/User.js')).default;
      
      // Get chat info
      const chat = await Chat.findById(chatId).populate('participants', '_id name');
      
      if (!chat) {
        console.error('❌ Chat not found:', chatId);
        socket.emit('error', { message: 'Chat not found' });
        return;
      }

      // Check if user is participant
      const isParticipant = chat.participants.some(p => p._id.toString() === socket.userId);
      if (!isParticipant) {
        console.error('❌ User not authorized to send message to this chat');
        socket.emit('error', { message: 'Not authorized' });
        return;
      }

      // Create message - IMPORTANT: isDelivered should be false initially
      const message = new Message({
        chat: chatId,
        sender: socket.userId,
        content: content.trim(),
        messageType,
        readBy: [{
          user: socket.userId,
          readAt: new Date()
        }],
        isDelivered: false, // Start as false
        isSeen: false
      });

      await message.save();

      // Update chat
      chat.lastMessage = message._id;
      chat.updatedAt = new Date();
      await chat.save();

      // Populate message
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name profileImage role');

      // Get other participant
      const otherParticipant = chat.participants.find(
        p => p._id.toString() !== socket.userId
      );

      // Emit to chat room - message is sent but not delivered yet
      io.to(chatId).emit('new-message', {
        success: true,
        message: populatedMessage,
        chatId,
        isDelivered: false // Tell frontend it's not delivered yet
      });

      // Emit to sender for confirmation
      socket.emit('message-sent', {
        success: true,
        message: populatedMessage,
        chatId,
        isDelivered: false
      });

      // Check if other participant is online
      if (otherParticipant) {
        const otherParticipantId = otherParticipant._id.toString();
        if (connectedUsers.has(otherParticipantId)) {
          // Mark as delivered when other user is online
          message.isDelivered = true;
          await message.save();
          
          // Re-populate with updated status
          const updatedMessage = await Message.findById(message._id)
            .populate('sender', 'name profileImage role');
          
          // Emit delivered status to sender
          io.to(socket.userId).emit('message-delivered', {
            success: true,
            messageId: message._id,
            chatId,
            isDelivered: true
          });
          
          console.log(`📨 Message delivered to ${otherParticipant.name}`);
        } else {
          console.log(`⏳ ${otherParticipant.name} is offline, message not delivered yet`);
        }
      }

      console.log(`✅ Message saved for chat ${chatId}`);

    } catch (error) {
      console.error('❌ Socket send message error:', error);
      socket.emit('error', { message: 'Failed to send message: ' + error.message });
    }
  });

  // Handle message delivery confirmation
  socket.on('message-received', async (data) => {
    try {
      const { messageId, chatId } = data;
      console.log(`📩 Message ${messageId} received by ${socket.user?.name}`);
      
      const Message = (await import('./models/Message.js')).default;
      
      // Update message as seen
      await Message.findByIdAndUpdate(messageId, {
        isSeen: true,
        $push: {
          readBy: {
            user: socket.userId,
            readAt: new Date()
          }
        }
      });
      
      // Notify sender that message was seen
      const message = await Message.findById(messageId);
      if (message) {
        io.to(message.sender.toString()).emit('message-seen', {
          success: true,
          messageId,
          chatId,
          seenBy: socket.userId,
          seenAt: new Date()
        });
        
        console.log(`👁️ Message ${messageId} marked as seen by ${socket.user?.name}`);
      }
    } catch (error) {
      console.error('❌ Error marking message as received:', error);
    }
  });

  // Handle user coming online - deliver pending messages
  socket.on('user-online', async () => {
    try {
      console.log(`🌐 ${socket.user?.name} is online, checking for pending messages`);
      
      const Message = (await import('./models/Message.js')).default;
      const Chat = (await import('./models/Chat.js')).default;
      
      // Find all messages sent to this user that are not delivered yet
      const userChats = await Chat.find({ participants: socket.userId });
      const chatIds = userChats.map(chat => chat._id);
      
      const pendingMessages = await Message.find({
        chat: { $in: chatIds },
        sender: { $ne: socket.userId },
        isDelivered: false
      });
      
      // Mark all pending messages as delivered
      for (const message of pendingMessages) {
        message.isDelivered = true;
        await message.save();
        
        // Notify sender that message is now delivered
        io.to(message.sender.toString()).emit('message-delivered', {
          success: true,
          messageId: message._id,
          chatId: message.chat,
          isDelivered: true,
          deliveredAt: new Date()
        });
        
        console.log(`📨 Delivered pending message ${message._id} to ${socket.user?.name}`);
      }
    } catch (error) {
      console.error('❌ Error delivering pending messages:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User ${socket.user?.name} disconnected`);
    connectedUsers.delete(socket.userId);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  // Handle multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File too large. Maximum size is 5MB.',
      error: err.message
    });
  }
  
  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: 'File upload error',
      error: err.message
    });
  }
  
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      '/api/health',
      '/api/auth/profile',
      '/api/auth/login',
      '/api/auth/register',
      '/api/mentors',
      '/api/sessions',
      '/api/chat'
    ]
  });
});

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Listen to connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('❌ MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`
🚀 Server running on port ${PORT}
📡 Socket.io: Enabled
💾 MongoDB: Connected
🌐 CORS: Configured
📁 Static files: Enabled for /uploads
📊 API Endpoints:
   • Health: http://localhost:${PORT}/api/health
   • Profile: http://localhost:${PORT}/api/auth/profile
   • Login: http://localhost:${PORT}/api/auth/login
   • Register: http://localhost:${PORT}/api/auth/register
    `);
    
    // Test the uploads directory
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`📁 Uploads exists: ${fs.existsSync(uploadsDir)}`);
  });
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Server terminated...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

startServer().catch(console.error);