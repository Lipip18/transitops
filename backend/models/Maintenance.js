const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    maintenanceType: {
      type: String,
      enum: [
        "Preventive",
        "Corrective",
        "Engine Repair",
        "Oil Change",
        "Brake Service",
        "Tyre Replacement",
        "Battery Replacement",
        "General Service",
        "Insurance",
        "Other",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    serviceCenter: {
      type: String,
      default: "",
      trim: true,
    },

    technician: {
      type: String,
      default: "",
      trim: true,
    },

    invoiceNumber: {
      type: String,
      default: "",
    },

    partsCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    laborCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    cost: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    odometerReading: {
      type: Number,
      default: 0,
      min: 0,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    status: {
      type: String,
      enum: [
        "Scheduled",
        "Active",
        "Completed",
        "Cancelled",
      ],
      default: "Scheduled",
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    completedDate: {
      type: Date,
    },

    nextServiceDate: {
      type: Date,
    },

    nextServiceOdometer: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      default: "",
    },

    attachments: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Maintenance",
  maintenanceSchema
);