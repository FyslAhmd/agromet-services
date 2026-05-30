import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const GUEST_USER = {
  id: "guest",
  username: "guest",
  name: "Guest Visitor",
  email: null,
  role: "guest",
  status: "approved",
  isGuest: true,
};

// Authentication middleware
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'agromet-secret-key-2024');

    if (decoded?.isGuest && decoded?.role === "guest") {
      req.user = { ...GUEST_USER };
      req.userId = GUEST_USER.id;
      return next();
    }
    
    // Find user
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if user is approved
    if (user.status !== 'approved') {
      return res.status(403).json({ message: 'Account not approved yet' });
    }
    
    // Add user to request object
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin middleware - must be used after authMiddleware
export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

export const guestOrUserMiddleware = (req, res, next) => {
  if (req.user && ["guest", "user", "admin"].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: "Access denied" });
  }
};

export const registeredUserMiddleware = (req, res, next) => {
  if (req.user && ["user", "admin"].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: "Registered account required" });
  }
};
