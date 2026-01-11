import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['technical', 'soft-skills', 'tools', 'frameworks', 'languages', 'other'],
    default: 'technical'
  },
  proficiency: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['learning', 'acquired', 'mastered'],
    default: 'learning'
  },
  sessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  }],
  goals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  }],
  acquiredAt: {
    type: Date
  },
  tags: [String],
  description: String
}, {
  timestamps: true
});

// Index for efficient queries
skillSchema.index({ user: 1, category: 1 });
skillSchema.index({ user: 1, status: 1 });

export default mongoose.model('Skill', skillSchema);