import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import Customer from '../model/Customer.js';

// Protect routes - verify JWT token for customers
export const protect = async (req, res, next) => {
  try {
    // 1) Getting token and check if it's there
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'You are not logged in! Please log in to get access.',
        code: 'NO_TOKEN'
      });
    }

    // 2) Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Your session has expired! Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token! Please log in again.',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'Token verification failed! Please log in again.',
          code: 'TOKEN_VERIFICATION_FAILED'
        });
      }
    }

    // 3) Check if this is a customer token
    if (decoded.type !== 'customer') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // 4) Check if customer still exists
    const currentCustomer = await Customer.findById(decoded.id).select('-password');
    if (!currentCustomer) {
      return res.status(401).json({
        success: false,
        error: 'The account belonging to this token no longer exists.',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    // Grant access to protected route
    req.customer = currentCustomer;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

// Optional auth - doesn't fail if no token, but attaches customer if present
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type === 'customer') {
        const customer = await Customer.findById(decoded.id).select('-password');
        if (customer) {
          req.customer = customer;
        }
      }
    } catch (error) {
      // Token invalid, but we continue without auth
    }

    next();
  } catch (error) {
    next();
  }
};

// Rate limiting for auth routes
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for registration
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 registration attempts per hour
  message: {
    success: false,
    error: 'Too many registration attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
