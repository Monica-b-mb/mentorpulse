import mongoose from 'mongoose';

const mentorshipRequestSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  goals: { type: String },
  expectedOutcome: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  respondedAt: Date
}, { timestamps: true });

export default mongoose.model('MentorshipRequest', mentorshipRequestSchema);
