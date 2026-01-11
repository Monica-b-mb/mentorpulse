import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session', // CHANGED from 'MentorshipSession' to 'Session'
    required: true
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 1000
  },
  categories: {
    communication: { type: Number, min: 1, max: 5 },
    knowledge: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 },
    effectiveness: { type: Number, min: 1, max: 5 }
  },
  wouldRecommend: {
    type: Boolean,
    default: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
}, {
  timestamps: true
});

// Compound index to ensure one feedback per session per user
feedbackSchema.index({ session: 1, mentee: 1 }, { unique: true });

// Index for faster queries
feedbackSchema.index({ mentor: 1, createdAt: -1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ status: 1 });

export default mongoose.model('Feedback', feedbackSchema);