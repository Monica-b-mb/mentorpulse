import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Availability from '../models/Availability.js';
import Mentorship from '../models/Mentorship.js';
import User from '../models/User.js';
import Session from '../models/Session.js';



const router = express.Router();

// Get availability for a specific mentor (for mentees to view)
// Get available time slots for a mentor on specific date
router.get('/mentor/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { date } = req.query; // Now getting date from query params

    console.log(`Fetching slots for mentor: ${mentorId}, date: ${date}`);

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    // Check if mentor exists and is active
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor' || !mentor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found or not available'
      });
    }

    // Get mentor's availability
    const availability = await Availability.findOne({ 
      mentorId,
      isActive: true 
    });
    
    if (!availability) {
      return res.json({ 
        success: true,
        availableSlots: [],
        message: 'No availability set for this mentor'
      });
    }

    // Get already booked sessions for that date
    const bookedSessions = await Session.find({
      mentorId,
      sessionDate: new Date(date),
      status: { $in: ['confirmed', 'pending'] }
    });

    // Convert day of week (0-6) for the given date
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

    // Get available slots from weekly availability
    // Convert Map to object if needed
    let weeklySlots = [];
    if (availability.weeklySlots instanceof Map) {
      weeklySlots = availability.weeklySlots.get(dayOfWeek.toString()) || [];
    } else {
      weeklySlots = availability.weeklySlots[dayOfWeek] || [];
    }

    console.log(`Weekly slots for day ${dayOfWeek}:`, weeklySlots);
    console.log(`Booked sessions:`, bookedSessions);

    // Filter out booked slots
    const availableSlots = weeklySlots.filter(slot => {
      if (!slot.isAvailable) return false;

      // Check if this slot is already booked
      const isBooked = bookedSessions.some(session =>
        session.startTime === slot.startTime && session.endTime === slot.endTime
      );

      console.log(`Slot ${slot.startTime}-${slot.endTime}: available=${slot.isAvailable}, booked=${isBooked}`);
      return !isBooked;
    });

    console.log('Final available slots:', availableSlots);

    res.json({
      success: true,
      availableSlots,
      timezone: availability.timezone
    });
  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get available time slots for a mentor on specific date
router.get('/slots/:mentorId/:date', async (req, res) => {
  try {
    const { mentorId, date } = req.params;

    // Check if user has access to this mentor's availability
    // (This could be enhanced with proper authentication)
    
    // Get mentor's availability
    const availability = await Availability.findOne({ 
      mentorId,
      isActive: true 
    });
    
    if (!availability) {
      return res.json({ 
        success: true,
        availableSlots: [],
        message: 'No availability set for this mentor'
      });
    }

    // Get already booked sessions for that date
    const bookedSessions = await Session.find({
      mentorId,
      sessionDate: new Date(date),
      status: { $in: ['confirmed', 'pending'] }
    });

    // Convert day of week (0-6) for the given date
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

    // Get available slots from weekly availability
    const weeklySlots = availability.weeklySlots.get(dayOfWeek.toString()) || [];

    // Filter out booked slots
    const availableSlots = weeklySlots.filter(slot => {
      if (!slot.isAvailable) return false;

      // Check if this slot is already booked
      const isBooked = bookedSessions.some(session =>
        session.startTime === slot.startTime && session.endTime === slot.endTime
      );

      return !isBooked;
    });

    res.json({
      success: true,
      availableSlots,
      timezone: availability.timezone
    });
  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Check if mentee can access mentor's availability
// Check if mentee can access mentor's availability
router.get('/access/:mentorId', protect, async (req, res) => {
  try {
    const { mentorId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // If the user is the mentor themselves, allow access
    if (userId === mentorId) {
      return res.json({
        success: true,
        hasAccess: true,
        isMentor: true
      });
    }

    // If user is a mentee, check if they have an accepted mentorship
    if (userRole === 'mentee') {
      const existingMentorship = await Mentorship.findOne({
        mentor: mentorId,
        mentee: userId,
        status: 'accepted'
      });

      return res.json({
        success: true,
        hasAccess: !!existingMentorship,
        isMentor: false
      });
    }

    // If user is an admin or other role, allow access
    res.json({
      success: true,
      hasAccess: true,
      isMentor: false
    });
  } catch (error) {
    console.error('Access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get logged-in mentor's availability
router.get('/my-availability', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'mentor') {
      return res.status(403).json({
        success: false,
        message: 'Only mentors can access their availability'
      });
    }

    const availability = await Availability.findOne({
      mentorId: userId,
      isActive: true
    }).populate('mentorId', 'name email avatar');

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'No availability found for this mentor'
      });
    }

    const availabilityData = availability.toObject();
    if (availabilityData.weeklySlots instanceof Map) {
      availabilityData.weeklySlots = Object.fromEntries(availabilityData.weeklySlots);
    }

    res.json({
      success: true,
      data: availabilityData
    });
  } catch (error) {
    console.error('Error fetching my availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});
// Create or update mentor availability
router.post('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole !== 'mentor') {
      return res.status(403).json({
        success: false,
        message: 'Only mentors can set availability'
      });
    }

    const { weeklySlots, exceptions, timezone } = req.body;

    // Upsert availability
    const updatedAvailability = await Availability.findOneAndUpdate(
      { mentorId: userId },
      {
        mentorId: userId,
        weeklySlots,
        exceptions,
        timezone,
        isActive: true
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Availability saved successfully',
      data: updatedAvailability
    });
  } catch (error) {
    console.error('Error saving availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});



export default router;