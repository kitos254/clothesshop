import multer from 'multer';
import path from 'path';

// Memory storage for processing files before uploading to Cloudinary
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed image formats
  const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedFormats.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`), false);
  }
};

// Multer configuration for product images
const uploadProductImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Multer configuration for single product image
const uploadSingleProductImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File size too large. Maximum size is 10MB.',
          error: 'FILE_SIZE_LIMIT'
        });
      
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 10 files allowed.',
          error: 'FILE_COUNT_LIMIT'
        });
      
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
          error: 'UNEXPECTED_FILE'
        });
      
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error.',
          error: error.code
        });
    }
  }
  
  if (error.message.includes('Invalid file format')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FORMAT'
    });
  }
  
  return res.status(500).json({
    success: false,
    message: 'Internal server error during file upload.',
    error: 'UPLOAD_ERROR'
  });
};

// Middleware to validate file presence
const validateFiles = (required = false) => {
  return (req, res, next) => {
    if (required && (!req.files || req.files.length === 0) && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'At least one image file is required.',
        error: 'NO_FILES'
      });
    }
    next();
  };
};

// Middleware to validate file types and sizes before processing
const validateImageFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  
  if (files.length === 0) {
    return next();
  }
  
  const errors = [];
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  files.forEach((file, index) => {
    // Check file type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`File ${index + 1}: Invalid format. Allowed: JPEG, PNG, WebP, GIF`);
    }
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File ${index + 1}: Size exceeds 10MB limit`);
    }
    
    // Check if buffer exists
    if (!file.buffer) {
      errors.push(`File ${index + 1}: File data is missing`);
    }
  });
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'File validation failed',
      errors,
      error: 'VALIDATION_ERROR'
    });
  }
  
  next();
};

// Middleware for handling product image uploads (multiple files)
export const uploadProductImagesMiddleware = [
  uploadProductImages.array('images', 10),
  handleMulterError,
  validateImageFiles
];

// Middleware for handling single product image upload
export const uploadSingleProductImageMiddleware = [
  uploadSingleProductImage.single('image'),
  handleMulterError,
  validateImageFiles
];

// Middleware for handling product image updates (optional files)
export const uploadProductImagesOptionalMiddleware = [
  uploadProductImages.array('images', 10),
  handleMulterError,
  validateImageFiles
];

// Export additional utilities
export {
  validateFiles,
  validateImageFiles,
  handleMulterError
};
