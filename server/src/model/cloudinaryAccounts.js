import mongoose from 'mongoose';

// Schema for Cloudinary account configuration
const cloudinaryAccountSchema = new mongoose.Schema({
  // Account identification
  name: {
    type: String,
    trim: true,
    unique: true,
    maxlength: [100, 'Account name cannot exceed 100 characters']
  },

  // Email for the Cloudinary account
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Cloudinary credentials
  cloudName: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function(value) {
        // For drafts, cloudName can be null
        if (this.isDraft) {
          return true;
        }
        // For live accounts, cloudName is required and must be unique
        return value && value.length > 0;
      },
      message: 'Cloud name is required for live accounts'
    }
  },
  apiKey: {
    type: String,
    trim: true
  },
  apiSecret: {
    type: String,
    trim: true
  },
  
  // Load balancing and usage tracking
  uploadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Account limits and configuration
  maxUploadsPerDay: {
    type: Number,
    default: 1000,
    min: 1
  },
  maxUploadsPerMonth: {
    type: Number,
    default: 25000,
    min: 1
  },
  
  // Usage statistics
  dailyStats: {
    date: {
      type: Date,
      default: Date.now
    },
    uploadsToday: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  monthlyStats: {
    month: {
      type: Number,
      default: () => new Date().getMonth() + 1,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear()
    },
    uploadsThisMonth: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Account status and configuration
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  
  // Priority for load balancing (lower number = higher priority)
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  // Folder configuration for organization
  defaultFolder: {
    type: String,
    default: 'products',
    trim: true
  },
  
  // Additional settings
  settings: {
    allowedFormats: [{
      type: String,
      enum: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'],
      default: ['jpg', 'jpeg', 'png', 'webp']
    }],
    maxFileSize: {
      type: Number,
      default: 10485760, // 10MB in bytes
      min: 1048576 // 1MB minimum
    },
    autoOptimize: {
      type: Boolean,
      default: true
    },
    generateThumbnails: {
      type: Boolean,
      default: true
    }
  },
  
  // Health monitoring
  lastUsed: {
    type: Date,
    default: Date.now
  },
  lastHealthCheck: {
    type: Date,
    default: Date.now
  },
  healthStatus: {
    type: String,
    enum: ['healthy', 'warning', 'error', 'maintenance'],
    default: 'healthy'
  },
  errorCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastError: {
    message: String,
    timestamp: Date,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Admin tracking
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: function() {
      // createdBy is not required for draft accounts (system-created)
      return !this.isDraft;
    }
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

  // Draft status for incremental creation
  isDraft: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
cloudinaryAccountSchema.index({ isActive: 1, priority: 1, uploadCount: 1 });
cloudinaryAccountSchema.index({ 'dailyStats.date': 1 });
cloudinaryAccountSchema.index({ 'monthlyStats.month': 1, 'monthlyStats.year': 1 });
cloudinaryAccountSchema.index({ lastUsed: -1 });
cloudinaryAccountSchema.index({ healthStatus: 1 });

// Unique index for cloudName, but only for non-draft accounts
cloudinaryAccountSchema.index(
  { cloudName: 1 }, 
  { 
    unique: true, 
    sparse: true, // This allows multiple null values
    partialFilterExpression: { 
      cloudName: { $ne: null },
      isDraft: false 
    }
  }
);

// Virtual for availability status
cloudinaryAccountSchema.virtual('isAvailable').get(function() {
  if (!this.isActive || this.healthStatus === 'error' || this.healthStatus === 'maintenance') {
    return false;
  }
  
  // Check daily limits
  const today = new Date();
  const statsDate = new Date(this.dailyStats.date);
  const isToday = today.toDateString() === statsDate.toDateString();
  
  if (isToday && this.dailyStats.uploadsToday >= this.maxUploadsPerDay) {
    return false;
  }
  
  // Check monthly limits
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  if (this.monthlyStats.month === currentMonth && 
      this.monthlyStats.year === currentYear && 
      this.monthlyStats.uploadsThisMonth >= this.maxUploadsPerMonth) {
    return false;
  }
  
  return true;
});

// Virtual for usage percentage
cloudinaryAccountSchema.virtual('dailyUsagePercentage').get(function() {
  if (!this.maxUploadsPerDay) return 0;
  
  const today = new Date();
  const statsDate = new Date(this.dailyStats.date);
  const isToday = today.toDateString() === statsDate.toDateString();
  
  if (!isToday) return 0;
  
  return Math.round((this.dailyStats.uploadsToday / this.maxUploadsPerDay) * 100);
});

cloudinaryAccountSchema.virtual('monthlyUsagePercentage').get(function() {
  if (!this.maxUploadsPerMonth) return 0;
  
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  if (this.monthlyStats.month !== currentMonth || this.monthlyStats.year !== currentYear) {
    return 0;
  }
  
  return Math.round((this.monthlyStats.uploadsThisMonth / this.maxUploadsPerMonth) * 100);
});

// Pre-save middleware to generate unique name if not provided
cloudinaryAccountSchema.pre('save', async function(next) {
  // Generate unique name if not provided (for new drafts)
  if (this.isNew && !this.name) {
    try {
      // Find the highest numbered account
      const lastAccount = await this.constructor.findOne(
        { name: { $regex: /^NEWRAN-ST-\d{4}$/ } },
        {},
        { sort: { name: -1 } }
      );

      let nextNumber = 1;
      if (lastAccount && lastAccount.name) {
        const match = lastAccount.name.match(/NEWRAN-ST-(\d{4})/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      // Format with leading zeros
      const formattedNumber = nextNumber.toString().padStart(4, '0');
      this.name = `NEWRAN-ST-${formattedNumber}`;
    } catch (error) {
      console.error('Error generating unique name:', error);
      // Fallback to timestamp if there's an error
      this.name = `NEWRAN-ST-${Date.now()}`;
    }
  }

  next();
});

// Pre-save middleware to reset daily stats if date has changed
cloudinaryAccountSchema.pre('save', async function(next) {
  const today = new Date();
  const statsDate = new Date(this.dailyStats.date);
  
  // Reset daily stats if it's a new day
  if (today.toDateString() !== statsDate.toDateString()) {
    this.dailyStats.date = today;
    this.dailyStats.uploadsToday = 0;
  }
  
  // Reset monthly stats if it's a new month
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  if (this.monthlyStats.month !== currentMonth || this.monthlyStats.year !== currentYear) {
    this.monthlyStats.month = currentMonth;
    this.monthlyStats.year = currentYear;
    this.monthlyStats.uploadsThisMonth = 0;
  }

  // Check for unique cloudName when going live (not draft)
  if (!this.isDraft && this.cloudName && this.isModified('cloudName')) {
    const existingAccount = await this.constructor.findOne({
      cloudName: this.cloudName,
      _id: { $ne: this._id },
      isDraft: false
    });
    
    if (existingAccount) {
      const error = new Error('Cloud name already exists');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  
  next();
});

// Pre-save middleware to ensure only one primary account
cloudinaryAccountSchema.pre('save', async function(next) {
  if (this.isPrimary && this.isModified('isPrimary')) {
    // Remove primary flag from other accounts
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isPrimary: false }
    );
  }
  next();
});

// Static methods for load balancing
cloudinaryAccountSchema.statics.getOptimalAccount = async function() {
  // Find available accounts sorted by priority and upload count
  const accounts = await this.find({ isActive: true })
    .sort({ 
      priority: 1,        // Lower priority number first
      uploadCount: 1,     // Lower upload count first
      lastUsed: 1         // Least recently used first
    });
  
  // Filter available accounts
  const availableAccounts = accounts.filter(account => account.isAvailable);
  
  if (availableAccounts.length === 0) {
    throw new Error('No available Cloudinary accounts found');
  }
  
  return availableAccounts[0];
};

cloudinaryAccountSchema.statics.getPrimaryAccount = async function() {
  const primaryAccount = await this.findOne({ isPrimary: true, isActive: true });
  
  if (!primaryAccount || !primaryAccount.isAvailable) {
    // Fallback to optimal account if primary is not available
    return await this.getOptimalAccount();
  }
  
  return primaryAccount;
};

cloudinaryAccountSchema.statics.getAccountStats = async function() {
  const pipeline = [
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalAccounts: { $sum: 1 },
        totalUploads: { $sum: '$uploadCount' },
        averageUploads: { $avg: '$uploadCount' },
        healthyAccounts: {
          $sum: {
            $cond: [{ $eq: ['$healthStatus', 'healthy'] }, 1, 0]
          }
        }
      }
    }
  ];
  
  const stats = await this.aggregate(pipeline);
  return stats[0] || {
    totalAccounts: 0,
    totalUploads: 0,
    averageUploads: 0,
    healthyAccounts: 0
  };
};

// Instance methods
cloudinaryAccountSchema.methods.incrementUploadCount = async function(count = 1) {
  this.uploadCount += count;
  this.dailyStats.uploadsToday += count;
  this.monthlyStats.uploadsThisMonth += count;
  this.lastUsed = new Date();
  
  await this.save();
  return this;
};

cloudinaryAccountSchema.methods.recordError = async function(error) {
  this.errorCount += 1;
  this.lastError = {
    message: error.message,
    timestamp: new Date(),
    details: error.details || {}
  };
  
  // Auto-disable account if too many errors
  if (this.errorCount >= 10) {
    this.healthStatus = 'error';
    this.isActive = false;
  } else if (this.errorCount >= 5) {
    this.healthStatus = 'warning';
  }
  
  await this.save();
  return this;
};

cloudinaryAccountSchema.methods.resetErrorCount = async function() {
  this.errorCount = 0;
  this.healthStatus = 'healthy';
  this.lastError = undefined;
  
  await this.save();
  return this;
};

cloudinaryAccountSchema.methods.performHealthCheck = async function() {
  try {
    // Import cloudinary dynamically to avoid circular dependency
    const cloudinary = await import('cloudinary');
    
    // Configure cloudinary with this account's credentials
    cloudinary.v2.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret
    });
    
    // Perform a simple API call to check account health
    await cloudinary.v2.api.ping();
    
    this.healthStatus = 'healthy';
    this.lastHealthCheck = new Date();
    
    if (this.errorCount > 0) {
      this.errorCount = Math.max(0, this.errorCount - 1);
    }
    
    await this.save();
    return { status: 'healthy', message: 'Account is functioning properly' };
    
  } catch (error) {
    await this.recordError(error);
    return { status: 'error', message: error.message };
  }
};

const CloudinaryAccount = mongoose.model('CloudinaryAccount', cloudinaryAccountSchema);

export default CloudinaryAccount;
