const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    vehicleName: {
      type: String,
      required: [true, "Vehicle name is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "Truck",
        "Bus",
        "Van",
        "Mini Truck",
        "Pickup",
        "Car",
      ],
      required: true,
    },

    model: {
      type: String,
      default: "",
      trim: true,
    },

    manufacturer: {
      type: String,
      default: "",
      trim: true,
    },

    year: {
      type: Number,
      default: new Date().getFullYear(),
    },

    maximumLoadCapacity: {
      type: Number,
      required: true,
      min: 0,
    },

    odometer: {
      type: Number,
      default: 0,
      min: 0,
    },

    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Electric", "CNG"],
      default: "Diesel",
    },

    fuelTankCapacity: {
      type: Number,
      default: 0,
    },

    averageMileage: {
      type: Number,
      default: 0,
    },

    acquisitionCost: {
      type: Number,
      required: true,
      min: 0,
    },

    currentValue: {
      type: Number,
      default: 0,
    },

    insuranceNumber: {
      type: String,
      default: "",
    },

    insuranceExpiry: {
      type: Date,
    },

    pollutionExpiry: {
      type: Date,
    },

    lastServiceDate: {
      type: Date,
    },

    nextServiceDate: {
      type: Date,
    },

    currentLocation: {
      type: String,
      default: "",
      trim: true,
    },

    gpsEnabled: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: [
        "Available",
        "On Trip",
        "In Shop",
        "Retired",
      ],
      default: "Available",
    },

    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ status: 1 });
vehicleSchema.index({ type: 1, status: 1 });
vehicleSchema.index({ currentLocation: 1, status: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);