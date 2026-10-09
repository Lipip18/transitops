const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
    },

    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    licenseCategory: {
      type: String,
      enum: ["LMV", "HMV", "Transport", "Commercial"],
      required: true,
    },

    licenseExpiryDate: {
      type: Date,
      required: true,
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    emergencyContactName: {
      type: String,
      default: "",
    },

    emergencyContactNumber: {
      type: String,
      default: "",
    },

    dateOfBirth: {
      type: Date,
    },

    joiningDate: {
      type: Date,
      default: Date.now,
    },

    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
    },

    assignedVehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    salary: {
      type: Number,
      default: 0,
    },

    safetyScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },

    totalTrips: {
      type: Number,
      default: 0,
    },

    totalDistanceDriven: {
      type: Number,
      default: 0,
    },

    accidents: {
      type: Number,
      default: 0,
    },

    medicalCertificateExpiry: {
      type: Date,
    },

    status: {
      type: String,
      enum: [
        "Available",
        "On Trip",
        "Off Duty",
        "Suspended",
      ],
      default: "Available",
    },

    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

driverSchema.index({ status: 1, licenseExpiryDate: 1 });

module.exports = mongoose.model("Driver", driverSchema);