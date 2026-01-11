import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get all mentors
router.get('/', async (req, res) => {
  try {
    console.log('📞 GET /api/mentors called');
    
    const mentorUsers = await User.find({
      role: 'mentor',
      isActive: true
    }).select('-password');

    console.log('📊 Found mentor users:', mentorUsers.length);

    if (mentorUsers.length > 0) {
      const mentors = mentorUsers.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '/default-avatar.png',
        designation: user.designation || 'Professional Mentor',
        company: user.company || '',
        skills: user.skills || [],
        hourlyRate: user.hourlyRate || 50,
        availability: user.availability || 'available',
        rating: user.rating || 4.5,
        reviews: user.reviews || 0,
        bio: user.bio || '',
        experience: user.experience || '',
        languages: user.languages || ['English'],
        isVerified: user.isVerified || false
      }));

      console.log('✅ Sending mentors from User collection:', mentors.length);
      return res.json(mentors);
    }

    console.log('ℹ️ No mentor users found in database');
    res.json([]);
  } catch (error) {
    console.error('❌ Error in /api/mentors:', error);
    res.status(500).json({
      message: 'Error fetching mentors',
      error: error.message
    });
  }
});

// Get single mentor by ID - FIXED ENDPOINT
router.get('/:id', async (req, res) => {
  try {
    console.log('📞 GET /api/mentors/:id called for:', req.params.id);
    
    const mentor = await User.findById(req.params.id)
      .select('-password')
      .lean();

    if (!mentor || mentor.role !== 'mentor') {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found'
      });
    }

    // Add stats data
    const mentorWithStats = {
      ...mentor,
      stats: {
        totalSessions: Math.floor(Math.random() * 50) + 10,
        averageRating: mentor.rating || 4.5,
        responseRate: Math.floor(Math.random() * 30) + 70,
        mentorshipDuration: '2+ years',
        successRate: '95%'
      }
    };

    res.json(mentorWithStats);
  } catch (error) {
    console.error('❌ Get mentor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;