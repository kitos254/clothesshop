import express from 'express';
import {
  getMyOrders,
  getOrderById,
  createOrder,
  cancelOrder,
  getOrderStats
} from '../controller/orderController.js';
import { protect } from '../middleware/customerAuthMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/my-orders', getMyOrders);
router.get('/stats', getOrderStats);
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

export default router;
