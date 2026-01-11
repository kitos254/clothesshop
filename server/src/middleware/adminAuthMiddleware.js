import jwt from 'jsonwebtoken';
import Admin from '../model/Admin.js';

// Protect routes - verify JWT token
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
        error: 'You are not logged in! Please log in to get access.'
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
          error: 'Your token has expired! Please log in again.',
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

    // 3) Check if admin still exists
    const currentAdmin = await Admin.findById(decoded.id);
    if (!currentAdmin) {
      return res.status(401).json({
        success: false,
        error: 'The admin belonging to this token does no longer exist.',
        code: 'ADMIN_NOT_FOUND'
      });
    }

    // 4) Check if admin is active
    if (!currentAdmin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Your account has been deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // 5) Check if account is locked
    if (currentAdmin.isLocked) {
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked due to too many failed login attempts.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // 6) Check if admin changed password after the token was issued
    if (currentAdmin.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        error: 'Admin recently changed password! Please log in again.',
        code: 'PASSWORD_CHANGED'
      });
    }

    // Grant access to protected route
    req.admin = currentAdmin;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong during authentication',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Check if admin has specific permission
export const hasPermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      if (!req.admin.hasPermission(permission)) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to perform this action',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            required: permission,
            current: req.admin.permissions
          }
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Something went wrong during permission check',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

// Check if admin has any of the specified permissions
export const hasAnyPermission = (permissions) => {
  return (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const hasPermission = permissions.some(permission => 
        req.admin.hasPermission(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to perform this action',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            requiredAny: permissions,
            current: req.admin.permissions
          }
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: 'Something went wrong during permission check',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

// Check if admin has specific role
export const hasRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(req.admin.role)) {
        return res.status(403).json({
          success: false,
          error: 'You do not have the required role to perform this action',
          code: 'INSUFFICIENT_ROLE',
          details: {
            required: allowedRoles,
            current: req.admin.role
          }
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        error: 'Something went wrong during role check',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

// Optional auth - doesn't fail if no token provided
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
      const currentAdmin = await Admin.findById(decoded.id);
      
      if (currentAdmin && currentAdmin.isActive && !currentAdmin.isLocked) {
        req.admin = currentAdmin;
      }
    } catch (error) {
      // Silently fail for optional auth
      console.log('Optional auth failed:', error.message);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if error occurs
  }
};

// Rate limiting for authentication routes
export const authRateLimit = (req, res, next) => {
  // This could be enhanced with Redis for production
  // For now, we'll rely on the general rate limiting in index.js
  next();
};

// Validate refresh token middleware
export const validateRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.adminRefreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token not found',
        code: 'REFRESH_TOKEN_MISSING'
      });
    }

    // Find admin with this refresh token
    const admin = await Admin.findOne({
      'sessions.refreshToken.token': refreshToken,
      'sessions.refreshToken.expiresAt': { $gt: new Date() },
      'sessions.refreshToken.isActive': true
    });

    if (!admin) {
      res.clearCookie('adminRefreshToken');
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    if (!admin.isActive) {
      res.clearCookie('adminRefreshToken');
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    req.admin = admin;
    req.refreshToken = refreshToken;
    next();

  } catch (error) {
    console.error('Refresh token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong during refresh token validation',
      code: 'INTERNAL_ERROR'
    });
  }
};
