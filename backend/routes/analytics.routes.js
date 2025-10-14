import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import CollectionRecord from '../models/CollectionRecord.model.js';
import Payment from '../models/Payment.model.js';
import Ticket from '../models/Ticket.model.js';
import SmartBin from '../models/SmartBin.model.js';

const router = express.Router();

router.use(protect);
router.use(authorize('authority', 'operator', 'admin'));

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Authority, Operator, Admin)
router.get('/dashboard', async (req, res) => {
  try {
    const totalBins = await SmartBin.countDocuments();
    const activeBins = await SmartBin.countDocuments({ status: 'active' });
    const totalCollections = await CollectionRecord.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: { $in: ['open', 'in-progress'] } });
    const totalPayments = await Payment.countDocuments({ status: 'completed' });

    res.status(200).json({
      success: true,
      data: {
        totalBins,
        activeBins,
        totalCollections,
        openTickets,
        totalPayments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
