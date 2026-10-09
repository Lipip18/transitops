const mongoose = require("mongoose");

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      default: null,
    },

    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "CNG", "Electric"],
      default: "Diesel",
    },

    fuelStation: {
      type: String,
      default: "",
      trim: true,
    },

    odometerReading: {
      type: Number,
      required: true,
      min: 0,
    },

    liters: {
      type: Number,
      required: true,
      min: 0.01,
    },

    pricePerLiter: {
      type: Number,
      required: true,
      min: 0.01,
    },

    cost: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "Card",
        "UPI",
        "Company Account",
      ],
      default: "Cash",
    },

    receiptNumber: {
      type: String,
      default: "",
    },

    filledBy: {
      type: String,
      default: "",
    },

    fuelEfficiency: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "FuelLog",
  fuelLogSchema
);