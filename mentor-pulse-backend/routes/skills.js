import express from 'express';
import Skill from '../models/Skill.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ GET USER SKILLS STATISTICS (REAL DATA)
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get real skills data from Skills collection
    const skills = await Skill.find({ user: userId });
    
    const acquiredSkills = skills.filter(skill => 
      skill.status === 'acquired' || skill.status === 'mastered'
    );
    
    const inProgressSkills = skills.filter(skill => 
      skill.status === 'learning'
    );
    
    const masteredSkills = skills.filter(skill => 
      skill.status === 'mastered'
    );

    const totalSkills = acquiredSkills.length + masteredSkills.length;
    const targetSkills = Math.max(totalSkills + 3, 10);

    res.json({
      success: true,
      data: {
        acquired: totalSkills,
        inProgress: inProgressSkills.length,
        mastered: masteredSkills.length,
        target: targetSkills,
        total: skills.length,
        progress: totalSkills > 0 ? Math.round((totalSkills / targetSkills) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Get skills stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get skills statistics'
    });
  }
});

export default router;