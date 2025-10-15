import express from 'express';
import {
  getCollectionRecords,
  getCollectionRecord,
  createCollectionRecord,
  updateCollectionRecord,
  deleteCollectionRecord,
  getCollectionStats,
  getCollectionSchedule,
  getRoutes,
  createRoute
} from '../controllers/collection.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

// Stats and schedule routes (before /:id)
router.get('/stats', getCollectionStats);
router.get('/schedule', getCollectionSchedule);

// Routes management
router.route('/routes')
  .get(getRoutes)
  .post(authorize('authority', 'operator', 'admin'), createRoute);

// Collection records
router.route('/')
  .get(getCollectionRecords)
  .post(authorize('collector'), createCollectionRecord);

router.route('/:id')
  .get(getCollectionRecord)
  .put(authorize('collector', 'operator', 'authority', 'admin'), updateCollectionRecord)
  .delete(authorize('authority', 'admin'), deleteCollectionRecord);

export default router;
