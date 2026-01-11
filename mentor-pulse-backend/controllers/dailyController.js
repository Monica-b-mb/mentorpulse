import axios from 'axios';
import Session from '../models/Session.js';

const DAILY_API_BASE = 'https://api.daily.co/v1';
const DAILY_API_KEY = process.env.DAILY_API_KEY;

// Create a Daily.co room for a session
export const createDailyRoom = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Create room configuration
    const roomConfig = {
      name: `mentorpulse-${sessionId}-${Date.now()}`,
      properties: {
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours expiry
        enable_chat: true,
        enable_screenshare: true,
        start_audio_off: false,
        start_video_off: false,
        lang: 'en',
        max_participants: 2
      }
    };

    const response = await axios.post(`${DAILY_API_BASE}/rooms`, roomConfig, {
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`
      }
    });

    const room = response.data;

    // Update session with Daily room info
    session.dailyRoom = {
      url: room.url,
      name: room.name,
      createdAt: new Date()
    };
    await session.save();

    res.json({
      success: true,
      room: session.dailyRoom,
      message: 'Daily.co room created successfully'
    });

  } catch (error) {
    console.error('Daily.co room creation error:', error?.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create video room'
    });
  }
};

// Get room token for secure joining
export const getDailyToken = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userName, isMentor } = req.body;

    const session = await Session.findById(sessionId);
    if (!session?.dailyRoom?.name) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const tokenRes = await axios.post(`${DAILY_API_BASE}/meeting-tokens`, {
      properties: {
        room_name: session.dailyRoom.name,
        user_name: userName || 'MentorPulse User',
        is_owner: !!isMentor,
        enable_screenshare: true
      }
    }, {
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`
      }
    });

    const token = tokenRes.data.token;

    res.json({ success: true, token });

  } catch (error) {
    console.error('Daily.co token error:', error?.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Failed to get room token' });
  }
};
