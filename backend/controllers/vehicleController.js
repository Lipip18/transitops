const Vehicle = require("../models/Vehicle");
const Trip = require("../models/Trip");
const Maintenance = require("../models/Maintenance");
const { createNotification } = require("./notificationController");
const { recordAuditLog } = require("./auditController");

const duplicateRegistrationError = (error) => error.code === 11000;
const vehicleFields = [
  "registrationNumber",
  "vehicleName",
  "type",
  "model",
  "manufacturer",
  "year",
  "maximumLoadCapacity",
  "odometer",
  "fuelType",
  "fuelTankCapacity",
  "averageMileage",
  "acquisitionCost",
  "currentValue",
  "insuranceNumber",
  "insuranceExpiry",
  "pollutionExpiry",
  "lastServiceDate",
  "nextServiceDate",
  "currentLocation",
  "gpsEnabled",
  "notes",
];

const pickFields = (source, fields) =>
  Object.fromEntries(
    fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]])
  );

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ======================================
// GET ALL VEHICLES
// SEARCH + FILTER + PAGINATION
// ======================================
const getVehicles = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 5));
    const search = String(req.query.search || "").slice(0, 100);
    const status = String(req.query.status || "");

    if (
      status &&
      !["Available", "On Trip", "In Shop", "Retired"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid vehicle status filter." });
    }

    const query = {};

    // Search by registration or vehicle name
    if (search) {
      query.$or = [
        {
          registrationNumber: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
        {
          vehicleName: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    if (req.query.availableForDispatch === "true") {
      query.status = "Available";
    }

    const totalVehicles = await Vehicle.countDocuments(query);

    let vehicleQuery = Vehicle.find(query);
    if (req.user.role !== "Fleet Manager") {
      vehicleQuery = vehicleQuery.select(
        "registrationNumber vehicleName type maximumLoadCapacity odometer status"
      );
    }
    const vehicles = await vehicleQuery
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      vehicles,
      currentPage: page,
      totalPages: Math.ceil(totalVehicles / limit),
      totalVehicles,
    });
  } catch (error) {
    console.error("Vehicle list query failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to load vehicles." });
  }
};

// ======================================
// GET SINGLE VEHICLE
// ======================================
const getVehicleById = async (req, res) => {
  try {
    let vehicleQuery = Vehicle.findById(req.params.id);
    if (req.user.role !== "Fleet Manager") {
      vehicleQuery = vehicleQuery.select(
        "registrationNumber vehicleName type maximumLoadCapacity odometer status"
      );
    }
    const vehicle = await vehicleQuery.lean();

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Vehicle query failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to load vehicle." });
  }
};

// ======================================
// CREATE VEHICLE
// ======================================
const createVehicle = async (req, res) => {
  try {
    const {
      registrationNumber,
      vehicleName,
      type,
      maximumLoadCapacity,
      odometer,
      acquisitionCost,
      status,
    } = req.body;

    if (
      !registrationNumber ||
      !vehicleName ||
      !type ||
      !Number.isFinite(Number(maximumLoadCapacity)) ||
      Number(maximumLoadCapacity) <= 0 ||
      !Number.isFinite(Number(acquisitionCost)) ||
      Number(acquisitionCost) < 0
    ) {
      return res.status(400).json({
        message: "Registration, vehicle name, type, positive capacity, and a valid acquisition cost are required.",
      });
    }

    if (status !== undefined && status !== "Available") {
      return res.status(400).json({
        message: "New vehicles must start with Available status.",
      });
    }

    const vehicle = await Vehicle.create({
      registrationNumber,
      vehicleName,
      type,
      maximumLoadCapacity,
      odometer,
      acquisitionCost,
      status: "Available",
    });

    await createNotification(
      "Vehicle Added",
      `${vehicle.vehicleName} has been added to the fleet.`,
      "vehicle"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Vehicle Created",
      entity: "Vehicle",
      entityId: vehicle._id,
      metadata: { registrationNumber: vehicle.registrationNumber },
    });

    res.status(201).json(vehicle);
  } catch (error) {
    if (duplicateRegistrationError(error)) {
      return res.status(400).json({
        message: "Vehicle registration number already exists.",
      });
    }
    const isBadRequest =
      error.name === "ValidationError" || error.name === "CastError";
    if (!isBadRequest) {
      console.error("Vehicle creation failed:", error.name || "Error");
    }
    res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? error.message : "Unable to create vehicle.",
    });
  }
};

