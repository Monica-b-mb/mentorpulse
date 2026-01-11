import mongoose from 'mongoose';

const platformFeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  categories: {
    easeOfUse: { type: Number, min: 1, max: 5 },
    features: { type: Number, min: 1, max: 5 },
    support: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 }
  },
  suggestions: {
    type: String,
    maxlength: 300
  }
}, {
  timestamps: true
});

export default mongoose.model('PlatformFeedback', platformFeedbackSchema);