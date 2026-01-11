import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: ''
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDelivered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  participants: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }],
    validate: {
      validator: function(participants) {
        return participants.length === 2;
      },
      message: 'Chat must have exactly 2 participants'
    },
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update updatedAt on save
chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index for unique participant pairs
chatSchema.index({ participants: 1 }, { 
  unique: true,
  partialFilterExpression: { isActive: true }
});

// Index for faster queries
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ 'participants': 1, 'updatedAt': -1 });

export default mongoose.model('Chat', chatSchema);