import express from 'express';
import Session from '../models/Session.js';
import Skill from '../models/Skill.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ GET SESSION ANALYTICS
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = 'weekly' } = req.query;

    // Get sessions for timeframe
    const sessions = await Session.find({
      $or: [{ mentorId: userId }, { menteeId: userId }],
      status: 'completed'
    }).populate('mentorId', 'name').populate('menteeId', 'name');

    // Calculate basic metrics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const totalHours = sessions.reduce((sum, session) => sum + (session.duration || 0) / 60, 0);
    
    // Session type breakdown
    const byType = {};
    sessions.forEach(session => {
      const type = session.sessionType || 'general';
      byType[type] = (byType[type] || 0) + 1;
    });

    // Day breakdown
    const byDay = {};
    sessions.forEach(session => {
      const day = new Date(session.createdAt).toLocaleDateString('en', { weekday: 'long' });
      byDay[day] = (byDay[day] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        metrics: {
          totalSessions,
          completedSessions,
          totalHours: parseFloat(totalHours.toFixed(2)),
          averageSessionDuration: totalSessions > 0 ? parseFloat((totalHours / totalSessions).toFixed(2)) : 0,
          completionRate: totalSessions > 0 ? parseFloat(((completedSessions / totalSessions) * 100).toFixed(2)) : 0
        },
        breakdown: {
          byType,
          byDay
        }
      }
    });

  } catch (error) {
    console.error('Get session analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session analytics'
    });
  }
});

export default router;