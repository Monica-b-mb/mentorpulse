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

// Apply protect middleware to all routes
router.use(protect);

// Debug route to test if chat routes are working
router.get('/test', (req, res) => {
  console.log('✅ Chat test route hit by user:', req.user.name);
  res.json({ 
    success: true, 
    message: 'Chat routes are working!',
    user: req.user.name,
    timestamp: new Date().toISOString()
  });
});

// Chat routes - CORRECT ENDPOINTS
router.get('/user/chats', getUserChats);
router.get('/users/available', getAvailableUsers);
router.post('/get-or-create', getOrCreateChat);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/messages', sendMessage);
router.patch('/:chatId/read', markAsRead);

export default router;