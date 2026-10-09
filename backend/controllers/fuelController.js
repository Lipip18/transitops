const FuelLog = require("../models/FuelLog");
const Vehicle = require("../models/Vehicle");
const { createNotification } = require("./notificationController");
const { recordAuditLog } = require("./auditController");

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
  deleteFuelLog,
};