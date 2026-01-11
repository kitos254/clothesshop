import cloudinary from 'cloudinary';
import CloudinaryAccount from '../model/cloudinaryAccounts.js';

class CloudinaryService {
  constructor() {
    this.configuredAccounts = new Map();
  }

  /**
   * Configure cloudinary instance with account credentials
   * @param {Object} account - Cloudinary account object
   * @returns {Object} Configured cloudinary instance
   */
  configureAccount(account) {
    const accountKey = account._id.toString();
    
    if (!this.configuredAccounts.has(accountKey)) {
      const cloudinaryInstance = cloudinary.v2;
      cloudinaryInstance.config({
        cloud_name: account.cloudName,
        api_key: account.apiKey,
        api_secret: account.apiSecret,
        secure: true
      });
      
      this.configuredAccounts.set(accountKey, cloudinaryInstance);
    }
    
    return this.configuredAccounts.get(accountKey);
  }

  /**
   * Get optimal Cloudinary account for upload with load balancing
   * @returns {Promise<Object>} Optimal cloudinary account
   */
  async getOptimalAccount() {
    try {
      const account = await CloudinaryAccount.getOptimalAccount();
      return account;
    } catch (error) {
      throw new Error(`Failed to get optimal Cloudinary account: ${error.message}`);
    }
  }

  /**
   * Upload single image to Cloudinary with load balancing
   * @param {Buffer|string} file - File buffer or file path
   * @param {Object} options - Upload options
   * @param {string} options.folder - Cloudinary folder
   * @param {string} options.publicId - Custom public ID
   * @param {Array<string>} options.tags - Image tags
   * @param {Object} options.transformation - Image transformation options
   * @param {string} options.adminId - ID of admin uploading the image
   * @returns {Promise<Object>} Upload result with account info
   */
  async uploadImage(file, options = {}) {
    const {
      folder = 'products',
      publicId,
      tags = [],
      transformation = {},
      adminId
    } = options;

    if (!adminId) {
      throw new Error('Admin ID is required for image upload');
    }

    let account;
    let cloudinaryInstance;
    
    try {
      // Get optimal account for upload
      console.log('[CloudinaryService] Getting optimal account...');
      account = await this.getOptimalAccount();
      console.log('[CloudinaryService] Got account:', account?._id, account?.cloudName);
      
      if (!account) {
        throw new Error('No Cloudinary account returned from getOptimalAccount');
      }
      
      cloudinaryInstance = this.configureAccount(account);
      console.log('[CloudinaryService] Configured cloudinary instance');

      // Prepare upload options - don't use format/quality here, those are for delivery URLs
      const uploadOptions = {
        folder,
        tags: [...tags, `account_${account._id}`, `admin_${adminId}`],
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        resource_type: 'image',
        ...transformation
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      // Upload to Cloudinary
      console.log('[CloudinaryService] Starting upload, isBuffer:', Buffer.isBuffer(file));
      const result = await new Promise((resolve, reject) => {
        if (Buffer.isBuffer(file)) {
          // Upload from buffer
          cloudinaryInstance.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) {
                console.error('[CloudinaryService] Upload error:', error);
                reject(error);
              } else {
                console.log('[CloudinaryService] Upload success, public_id:', result?.public_id);
                resolve(result);
              }
            }
          ).end(file);
        } else {
          // Upload from file path
          cloudinaryInstance.uploader.upload(file, uploadOptions, (error, result) => {
            if (error) {
              console.error('[CloudinaryService] Upload error:', error);
              reject(error);
            } else {
              console.log('[CloudinaryService] Upload success, public_id:', result?.public_id);
              resolve(result);
            }
          });
        }
      });

      // Increment upload count for the account
      await account.incrementUploadCount(1);

