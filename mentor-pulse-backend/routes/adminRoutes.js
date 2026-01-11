import express from 'express';
import User from '../models/User.js';
import Session from '../models/Session.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// ✅ Demo-safe adminAuth: only checks token + role
const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access denied' });
    }

    // 🚫 Do not block on isActive for demo
    req.user = user;
    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// 📊 Dashboard stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const totalMentees = await User.countDocuments({ role: 'mentee' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const activeSessions = await Session.countDocuments({ status: { $in: ['upcoming', 'confirmed'] } });
    const completedSessions = await Session.countDocuments({ status: 'completed' });
    const cancelledSessions = await Session.countDocuments({ status: 'cancelled' });

    const currentDate = new Date();
    const last30DaysStart = new Date(currentDate);
    last30DaysStart.setDate(last30DaysStart.getDate() - 30);

    const previous30DaysStart = new Date(currentDate);
    previous30DaysStart.setDate(previous30DaysStart.getDate() - 60);
    const previous30DaysEnd = new Date(currentDate);
    previous30DaysEnd.setDate(previous30DaysEnd.getDate() - 30);

    const last30DaysUsers = await User.countDocuments({ createdAt: { $gte: last30DaysStart } });
    const previous30DaysUsers = await User.countDocuments({
      createdAt: { $gte: previous30DaysStart, $lt: previous30DaysEnd }
    });

    let growthRate = 0;
    if (previous30DaysUsers > 0) {
      growthRate = ((last30DaysUsers - previous30DaysUsers) / previous30DaysUsers) * 100;
    } else if (last30DaysUsers > 0) {
      growthRate = 100;
    }

    const last30DaysSessions = await Session.countDocuments({ createdAt: { $gte: last30DaysStart } });

    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await User.countDocuments({
      $or: [{ lastLogin: { $gte: sevenDaysAgo } }, { updatedAt: { $gte: sevenDaysAgo } }]
    });

    const todayStart = new Date(currentDate);
    todayStart.setHours(0, 0, 0, 0);
    const todayActivities = {
      newUsers: await User.countDocuments({ createdAt: { $gte: todayStart } }),
      newSessions: await Session.countDocuments({ createdAt: { $gte: todayStart } }),
      completedSessions: await Session.countDocuments({ status: 'completed', updatedAt: { $gte: todayStart } })
    };

    const stats = {
      totalUsers,
      totalMentors,
      totalMentees,
      totalAdmins,
      activeUsers,
      activeSessions,
      completedSessions,
      cancelledSessions,
      last30DaysUsers,
      last30DaysSessions,
      growthRate: Math.round(growthRate * 10) / 10,
      todayActivities,
      systemHealth: 99.9,
      lastUpdated: new Date()
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard statistics' });
  }
});

// 👥 Users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (status === 'verified') query.isVerified = true;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const usersWithSessionCounts = await Promise.all(
      users.map(async (user) => {
        let sessionsCompleted = 0;
        if (user.role === 'mentor') {
          sessionsCompleted = await Session.countDocuments({ mentorId: user._id, status: 'completed' });
        } else if (user.role === 'mentee') {
          sessionsCompleted = await Session.countDocuments({ menteeId: user._id, status: 'completed' });
        }
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.isActive ? 'active' : 'inactive',
          joinDate: user.createdAt,
          lastActive: user.updatedAt,
          sessionsCompleted,
          rating: user.rating || null,
          isVerified: user.isVerified,
          avatar: user.avatar,
          designation: user.designation
        };
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: usersWithSessionCounts,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// 🔄 Update user status
router.patch('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    let updateData = {};
    if (status === 'active') updateData.isActive = true;
    else if (status === 'inactive') updateData.isActive = false;
    else if (status === 'verified') updateData.isVerified = true;
    else if (status === 'suspended') updateData.isActive = false;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      message: 'User status updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.isActive ? 'active' : 'inactive',
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('User status update error:', error);
    res.status(500).json({ success: false, message: 'Error updating user status' });
  }
});

// ❌ Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('User delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// 📅 Sessions
// 📅 Sessions
router.get('/sessions', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    const sessions = await Session.find(query)
      .populate('mentorId', 'name email avatar designation')
      .populate('menteeId', 'name email avatar')
      .sort({ sessionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const formattedSessions = sessions.map(session => ({
      id: session._id,
      mentor: {
        id: session.mentorId._id,
        name: session.mentorId.name,
        email: session.mentorId.email,
        avatar: session.mentorId.avatar,
        designation: session.mentorId.designation
      },
      mentee: {
        id: session.menteeId._id,
        name: session.menteeId.name,
        email: session.menteeId.email,
        avatar: session.menteeId.avatar
      },
      date: session.sessionDate,
      time: session.startTime,
      duration: session.duration,
      type: session.sessionType,
      topic: session.notes || 'General Session',
      status: session.status,
      price: session.price,
      rating: session.rating,
      notes: session.notes,
      meetLink: session.meetLink,
      verificationStatus: session.verificationStatus
    }));

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      data: formattedSessions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching sessions' });
  }
});

