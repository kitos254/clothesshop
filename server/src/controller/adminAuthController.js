import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../model/Admin.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create and send token response
const createSendToken = async (admin, statusCode, res, message = 'Success') => {
  const token = generateToken(admin._id);
  const refreshToken = generateRefreshToken();
  
  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Set refresh token as httpOnly cookie
  res.cookie('adminRefreshToken', refreshToken, cookieOptions);

  // Save refresh token to database
  const deviceInfo = {
    userAgent: res.req.get('user-agent') || '',
    ip: res.req.ip || res.req.connection.remoteAddress,
  };
  
  admin.createRefreshToken(deviceInfo, refreshToken);
  
  // Save admin data (this might trigger pre-save hooks)
  await admin.save({ validateBeforeSave: false });

  // Create response object without password
  const adminResponse = {
    id: admin._id,
    username: admin.username,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    fullName: admin.fullName,
    role: admin.role,
    permissions: admin.permissions,
    isActive: admin.isActive,
    avatar: admin.avatar,
    preferences: admin.preferences
  };

  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: {
      admin: adminResponse
    }
  });
};

// @desc    Login admin
// @route   POST /api/admin/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { login, password, rememberMe } = req.body;

    // 1) Check if login and password exist
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide username/email and password'
      });
    }

    // 2) Check if admin exists and password is correct
    // The login field can be either username or email
    const query = login.includes('@') 
      ? { email: login.toLowerCase() } 
      : { username: login };

    const admin = await Admin.findOne(query).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      // Handle failed login attempt
      if (admin) {
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent') || '';
        await admin.handleFailedLogin(ip, userAgent, 'Invalid credentials');
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // 3) Check if admin account is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Your account has been deactivated. Please contact support.'
      });
    }

    // 4) Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        error: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // 5) Handle successful login
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';
    await admin.handleSuccessfulLogin(ip, userAgent);

    // 6) Add audit log
    admin.addAuditLog('LOGIN', {
      ip,
      userAgent,
      rememberMe
    });

    // 7) Create and send token (this will save the admin data)
    await createSendToken(admin, 200, res, 'Login successful');

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong during login'
    });
  }
};

// @desc    Logout admin
// @route   POST /api/admin/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.adminRefreshToken;
    
    if (refreshToken && req.admin) {
      // Revoke the refresh token
      await req.admin.revokeRefreshToken(refreshToken);
      
      // Add audit log
      req.admin.addAuditLog('LOGOUT', {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || ''
      });
      
      await req.admin.save({ validateBeforeSave: false });
    }

    // Clear the refresh token cookie
    res.clearCookie('adminRefreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong during logout'
    });
  }
};

// @desc    Refresh token
// @route   POST /api/admin/auth/refresh
// @access  Private (via refresh token)
export const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.adminRefreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token not found'
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
        error: 'Invalid or expired refresh token'
      });
    }

    // Check if admin is still active
    if (!admin.isActive) {
      res.clearCookie('adminRefreshToken');
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }

    // Update last used time for the refresh token
    const session = admin.sessions.find(s => 
      s.refreshToken.token === refreshToken && s.refreshToken.isActive
    );
    
    if (session) {
      session.refreshToken.lastUsedAt = new Date();
      session.lastActivityAt = new Date();
    }

    await admin.save({ validateBeforeSave: false });

    // Generate new access token
    const newToken = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          fullName: admin.fullName,
          role: admin.role,
          permissions: admin.permissions,
          isActive: admin.isActive,
          avatar: admin.avatar,
          preferences: admin.preferences
        }
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong during token refresh'
    });
  }
};

// @desc    Get current admin
// @route   GET /api/admin/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          fullName: admin.fullName,
          role: admin.role,
          permissions: admin.permissions,
          isActive: admin.isActive,
          isEmailVerified: admin.isEmailVerified,
          avatar: admin.avatar,
          preferences: admin.preferences,
          lastLoginAt: admin.lastLoginAt,
          createdAt: admin.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong while fetching admin profile'
    });
  }
};

// @desc    Validate token
// @route   POST /api/admin/auth/validate
// @access  Private
export const validateToken = async (req, res, next) => {
  try {
    // If we reach here, the token is valid (middleware already verified it)
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        admin: {
          id: req.admin._id,
          username: req.admin.username,
          role: req.admin.role,
          permissions: req.admin.permissions
        }
      }
    });

  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong during token validation'
    });
  }
};

// @desc    Logout from all devices
// @route   POST /api/admin/auth/logout-all
// @access  Private
export const logoutAll = async (req, res, next) => {
  try {
    // Revoke all refresh tokens
    await req.admin.revokeAllRefreshTokens();
    
    // Add audit log
    req.admin.addAuditLog('LOGOUT_ALL', {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || ''
    });
    
    await req.admin.save({ validateBeforeSave: false });

    // Clear the refresh token cookie
    res.clearCookie('adminRefreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });

  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Something went wrong during logout from all devices'
    });
  }
};
