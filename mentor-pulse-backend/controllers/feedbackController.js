import Feedback from '../models/Feedback.js';
import MentorshipSession from '../models/MentorshipSession.js';
import User from '../models/User.js';

// Submit feedback for a session
export const submitFeedback = async (req, res) => {
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
    const session = await MentorshipSession.findOne({
      _id: sessionId,
      $or: [
        { mentor: menteeId },
        { mentee: menteeId }
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
    const mentorId = session.mentor.toString() === menteeId.toString() ? session.mentee : session.mentor;

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
      .populate('session', 'title scheduledDate duration');

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
};

// Get feedback for a mentor
export const getMentorFeedback = async (req, res) => {
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
      .populate('session', 'title scheduledDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Feedback.countDocuments(query);

    // Get rating statistics
    const stats = await Feedback.aggregate([
      { $match: { mentor: mongoose.Types.ObjectId(mentorId), status: 'approved' } },
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
          averageRating: Number(ratingStats.averageRating.toFixed(1)),
          totalReviews: ratingStats.totalReviews,
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
};

// Get user's submitted feedback
export const getUserFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const feedback = await Feedback.find({ mentee: userId })
      .populate('mentor', 'name profileImage role')
      .populate('session', 'title scheduledDate')
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
};

// Update mentor's average rating (helper function)
const updateMentorRating = async (mentorId) => {
  try {
    const stats = await Feedback.aggregate([
      { $match: { mentor: mongoose.Types.ObjectId(mentorId), status: 'approved' } },
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

// Admin: Get all feedback
export const getAllFeedback = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, rating, mentor } = req.query;

    let query = {};
    
    if (status) query.status = status;
    if (rating) query.rating = parseInt(rating);
    if (mentor) query.mentor = mentor;

    const feedback = await Feedback.find(query)
      .populate('mentor', 'name email profileImage role')
      .populate('mentee', 'name email profileImage role')
      .populate('session', 'title scheduledDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Feedback.countDocuments(query);

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
    console.error('Get all feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback'
    });
  }
};

// Admin: Update feedback status
export const updateFeedbackStatus = async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const feedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { status },
      { new: true }
    ).populate('mentor', 'name profileImage role')
     .populate('mentee', 'name profileImage role');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Update mentor rating if status changed to approved
    if (status === 'approved') {
      await updateMentorRating(feedback.mentor._id);
    }

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      data: feedback
    });

  } catch (error) {
    console.error('Update feedback status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback status'
    });
  }
};