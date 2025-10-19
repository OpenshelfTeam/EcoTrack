import express from 'express';
import { 
  createBinRequest, 
  approveAndAssignRequest, 
  getRequests, 
  cancelBinRequest, 
  confirmBinReceipt 
} from '../controllers/binRequest.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('resident'), createBinRequest);
router.get('/', authorize('operator', 'admin', 'resident'), getRequests);
router.post('/:requestId/approve', authorize('operator', 'admin'), approveAndAssignRequest);
router.post('/:requestId/cancel', authorize('resident'), cancelBinRequest);
router.post('/:requestId/confirm-receipt', authorize('resident'), confirmBinReceipt);

export default router;
