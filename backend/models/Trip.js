const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: [true, "Source is required"],
      trim: true,
    },

    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    cargoWeight: {
      type: Number,
      required: true,
      min: 0,
    },

    cargoType: {
      type: String,
      default: "",
    },

    plannedDistance: {
      type: Number,
      required: true,
      min: 0,
    },

    actualDistance: {
      type: Number,
      default: 0,
      min: 0,
    },

    estimatedDuration: {
      type: Number,
      default: 0,
    },

    actualDuration: {
      type: Number,
      default: 0,
    },

    departureTime: {
      type: Date,
    },

    arrivalTime: {
      type: Date,
    },

    completedAt: {
      type: Date,
    },

    fuelConsumed: {
      type: Number,
      default: 0,
      min: 0,
    },

    fuelCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    tollCharges: {
      type: Number,
      default: 0,
    },

    otherExpenses: {
      type: Number,
      default: 0,
    },

    revenue: {
      type: Number,
      default: 0,
    },

    delayReason: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
    },

    gpsRoute: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "Draft",
        "Dispatched",
        "Completed",
        "Cancelled",
      ],
      default: "Draft",
    },
  },
  {
    timestamps: true,
  }
);

tripSchema.index({ status: 1 });
tripSchema.index({ vehicle: 1, status: 1 });
tripSchema.index({ driver: 1, status: 1 });

module.exports = mongoose.model("Trip", tripSchema);