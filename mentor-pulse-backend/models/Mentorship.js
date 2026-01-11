import mongoose from 'mongoose';

const mentorshipSchema = new mongoose.Schema({
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
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  goals: [String],
  expectedOutcome: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date
}, {
  timestamps: true
});

// Prevent duplicate active requests
mentorshipSchema.index({ mentor: 1, mentee: 1, status: 1 });

export default mongoose.model('Mentorship', mentorshipSchema);