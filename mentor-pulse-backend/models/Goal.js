import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['technical', 'projects', 'career', 'personal', 'certification'],
    default: 'technical'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  targetDate: {
    type: Date,
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'cancelled'],
    default: 'not-started'
  },
  milestones: [{
    title: String,
    completed: { type: Boolean, default: false },
    completedAt: Date
  }],
  tags: [String],
  estimatedHours: Number,
  actualHours: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Index for efficient queries
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, targetDate: 1 });
goalSchema.index({ user: 1, category: 1 });

export default mongoose.model('Goal', goalSchema);