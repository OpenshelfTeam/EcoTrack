import express from 'express';
import {
  getSmartBins,
  getSmartBin,
  createSmartBin,
  updateSmartBin,
  deleteSmartBin,
  assignBin
} from '../controllers/smartBin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSmartBins)
  .post(authorize('operator', 'admin'), createSmartBin);

router.route('/:id')
  .get(getSmartBin)
  .put(authorize('operator', 'collector', 'admin'), updateSmartBin)
  .delete(authorize('admin'), deleteSmartBin);

router.post('/:id/assign', authorize('operator', 'admin'), assignBin);

export default router;
