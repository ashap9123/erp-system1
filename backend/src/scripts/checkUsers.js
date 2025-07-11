const mongoose = require('mongoose');
const User = require('../models/user.model');
require('dotenv').config();

const checkUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system');
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log('Existing users:', users);

    // Check specific admin user
    const admin = await User.findOne({ email: 'admin@example.com' });
    console.log('Admin user:', admin);

    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
};

checkUsers(); 