import express from 'express';
import Progress from '../models/Progress.js';
import Goal from '../models/Goal.js';
import Session from '../models/Session.js';
import Skill from '../models/Skill.js';
import { protect } from '../middleware/authMiddleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get user progress dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = 'month' } = req.query;

    // Calculate timeframe
    let dateFilter = {};
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (timeframe) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(0);
      }

      dateFilter = { createdAt: { $gte: startDate } };
    }

    // Get progress entries
    const progressEntries = await Progress.find({
      user: userId,
      ...dateFilter
    })
      .populate('relatedSession', 'title sessionDate duration')
      .populate('relatedGoal', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate statistics
    const stats = await calculateProgressStats(userId, dateFilter);

    // Get recent activity
    const recentActivity = progressEntries.slice(0, 10);

    // Get progress over time (for charts)
    const progressOverTime = await getProgressOverTime(userId, timeframe);

    // Get user goals
    const goals = await Goal.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        statistics: stats,
        recentActivity,
        progressOverTime,
        goals
      }
    });

  } catch (error) {
    console.error('Get progress dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get progress data'
    });
  }
});

// Create a new goal
router.post('/goals', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      description,
      category,
      priority,
      targetDate,
      milestones,
      tags,
      estimatedHours,
      skills // ✅ ADD SKILLS TO GOAL CREATION
    } = req.body;

    if (!title || !description || !targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and target date are required'
      });
    }

    const goal = new Goal({
      user: userId,
      title,
      description,
      category: category || 'technical',
      priority: priority || 'medium',
      targetDate,
      milestones: milestones || [],
      tags: tags || [],
      estimatedHours: estimatedHours || 0,
      skills: skills || [], // ✅ STORE SKILLS WITH GOAL
      status: 'not-started'
    });

    await goal.save();

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: goal
    });

  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create goal'
    });
  }
});

// Update goal progress - UPDATED WITH SKILLS TRACKING
router.patch('/goals/:id/progress', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, status, actualHours, skills } = req.body;

    const goal = await Goal.findOne({
      _id: id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    const updateData = {};
    if (progress !== undefined) {
      updateData.progress = Math.min(Math.max(progress, 0), 100);
      updateData.status = updateData.progress === 100 ? 'completed' : 
                         updateData.progress > 0 ? 'in-progress' : 'not-started';
    }

    if (status) updateData.status = status;
    if (actualHours !== undefined) updateData.actualHours = actualHours;

    const updatedGoal = await Goal.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // ✅ ADD SKILLS WHEN GOAL IS COMPLETED
    if ((status === 'completed' || (progress === 100 && goal.progress !== 100)) && (skills || goal.skills)) {
      await addSkillsFromGoal(req.user._id, skills || goal.skills, goal._id);
    }

    // Create progress entry if goal is completed
    if (status === 'completed' || (progress === 100 && goal.progress !== 100)) {
      const progressEntry = new Progress({
        user: req.user._id,
        type: 'goal_achieved',
        title: `Goal Completed: ${goal.title}`,
        description: goal.description,
        relatedGoal: goal._id,
        value: 20,
        metrics: { goalsAchieved: 1 },
        skills: skills || goal.skills || [] // ✅ ADD SKILLS TO PROGRESS ENTRY
      });
      await progressEntry.save();
    }

    res.json({
      success: true,
      message: 'Goal progress updated successfully',
      data: updatedGoal
    });

  } catch (error) {
    console.error('Update goal progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update goal progress'
    });
  }
});

// Delete goal
router.delete('/goals/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const goal = await Goal.findOneAndDelete({
      _id: id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });

  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete goal'
    });
  }
});

// Get user goals
router.get('/goals', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, category } = req.query;

    let query = { user: userId };
    if (status) query.status = status;
    if (category) query.category = category;

    const goals = await Goal.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: goals
    });

  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get goals'
    });
  }
});

// ✅ SKILLS ROUTES

