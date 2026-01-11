import mongoose from 'mongoose';

const mentorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true,
    maxlength: [100, 'Designation cannot be more than 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true,
    maxlength: [100, 'Company cannot be more than 100 characters']
  },
  skills: [{
    type: String,
    required: [true, 'At least one skill is required'],
    trim: true
  }],
  hourlyRate: {
    type: Number,
    required: [true, 'Hourly rate is required'],
    min: [0, 'Hourly rate cannot be negative'],
    max: [1000, 'Hourly rate cannot exceed $1000']
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'away'],
    default: 'available'
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  reviews: {
    type: Number,
    default: 0,
    min: 0
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    trim: true
  },
  experience: {
    type: String,
    trim: true
  },
  languages: [{
    type: String,
    trim: true
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Update user role when mentor is created
mentorSchema.post('save', async function() {
  try {
    const User = mongoose.model('User');
    await User.findByIdAndUpdate(this.user, { 
      role: 'mentor',
      isMentor: true
    });
  } catch (error) {
    console.error('Error updating user role:', error);
  }
});

// Index for better performance
mentorSchema.index({ user: 1 });
mentorSchema.index({ isActive: 1 });
mentorSchema.index({ skills: 1 });
mentorSchema.index({ availability: 1 });

export default mongoose.model('Mentor', mentorSchema);