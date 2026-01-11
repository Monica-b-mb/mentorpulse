import Session from '../models/Session.js';
import Skill from '../models/Skill.js';
import Progress from '../models/Progress.js';
import axios from 'axios';

// 📅 Book a new session
export const bookSession = async (req, res) => {
  try {
    const { mentorId, menteeId, sessionDate, startTime, endTime, sessionType, price, availabilitySlot } = req.body;

    const session = await Session.create({
      mentorId,
      menteeId,
      sessionDate,
      startTime,
      endTime,
      sessionType,
      price,
      availabilitySlot,
      status: 'confirmed'
    });

    res.status(201).json({ success: true, message: 'Session booked', data: session });
  } catch (error) {
    console.error('Session booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to book session' });
  }
};

// 📋 Get sessions for logged-in user (grouped by status)
export const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await Session.find({
      $or: [{ mentorId: userId }, { menteeId: userId }]
    })
    .populate('mentorId', 'name email')
    .populate('menteeId', 'name email')
    .sort({ sessionDate: 1 });

    const upcoming = sessions.filter(s => s.status === 'confirmed' || s.status === 'upcoming' || s.status === 'pending_verification');
    const completed = sessions.filter(s => s.status === 'completed');
    const cancelled = sessions.filter(s => s.status === 'cancelled');

    res.json({
      success: true,
      data: {
        upcoming,
        completed,
        cancelled
      },
      counts: {
        upcoming: upcoming.length,
        completed: completed.length,
        cancelled: cancelled.length,
        total: sessions.length
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
};

// ❌ Cancel a session
export const cancelSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason, status = 'cancelled' } = req.body;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    session.status = status;
    session.cancellationReason = cancellationReason || 'Cancelled by user';
    await session.save();

    await session.populate('mentorId', 'name email profileImage');
    await session.populate('menteeId', 'name email profileImage');

    res.json({ 
      success: true, 
      message: 'Session cancelled successfully', 
      data: session 
    });
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel session' 
    });
  }
};

// ⭐ Add review and feedback
export const addReview = async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.rating = rating;
    session.feedback = feedback;
    await session.save();

    res.json({ success: true, message: 'Review added', data: session });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: 'Failed to add review' });
  }
};

// Generate Daily.co meeting link
export const generateMeetLink = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (session.dailyRoom) {
      return res.json({ 
        success: true, 
        meetLink: session.dailyRoom.url,
        dailyRoom: session.dailyRoom,
        message: 'Daily.co room already exists' 
      });
    }

    const roomConfig = {
      name: `mentorpulse-${session._id}-${Date.now()}`,
      properties: {
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
        enable_chat: true,
        enable_screenshare: true,
        start_audio_off: false,
        start_video_off: false,
        max_participants: 2,
      }
    };

    const dailyResponse = await axios.post('https://api.daily.co/v1/rooms', roomConfig, {
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const dailyRoom = dailyResponse.data;

    session.dailyRoom = {
      url: dailyRoom.url,
      name: dailyRoom.name,
      createdAt: new Date()
    };
    await session.save();

    res.json({ 
      success: true, 
      meetLink: dailyRoom.url,
      dailyRoom: session.dailyRoom,
      message: 'Daily.co room created successfully' 
    });

  } catch (error) {
    console.error('Daily.co room creation error:', error.response?.data || error.message);
    
    const jitsiLink = `https://meet.jit.si/MentorPulse-${req.params.id}-${Date.now()}`;
    res.json({
      success: true,
      meetLink: jitsiLink,
      isFallback: true,
      message: 'Using Jitsi Meet as fallback'
    });
  }
};

// Generate Google Meet link
export const generateGoogleMeetLink = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    const meetLink = `https://meet.google.com/new?hl=en`;
    
    session.meetLink = meetLink;
    await session.save();

    res.json({ 
      success: true, 
      meetLink,
      message: 'Google Meet link generated successfully' 
    });
  } catch (error) {
    console.error('Google Meet generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate meeting link' });
  }
};

