const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "trip",
        "maintenance",
        "fuel",
        "vehicle",
        "driver",
      ],
      default: "trip",
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    roles: {
      type: [String],
      default: undefined,
    },

    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ roles: 1, createdAt: -1 });
notificationSchema.index({ recipientUser: 1, createdAt: -1 });

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);