import express from 'express';
import {
  getCollectionRecords,
  createCollectionRecord,
  getRoutes,
  createRoute
} from '../controllers/collection.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCollectionRecords)
  .post(authorize('collector'), createCollectionRecord);

router.route('/routes')
  .get(getRoutes)
  .post(authorize('authority', 'operator', 'admin'), createRoute);

export default router;
