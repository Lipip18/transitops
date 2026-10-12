const FuelLog = require("../models/FuelLog");
const Vehicle = require("../models/Vehicle");
const { createNotification } = require("./notificationController");
const { recordAuditLog } = require("./auditController");

const updateFuelLog = async (req, res) => {
  try {
    const fuelLog = await FuelLog.findById(req.params.id);
    if (!fuelLog) return res.status(404).json({ message: "Fuel log not found." });
    const updates = {};

    if (req.body.vehicle !== undefined) {
      const vehicle = await Vehicle.findById(req.body.vehicle).select("_id fuelType");
      if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
      updates.vehicle = vehicle._id;
      if (req.body.fuelType === undefined) updates.fuelType = vehicle.fuelType;
    }
    if (req.body.liters !== undefined) {
      const liters = Number(req.body.liters);
      if (!Number.isFinite(liters) || liters <= 0) return res.status(400).json({ message: "Liters must be greater than zero." });
      updates.liters = liters;
    }
    if (req.body.pricePerLiter !== undefined) {
      const pricePerLiter = Number(req.body.pricePerLiter);
      if (!Number.isFinite(pricePerLiter) || pricePerLiter <= 0) return res.status(400).json({ message: "Price per liter must be greater than zero." });
      updates.pricePerLiter = pricePerLiter;
    }
    if (req.body.fuelType !== undefined) updates.fuelType = req.body.fuelType;
    if (req.body.fuelStation !== undefined) updates.fuelStation = req.body.fuelStation;
    if (req.body.paymentMethod !== undefined) updates.paymentMethod = req.body.paymentMethod;
    if (req.body.receiptNumber !== undefined) updates.receiptNumber = req.body.receiptNumber;
    if (req.body.filledBy !== undefined) updates.filledBy = req.body.filledBy;
    if (req.body.remarks !== undefined) updates.remarks = req.body.remarks;
    if (req.body.odometerReading !== undefined) {
      const odometerReading = Number(req.body.odometerReading);
      if (!Number.isFinite(odometerReading) || odometerReading < 0) return res.status(400).json({ message: "Odometer must be non-negative." });
      updates.odometerReading = odometerReading;
    }
    if (req.body.date !== undefined) {
      const date = new Date(req.body.date);
      if (Number.isNaN(date.getTime())) return res.status(400).json({ message: "Invalid fuel log date." });
      updates.date = date;
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ message: "At least one fuel field must be provided." });

    const liters = updates.liters ?? fuelLog.liters;
    const pricePerLiter = updates.pricePerLiter ?? fuelLog.pricePerLiter;
    updates.cost = Number((liters * pricePerLiter).toFixed(2));
    Object.assign(fuelLog, updates);
    await fuelLog.save();
    await recordAuditLog({
      actor: req.user,
      action: "Fuel Updated",
      entity: "FuelLog",
      entityId: fuelLog._id,
      metadata: { liters: fuelLog.liters, cost: fuelLog.cost },
    });
    return res.status(200).json(fuelLog);
  } catch (error) {
    const isBadRequest = ["ValidationError", "CastError", "BSONError"].includes(error.name);
    if (!isBadRequest) console.error("Fuel log update failed:", error.name || "Error");
    return res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? error.message : "Unable to update fuel log.",
    });
  }
};

// ==========================================
// GET ALL FUEL LOGS
// ==========================================
const getFuelLogs = async (req, res) => {
  try {
    const logs = await FuelLog.find()
      .populate("vehicle")
      .populate("driver")
      .populate("trip")
      .sort({ createdAt: -1 });

    res.status(200).json(logs);
  } catch (error) {
    console.error("Fuel log query failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to load fuel logs." });
  }
};

// ==========================================
// CREATE FUEL LOG
// ==========================================
const createFuelLog = async (req, res) => {
  try {
    const {
      vehicle,
      driver,
      trip,
      fuelType,
      fuelStation,
      odometerReading,
      liters,
      pricePerLiter,
      date,
      paymentMethod,
      receiptNumber,
      filledBy,
      remarks,
    } = req.body;

    // Check vehicle exists
    const selectedVehicle = await Vehicle.findById(vehicle);

    if (!selectedVehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    const fuelLiters = Number(liters);
    const unitPrice = Number(pricePerLiter);
    const reading = Number(odometerReading);
    if (
      !Number.isFinite(fuelLiters) ||
      fuelLiters <= 0 ||
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0 ||
      !Number.isFinite(reading) ||
      reading < 0
    ) {
      return res.status(400).json({
        message: "Liters and price per liter must be greater than zero; odometer must be non-negative.",
      });
    }
    const cost = fuelLiters * unitPrice;
    if (!Number.isFinite(cost) || cost <= 0) {
      return res.status(400).json({
        message: "Fuel total cost is invalid.",
      });
    }

    const fuelLog = await FuelLog.create({
      vehicle,
      driver,
      trip,
      fuelType,
      fuelStation,
      odometerReading: reading,
      liters: fuelLiters,
      pricePerLiter: unitPrice,
      cost,
      date: date || new Date(),
      paymentMethod,
      receiptNumber,
      filledBy,
      remarks,
    });

    // Send notification
    await createNotification(
      "Fuel Added",
      `${liters} L fuel added to ${selectedVehicle.vehicleName}.`,
      "fuel"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Fuel Created",
      entity: "FuelLog",
      entityId: fuelLog._id,
      metadata: {
        vehicle: selectedVehicle.registrationNumber,
        liters: fuelLog.liters,
        cost: fuelLog.cost,
      },
    });

    res.status(201).json(fuelLog);

  } catch (error) {

    const isBadRequest =
      error.name === "ValidationError" ||
      error.name === "CastError" ||
      error.name === "BSONError";
    if (!isBadRequest) {
      console.error("Fuel log creation failed:", error.name || "Error");
    }
    res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? error.message : "Unable to create fuel log.",
    });

  }
};

// ==========================================
// DELETE FUEL LOG
// ==========================================
const deleteFuelLog = async (req, res) => {

  try {

    const fuelLog = await FuelLog.findById(req.params.id);

    if (!fuelLog) {
      return res.status(404).json({
        message: "Fuel log not found",
      });
    }

    await fuelLog.deleteOne();

    await recordAuditLog({
      actor: req.user,
      action: "Fuel Deleted",
      entity: "FuelLog",
      entityId: fuelLog._id,
      metadata: { liters: fuelLog.liters, cost: fuelLog.cost },
    });

    res.status(200).json({
      message: "Fuel log deleted successfully",
    });

  } catch (error) {
    console.error("Fuel log deletion failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to delete fuel log." });

  }

};

module.exports = {
  getFuelLogs,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
};