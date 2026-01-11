import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Define permissions enum
const PERMISSIONS = {
  // Product Management
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  
  // Order Management
  ORDER_READ: 'order:read',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
  
  // Customer Management
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',
  
  // Admin Management
  ADMIN_CREATE: 'admin:create',
  ADMIN_READ: 'admin:read',
  ADMIN_UPDATE: 'admin:update',
  ADMIN_DELETE: 'admin:delete',
  
  // System Management
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_LOGS: 'system:logs',
  SYSTEM_ANALYTICS: 'system:analytics',
  
  // Role Management
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete'
};

// Define default roles
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  MODERATOR: 'moderator',
  VIEWER: 'viewer'
};

// Role permissions mapping
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.PRODUCT_CREATE, PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.ORDER_READ, PERMISSIONS.ORDER_UPDATE, PERMISSIONS.ORDER_DELETE,
    PERMISSIONS.CUSTOMER_READ, PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.ADMIN_READ, PERMISSIONS.ADMIN_UPDATE,
    PERMISSIONS.SYSTEM_ANALYTICS, PERMISSIONS.ROLE_READ
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.ORDER_READ, PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.CUSTOMER_READ, PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.SYSTEM_ANALYTICS
  ],
  [ROLES.MODERATOR]: [
    PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.ORDER_READ, PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.CUSTOMER_READ
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.PRODUCT_READ, PERMISSIONS.ORDER_READ, PERMISSIONS.CUSTOMER_READ
  ]
};

// Refresh Token Schema
const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deviceInfo: {
    userAgent: String,
    ip: String,
    device: String,
    browser: String,
    os: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Session Schema
const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  refreshToken: refreshTokenSchema,
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// MFA Schema
const mfaSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    default: false
  },
  secret: {
    type: String,
    select: false // Don't include by default in queries
  },
  backupCodes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    },
    usedAt: Date
  }],
  enabledAt: Date,
  lastUsedAt: Date
});

// Audit Log Schema for admin activities
const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  resource: String,
  resourceId: String,
  details: mongoose.Schema.Types.Mixed,
  ip: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String
});

// Main Admin Schema
const adminSchema = new mongoose.Schema({
  // Basic Information
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please provide a valid phone number']
  },
  avatar: {
    url: String,
    publicId: String
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.VIEWER,
    required: true
  },
  permissions: [{
    type: String,
    enum: Object.values(PERMISSIONS)
  }],
  customPermissions: [{
    permission: {
      type: String,
      enum: Object.values(PERMISSIONS)
    },
    granted: {
      type: Boolean,
      default: true
    }
  }],
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Security
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Multi-Factor Authentication
  mfa: mfaSchema,
  
  // Sessions and Refresh Tokens
  sessions: [sessionSchema],
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  lastLoginAt: Date,
  lastLoginIp: String,
  loginHistory: [{
    ip: String,
    userAgent: String,
    loginAt: {
      type: Date,
      default: Date.now
    },
    success: {
      type: Boolean,
      default: true
    },
    failureReason: String
  }],
  
  // Audit Trail
  auditLogs: [auditLogSchema],
  
  // Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      inApp: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (only for fields without unique: true)
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ 'sessions.refreshToken.expiresAt': 1 });
adminSchema.index({ 'auditLogs.timestamp': -1 });

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  // Only hash password if it's been modified and exists
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update password changed timestamp
    this.passwordChangedAt = Date.now() - 1000; // Subtract 1 second to handle JWT timing
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to set default permissions based on role
adminSchema.pre('save', function(next) {
  if (this.isModified('role') || this.isNew) {
    this.permissions = ROLE_PERMISSIONS[this.role] || [];
  }
  next();
});

// Instance method to compare passwords
adminSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after JWT was issued
adminSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to generate password reset token
adminSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Instance method to generate email verification token
adminSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

