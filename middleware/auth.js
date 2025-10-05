const jwt = require('jsonwebtoken');
const User = require('../models/User');

// This middleware checks if user is logged in
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]; // Extract token
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Not authorized, no token' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database (without password)
    req.user = await User.findById(decoded.id).select('-hashedPassword');
    
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    
    next(); // User is authenticated, continue to route
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
