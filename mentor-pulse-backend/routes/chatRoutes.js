import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  markAsRead,
  getAvailableUsers
} from '../controllers/chatController.js';

const router = express.Router();

console.log('✅ Chat routes loaded');

// PUBLIC ROUTES FOR DEMO
router.get('/test', (req, res) => {
  console.log('✅ Chat test route hit');
  res.json({ 
    success: true, 
    message: 'Chat API is working!',
    status: 'Public route accessible',
    timestamp: new Date().toISOString(),
    routes: [
      'GET /api/chat/user/chats (protected)',
      'GET /api/chat/users/available (protected)',
      'POST /api/chat/get-or-create (protected)',
      'GET /api/chat/:chatId/messages (protected)',
      'POST /api/chat/:chatId/messages (protected)',
      'PATCH /api/chat/:chatId/read (protected)',
      'GET /api/chat/test (public)',
      'GET /api/chat/demo/chats (public)'
    ]
  });
});

// Demo data route (public for demo)
router.get('/demo/chats', (req, res) => {
  res.json({
    success: true,
    message: 'Demo chat data for presentation',
    chats: [
      {
        _id: 'demo1',
        participants: [
          { _id: 'user1', name: 'John Doe', role: 'mentor', profileImage: 'https://i.pravatar.cc/150?img=1' }
        ],
        lastMessage: {
          content: 'Welcome to MentorPulse! How can I help you today?',
          sender: { name: 'John Doe' },
          createdAt: new Date().toISOString(),
          isDelivered: true
        },
        unreadCount: 0,
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'demo2',
        participants: [
          { _id: 'user2', name: 'Jane Smith', role: 'mentee', profileImage: 'https://i.pravatar.cc/150?img=2' }
        ],
        lastMessage: {
          content: 'Our session is scheduled for 3 PM tomorrow. Looking forward!',
          sender: { name: 'Jane Smith' },
          createdAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
          isDelivered: true
        },
        unreadCount: 2,
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  });
});

// Demo messages route (public)
router.get('/demo/:chatId/messages', (req, res) => {
  const { chatId } = req.params;
  
  const demoMessages = [
    {
      _id: 'msg1',
      chat: chatId,
      sender: { _id: 'user1', name: 'John Doe', profileImage: 'https://i.pravatar.cc/150?img=1' },
      content: 'Hello! Welcome to MentorPulse.',
      messageType: 'text',
      isDelivered: true,
      isSeen: true,
      createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      _id: 'msg2',
      chat: chatId,
      sender: { _id: 'demo-user', name: 'You', profileImage: 'https://i.pravatar.cc/150?img=3' },
      content: 'Hi! I need help with React state management.',
      messageType: 'text',
      isDelivered: true,
      isSeen: true,
      createdAt: new Date(Date.now() - 1800000).toISOString() // 30 mins ago
    },
    {
      _id: 'msg3',
      chat: chatId,
      sender: { _id: 'user1', name: 'John Doe', profileImage: 'https://i.pravatar.cc/150?img=1' },
      content: 'Sure! I can help with that. When would you like to schedule a session?',
      messageType: 'text',
      isDelivered: true,
      isSeen: false,
      createdAt: new Date().toISOString()
    }
  ];
  
  res.json({
    success: true,
    messages: demoMessages,
    chatId,
    isDemo: true
  });
});

// Apply protect middleware to all REAL routes (not demo)
router.use(protect);

// Protected chat routes
router.get('/user/chats', getUserChats);
router.get('/users/available', getAvailableUsers);
router.post('/get-or-create', getOrCreateChat);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/messages', sendMessage);
router.patch('/:chatId/read', markAsRead);

export default router;