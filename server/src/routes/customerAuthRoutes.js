import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  syncCart,
  getCart,
  updateCart,
  clearCartDb,
  syncWishlist,
  getWishlist,
  updateWishlist,
  clearWishlistDb
} from '../controller/customerAuthController.js';
import {
  protect,
  authRateLimit,
  registerRateLimit
} from '../middleware/customerAuthMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/refresh', refreshToken);

// Protected routes (require authentication)
router.use(protect); // All routes after this middleware are protected

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/password', changePassword);

// Address management routes
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

// Cart sync routes
router.get('/cart', getCart);
router.put('/cart', updateCart);
router.post('/sync/cart', syncCart);
router.delete('/cart', clearCartDb);

// Wishlist sync routes
router.get('/wishlist', getWishlist);
router.put('/wishlist', updateWishlist);
router.post('/sync/wishlist', syncWishlist);
router.delete('/wishlist', clearWishlistDb);

export default router;
