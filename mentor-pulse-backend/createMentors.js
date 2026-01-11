import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const createRealMentors = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create real mentor users
    const realMentors = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.mentor@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
        role: 'mentor',
        designation: 'Senior Frontend Developer',
        company: 'Google',
        skills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'UI/UX'],
        bio: 'Passionate about React and frontend development with 8+ years of experience.',
        location: 'San Francisco, CA',
        hourlyRate: 75,
        rating: 4.8,
        reviews: 42,
        availability: 'available',
        isVerified: true
      },
      {
        name: 'Michael Chen',
        email: 'michael.mentor@example.com', 
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // "password"
        role: 'mentor',
        designation: 'Full Stack Developer',
        company: 'Microsoft',
        skills: ['Node.js', 'Python', 'AWS', 'Docker', 'React'],
        bio: 'Full-stack developer with expertise in cloud technologies and 10+ years of experience.',
        location: 'Seattle, WA', 
        hourlyRate: 85,
        rating: 4.9,
        reviews: 38,
        availability: 'available',
        isVerified: true
      },
      {
        name: 'Emily Rodriguez',
        email: 'emily.mentor@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        role: 'mentor',
        designation: 'Data Scientist',
        company: 'Amazon',
        skills: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Data Analysis'],
        bio: 'Data scientist with expertise in machine learning and big data analytics.',
        location: 'New York, NY',
        hourlyRate: 90,
        rating: 4.7,
        reviews: 35,
        availability: 'available',
        isVerified: true
      }
    ];

    console.log('👥 Creating mentor users...');
    
    for (const mentorData of realMentors) {
      const existingUser = await User.findOne({ email: mentorData.email });
      if (!existingUser) {
        await User.create(mentorData);
        console.log(`✅ Created new mentor: ${mentorData.name}`);
      } else {
        console.log(`ℹ️ Mentor already exists: ${mentorData.name}`);
        // Update existing user to be a mentor with all fields
        await User.findOneAndUpdate(
          { email: mentorData.email },
          { 
            role: 'mentor',
            designation: mentorData.designation,
            company: mentorData.company,
            skills: mentorData.skills,
            hourlyRate: mentorData.hourlyRate,
            rating: mentorData.rating,
            reviews: mentorData.reviews,
            availability: mentorData.availability,
            isVerified: mentorData.isVerified,
            bio: mentorData.bio,
            location: mentorData.location
          },
          { new: true }
        );
        console.log(`✅ Updated user to mentor: ${mentorData.name}`);
      }
    }

    console.log('🎉 Real mentors created/updated successfully!');
    
    // Show all mentors in database
    const allMentors = await User.find({ role: 'mentor' }).select('name email role designation');
    console.log('📊 All mentors in database:', allMentors);
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating real mentors:', error);
    process.exit(1);
  }
};

// Run the function
createRealMentors();