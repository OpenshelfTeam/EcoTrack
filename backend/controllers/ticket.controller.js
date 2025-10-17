import Ticket from "../models/Ticket.model.js";
import User from "../models/User.model.js";

// @desc    Get all tickets with advanced filtering
// @route   GET /api/tickets
// @access  Private
export const getTickets = async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      reporter,
      assignedTo,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "-createdAt",
    } = req.query;

    // Build filter query
    const filter = {};

    // If user is a resident, only show their tickets
    if (req.user.role === "resident") {
      filter.reporter = req.user._id;
    }

    if (status) {
      if (status.includes(",")) {
        filter.status = { $in: status.split(",") };
      } else {
        filter.status = status;
      }
    }

    if (category) {
      if (category.includes(",")) {
        filter.category = { $in: category.split(",") };
      } else {
        filter.category = category;
      }
    }

    if (priority) {
      if (priority.includes(",")) {
        filter.priority = { $in: priority.split(",") };
      } else {
        filter.priority = priority;
      }
    }

    if (reporter) {
      filter.reporter = reporter;
    }

    if (assignedTo) {
      if (assignedTo === "unassigned") {
        filter.assignedTo = null;
      } else {
        filter.assignedTo = assignedTo;
      }
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { ticketNumber: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .populate("reporter", "firstName lastName email phone")
        .populate("assignedTo", "firstName lastName email")
        .populate("relatedBin", "binId location")
        .sort(sortBy)
        .skip(skip)
        .limit(parseInt(limit)),
      Ticket.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: tickets.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
export const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("reporter", "firstName lastName email phone address")
      .populate("assignedTo", "firstName lastName email")
      .populate("relatedBin")
      .populate("comments.user", "firstName lastName")
      .populate("statusHistory.changedBy", "firstName lastName")
      .populate("resolution.resolvedBy", "firstName lastName");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check authorization for residents
    if (
      req.user.role === "resident" &&
      ticket.reporter._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this ticket",
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create ticket
// @route   POST /api/tickets
// @access  Private
export const createTicket = async (req, res) => {
  try {
    const ticketData = {
      ...req.body,
      reporter: req.user._id,
      statusHistory: [
        {
          status: "open",
          changedBy: req.user._id,
          changedAt: new Date(),
        },
      ],
    };

    const ticket = await Ticket.create(ticketData);
    await ticket.populate("reporter", "firstName lastName email phone");

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private (Ticket owner, Authority, Operator, Admin)
export const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Check authorization: residents can only edit their own tickets
    if (
      req.user.role === "resident" &&
      ticket.reporter.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this ticket",
      });
    }

    // Update the ticket
    Object.assign(ticket, req.body);

    // Add to status history when ticket is edited
    if (
      req.body.title ||
      req.body.description ||
      req.body.category ||
      req.body.priority
    ) {
      ticket.statusHistory.push({
        status: ticket.status,
        changedBy: req.user._id,
        changedAt: new Date(),
        notes: "Ticket details updated",
      });
    }

    await ticket.save();
    await ticket.populate("reporter assignedTo relatedBin");

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update ticket status
// @route   PATCH /api/tickets/:id/status
// @access  Private (Assigned user, Operator, Admin)
export const updateTicketStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.status = status;

    // Add to status history
    ticket.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      notes,
    });

    // Set closed date if status is closed
    if (status === "closed") {
      ticket.closedAt = new Date();
    }

    await ticket.save();
    await ticket.populate("reporter assignedTo");

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Assign ticket to user
// @route   PATCH /api/tickets/:id/assign
// @access  Private (Operator, Admin)
export const assignTicket = async (req, res) => {
  try {
    const { userId, dueDate } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    ticket.assignedTo = userId;
    ticket.status = "in-progress";
    if (dueDate) ticket.dueDate = dueDate;

    ticket.statusHistory.push({
      status: "in-progress",
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: `Assigned to ${user.firstName} ${user.lastName}`,
    });

    await ticket.save();
    await ticket.populate("reporter assignedTo");

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add comment to ticket
// @route   POST /api/tickets/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { message } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    // Residents can only delete their own tickets
    }

    // Check if user has access to this ticket
    if (
      req.user.role === "resident" &&
      ticket.reporter.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to comment on this ticket",
      });
    }

    ticket.comments.push({
      user: req.user._id,
      message,
      createdAt: new Date(),
    });

    await ticket.save();
    await ticket.populate("comments.user", "firstName lastName");

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Resolve ticket
// @route   PATCH /api/tickets/:id/resolve
// @access  Private (Assigned user, Operator, Admin)
export const resolveTicket = async (req, res) => {
  try {
    const { resolution, actionTaken } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    ticket.status = "resolved";
    ticket.resolution = {
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      resolution,
      actionTaken,
    };

    ticket.statusHistory.push({
      status: "resolved",
      changedBy: req.user._id,
      changedAt: new Date(),
      notes: resolution,
    });

    await ticket.save();
    await ticket.populate("reporter assignedTo resolution.resolvedBy");

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get ticket statistics
// @route   GET /api/tickets/stats
// @access  Private (Operator, Admin, Authority)
export const getTicketStats = async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      {
        $facet: {
          statusCounts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          categoryCounts: [
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
              },
            },
          ],
          priorityCounts: [
            {
              $group: {
                _id: "$priority",
                count: { $sum: 1 },
              },
            },
          ],
          total: [
            {
              $count: "count",
            },
          ],
          avgResolutionTime: [
            {
              $match: {
                status: "resolved",
                "resolution.resolvedAt": { $exists: true },
              },
            },
            {
              $project: {
                resolutionTime: {
                  $subtract: ["$resolution.resolvedAt", "$createdAt"],
                },
              },
            },
            {
              $group: {
                _id: null,
                avgTime: { $avg: "$resolutionTime" },
              },
            },
          ],
          unassigned: [
            {
              $match: {
                assignedTo: null,
                status: { $nin: ["closed", "cancelled"] },
              },
            },
            {
              $count: "count",
            },
          ],
          overdue: [
            {
              $match: {
                dueDate: { $lt: new Date() },
                status: { $nin: ["resolved", "closed", "cancelled"] },
              },
            },
            {
              $count: "count",
            },
          ],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private (Admin)
export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