// Get skills statistics
router.get('/skills/stats', protect, async (req, res) => {
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

// Add new skill
router.post('/skills', protect, async (req, res) => {
  try {
    const { name, category, proficiency, description, tags, progress = 100 } = req.body;
    const userId = req.user._id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Skill name is required'
      });
    }

    // Check if skill already exists
    const existingSkill = await Skill.findOne({
      user: userId,
      name: { $regex: new RegExp(name, 'i') }
    });

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        message: 'Skill already exists'
      });
    }

    const skillStatus = progress >= 80 ? 'acquired' : 'learning';

    const skill = new Skill({
      user: userId,
      name,
      category: category || 'technical',
      proficiency: proficiency || 'beginner',
      description,
      tags: tags || [],
      progress: Math.min(Math.max(progress, 0), 100),
      status: skillStatus,
      acquiredAt: skillStatus === 'acquired' ? new Date() : null
    });

    await skill.save();

    // Create progress entry for skill acquisition
    if (skillStatus === 'acquired') {
      const progressEntry = new Progress({
        user: userId,
        type: 'skill_acquired',
        title: `Skill Acquired: ${name}`,
        description: description || `Successfully acquired ${name} skill`,
        value: 15,
        metrics: { skillsLearned: 1 },
        skills: [{
          name: name,
          category: category || 'technical',
          proficiency: proficiency || 'beginner'
        }]
      });
      await progressEntry.save();
    }

    res.status(201).json({
      success: true,
      message: 'Skill added successfully',
      data: skill
    });

  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add skill'
    });
  }
});

// Get user skills
router.get('/skills', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { category, status } = req.query;

    let query = { user: userId };
    if (category) query.category = category;
    if (status) query.status = status;

    const skills = await Skill.find(query)
      .populate('sessions', 'sessionType duration sessionDate')
      .populate('goals', 'title description')
      .sort({ progress: -1, createdAt: -1 });

    res.json({
      success: true,
      data: skills
    });

  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get skills'
    });
  }
});

// Update skill progress
router.patch('/skills/:id/progress', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, status, proficiency } = req.body;

    const skill = await Skill.findOne({
      _id: id,
      user: req.user._id
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    const updateData = {};
    if (progress !== undefined) {
      updateData.progress = Math.min(Math.max(progress, 0), 100);
      
      // Auto-update status based on progress
      if (progress >= 80) {
        updateData.status = 'acquired';
        if (progress === 100) {
          updateData.status = 'mastered';
        }
        if (!skill.acquiredAt) {
          updateData.acquiredAt = new Date();
        }
      } else {
        updateData.status = 'learning';
      }
    }

    if (status) updateData.status = status;
    if (proficiency) updateData.proficiency = proficiency;

    const updatedSkill = await Skill.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Skill progress updated successfully',
      data: updatedSkill
    });

  } catch (error) {
    console.error('Update skill progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update skill progress'
    });
  }
});

