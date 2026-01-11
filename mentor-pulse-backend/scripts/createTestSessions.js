// scripts/createTestSessions.js
import mongoose from 'mongoose';
import Session from '../models/Session.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestSessions = async () => {
  try {
    // Use direct connection string instead of SRV
    const connectionString = process.env.MONGODB_URI.replace('mongodb+srv://', 'mongodb://');
    
    await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get a mentor and mentee
    const mentor = await User.findOne({ role: 'mentor' });
    const mentee = await User.findOne({ role: 'mentee' });
    
    if (!mentor || !mentee) {
      console.log('❌ Please create mentor and mentee users first');
      
      // Create test users if they don't exist
      console.log('👨‍💼 Creating test users...');
      const testMentor = new User({
        name: 'Test Mentor',
        email: 'mentor@test.com',
        password: 'test123',
        role: 'mentor',
        profileImage: '',
        skills: ['JavaScript', 'React', 'Node.js']
      });
      
      const testMentee = new User({
        name: 'Test Mentee',
        email: 'mentee@test.com', 
        password: 'test123',
        role: 'mentee',
        profileImage: ''
      });
      
      await testMentor.save();
      await testMentee.save();
      
      console.log('✅ Created test users');
    }

    const currentMentor = mentor || await User.findOne({ role: 'mentor' });
    const currentMentee = mentee || await User.findOne({ role: 'mentee' });

    console.log(`👨‍🏫 Mentor: ${currentMentor.name}`);
    console.log(`👨‍🎓 Mentee: ${currentMentee.name}`);

    const testSessions = [
      {
        mentorId: currentMentor._id,
        menteeId: currentMentee._id,
        sessionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        startTime: '14:00',
        endTime: '15:00',
        sessionType: 'Career Coaching',
        price: 50,
        duration: 60,
        status: 'confirmed',
        notes: 'Discussion about career growth opportunities',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        mentorId: currentMentor._id,
        menteeId: currentMentee._id,
        sessionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        startTime: '10:00',
        endTime: '11:00',
        sessionType: 'Technical Interview Prep',
        price: 75,
        duration: 60,
        status: 'completed',
        rating: 5,
        feedback: 'Excellent session! Very helpful tips for technical interviews.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Clear existing sessions
    await Session.deleteMany({});
    console.log('🧹 Cleared existing sessions');
    
    // Insert test sessions
    await Session.insertMany(testSessions);
    console.log('✅ Created test sessions');
    
    // Verify the sessions were created
    const sessionCount = await Session.countDocuments();
    console.log(`📊 Total sessions in database: ${sessionCount}`);
    
    // Show the created sessions
    const sessions = await Session.find().populate('mentorId', 'name').populate('menteeId', 'name');
    console.log('📋 Created sessions:');
    sessions.forEach(session => {
      console.log(`   - ${session.sessionType} with ${session.mentorId.name} and ${session.menteeId.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test sessions:', error);
    console.log('💡 Try these solutions:');
    console.log('   1. Check your MongoDB connection string in .env file');
    console.log('   2. Ensure MongoDB Atlas whitelists your IP address');
    console.log('   3. Check your internet connection');
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
};

createTestSessions();