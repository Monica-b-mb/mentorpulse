import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to your Atlas database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get the User model (adjust based on your model)
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      name: String,
      email: { type: String, unique: true },
      password: String,
      role: String,
      avatar: String,
      skills: [String],
      isVerified: Boolean,
      isActive: Boolean,
      createdAt: Date,
      updatedAt: Date
    }));

    // Delete existing admin if any
    await User.deleteOne({ email: 'admin@mentorpulse.com' });
    console.log('✅ Removed existing admin user');

    // Create NEW admin with correct password hash
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@mentorpulse.com',
      password: hashedPassword,
      role: 'admin',
      avatar: 'default-avatar.png',
      skills: ['administration', 'management'],
      isVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();
    console.log('🎉 ADMIN USER CREATED SUCCESSFULLY!');
    console.log('Email: admin@mentorpulse.com');
    console.log('Password: admin123');
    console.log('Role: admin');

    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();