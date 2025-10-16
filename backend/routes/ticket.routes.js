import express from "express";
import {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  updateTicketStatus,
  assignTicket,
  addComment,
  resolveTicket,
  getTicketStats,
  deleteTicket,
} from "../controllers/ticket.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Stats route (before /:id)
router.get(
  "/stats",
  authorize("operator", "admin", "authority"),
  getTicketStats
);

// Main CRUD routes
router.route("/").get(getTickets).post(createTicket);

router
  .route("/:id")
  .get(getTicket)
  .put(authorize("authority", "operator", "admin"), updateTicket)
  .delete(authorize("admin"), deleteTicket);

// Action routes
router.patch(
  "/:id/status",
  authorize("operator", "admin", "authority"),
  updateTicketStatus
);
router.patch(
  "/:id/assign",
  authorize("operator", "admin", "authority"),
  assignTicket
);
router.post("/:id/comments", addComment);
router.patch(
  "/:id/resolve",
  authorize("operator", "admin", "authority"),
  resolveTicket
);

export default router;
