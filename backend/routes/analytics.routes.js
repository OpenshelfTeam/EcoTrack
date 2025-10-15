import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import {
  getDashboardStats,
  getWasteStatistics,
  getEfficiencyMetrics,
  getFinancialAnalytics,
  getAreaStatistics,
  getEngagementStatistics,
  exportAnalytics
} from '../controllers/analytics.controller.js';

const router = express.Router();

router.use(protect);

// Dashboard and overview
router.get('/dashboard', authorize('operator', 'authority', 'admin'), getDashboardStats);

// Waste analytics
router.get('/waste', getWasteStatistics);

// Efficiency metrics
router.get('/efficiency', authorize('operator', 'authority', 'admin'), getEfficiencyMetrics);

// Financial analytics
router.get('/financial', authorize('authority', 'admin'), getFinancialAnalytics);

// Area statistics
router.get('/areas', getAreaStatistics);

// User engagement
router.get('/engagement', authorize('operator', 'authority', 'admin'), getEngagementStatistics);

// Export data
router.get('/export', authorize('authority', 'admin'), exportAnalytics);

export default router;
