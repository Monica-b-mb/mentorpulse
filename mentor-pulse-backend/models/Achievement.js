import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  icon: String,
  completed: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0
  },
  target: {
    type: Number,
    default: 1
  },
  completedAt: Date
}, {
  timestamps: true
});

export default mongoose.model('Achievement', achievementSchema);