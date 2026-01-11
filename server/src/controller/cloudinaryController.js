import CloudinaryAccount from '../model/cloudinaryAccounts.js';
import cloudinaryService from '../services/cloudinaryService.js';

// Get all Cloudinary accounts
export const getAllAccounts = async (req, res) => {
  try {
    const accounts = await CloudinaryAccount.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ priority: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: accounts
    });

  } catch (error) {
    console.error('Get all accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Cloudinary accounts',
      error: error.message
    });
  }
};

// Get single Cloudinary account
export const getAccount = async (req, res) => {
  try {
    const { id } = req.params;
    
    const account = await CloudinaryAccount.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cloudinary account not found'
      });
    }

    res.status(200).json({
      success: true,
      data: account
    });

  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Cloudinary account',
      error: error.message
    });
  }
};

// Get existing draft account (there should only be one)
export const getExistingDraft = async (req, res) => {
  try {
    const draft = await CloudinaryAccount.findOne({ isDraft: true })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: draft
    });

  } catch (error) {
    console.error('Get existing draft error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch existing draft',
      error: error.message
    });
  }
};

// Create new Cloudinary account
export const createAccount = async (req, res) => {
  try {
    const adminId = req.admin._id;
    
    const {
      name,
      email,
      cloudName,
      apiKey,
      apiSecret,
      maxUploadsPerDay,
      maxUploadsPerMonth,
      priority,
      isPrimary,
      defaultFolder,
      settings,
      isDraft
    } = req.body;

    // For draft creation, only require minimal data
    if (isDraft) {
      // Check if there's already an existing draft and delete it
      const existingDraft = await CloudinaryAccount.findOne({ isDraft: true });
      if (existingDraft) {
        await CloudinaryAccount.findByIdAndDelete(existingDraft._id);
      }

      // Create draft with auto-generated name and minimal data
      const accountData = {
        email: email || '',
        cloudName: cloudName || null, // Use null instead of empty string for unique constraint
        apiKey: apiKey || '',
        apiSecret: apiSecret || '',
        maxUploadsPerDay: maxUploadsPerDay || 1000,
        maxUploadsPerMonth: maxUploadsPerMonth || 25000,
        priority: priority || 1,
        isPrimary: false,
        defaultFolder: defaultFolder || 'products',
        settings: settings || {
          allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
          maxFileSize: 10485760,
          autoOptimize: true,
          generateThumbnails: true
        },
        isDraft: true,
        isActive: false,
        createdBy: adminId
      };

      const account = new CloudinaryAccount(accountData);
      await account.save();

      // Populate for response
      await account.populate('createdBy', 'name email');

      return res.status(201).json({
        success: true,
        message: 'Draft Cloudinary account created successfully',
        data: account
      });
    }

    // For live accounts, validate required fields
    if (!name || !email || !cloudName || !apiKey || !apiSecret) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, cloudName, apiKey, apiSecret'
      });
    }

    // Check if cloud name already exists
    const existingAccount = await CloudinaryAccount.findOne({ cloudName });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: 'Cloud name already exists'
      });
    }

    // Create live account data
    const accountData = {
      name,
      email,
      cloudName,
      apiKey,
      apiSecret,
      maxUploadsPerDay: maxUploadsPerDay || 1000,
      maxUploadsPerMonth: maxUploadsPerMonth || 25000,
      priority: priority || 1,
      isPrimary: isPrimary || false,
      defaultFolder: defaultFolder || 'products',
      settings: settings || {
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxFileSize: 10485760,
        autoOptimize: true,
        generateThumbnails: true
      },
      isDraft: false,
      isActive: true,
      createdBy: adminId
    };

    // Create account
    const account = new CloudinaryAccount(accountData);
    await account.save();

    // Perform initial health check
    try {
      await account.performHealthCheck();
    } catch (healthError) {
      console.error('Initial health check failed:', healthError);
      // Don't fail account creation if health check fails
    }

    // Populate for response
    await account.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Cloudinary account created successfully',
      data: account
    });

  } catch (error) {
    console.error('Create account error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create Cloudinary account',
      error: error.message
    });
  }
};

// Update Cloudinary account
export const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;

    const account = await CloudinaryAccount.findById(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cloudinary account not found'
      });
    }

    // Check if cloud name conflicts with other accounts
    if (req.body.cloudName && req.body.cloudName !== account.cloudName) {
      const existingAccount = await CloudinaryAccount.findOne({ 
        cloudName: req.body.cloudName,
        _id: { $ne: id }
      });
      if (existingAccount) {
        return res.status(400).json({
          success: false,
          message: 'Cloud name already exists'
        });
      }
    }

    // Update account
    const updateData = {
      ...req.body,
      updatedBy: adminId
    };

    const updatedAccount = await CloudinaryAccount.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Populate for response
    await updatedAccount.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Cloudinary account updated successfully',
      data: updatedAccount
    });

  } catch (error) {
    console.error('Update account error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update Cloudinary account',
      error: error.message
    });
  }
};

// Delete Cloudinary account
export const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await CloudinaryAccount.findById(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cloudinary account not found'
      });
    }

    // Check if account is being used by any products
    const Product = (await import('../model/Product.js')).default;
    const productsUsingAccount = await Product.countDocuments({
      'images.cloudinaryAccount': id
    });

    if (productsUsingAccount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete account. ${productsUsingAccount} products are using this account.`
      });
    }

    // Delete account
    await CloudinaryAccount.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Cloudinary account deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete Cloudinary account',
      error: error.message
    });
  }
};

// Toggle account active status
export const toggleAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const account = await CloudinaryAccount.findById(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cloudinary account not found'
      });
    }

    account.isActive = isActive;
    account.updatedBy = req.admin._id;
    
    if (isActive) {
      // Reset health status when activating
      account.healthStatus = 'healthy';
      account.errorCount = 0;
    }

    await account.save();

    res.status(200).json({
      success: true,
      message: `Account ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: account
    });

  } catch (error) {
    console.error('Toggle account status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update account status',
      error: error.message
    });
  }
};

// Perform health check on account
export const performHealthCheck = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await CloudinaryAccount.findById(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cloudinary account not found'
      });
    }

    const healthResult = await account.performHealthCheck();

    res.status(200).json({
      success: true,
      message: 'Health check completed',
      data: {
        account: account,
        healthCheck: healthResult
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};

// Perform health check on all accounts
export const performAllHealthChecks = async (req, res) => {
  try {
    const healthResults = await cloudinaryService.performHealthCheck();

    res.status(200).json({
      success: true,
      message: 'Health checks completed',
      data: healthResults
    });

  } catch (error) {
    console.error('All health checks error:', error);
    res.status(500).json({
      success: false,
      message: 'Health checks failed',
      error: error.message
    });
  }
};

// Get usage statistics
export const getUsageStats = async (req, res) => {
  try {
    const stats = await cloudinaryService.getUsageStats();

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage statistics',
      error: error.message
    });
  }
};

// Reset error count for account
export const resetErrorCount = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await CloudinaryAccount.findById(id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Cloudinary account not found'
      });
    }

    await account.resetErrorCount();

    res.status(200).json({
      success: true,
      message: 'Error count reset successfully',
      data: account
    });

  } catch (error) {
    console.error('Reset error count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset error count',
      error: error.message
    });
  }
};
