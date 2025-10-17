import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "pickup-scheduled",
        "pickup-reminder",
        "pickup-completed",
        "bin-delivered",
        "bin-activated",
        "payment-due",
        "payment-received",
        "payment-failed",
        "ticket-created",
        "ticket-assigned",
        "ticket-update",
        "ticket-resolved",
        "system-alert",
        "general",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    channel: {
      type: [String],
      enum: ["in-app", "email", "sms", "push"],
      default: ["in-app"],
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "read", "failed"],
      default: "pending",
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["route", "bin", "payment", "ticket", "collection", "user"],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    metadata: {
      actionUrl: String,
      actionLabel: String,
      expiresAt: Date,
    },
    readAt: Date,
    sentAt: Date,
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
