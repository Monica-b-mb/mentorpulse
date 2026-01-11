import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['session_completed', 'skill_acquired', 'goal_achieved', 'milestone_reached'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metrics: {
    sessionsCompleted: { type: Number, default: 0 },
    hoursSpent: { type: Number, default: 0 },
    skillsLearned: { type: Number, default: 0 },
    goalsAchieved: { type: Number, default: 0 }
  },
  // ADD SKILLS FIELD
  skills: [{
    name: String,
    category: String,
    proficiency: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' }
  }],
  relatedSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  relatedGoal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  },
  value: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

export default mongoose.model('Progress', progressSchema);