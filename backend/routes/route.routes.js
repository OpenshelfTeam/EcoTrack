import express from 'express';
import {
  getRoutes,
  getRoute,
  createRoute,
  updateRoute,
  deleteRoute,
  updateRouteStatus,
  startRoute,
  completeRoute,
  optimizeRoute,
  getRouteStats
} from '../controllers/route.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Stats route (before /:id to avoid conflict)
router.get('/stats', getRouteStats);

// Get all routes and create new route
router.route('/')
  .get(getRoutes)
  .post(authorize('operator', 'authority', 'admin'), createRoute);

// Optimize route
router.post('/:id/optimize', authorize('operator', 'authority', 'admin'), optimizeRoute);

// Route status updates
router.patch('/:id/status', updateRouteStatus);
router.patch('/:id/start', authorize('collector'), startRoute);
router.patch('/:id/complete', authorize('collector'), completeRoute);

// Single route operations
router.route('/:id')
  .get(getRoute)
  .put(authorize('operator', 'authority', 'admin'), updateRoute)
  .delete(authorize('authority', 'admin'), deleteRoute);

export default router;
