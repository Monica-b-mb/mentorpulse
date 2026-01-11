import mongoose from 'mongoose';
import Availability from '../models/Availability.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const setupDemoData = async () => {
  try {
    // Check if MONGO_URI is available
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB with URI:', process.env.MONGO_URI.replace(/:[^:]*@/, ':****@')); // Hide password
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all mentor users
    const mentors = await User.find({ role: 'mentor' });
    console.log(`Found ${mentors.length} mentors`);

    for (const mentor of mentors) {
      // Check if availability already exists
      const existingAvailability = await Availability.findOne({ mentorId: mentor._id });
      
      if (!existingAvailability) {
        // Create demo availability (Mon-Fri, 9AM-5PM)
        const weeklySlots = new Map();
        
        // Monday to Friday (1-5)
        for (let day = 1; day <= 5; day++) {
          weeklySlots.set(day.toString(), [
            { startTime: '09:00', endTime: '10:00', isAvailable: true },
            { startTime: '10:00', endTime: '11:00', isAvailable: true },
            { startTime: '11:00', endTime: '12:00', isAvailable: true },
            { startTime: '14:00', endTime: '15:00', isAvailable: true },
            { startTime: '15:00', endTime: '16:00', isAvailable: true },
            { startTime: '16:00', endTime: '17:00', isAvailable: true }
          ]);
        }

        const availability = new Availability({
          mentorId: mentor._id,
          weeklySlots,
          timezone: 'Asia/Calcutta',
          isActive: true
        });

        await availability.save();
        console.log(`✅ Set up availability for ${mentor.name}`);
      } else {
        console.log(`ℹ️ Availability already exists for ${mentor.name}`);
      }
    }

    console.log('🎉 Demo data setup completed!');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error setting up demo data:', error.message);
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

setupDemoData();