      // Return result with account information
      return {
        ...result,
        cloudinaryAccount: account._id,
        uploadedBy: adminId,
        uploadedAt: new Date()
      };

    } catch (error) {
      // Record error if account was selected
      if (account) {
        await account.recordError({
          message: error.message,
          details: {
            operation: 'upload',
            folder,
            adminId,
            timestamp: new Date()
          }
        });
      }
      
      throw new Error(`Image upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple images with load balancing
   * @param {Array} files - Array of file buffers or paths
   * @param {Object} options - Upload options
   * @returns {Promise<Array>} Array of upload results
   */
  async uploadMultipleImages(files, options = {}) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('Files array is required and must not be empty');
    }

    const uploadPromises = files.map(async (file, index) => {
      try {
        const fileOptions = {
          ...options,
          publicId: options.publicId ? `${options.publicId}_${index + 1}` : undefined
        };
        
        return await this.uploadImage(file, fileOptions);
      } catch (error) {
        return {
          error: error.message,
          index,
          success: false
        };
      }
    });

    const results = await Promise.allSettled(uploadPromises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { ...result.value, index, success: true };
      } else {
        return {
          error: result.reason.message,
          index,
          success: false
        };
      }
    });
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Image public ID
   * @param {string} accountId - Cloudinary account ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteImage(publicId, accountId) {
    try {
      const account = await CloudinaryAccount.findById(accountId);
      if (!account) {
        throw new Error('Cloudinary account not found');
      }

      const cloudinaryInstance = this.configureAccount(account);
      
      const result = await new Promise((resolve, reject) => {
        cloudinaryInstance.uploader.destroy(publicId, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });

      return result;
    } catch (error) {
      throw new Error(`Image deletion failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple images
   * @param {Array<Object>} images - Array of image objects with publicId and accountId
   * @returns {Promise<Array>} Array of deletion results
   */
  async deleteMultipleImages(images) {
    if (!Array.isArray(images) || images.length === 0) {
      return [];
    }

    const deletePromises = images.map(async (image, index) => {
      try {
        const result = await this.deleteImage(image.publicId, image.cloudinaryAccount);
        return { ...result, index, success: true };
      } catch (error) {
        return {
          error: error.message,
          index,
          publicId: image.publicId,
          success: false
        };
      }
    });

    const results = await Promise.allSettled(deletePromises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          error: result.reason.message,
          index,
          success: false
        };
      }
    });
  }

  /**
   * Generate transformation URL for an image
   * @param {string} publicId - Image public ID
   * @param {Object} transformations - Transformation options
   * @returns {string} Transformed image URL
   */
  generateTransformationUrl(publicId, transformations = {}) {
    // Use default transformation options if none provided
    const defaultTransforms = {
      quality: 'auto',
      fetch_format: 'auto',
      ...transformations
    };

    return cloudinary.v2.url(publicId, defaultTransforms);
  }

  /**
   * Get image details from Cloudinary
   * @param {string} publicId - Image public ID
   * @param {string} accountId - Cloudinary account ID
   * @returns {Promise<Object>} Image details
   */
  async getImageDetails(publicId, accountId) {
    try {
      const account = await CloudinaryAccount.findById(accountId);
      if (!account) {
        throw new Error('Cloudinary account not found');
      }

      const cloudinaryInstance = this.configureAccount(account);
      
      const result = await new Promise((resolve, reject) => {
        cloudinaryInstance.api.resource(publicId, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });

      return result;
    } catch (error) {
      throw new Error(`Failed to get image details: ${error.message}`);
    }
  }

  /**
   * Health check for all active Cloudinary accounts
   * @returns {Promise<Array>} Health check results
   */
  async performHealthCheck() {
    try {
      const accounts = await CloudinaryAccount.find({ isActive: true });
      
      const healthPromises = accounts.map(async (account) => {
        try {
          const result = await account.performHealthCheck();
          return {
            accountId: account._id,
            accountName: account.name,
            ...result
          };
        } catch (error) {
          return {
            accountId: account._id,
            accountName: account.name,
            status: 'error',
            message: error.message
          };
        }
      });

      return await Promise.all(healthPromises);
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  /**
   * Get usage statistics for all accounts
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats() {
    try {
      const accounts = await CloudinaryAccount.find({ isActive: true });
      const globalStats = await CloudinaryAccount.getAccountStats();

      const accountDetails = accounts.map(account => ({
        id: account._id,
        name: account.name,
        uploadCount: account.uploadCount,
        dailyUsage: account.dailyUsagePercentage,
        monthlyUsage: account.monthlyUsagePercentage,
        healthStatus: account.healthStatus,
        isAvailable: account.isAvailable,
        lastUsed: account.lastUsed
      }));

      return {
        global: globalStats,
        accounts: accountDetails
      };
    } catch (error) {
      throw new Error(`Failed to get usage statistics: ${error.message}`);
    }
  }
}

// Export singleton instance
const cloudinaryService = new CloudinaryService();
export default cloudinaryService;
