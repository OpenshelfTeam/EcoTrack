import express from 'express';
import {
  getSmartBins,
  getSmartBin,
  createSmartBin,
  updateSmartBin,
  deleteSmartBin,
  assignBin,
  activateBin,
  updateBinLevel,
  addMaintenance,
  emptyBin,
  getBinStats,
  getNearbyBins,
  getBinsNeedingCollection
} from '../controllers/smartBin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Stats and special routes (before /:id)
router.get('/stats', getBinStats);
router.get('/nearby', getNearbyBins);
router.get('/needs-collection', authorize('collector', 'operator', 'admin'), getBinsNeedingCollection);

// Main CRUD routes
router.route('/')
  .get(getSmartBins)
  .post(authorize('operator', 'admin'), createSmartBin);

router.route('/:id')
  .get(getSmartBin)
  .put(authorize('operator', 'collector', 'admin'), updateSmartBin)
  .delete(authorize('admin'), deleteSmartBin);

// Action routes
router.post('/:id/assign', authorize('operator', 'admin'), assignBin);
router.patch('/:id/activate', authorize('operator', 'collector', 'admin'), activateBin);
router.patch('/:id/level', updateBinLevel);
router.post('/:id/maintenance', authorize('collector', 'operator', 'admin'), addMaintenance);
router.patch('/:id/empty', authorize('collector'), emptyBin);

export default router;
