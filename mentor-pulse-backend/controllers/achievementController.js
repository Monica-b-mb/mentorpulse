import Session from '../models/Session.js';
import Skill from '../models/Skill.js';

// ✅ GET REAL-TIME ACHIEVEMENTS (NO MODEL NEEDED)
export const getRealTimeAchievements = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get real data
    const sessionsCompleted = await Session.countDocuments({ 
      $or: [{ mentorId: userId }, { menteeId: userId }],
      status: 'completed'
    });

    const skillsAcquired = await Skill.countDocuments({ 
      user: userId, 
      status: { $in: ['acquired', 'mastered'] } 
    });

    // Generate achievements from real data
    const achievements = [
      {
        id: 1,
        title: 'First Steps',
        description: 'Complete your first session',
        icon: '🎯',
        completed: sessionsCompleted >= 1,
        progress: Math.min(sessionsCompleted, 1),
        target: 1
      },
      {
        id: 2,
        title: 'Session Marathon',
        description: 'Complete 5 sessions',
        icon: '🏃‍♂️',
        completed: sessionsCompleted >= 5,
        progress: Math.min(sessionsCompleted, 5),
        target: 5
      },
      {
        id: 3,
        title: 'Skill Collector',
        description: 'Acquire 3 skills',
        icon: '📚',
        completed: skillsAcquired >= 3,
        progress: Math.min(skillsAcquired, 3),
        target: 3
      },
      {
        id: 4,
        title: 'Dedicated Learner',
        description: 'Complete 10 sessions',
        icon: '⭐',
        completed: sessionsCompleted >= 10,
        progress: Math.min(sessionsCompleted, 10),
        target: 10
      }
    ];

    const completedCount = achievements.filter(a => a.completed).length;

    res.json({
      success: true,
      data: {
        achievements,
        stats: {
          completed: completedCount,
          total: achievements.length,
          progress: Math.round((completedCount / achievements.length) * 100)
        }
      }
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get achievements'
    });
  }
};