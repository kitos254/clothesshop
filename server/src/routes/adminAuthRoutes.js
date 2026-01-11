import express from 'express';
import {
  login,
  logout,
  refreshToken,
  getMe,
  validateToken,
  logoutAll
} from '../controller/adminAuthController.js';
import {
  protect,
  validateRefreshToken,
  authRateLimit
} from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', authRateLimit, login);

// Protected routes (require authentication)
router.use(protect); // All routes after this middleware are protected

router.post('/logout', logout);
router.post('/logout-all', logoutAll);
router.get('/me', getMe);
router.post('/validate', validateToken);

// Separate router for refresh token (uses different middleware)
export const refreshRouter = express.Router();
refreshRouter.post('/refresh', validateRefreshToken, refreshToken);

export default router;
