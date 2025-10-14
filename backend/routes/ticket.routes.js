import express from 'express';
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket
} from '../controllers/ticket.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTickets)
  .post(createTicket);

router.route('/:id')
  .get(getTicket)
  .put(authorize('authority', 'operator', 'admin'), updateTicket);

export default router;
