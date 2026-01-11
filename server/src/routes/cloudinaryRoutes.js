import express from 'express';
import {
  getAllAccounts,
  getAccount,
  getExistingDraft,
  createAccount,
  updateAccount,
  deleteAccount,
  toggleAccountStatus,
  performHealthCheck,
  performAllHealthChecks,
  getUsageStats,
  resetErrorCount
} from '../controller/cloudinaryController.js';
import { protect } from '../middleware/adminAuthMiddleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Account management
router.get('/', getAllAccounts); // Get all accounts
router.get('/draft', getExistingDraft); // Get existing draft
router.get('/stats', getUsageStats); // Get usage statistics
router.post('/health-check', performAllHealthChecks); // Health check all accounts
router.post('/', createAccount); // Create new account
router.get('/:id', getAccount); // Get single account
router.put('/:id', updateAccount); // Update account
router.patch('/:id/status', toggleAccountStatus); // Toggle active status
router.post('/:id/health-check', performHealthCheck); // Health check single account
router.post('/:id/reset-errors', resetErrorCount); // Reset error count
router.delete('/:id', deleteAccount); // Delete account

export default router;
