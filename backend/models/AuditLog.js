const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    action: {
      type: String,
      required: true,
    },

    module: {
      type: String,
      required: true,
    },

    entity: {
      type: String,
      default: "",
    },

    entityId: {
      type: String,
      default: "",
    },

    details: {
      type: String,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

auditSchema.index({ createdAt: -1 });
auditSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model(
  "AuditLog",
  auditSchema
);