// ======================================
// UPDATE VEHICLE
// ======================================
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    const updates = pickFields(req.body, vehicleFields);
    if (
      req.body.status !== undefined &&
      !["Available", "On Trip", "In Shop", "Retired"].includes(req.body.status)
    ) {
      return res.status(400).json({ message: "Invalid vehicle status." });
    }
    if (req.body.status !== undefined && req.body.status !== vehicle.status) {
      if (req.body.status !== "Retired" || vehicle.status !== "Available") {
        return res.status(400).json({
          message: "Vehicle status can only be changed by trip or maintenance operations; available vehicles may be retired.",
        });
      }

      const activeTrip = await Trip.exists({
        vehicle: vehicle._id,
        status: { $in: ["Draft", "Dispatched", "In Progress"] },
      });
      const activeMaintenance = await Maintenance.exists({
        vehicle: vehicle._id,
        status: { $in: ["Scheduled", "Active"] },
      });

      if (activeTrip || activeMaintenance) {
        return res.status(400).json({
          message: "Vehicle with active trip or maintenance records cannot be retired.",
        });
      }

      updates.status = "Retired";
    }

    const updatedVehicle = updates.status === "Retired"
      ? await Vehicle.findOneAndUpdate(
          { _id: vehicle._id, status: "Available" },
          { $set: updates },
          { new: true, runValidators: true }
        )
      : Object.assign(vehicle, updates);
    if (!updatedVehicle) {
      return res.status(400).json({
        message: "Vehicle status changed before the update could be applied.",
      });
    }
    if (updates.status !== "Retired") {
      await updatedVehicle.save();
    }

    await createNotification(
      "Vehicle Updated",
      `${updatedVehicle.vehicleName} details updated.`,
      "vehicle"
    );
    await recordAuditLog({
      actor: req.user,
      action: updates.status === "Retired" ? "Vehicle Retired" : "Vehicle Updated",
      entity: "Vehicle",
      entityId: updatedVehicle._id,
      metadata: {
        registrationNumber: updatedVehicle.registrationNumber,
        changedFields: Object.keys(updates),
        status: updatedVehicle.status,
      },
    });

    res.status(200).json(updatedVehicle);
  } catch (error) {
    if (duplicateRegistrationError(error)) {
      return res.status(400).json({
        message: "Vehicle registration number already exists.",
      });
    }
    const isBadRequest =
      error.name === "ValidationError" || error.name === "CastError";
    res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? error.message : "Unable to update vehicle.",
    });
  }
};

// ======================================
// DELETE VEHICLE
// ======================================
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    const activeTrip = await Trip.findOne({
      vehicle: vehicle._id,
      status: {
        $in: ["Draft", "Dispatched", "In Progress"],
      },
    });

    if (activeTrip) {
      return res.status(400).json({
        message: "Vehicle cannot be deleted while assigned to a trip.",
      });
    }

    const maintenance = await Maintenance.findOne({
      vehicle: vehicle._id,
      status: {
        $in: ["Scheduled", "Active"],
      },
    });

    if (maintenance) {
      return res.status(400).json({
        message: "Vehicle is currently under maintenance.",
      });
    }

    if (vehicle.status === "On Trip" || vehicle.status === "In Shop") {
      return res.status(400).json({
        message: "Vehicle cannot be deleted while on a trip or in maintenance.",
      });
    }

    await vehicle.deleteOne();

    await createNotification(
      "Vehicle Deleted",
      `${vehicle.vehicleName} removed from fleet.`,
      "vehicle"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Vehicle Deleted",
      entity: "Vehicle",
      entityId: vehicle._id,
      metadata: { registrationNumber: vehicle.registrationNumber },
    });

    res.status(200).json({
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Vehicle deletion failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to delete vehicle." });
  }
};

// ======================================
// RETIRE VEHICLE
// ======================================
const retireVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle not found",
      });
    }

    if (vehicle.status !== "Available") {
      return res.status(400).json({
        message: "Only available vehicles can be retired.",
      });
    }

    const activeTrip = await Trip.exists({
      vehicle: vehicle._id,
      status: { $in: ["Draft", "Dispatched", "In Progress"] },
    });
    const activeMaintenance = await Maintenance.exists({
      vehicle: vehicle._id,
      status: { $in: ["Scheduled", "Active"] },
    });
    if (activeTrip || activeMaintenance) {
      return res.status(400).json({
        message: "Vehicle with active trip or maintenance records cannot be retired.",
      });
    }

    const retiredVehicle = await Vehicle.findOneAndUpdate(
      { _id: vehicle._id, status: "Available" },
      { $set: { status: "Retired" } },
      { new: true }
    );
    if (!retiredVehicle) {
      return res.status(400).json({
        message: "Vehicle status changed before it could be retired.",
      });
    }

    await createNotification(
      "Vehicle Retired",
      `${retiredVehicle.vehicleName} retired from fleet.`,
      "vehicle"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Vehicle Retired",
      entity: "Vehicle",
      entityId: retiredVehicle._id,
      metadata: { registrationNumber: retiredVehicle.registrationNumber },
    });

    res.status(200).json(retiredVehicle);
  } catch (error) {
    console.error("Vehicle retirement failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to retire vehicle." });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  retireVehicle,
};