// Cancel session during meetlink flow
export const cancelSessionOnLink = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (session.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Session already cancelled' });
    }

    session.status = 'cancelled';
    session.cancellationReason = 'Cancelled during meetlink generation';
    await session.save();

    res.json({ success: true, message: 'Session cancelled successfully', data: session });
  } catch (error) {
    console.error('Cancel-on-link error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel session' });
  }
};

// 🔄 Update session status (general purpose)
export const updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cancellationReason, notes } = req.body;

    const validStatuses = ['upcoming', 'confirmed', 'completed', 'cancelled', 'missed', 'pending_verification'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const updateData = { status };
    
    if (status === 'cancelled' && cancellationReason) {
      updateData.cancellationReason = cancellationReason;
    }
    
    if (notes) {
      updateData.notes = notes;
    }

    const session = await Session.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('mentorId', 'name email profileImage')
    .populate('menteeId', 'name email profileImage');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: `Session status updated to ${status}`,
      data: session
    });

  } catch (error) {
    console.error('Error updating session status:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update meeting link
export const updateMeetLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { meetLink } = req.body;

    if (meetLink && !meetLink.startsWith('http')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid URL starting with http:// or https://'
      });
    }

    const session = await Session.findByIdAndUpdate(
      id,
      { meetLink: meetLink || '' },
      { new: true, runValidators: true }
    ).populate('mentorId', 'name email profileImage')
     .populate('menteeId', 'name email profileImage');

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    res.json({
      success: true,
      message: meetLink ? 'Meeting link updated successfully' : 'Meeting link removed',
      data: session
    });

  } catch (error) {
    console.error('Error updating meet link:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to update meeting link' 
    });
  }
};

