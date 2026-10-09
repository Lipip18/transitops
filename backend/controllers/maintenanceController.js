const Maintenance = require("../models/Maintenance");
const Vehicle = require("../models/Vehicle");
const mongoose = require("mongoose");
const { createNotification } = require("./notificationController");
const { recordAuditLog } = require("./auditController");

// ========================================
// GET ALL MAINTENANCE RECORDS
// ========================================
const getMaintenance = async (req, res) => {
  try {
    const logs = await Maintenance.find()
      .populate("vehicle")
      .sort({ createdAt: -1 });

    res.status(200).json(logs);
  } catch (error) {
    console.error("Maintenance query failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to load maintenance records." });
  }
};

// ========================================
// CREATE MAINTENANCE
// ========================================
const createMaintenance = async (req, res) => {
  const session = await mongoose.startSession();
  let maintenance;
  let selectedVehicle;

  try {
    const {
      vehicle,
      maintenanceType,
      description,
      serviceCenter,
      technician,
      invoiceNumber,
      partsCost,
      laborCost,
      cost,
      odometerReading,
      priority,
      nextServiceDate,
      nextServiceOdometer,
      remarks,
    } = req.body;

    await session.withTransaction(async () => {
      selectedVehicle = await Vehicle.findById(vehicle).session(session);
      if (!selectedVehicle) {
        const error = new Error("Vehicle not found.");
        error.statusCode = 404;
        throw error;
      }
      if (["Retired", "In Shop", "On Trip"].includes(selectedVehicle.status)) {
        const error = new Error(
          `A vehicle with status ${selectedVehicle.status} cannot enter maintenance.`
        );
        error.statusCode = 400;
        throw error;
      }

      const claimedVehicle = await Vehicle.findOneAndUpdate(
        { _id: selectedVehicle._id, status: "Available" },
        { $set: { status: "In Shop" } },
        { new: true, session }
      );
      if (!claimedVehicle) {
        const error = new Error("Vehicle is no longer available.");
        error.statusCode = 400;
        throw error;
      }

      [maintenance] = await Maintenance.create(
        [
          {
            vehicle: selectedVehicle._id,
            maintenanceType,
            description,
            serviceCenter,
            technician,
            invoiceNumber,
            partsCost,
            laborCost,
            cost,
            odometerReading,
            priority,
            nextServiceDate,
            nextServiceOdometer,
            remarks,
            status: "Active",
          },
        ],
        { session }
      );
    });

    await createNotification(
      "Maintenance Started",
      `${selectedVehicle.vehicleName} moved to maintenance.`,
      "maintenance"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Maintenance Started",
      entity: "Maintenance",
      entityId: maintenance._id,
      metadata: {
        vehicle: selectedVehicle.registrationNumber,
        maintenanceType: maintenance.maintenanceType,
      },
    });

    return res.status(201).json(maintenance);
  } catch (error) {
    const isBadRequest =
      error.statusCode === 400 ||
      error.name === "ValidationError" ||
      error.name === "CastError";
    const status = error.statusCode || (isBadRequest ? 400 : 500);
    if (status >= 500) {
      console.error("Maintenance creation failed:", error.name || "Error");
    }
    return res.status(status).json({
      message:
        error.statusCode || isBadRequest
          ? error.message
          : "Unable to start maintenance.",
    });
  } finally {
    await session.endSession();
  }
};

// ========================================
// COMPLETE MAINTENANCE
// ========================================
const completeMaintenance = async (req, res) => {
  const session = await mongoose.startSession();
  let maintenance;
  let vehicle;
  try {
    await session.withTransaction(async () => {
      const currentMaintenance = await Maintenance.findById(req.params.id).session(session);
      if (!currentMaintenance) {
        const error = new Error("Maintenance record not found.");
        error.statusCode = 404;
        throw error;
      }
      if (currentMaintenance.status !== "Active") {
        const error = new Error("Only active maintenance can be completed.");
        error.statusCode = 400;
        throw error;
      }

      vehicle = await Vehicle.findById(currentMaintenance.vehicle).session(session);
      if (!vehicle) {
        const error = new Error("Maintenance vehicle no longer exists.");
        error.statusCode = 400;
        throw error;
      }

      const maintenanceUpdate = await Maintenance.updateOne(
        { _id: currentMaintenance._id, status: "Active" },
        { $set: { status: "Completed", completedDate: new Date() } },
        { session }
      );
      if (maintenanceUpdate.matchedCount !== 1) {
        const error = new Error("Maintenance status changed; completion was not applied.");
        error.statusCode = 400;
        throw error;
      }

      if (vehicle.status !== "Retired") {
        const updatedVehicle = await Vehicle.findOneAndUpdate(
          { _id: vehicle._id, status: "In Shop" },
          { $set: { status: "Available" } },
          { new: true, session }
        );
        if (!updatedVehicle) {
          const error = new Error("Vehicle is not in maintenance.");
          error.statusCode = 400;
          throw error;
        }
      }

      maintenance = await Maintenance.findById(currentMaintenance._id).session(session);
    });

    await createNotification(
      "Maintenance Completed",
      `${vehicle.vehicleName} maintenance completed.`,
      "maintenance"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Maintenance Completed",
      entity: "Maintenance",
      entityId: maintenance._id,
      metadata: { vehicle: vehicle.registrationNumber, cost: maintenance.cost },
    });
    return res.status(200).json(maintenance);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Unable to complete maintenance.",
    });
  } finally {
    await session.endSession();
  }
};

// ========================================
// DELETE MAINTENANCE RECORD
// ========================================
const deleteMaintenance = async (req, res) => {

  try {

    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
      return res.status(404).json({
        message: "Maintenance record not found",
      });
    }

    await maintenance.deleteOne();

    res.status(200).json({
      message: "Maintenance record deleted successfully",
    });

  } catch (error) {
    console.error("Maintenance deletion failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to delete maintenance record." });

  }

};

module.exports = {
  getMaintenance,
  createMaintenance,
  completeMaintenance,
  deleteMaintenance,
};