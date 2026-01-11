import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['mentee', 'mentor', 'admin'],
    default: 'mentee'
  },
  avatar: {
    type: String,
    default: ''
  },
  designation: {
    type: String,
    default: '',
    maxlength: [100, 'Designation cannot be more than 100 characters']
  },
  bio: {
    type: String,
    default: '',
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  skills: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    default: '',
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  website: {
    type: String,
    default: '',
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  socialLinks: {
    twitter: {
      type: String,
      default: '',
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Please use a valid URL with HTTP or HTTPS'
      ]
    },
    linkedin: {
      type: String,
      default: '',
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Please use a valid URL with HTTP or HTTPS'
      ]
    },
    github: {
      type: String,
      default: '',
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        'Please use a valid URL with HTTP or HTTPS'
      ]
    }
  },
  // ✅ NEW FIELDS ADDED FOR MENTORS
  company: {
    type: String,
    default: '',
    maxlength: [100, 'Company cannot be more than 100 characters']
  },
  hourlyRate: {
    type: Number,
    default: 50,
    min: [0, 'Hourly rate cannot be negative'],
    max: [1000, 'Hourly rate cannot exceed $1000']
  },
  rating: {
    type: Number,
    default: 4.5,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  reviews: {
    type: Number,
    default: 0,
    min: 0
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'away'],
    default: 'available'
  },
  experience: {
    type: String,
    default: '',
    maxlength: [100, 'Experience cannot be more than 100 characters']
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
  },
  isMentor: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Encrypt password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();   // <-- add return here
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// Match password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);