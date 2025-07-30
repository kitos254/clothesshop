import express from 'express';
import { getAllProducts, getProductById, getSimilarProducts } from '../controller/productController.js';

const router = express.Router();

// GET /api/products/:id/similar - fetch similar products for 'You might also like'
router.get('/:id/similar', getSimilarProducts);

// GET /api/products/all - fetch all products
router.get('/all', getAllProducts);

// GET /api/products/:id - fetch single product by id
router.get('/:id', getProductById);

export default router;
