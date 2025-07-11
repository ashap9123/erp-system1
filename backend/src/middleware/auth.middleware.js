const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Please authenticate' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_key_here');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Please authenticate' });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Please authenticate' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate.' });
  }
};

module.exports = {
  auth,
  adminAuth
}; 