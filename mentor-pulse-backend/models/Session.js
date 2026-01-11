import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionDate: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  sessionType: { type: String, required: true },
  price: { type: Number, default: 0 },
  duration: { type: Number, default: 60 },
  status: { 
    type: String, 
    enum: ['upcoming', 'confirmed', 'completed', 'cancelled', 'missed', 'pending_verification'],
    default: 'upcoming' 
  },
  notes: { type: String },
  meetLink: { type: String },
  rating: { type: Number },
  feedback: { type: String },
  cancellationReason: { type: String },
  
  // VERIFICATION FIELDS
  verificationStatus: {
    type: String,
    enum: ['not_started', 'mentor_approved', 'mentee_approved', 'both_approved', 'disputed'],
    default: 'not_started'
  },
  mentorApproval: {
    approved: { type: Boolean, default: false },
    approvedAt: { type: Date },
    notes: { type: String }
  },
  menteeApproval: {
    approved: { type: Boolean, default: false },
    approvedAt: { type: Date },
    notes: { type: String }
  },
  actualDuration: { type: Number },
  completedAt: { type: Date }
}, { 
  timestamps: true 
});

export default mongoose.model('Session', sessionSchema);