// Instance method to generate refresh token
adminSchema.methods.createRefreshToken = function(deviceInfo = {}, providedToken = null) {
  const refreshToken = providedToken || crypto.randomBytes(64).toString('hex');
  const sessionId = crypto.randomBytes(32).toString('hex');
  
  const tokenData = {
    token: refreshToken, // Store token directly, not hashed for this implementation
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    isActive: true,
    deviceInfo,
    createdAt: new Date(),
    lastUsedAt: new Date()
  };
  
  const session = {
    sessionId,
    refreshToken: tokenData,
    isActive: true,
    createdAt: new Date(),
    lastActivityAt: new Date()
  };
  
  this.sessions.push(session);
  
  return { refreshToken, sessionId };
};

// Instance method to revoke refresh token
adminSchema.methods.revokeRefreshToken = function(tokenOrSessionId) {
  const isSessionId = tokenOrSessionId.length === 64; // Session ID length
  
  if (isSessionId) {
    const session = this.sessions.find(s => s.sessionId === tokenOrSessionId);
    if (session) {
      session.isActive = false;
      session.refreshToken.isActive = false;
    }
  } else {
    // Look for token directly without hashing
    const session = this.sessions.find(s => s.refreshToken.token === tokenOrSessionId);
    if (session) {
      session.isActive = false;
      session.refreshToken.isActive = false;
    }
  }
};

// Instance method to revoke all refresh tokens
adminSchema.methods.revokeAllRefreshTokens = function() {
  this.sessions.forEach(session => {
    session.isActive = false;
    session.refreshToken.isActive = false;
  });
};

// Instance method to clean up expired tokens
adminSchema.methods.cleanupExpiredTokens = function() {
  this.sessions = this.sessions.filter(session => {
    return session.refreshToken.expiresAt > new Date() && session.isActive;
  });
};

// Instance method to check permissions
adminSchema.methods.hasPermission = function(permission) {
  // Super admin has all permissions
  if (this.role === ROLES.SUPER_ADMIN) return true;
  
  // Check if permission is in default role permissions
  if (this.permissions.includes(permission)) return true;
  
  // Check custom permissions
  const customPerm = this.customPermissions.find(cp => cp.permission === permission);
  return customPerm ? customPerm.granted : false;
};

// Instance method to add audit log
adminSchema.methods.addAuditLog = function(action, details = {}) {
  this.auditLogs.push({
    action,
    resource: details.resource,
    resourceId: details.resourceId,
    details: details.details,
    ip: details.ip,
    userAgent: details.userAgent,
    timestamp: new Date(),
    success: details.success !== false,
    errorMessage: details.errorMessage
  });
  
  // Keep only last 1000 audit logs per admin
  if (this.auditLogs.length > 1000) {
    this.auditLogs = this.auditLogs.slice(-1000);
  }
};

// Instance method to handle failed login
adminSchema.methods.handleFailedLogin = function(ip, userAgent, reason) {
  this.loginAttempts += 1;
  
  // Add to login history
  this.loginHistory.push({
    ip,
    userAgent,
    loginAt: new Date(),
    success: false,
    failureReason: reason
  });
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  }
  
  // Add audit log
  this.addAuditLog('LOGIN_FAILED', {
    details: { reason, attempts: this.loginAttempts },
    ip,
    userAgent,
    success: false
  });
};

// Instance method to handle successful login
adminSchema.methods.handleSuccessfulLogin = function(ip, userAgent) {
  this.lastLoginAt = new Date();
  this.lastLoginIp = ip;
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  
  // Add to login history
  this.loginHistory.push({
    ip,
    userAgent,
    loginAt: new Date(),
    success: true
  });
  
  // Keep only last 50 login history entries
  if (this.loginHistory.length > 50) {
    this.loginHistory = this.loginHistory.slice(-50);
  }
  
  // Add audit log
  this.addAuditLog('LOGIN_SUCCESS', {
    details: { ip, userAgent },
    ip,
    userAgent
  });
};

// Static method to get permissions for role
adminSchema.statics.getRolePermissions = function(role) {
  return ROLE_PERMISSIONS[role] || [];
};

// Export constants
adminSchema.statics.PERMISSIONS = PERMISSIONS;
adminSchema.statics.ROLES = ROLES;
adminSchema.statics.ROLE_PERMISSIONS = ROLE_PERMISSIONS;

export default mongoose.model('Admin', adminSchema);
