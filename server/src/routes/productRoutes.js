import express from 'express';
import {
  getAllProducts,
  getProduct,
  getSimilarProducts,
  getRelatedProducts,
  getPopularProducts,
  createProduct,
  createDraftProduct,
  updateProduct,
  addProductImages,
  removeProductImages,
  toggleProductStatus,
  deleteProduct,
  bulkUpdateProducts,
  getProductStats,
  addProductVariation,
  updateProductVariation,
  removeProductVariation,
  updateVariationCombinationPricing,
  getProductVariationCombinations,
  regenerateVariationCombinations
} from '../controller/productController.js';
import {
  uploadProductImagesMiddleware,
  uploadProductImagesOptionalMiddleware,
  validateFiles
} from '../middleware/uploadMiddleware.js';
import { protect } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/public', getAllProducts); // Get all products (public view)
router.get('/public/popular', getPopularProducts); // Get popular products by views (public)
router.get('/public/:id', getProduct); // Get single product (public view)
router.get('/:id/similar', getSimilarProducts); // Get similar products (public)
router.get('/:id/related', getRelatedProducts); // Get related products (public) - prioritizes deepest category level

// Protected routes (require authentication)
router.use(protect); // Apply authentication to all routes below

// Product CRUD operations
router.get('/', getAllProducts); // Get all products (admin view)
router.get('/stats', getProductStats); // Get product statistics
router.post('/draft', createDraftProduct); // Create draft product
router.post('/', 
  uploadProductImagesMiddleware,
  validateFiles(false), // Images not required for draft products
  createProduct
); // Create new product
router.get('/:id', getProduct); // Get single product
router.put('/:id', 
  uploadProductImagesOptionalMiddleware,
  updateProduct
); // Update product

// Image management
router.post('/:id/images',
  uploadProductImagesMiddleware,
  validateFiles(true), // Images required
  addProductImages
); // Add new images to existing product
router.delete('/:id/images', removeProductImages); // Remove specific images

// Variation management
router.post('/:id/variations', addProductVariation); // Add variation definition
router.put('/:id/variations/:variationId', updateProductVariation); // Update variation definition
router.delete('/:id/variations/:variationId', removeProductVariation); // Remove variation definition
router.get('/:id/variations/combinations', getProductVariationCombinations); // Get all combinations
router.put('/:id/variations/combinations/pricing', updateVariationCombinationPricing); // Update combination pricing
router.post('/:id/variations/combinations/regenerate', regenerateVariationCombinations); // Regenerate combinations

// Product status management
router.patch('/:id/status', toggleProductStatus); // Suspend/activate/discontinue product

// Bulk operations
router.patch('/bulk/update', bulkUpdateProducts); // Bulk update products

// Delete product (should be last to avoid conflicts)
router.delete('/:id', deleteProduct); // Delete product permanently

export default router;
