import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import MentorshipRequest from '../models/MentorshipRequest.js';

const router = express.Router();

// 📨 Send mentorship request with validation
router.post('/request', protect, async (req, res) => {
  try {
    const { mentorId, message, goals, expectedOutcome } = req.body;

    // Check for existing pending or accepted request
    const existingRequest = await MentorshipRequest.findOne({
      mentor: mentorId,
      mentee: req.user.id,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message:
          existingRequest.status === 'accepted'
            ? 'You are already connected with this mentor'
            : 'You already have a pending request with this mentor'
      });
    }

    // Create new request
    const request = await MentorshipRequest.create({
      mentor: mentorId,
      mentee: req.user.id,
      message,
      goals,
      expectedOutcome
    });

    // Populate mentor and mentee details
    await request.populate('mentor', 'name avatar designation company');
    await request.populate('mentee', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Mentorship request sent successfully',
      data: request
    });
  } catch (error) {
    console.error('Mentorship request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending request'
    });
  }
});

// 📥 Mentor's incoming requests
router.get('/mentor/requests', protect, async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({ mentor: req.user.id })
      .populate('mentee', 'name avatar');
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching mentor requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch mentor requests' });
  }
});

// 📤 Mentee's outgoing requests
router.get('/mentee/requests', protect, async (req, res) => {
  try {
    const requests = await MentorshipRequest.find({ mentee: req.user.id })
      .populate('mentor', 'name avatar designation company');
    res.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching mentee requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch mentee requests' });
  }
});

// ✅ Update request status (accept/reject)
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;

    const request = await MentorshipRequest.findOneAndUpdate(
      { _id: req.params.id, mentor: req.user.id },
      { status, respondedAt: new Date() },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found or unauthorized' });
    }

    res.json({ success: true, message: `Request ${status}`, request });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ success: false, message: 'Failed to update request status' });
  }
});
// Check mentorship status between mentee and mentor
router.get('/status/:mentorId', protect, async (req, res) => {
  try {
    const { mentorId } = req.params;
    const menteeId = req.user.id;

    // Check if user is a mentee
    if (req.user.role !== 'mentee') {
      return res.status(403).json({
        success: false,
        message: 'Only mentees can check mentorship status'
      });
    }

    const mentorship = await Mentorship.findOne({
      mentor: mentorId,
      mentee: menteeId
    });

    res.json({
      success: true,
      status: mentorship ? mentorship.status : 'not-connected',
      mentorship: mentorship || null
    });
  } catch (error) {
    console.error('Mentorship status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
