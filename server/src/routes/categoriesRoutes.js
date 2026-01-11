import express from 'express';
import { body, query, param } from 'express-validator';
import {
  getCategories,
  getCategoryTree,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  bulkUpdateCategories,
  updateDisplayOrder,
  getCategoryStats,
  updateProductCounts,
  getMainCategories,
  getSubCategories,
  getChildCategories,
  getCategoryHierarchy
} from '../controller/categoriesController.js';
import { protect, hasRole } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// Validation schemas for simplified category form
const categoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be between 1 and 100 characters'),
  body('parent')
    .optional()
    .custom((value) => {
      if (value === '' || value === null) return true; // Allow empty string or null
      if (!/^[0-9a-fA-F]{24}$/.test(value)) {
        throw new Error('Parent must be a valid MongoDB ObjectId');
      }
      return true;
    }),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('displayOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a non-negative integer')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('level')
    .optional()
    .isInt({ min: 0, max: 2 })
    .withMessage('Level must be between 0 and 2'),
  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt', 'displayOrder', 'level'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

const paramValidation = [
  param('identifier')
    .custom((value) => {
      // Allow both ObjectId and slug
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(value);
      const isSlug = /^[a-z0-9-]+$/.test(value);
      if (!isObjectId && !isSlug) {
        throw new Error('Invalid category identifier');
      }
      return true;
    })
];

// Public routes (no authentication required)
router.get(
  '/public',
  queryValidation,
  getCategories
);

router.get(
  '/public/tree',
  query('maxDepth')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('Max depth must be between 1 and 3'),
  getCategoryTree
);

router.get(
  '/public/:identifier',
  paramValidation,
  getCategory
);

// Protected routes (require authentication)
router.use(protect);

// GET routes
router.get(
  '/',
  hasRole(['super_admin', 'admin', 'manager', 'viewer']),
  queryValidation,
  getCategories
);

router.get(
  '/tree',
  hasRole(['super_admin', 'admin', 'manager', 'viewer']),
  query('maxDepth')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('Max depth must be between 1 and 3'),
  getCategoryTree
);

router.get(
  '/stats',
  hasRole(['super_admin', 'admin', 'manager', 'viewer']),
  getCategoryStats
);

// Hierarchical category routes for product forms (must come before /:identifier)
router.get('/main', protect, getMainCategories);
router.get('/sub/:parentId', protect, 
  param('parentId').isMongoId().withMessage('Invalid parent category ID'),
  getSubCategories
);
router.get('/child/:parentId', protect,
  param('parentId').isMongoId().withMessage('Invalid parent category ID'),
  getChildCategories
);
router.get('/hierarchy/:categoryId', protect,
  param('categoryId').isMongoId().withMessage('Invalid category ID'),
  getCategoryHierarchy
);

router.get(
  '/:identifier',
  hasRole(['super_admin', 'admin', 'manager', 'viewer']),
  paramValidation,
  getCategory
);

// POST routes
router.post(
  '/',
  hasRole(['super_admin', 'admin', 'manager']),
  categoryValidation,
  createCategory
);

// PUT routes
router.put(
  '/:id',
  hasRole(['super_admin', 'admin', 'manager']),
  param('id').isMongoId().withMessage('Invalid category ID'),
  categoryValidation,
  updateCategory
);

router.put(
  '/bulk/update',
  hasRole(['super_admin', 'admin', 'manager']),
  body('ids')
    .isArray({ min: 1 })
    .withMessage('Category IDs array is required'),
  body('ids.*')
    .isMongoId()
    .withMessage('Each ID must be a valid MongoDB ObjectId'),
  body('updates')
    .isObject()
    .withMessage('Updates object is required'),
  bulkUpdateCategories
);

router.put(
  '/reorder/display-order',
  hasRole(['super_admin', 'admin', 'manager']),
  body('orderedIds')
    .isArray({ min: 1 })
    .withMessage('Ordered IDs array is required'),
  body('orderedIds.*')
    .isMongoId()
    .withMessage('Each ID must be a valid MongoDB ObjectId'),
  updateDisplayOrder
);

router.put(
  '/maintenance/update-counts',
  hasRole(['super_admin', 'admin']),
  updateProductCounts
);

// DELETE routes
router.delete(
  '/:id',
  hasRole(['super_admin', 'admin']),
  param('id').isMongoId().withMessage('Invalid category ID'),
  deleteCategory
);

export default router;
