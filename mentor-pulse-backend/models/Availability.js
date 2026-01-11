import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  startTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:MM (24-hour format)'
    }
  },
  endTime: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:MM (24-hour format)'
    }
  },
  isAvailable: { 
    type: Boolean, 
    default: true 
  }
});

const exceptionSchema = new mongoose.Schema({
  date: { 
    type: Date, 
    required: true 
  },
  reason: {
    type: String,
    maxlength: 200
  },
  slots: [timeSlotSchema]
});

const availabilitySchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  weeklySlots: {
    type: Map,
    of: [timeSlotSchema],
    default: new Map(),
    validate: {
      validator: function(slotsMap) {
        // Validate that all day keys are 0-6 (Sunday-Saturday)
        const validDays = ['0', '1', '2', '3', '4', '5', '6'];
        for (const key of slotsMap.keys()) {
          if (!validDays.includes(key)) {
            return false;
          }
        }
        return true;
      },
      message: 'Weekly slots must have day keys between 0-6 (Sunday-Saturday)'
    }
  },
  exceptions: {
    type: [exceptionSchema],
    default: []
  },
  timezone: {
    type: String,
    default: 'UTC',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for faster queries
availabilitySchema.index({ mentorId: 1 });
availabilitySchema.index({ isActive: 1 });

// Pre-save middleware to update lastUpdated
availabilitySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Method to check if a time slot is available
availabilitySchema.methods.isSlotAvailable = function(date, startTime, endTime) {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
  const dateStr = date.toISOString().split('T')[0];
  
  // Check exceptions first
  const exception = this.exceptions.find(ex => 
    ex.date.toISOString().split('T')[0] === dateStr
  );
  
  if (exception) {
    const slotAvailable = exception.slots.some(slot =>
      slot.startTime === startTime && 
      slot.endTime === endTime && 
      slot.isAvailable
    );
    return slotAvailable;
  }
  
  // Check weekly availability
  const daySlots = this.weeklySlots.get(dayOfWeek.toString()) || [];
  const slotAvailable = daySlots.some(slot =>
    slot.startTime === startTime && 
    slot.endTime === endTime && 
    slot.isAvailable
  );
  
  return slotAvailable;
};

// Convert Map to Object for JSON serialization
// Convert Map to Object for JSON serialization
availabilitySchema.methods.toJSON = function() {
  const availability = this.toObject();
  
  // Convert Map to plain object for JSON serialization
  if (availability.weeklySlots instanceof Map) {
    const slotsObj = {};
    for (const [key, value] of availability.weeklySlots.entries()) {
      slotsObj[key] = value;
    }
    availability.weeklySlots = slotsObj;
  }
  
  return availability;
};

export default mongoose.model('Availability', availabilitySchema);