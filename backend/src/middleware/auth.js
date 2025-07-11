const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided in request');
      return res.status(401).json({ 
        message: 'Authentication required',
        details: 'No token provided'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('Decoded token:', decoded); // Debug log

      const user = await User.findById(decoded.userId);
      console.log('Found user:', user ? { id: user._id, email: user.email, role: user.role } : 'Not found'); // Debug log

      if (!user) {
        console.log('User not found for token:', decoded.userId);
        return res.status(401).json({ 
          message: 'User not found',
          details: 'The user associated with this token no longer exists'
        });
      }

      // Set user info in request
      req.user = {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.role === 'admin'
      };
      
      console.log('Set user in request:', req.user); // Debug log
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        details: jwtError.message
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Authentication error',
      details: error.message
    });
  }
}; 