// 📈 Analytics
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          users: { $sum: 1 },
          mentors: { $sum: { $cond: [{ $eq: ['$role', 'mentor'] }, 1, 0] } },
          mentees: { $sum: { $cond: [{ $eq: ['$role', 'mentee'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const sessionMetrics = await Session.aggregate([
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          averageDuration: { $avg: '$duration' },
          completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledSessions: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]);

    const metrics = sessionMetrics.length > 0 ? sessionMetrics[0] : {
      totalSessions: 0,
      averageDuration: 0,
      completedSessions: 0,
      cancelledSessions: 0
    };

    const platformStats = {
      totalUsers: await User.countDocuments(),
      activeUsers: await User.countDocuments({ isActive: true }),
      verifiedMentors: await User.countDocuments({ role: 'mentor', isVerified: true }),
      newRegistrations: await User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    };

    const activeSessionsCount = await Session.countDocuments({ status: { $in: ['upcoming', 'confirmed'] } });

    const analytics = {
      userGrowth,
      sessionMetrics: {
        totalSessions: metrics.totalSessions,
        averageDuration: Math.round(metrics.averageDuration || 0),
        completionRate: metrics.totalSessions > 0
          ? Math.round((metrics.completedSessions / metrics.totalSessions) * 100)
          : 0,
        cancellationRate: metrics.totalSessions > 0
          ? Math.round((metrics.cancelledSessions / metrics.totalSessions) * 100)
          : 0,
        activeSessions: activeSessionsCount
      },
      platformStats
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching analytics data' });
  }
});

// 🕒 Recent activity
router.get('/recent-activity', adminAuth, async (req, res) => {
  try {
    const recentUsers = await User.find()
      .select('name email role createdAt avatar')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentSessions = await Session.find()
      .populate('mentorId', 'name avatar')
      .populate('menteeId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const activities = [];

    recentUsers.forEach(user => {
      activities.push({
        id: `user_${user._id}`,
        type: 'user_registration',
        title: 'New User Registration',
        description: `${user.name} joined as ${user.role}`,
        user: { name: user.name, avatar: user.avatar, role: user.role },
        timestamp: user.createdAt,
        icon: user.role === 'mentor' ? '👨‍🏫' : '👨‍🎓'
      });
    });

    recentSessions.forEach(session => {
      let activityType, title, description, icon;
      switch (session.status) {
        case 'completed':
          activityType = 'session_completed';
          title = 'Session Completed';
          description = `${session.mentorId.name} completed session with ${session.menteeId.name}`;
          icon = '✅';
          break;
        case 'confirmed':
          activityType = 'session_scheduled';
          title = 'Session Scheduled';
          description = `${session.mentorId.name} scheduled session with ${session.menteeId.name}`;
          icon = '📅';
          break;
        case 'cancelled':
          activityType = 'session_cancelled';
          title = 'Session Cancelled';
          description = `Session between ${session.mentorId.name} and ${session.menteeId.name} was cancelled`;
          icon = '❌';
          break;
        default:
          activityType = 'session_created';
          title = 'Session Created';
          description = `New session created between ${session.mentorId.name} and ${session.menteeId.name}`;
          icon = '🆕';
      }
      activities.push({
        id: `session_${session._id}`,
        type: activityType,
        title,
        description,
        users: { mentor: session.mentorId, mentee: session.menteeId },
        timestamp: session.createdAt,
        icon
      });
    });

    const recentActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json({ success: true, data: recentActivities });
  } catch (error) {
    console.error('Recent activity fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching recent activity' });
  }
});

// ⚙️ System status
router.get('/system-status', adminAuth, async (req, res) => {
  try {
    const dbStatus = await checkDatabaseStatus();
    const serverStatus = {
      status: 'operational',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    };

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const activeSessions = await Session.countDocuments({ status: { $in: ['upcoming', 'confirmed'] } });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySessions = await Session.countDocuments({ createdAt: { $gte: todayStart } });

    const systemHealth = await calculateSystemHealth();

    const systemStatus = {
      database: dbStatus,
      server: serverStatus,
      metrics: {
        totalUsers,
        activeUsers,
        activeSessions,
        todaySessions,
        systemHealth: systemHealth.percentage,
        responseTime: '45ms'
      },
      services: {
        api: 'operational',
        database: dbStatus.status,
        authentication: 'operational',
        payments: 'operational',
        notifications: 'operational'
      },
      lastUpdated: new Date()
    };

        res.json({ success: true, data: systemStatus });
  } catch (error) {
    console.error('System status fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching system status' });
  }
});

// 🔧 Helper: check database status
async function checkDatabaseStatus() {
  try {
    await User.findOne().limit(1);
    return {
      status: 'operational',
      message: 'Database connected successfully',
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'degraded',
      message: 'Database connection issues',
      error: error.message,
      timestamp: new Date()
    };
  }
}

// 🔧 Helper: calculate system health
async function calculateSystemHealth() {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalSessions = await Session.countDocuments();
    const completedSessions = await Session.countDocuments({ status: 'completed' });

    const userActivityRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 100;
    const sessionSuccessRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 100;

    const overallHealth = (userActivityRate * 0.4) + (sessionSuccessRate * 0.6);

    return {
      percentage: Math.min(100, Math.max(0, overallHealth)),
      userActivityRate,
      sessionSuccessRate
    };
  } catch (error) {
    return {
      percentage: 0,
      userActivityRate: 0,
      sessionSuccessRate: 0,
      error: error.message
    };
  }
}

export default router;