// Helper function to calculate progress statistics
const calculateProgressStats = async (userId, dateFilter = {}) => {
  // Get session statistics
  const sessionStats = await Session.aggregate([
    {
      $match: {
        $or: [{ mentorId: userId }, { menteeId: userId }],
        status: 'completed',
        ...dateFilter
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        totalHours: { $sum: '$duration' },
        averageSessionLength: { $avg: '$duration' }
      }
    }
  ]);

  // Get goal statistics
  const goalStats = await Goal.aggregate([
    {
      $match: {
        user: userId,
        ...dateFilter
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const sessionData = sessionStats[0] || {
    totalSessions: 0,
    totalHours: 0,
    averageSessionLength: 0
  };

  // Calculate goal statistics
  const goalsCompleted = goalStats.find(stat => stat._id === 'completed')?.count || 0;
  const goalsInProgress = goalStats.find(stat => stat._id === 'in-progress')?.count || 0;
  const totalGoals = goalStats.reduce((sum, stat) => sum + stat.count, 0);

  // ✅ UPDATED: Calculate skills statistics properly
  const skillsStats = await calculateSkillsStats(userId, dateFilter);

  return {
    sessions: {
      completed: sessionData.totalSessions,
      hoursSpent: sessionData.totalHours,
      averageLength: Math.round(sessionData.averageSessionLength * 10) / 10,
      upcoming: 0
    },
    skills: skillsStats,
    goals: {
      achieved: goalsCompleted,
      inProgress: goalsInProgress,
      total: totalGoals
    },
    productivity: {
      sessionsPerWeek: calculateWeeklyRate(sessionData.totalSessions, dateFilter),
      consistencyScore: await calculateConsistencyScore(userId, dateFilter)
    }
  };
};

// ✅ UPDATED: Helper function to calculate skills statistics
const calculateSkillsStats = async (userId, dateFilter = {}) => {
  try {
    const skills = await Skill.find({
      user: userId,
      ...dateFilter
    });

    const acquiredSkills = skills.filter(skill => 
      skill.status === 'acquired' || skill.status === 'mastered'
    );
    
    const inProgressSkills = skills.filter(skill => 
      skill.status === 'learning'
    );
    
    const masteredSkills = skills.filter(skill => 
      skill.status === 'mastered'
    );

    const totalAcquired = acquiredSkills.length + masteredSkills.length;
    const targetSkills = Math.max(totalAcquired + 3, 10);

    return {
      acquired: totalAcquired,
      inProgress: inProgressSkills.length,
      mastered: masteredSkills.length,
      target: targetSkills,
      total: skills.length
    };
  } catch (error) {
    console.error('Calculate skills stats error:', error);
    return {
      acquired: 0,
      inProgress: 0,
      mastered: 0,
      target: 10,
      total: 0
    };
  }
};

// ✅ NEW: Helper function to add skills from goal completion
const addSkillsFromGoal = async (userId, skills, goalId) => {
  try {
    for (const skillData of skills) {
      // Check if skill already exists
      const existingSkill = await Skill.findOne({
        user: userId,
        name: { $regex: new RegExp(skillData.name, 'i') }
      });

      if (existingSkill) {
        // Update existing skill
        existingSkill.progress = Math.min(existingSkill.progress + 25, 100);
        if (existingSkill.progress >= 80) {
          existingSkill.status = existingSkill.progress === 100 ? 'mastered' : 'acquired';
          if (!existingSkill.acquiredAt) {
            existingSkill.acquiredAt = new Date();
          }
        }
        if (!existingSkill.goals.includes(goalId)) {
          existingSkill.goals.push(goalId);
        }
        await existingSkill.save();
      } else {
        // Create new skill
        const skill = new Skill({
          user: userId,
          name: skillData.name,
          category: skillData.category || 'technical',
          proficiency: skillData.proficiency || 'beginner',
          description: skillData.description || `Acquired through goal completion`,
          progress: 100,
          status: 'acquired',
          goals: [goalId],
          acquiredAt: new Date()
        });
        await skill.save();
      }
    }
  } catch (error) {
    console.error('Add skills from goal error:', error);
  }
};

// Helper function to get progress over time for charts
const getProgressOverTime = async (userId, timeframe) => {
  let groupFormat;
  
  switch (timeframe) {
    case 'week':
      groupFormat = '%Y-%m-%d'; // Daily
      break;
    case 'month':
      groupFormat = '%Y-%U'; // Weekly
      break;
    case 'quarter':
    case 'year':
      groupFormat = '%Y-%m'; // Monthly
      break;
    default:
      groupFormat = '%Y-%m'; // Monthly for all time
  }

  const progressOverTime = await Progress.aggregate([
    {
      $match: {
        user: userId
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          type: '$type'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);

  // Format data for charts
  const formattedData = progressOverTime.reduce((acc, item) => {
    const { date, type } = item._id;
    if (!acc[date]) {
      acc[date] = { date, session_completed: 0, skill_acquired: 0, goal_achieved: 0, milestone_reached: 0 };
    }
    acc[date][type] = item.count;
    return acc;
  }, {});

  return Object.values(formattedData);
};

// Helper function to calculate weekly session rate
const calculateWeeklyRate = (totalSessions, dateFilter) => {
  if (!dateFilter.createdAt || !dateFilter.createdAt.$gte) {
    return totalSessions / 52;
  }

  const daysDiff = (new Date() - dateFilter.createdAt.$gte) / (1000 * 60 * 60 * 24);
  const weeks = Math.max(daysDiff / 7, 1);
  
  return Math.round((totalSessions / weeks) * 10) / 10;
};

// Helper function to calculate consistency score
const calculateConsistencyScore = async (userId, dateFilter) => {
  const sessions = await Session.find({
    $or: [{ mentorId: userId }, { menteeId: userId }],
    status: 'completed',
    ...dateFilter
  }).sort({ sessionDate: 1 });

  if (sessions.length < 2) return 100;

  let totalInterval = 0;
  let intervals = [];

  for (let i = 1; i < sessions.length; i++) {
    const interval = (sessions[i].sessionDate - sessions[i - 1].sessionDate) / (1000 * 60 * 60 * 24);
    intervals.push(interval);
    totalInterval += interval;
  }

  const averageInterval = totalInterval / intervals.length;
  const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - averageInterval, 2), 0) / intervals.length;

  const maxVariance = 30;
  const score = Math.max(0, 100 - (variance / maxVariance) * 100);
  
  return Math.round(score);
};

export default router;