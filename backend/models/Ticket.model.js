import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: false, // Auto-generated, so not required on creation
      unique: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "collection",
        "bin",
        "payment",
        "technical",
        "complaint",
        "other",
        // Legacy values for backward compatibility
        "damaged-bin",
        "missed-pickup",
        "payment-issue",
        "bin-not-delivered",
        "collection-complaint",
        "technical-issue",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed", "cancelled"],
      default: "open",
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    relatedBin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SmartBin",
      default: null,
    },
    relatedCollection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollectionRecord",
      default: null,
    },
    location: {
      address: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    attachments: [
      {
        url: String,
        type: String,
        uploadedAt: Date,
      },
    ],
    statusHistory: [
      {
        status: String,
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        notes: String,
      },
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolution: {
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      resolvedAt: Date,
      resolution: String,
      actionTaken: String,
    },
    dueDate: Date,
    closedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Auto-generate ticket number
ticketSchema.pre("save", async function (next) {
  if (this.isNew && !this.ticketNumber) {
    try {
      // Find the ticket with the highest number
      const lastTicket = await mongoose
        .model("Ticket")
        .findOne()
        .sort({ ticketNumber: -1 })
        .select("ticketNumber")
        .lean();

      let nextNumber = 1;

      if (lastTicket && lastTicket.ticketNumber) {
        // Extract the number from the last ticket (e.g., "TKT000004" -> 4)
        const lastNumber = parseInt(lastTicket.ticketNumber.replace("TKT", ""));
        nextNumber = lastNumber + 1;
      }

      // Generate new ticket number with padding
      this.ticketNumber = `TKT${String(nextNumber).padStart(6, "0")}`;
    } catch (error) {
      console.error("Error generating ticket number:", error);
      // Fallback to timestamp-based unique ID if there's an error
      this.ticketNumber = `TKT${Date.now()}`;
    }
  }
  next();
});

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
