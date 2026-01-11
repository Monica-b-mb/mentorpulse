import express from 'express';
import Feedback from '../models/Feedback.js';
import PlatformFeedback from '../models/PlatformFeedback.js';
import Session from '../models/Session.js'; // CHANGED from MentorshipSession to Session
import User from '../models/User.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// Submit feedback for a session
router.post('/submit', protect, async (req, res) => {
  try {
    const { sessionId, rating, comment, categories, wouldRecommend, isAnonymous } = req.body;
    const menteeId = req.user._id;

    // Validate required fields
    if (!sessionId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and rating are required'
      });
    }

    // Check if session exists and user is participant
    const session = await Session.findOne({
      _id: sessionId,
      $or: [
        { mentorId: menteeId },
        { menteeId: menteeId }
      ],
      status: 'completed'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or not completed'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      session: sessionId,
      mentee: menteeId
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this session'
      });
    }

    // Determine mentor (if mentee is submitting, mentor is session mentor, and vice versa)
    const mentorId = session.mentorId.toString() === menteeId.toString() ? session.menteeId : session.mentorId;

    // Create feedback
    const feedback = new Feedback({
      session: sessionId,
      mentor: mentorId,
      mentee: menteeId,
      rating,
      comment,
      categories,
      wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true,
      isAnonymous: isAnonymous || false
    });

    await feedback.save();

    // Populate for response
    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate('mentor', 'name profileImage role')
      .populate('mentee', 'name profileImage role')
      .populate('session', 'sessionType sessionDate duration');

    // Update mentor's average rating
    await updateMentorRating(mentorId);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: populatedFeedback
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

// Submit platform feedback
router.post('/platform', protect, async (req, res) => {
  try {
    const { rating, comment, categories, suggestions } = req.body;
    const userId = req.user._id;

    // Create platform feedback record
    const platformFeedback = new PlatformFeedback({
      user: userId,
      rating,
      comment,
      categories,
      suggestions
    });

    await platformFeedback.save();

    res.status(201).json({
      success: true,
      message: 'Platform feedback submitted successfully',
      data: platformFeedback
    });

  } catch (error) {
    console.error('Platform feedback submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit platform feedback'
    });
  }
});

// Get feedback for a mentor
router.get('/mentor/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    // Build query
    let query = { mentor: mentorId, status: 'approved' };
    
    if (rating) {
      query.rating = parseInt(rating);
    }

    const feedback = await Feedback.find(query)
      .populate('mentee', 'name profileImage role')
      .populate('session', 'sessionType sessionDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Feedback.countDocuments(query);

    // Get rating statistics
    const stats = await Feedback.aggregate([
      { $match: { mentor: new mongoose.Types.ObjectId(mentorId), status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    const ratingStats = stats[0] || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: []
    };

    // Calculate rating distribution
    const distribution = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: ratingStats.ratingDistribution.filter(r => r === star).length
    }));

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        statistics: {
          averageRating: Number(ratingStats.averageRating.toFixed(1)) || 0,
          totalReviews: ratingStats.totalReviews || 0,
          distribution
        }
      }
    });

  } catch (error) {
    console.error('Get mentor feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback'
    });
  }
});

// Get user's submitted feedback
router.get('/my-feedback', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const feedback = await Feedback.find({ mentee: userId })
      .populate('mentor', 'name profileImage role')
      .populate('session', 'sessionType sessionDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Feedback.countDocuments({ mentee: userId });

    res.json({
      success: true,
      data: {
        feedback,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user feedback'
    });
  }
});

// Helper function to update mentor's average rating
const updateMentorRating = async (mentorId) => {
  try {
    const stats = await Feedback.aggregate([
      { $match: { mentor: new mongoose.Types.ObjectId(mentorId), status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await User.findByIdAndUpdate(mentorId, {
        averageRating: Number(stats[0].averageRating.toFixed(1)),
        totalReviews: stats[0].totalReviews
      });
    }
  } catch (error) {
    console.error('Update mentor rating error:', error);
  }
};

export default router;