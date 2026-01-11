import express from 'express';
const router = express.Router();

import { protect } from '../middleware/authMiddleware.js';
import {
  bookSession,
  getUserSessions,
  cancelSession,
  cancelSessionOnLink,
  addReview,
  updateMeetLink,
  updateSessionStatus,
  approveSessionCompletion,
  initiateSessionCompletion
} from '../controllers/sessionController.js';

// 📅 Book a new session
router.post('/book', protect, bookSession);

// 📋 Get sessions for logged-in user
router.get('/user-sessions', protect, getUserSessions);

// ✅ VERIFICATION ROUTES
router.patch('/:id/initiate-completion', protect, initiateSessionCompletion);
router.patch('/:id/approve', protect, approveSessionCompletion);

// ❌ Session status management
router.patch('/:id/status', protect, updateSessionStatus);
router.patch('/:id/cancel', protect, cancelSession);

// 🔗 Meeting link management
router.patch('/:id/meet-link', protect, updateMeetLink);

// ⭐ Add review and feedback
router.post('/:id/review', protect, addReview);
router.post('/:id/cancel-on-link', protect, cancelSessionOnLink);

export default router;