// ✅ INITIATE SESSION COMPLETION - WITH PROPER SKILLS TRACKING
export const initiateSessionCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, skills } = req.body;
    const userId = req.user._id;

    console.log('🎯 INITIATE COMPLETION CALLED');

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Check if user is mentor
    const isMentor = session.mentorId.toString() === userId.toString();
    
    if (!isMentor) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only mentor can initiate session completion' 
      });
    }

    // Update session
    session.status = 'pending_verification';
    session.verificationStatus = 'not_started';
    
    if (notes && notes.trim()) {
      session.notes = notes;
    }
    
    await session.save();

    // ✅ ADD SKILLS FROM SESSION
    if (skills && skills.length > 0) {
      await addSkillsFromSession(session.menteeId, skills, session._id);
    }

    // ✅ CREATE PROGRESS ENTRY WITH SKILLS
    const progressEntry = new Progress({
      user: session.menteeId,
      type: 'session_completed',
      title: `Session Completed: ${session.sessionType}`,
      description: `Completed ${session.sessionType} session with mentor`,
      value: 10,
      metrics: { 
        sessionsCompleted: 1,
        hoursSpent: session.duration / 60
      },
      skills: skills || [],
      relatedSession: session._id
    });

    await progressEntry.save();
    console.log('✅ Progress entry created with skills');

    // Populate before sending response
    await session.populate('mentorId', 'name email profileImage');
    await session.populate('menteeId', 'name email profileImage');

    res.json({
      success: true,
      message: 'Session moved to verification phase!',
      data: session
    });

  } catch (error) {
    console.error('❌ INITIATE COMPLETION ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ✅ APPROVE SESSION COMPLETION - WORKING VERSION
export const approveSessionCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, notes, actualDuration } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Check if user is participant
    const isMentor = session.mentorId.toString() === userId.toString();
    const isMentee = session.menteeId.toString() === userId.toString();
    
    if (!isMentor && !isMentee) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Update approval
    if (isMentor) {
      session.mentorApproval = { 
        approved: approved !== false, 
        notes: notes || '',
        approvedAt: new Date()
      };
    } else {
      session.menteeApproval = { 
        approved: approved !== false, 
        notes: notes || '',
        approvedAt: new Date()
      };
    }

    if (actualDuration) {
      session.actualDuration = actualDuration;
    }

    await session.save();

    // Check if both approved
    if (session.mentorApproval.approved && session.menteeApproval.approved) {
      session.status = 'completed';
      session.verificationStatus = 'both_approved';
      session.completedAt = new Date();
      await session.save();

      return res.json({
        success: true,
        message: 'Session completed successfully!',
        data: session,
        progressAwarded: true
      });
    }

    res.json({
      success: true,
      message: `Session ${approved ? 'approved' : 'rejected'}. Waiting for other party.`,
      data: session,
      progressAwarded: false
    });

  } catch (error) {
    console.error('❌ APPROVE SESSION ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// ✅ HELPER FUNCTION TO ADD SKILLS FROM SESSION
const addSkillsFromSession = async (userId, skills, sessionId) => {
  try {
    console.log(`🔄 Adding ${skills.length} skills from session for user ${userId}`);
    
    for (const skillData of skills) {
      // Check if skill already exists
      const existingSkill = await Skill.findOne({
        user: userId,
        name: { $regex: new RegExp(skillData.name, 'i') }
      });

      if (existingSkill) {
        // Update existing skill
        const newProgress = Math.min(existingSkill.progress + 10, 100);
        existingSkill.progress = newProgress;
        
        // Update status based on progress
        if (newProgress >= 80) {
          existingSkill.status = newProgress === 100 ? 'mastered' : 'acquired';
          if (!existingSkill.acquiredAt) {
            existingSkill.acquiredAt = new Date();
          }
        }
        
        // Add session to skill if not already linked
        if (!existingSkill.sessions.includes(sessionId)) {
          existingSkill.sessions.push(sessionId);
        }
        
        await existingSkill.save();
        console.log(`✅ Updated existing skill: ${skillData.name}, Progress: ${newProgress}%`);
      } else {
        // Create new skill
        const skill = new Skill({
          user: userId,
          name: skillData.name,
          category: skillData.category || 'technical',
          proficiency: skillData.proficiency || 'beginner',
          description: skillData.description || `Learning through sessions`,
          progress: 10,
          status: 'learning',
          sessions: [sessionId]
        });
        
        await skill.save();
        console.log(`✅ Created new skill: ${skillData.name}, Progress: 10%`);
      }
    }
  } catch (error) {
    console.error('❌ Add skills from session error:', error);
  }
};

// ✅ COMPLETE SESSION DIRECTLY (Alternative to approval flow)
export const completeSessionDirectly = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, skills, actualDuration } = req.body;
    const userId = req.user._id;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Check if user is mentor
    const isMentor = session.mentorId.toString() === userId.toString();
    
    if (!isMentor) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only mentor can complete sessions' 
      });
    }

    // Update session to completed
    session.status = 'completed';
    session.verificationStatus = 'direct_completion';
    session.completedAt = new Date();
    
    if (notes && notes.trim()) {
      session.notes = notes;
    }
    
    if (actualDuration) {
      session.actualDuration = actualDuration;
    }

    await session.save();

    // ✅ ADD SKILLS FROM SESSION
    if (skills && skills.length > 0) {
      await addSkillsFromSession(session.menteeId, skills, session._id);
    }

    // ✅ CREATE PROGRESS ENTRY WITH SKILLS
    const progressEntry = new Progress({
      user: session.menteeId,
      type: 'session_completed',
      title: `Session Completed: ${session.sessionType}`,
      description: `Completed ${session.sessionType} session with mentor`,
      value: 10,
      metrics: { 
        sessionsCompleted: 1,
        hoursSpent: session.actualDuration || session.duration / 60
      },
      skills: skills || [],
      relatedSession: session._id
    });

    await progressEntry.save();

    // Populate before sending response
    await session.populate('mentorId', 'name email profileImage');
    await session.populate('menteeId', 'name email profileImage');

    res.json({
      success: true,
      message: 'Session completed successfully!',
      data: session,
      skillsAdded: skills ? skills.length : 0
    });

  } catch (error) {
    console.error('❌ COMPLETE SESSION ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to complete session' 
    });
  }
};

// ✅ GET SESSION SKILLS
export const getSessionSkills = async (req, res) => {
  try {
    const { id } = req.params;
    
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Session not found' 
      });
    }

    // Get skills associated with this session
    const skills = await Skill.find({
      user: session.menteeId,
      sessions: session._id
    }).sort({ progress: -1 });

    res.json({
      success: true,
      data: skills
    });

  } catch (error) {
    console.error('❌ GET SESSION SKILLS ERROR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get session skills' 
    });
  }
};