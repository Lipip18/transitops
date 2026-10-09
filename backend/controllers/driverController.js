const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const { createNotification } = require("./notificationController");
const { recordAuditLog } = require("./auditController");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// =====================================
// GET ALL DRIVERS
// SEARCH + FILTER + PAGINATION
// =====================================
const getDrivers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 5));
    const search = String(req.query.search || "").slice(0, 100);
    const status = String(req.query.status || "");
    if (
      status &&
      !["Available", "On Trip", "Off Duty", "Suspended"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid driver status filter." });
    }

    const query = {};

    if (search) {
      query.$or = [
        {
          name: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
        {
          licenseNumber: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (req.query.availableForDispatch === "true") {
      query.status = "Available";
      query.licenseExpiryDate = { $gt: new Date() };
    }

    const totalDrivers = await Driver.countDocuments(query);

    let driverQuery = Driver.find(query);
    if (req.user.role === "Safety Officer") {
      driverQuery = driverQuery.select(
        "-salary -address -emergencyContactName -emergencyContactNumber"
      );
    }
    const drivers = await driverQuery
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.status(200).json({
      drivers,
      currentPage: page,
      totalPages: Math.ceil(totalDrivers / limit),
      totalDrivers,
    });
  } catch (error) {
    console.error("Driver list query failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to load drivers." });
  }
};

// =====================================
// GET DRIVER BY ID
// =====================================
const getDriverById = async (req, res) => {
  try {
    let driverQuery = Driver.findById(req.params.id);
    if (req.user.role === "Safety Officer") {
      driverQuery = driverQuery.select(
        "-salary -address -emergencyContactName -emergencyContactNumber"
      );
    }
    const driver = await driverQuery.lean();

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    res.status(200).json(driver);
  } catch (error) {
    console.error("Driver query failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to load driver." });
  }
};

// =====================================
// CREATE DRIVER
// =====================================
const createDriver = async (req, res) => {
  try {
    const {
      name,
      licenseNumber,
      email,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore,
      status,
    } = req.body;

    if (status !== undefined && status !== "Available") {
      return res.status(400).json({
        message: "New drivers must start with Available status.",
      });
    }

    const existingDriver = await Driver.findOne({ licenseNumber });

    if (existingDriver) {
      return res.status(400).json({
        message: "License number already exists",
      });
    }

    const driver = await Driver.create({
      name,
      licenseNumber,
      email: email ? String(email).trim().toLowerCase() : undefined,
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      safetyScore,
      status: "Available",
    });

    await createNotification(
      "Driver Added",
      `${driver.name} joined the fleet.`,
      "driver"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Driver Created",
      entity: "Driver",
      entityId: driver._id,
      metadata: { licenseNumber: driver.licenseNumber },
    });

    res.status(201).json(driver);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "License number already exists.",
      });
    }
    const isBadRequest =
      error.name === "ValidationError" || error.name === "CastError";
    if (!isBadRequest) {
      console.error("Driver creation failed:", error.name || "Error");
    }
    res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? error.message : "Unable to create driver.",
    });
  }
};

// =====================================
// UPDATE DRIVER
// =====================================
const updateDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    if (
      req.body.licenseNumber &&
      req.body.licenseNumber !== driver.licenseNumber
    ) {
      const exists = await Driver.findOne({
        licenseNumber: req.body.licenseNumber,
      });

      if (exists) {
        return res.status(400).json({
          message: "License number already exists",
        });
      }
    }

    if (req.body.status !== undefined && req.body.status !== driver.status) {
      if (driver.status === "On Trip" || req.body.status === "On Trip") {
        return res.status(400).json({
          message: "Trip operations control the On Trip driver status.",
        });
      }
      if (
        !["Available", "Off Duty", "Suspended"].includes(req.body.status)
      ) {
        return res.status(400).json({
          message: "Invalid driver status.",
        });
      }
      if (req.body.status === "Available") {
        if (new Date(driver.licenseExpiryDate) <= new Date()) {
          return res.status(400).json({
            message: "A driver with an expired license cannot be made available.",
          });
        }
        const activeTrip = await Trip.exists({
          driver: driver._id,
          status: { $in: ["Draft", "Dispatched", "In Progress"] },
        });
        if (activeTrip) {
          return res.status(400).json({
            message: "A driver assigned to an active trip cannot be made available.",
          });
        }
      }
    }

    const updatableFields = [
      "name",
      "licenseNumber",
      "licenseCategory",
      "licenseExpiryDate",
      "contactNumber",
      "safetyScore",
      "status",
      "address",
      "emergencyContactName",
      "emergencyContactNumber",
      "yearsOfExperience",
      "remarks",
    ];
    const updates = {};
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    if (req.body.email !== undefined) {
      updates.email = String(req.body.email).trim().toLowerCase();
    }
    const updatedDriver = Object.keys(updates).includes("status")
      ? await Driver.findOneAndUpdate(
          { _id: driver._id, status: driver.status },
          { $set: updates },
          { new: true, runValidators: true }
        )
      : Object.assign(driver, updates);
    if (!updatedDriver) {
      return res.status(400).json({
        message: "Driver status changed before the update could be applied.",
      });
    }
    if (!Object.keys(updates).includes("status")) {
      await updatedDriver.save();
    }

    await createNotification(
      "Driver Updated",
      `${updatedDriver.name} details updated.`,
      "driver"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Driver Updated",
      entity: "Driver",
      entityId: updatedDriver._id,
      metadata: {
        licenseNumber: updatedDriver.licenseNumber,
        changedFields: Object.keys(updates),
        status: updatedDriver.status,
      },
    });

    res.status(200).json(updatedDriver);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "License number already exists.",
      });
    }
    const isBadRequest =
      error.name === "ValidationError" || error.name === "CastError";
    res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? error.message : "Unable to update driver.",
    });
  }
};

const updateDriverCompliance = async (req, res) => {
  try {
    const allowedFields = ["licenseExpiryDate", "safetyScore"];
    const fields = Object.keys(req.body);
    if (
      fields.length === 0 ||
      fields.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        message: "Only license expiry date and safety score can be updated.",
      });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    if (req.body.licenseExpiryDate !== undefined) {
      const expiryDate = new Date(req.body.licenseExpiryDate);
      if (Number.isNaN(expiryDate.getTime())) {
        return res.status(400).json({
          message: "A valid license expiry date is required.",
        });
      }
      driver.licenseExpiryDate = expiryDate;
    }

    if (req.body.safetyScore !== undefined) {
      const score = Number(req.body.safetyScore);
      if (!Number.isFinite(score) || score < 0 || score > 100) {
        return res.status(400).json({
          message: "Safety score must be between 0 and 100.",
        });
      }
      driver.safetyScore = score;
    }

    const updatedDriver = await driver.save();
    await recordAuditLog({
      actor: req.user,
      action: "Driver Compliance Updated",
      entity: "Driver",
      entityId: driver._id,
      metadata: {
        licenseExpiryDate: driver.licenseExpiryDate,
        safetyScore: driver.safetyScore,
      },
    });
    res.status(200).json(updatedDriver);
  } catch (error) {
    res.status(error.name === "ValidationError" ? 400 : 500).json({
      message:
        error.name === "ValidationError"
          ? error.message
          : "Unable to update driver compliance.",
    });
  }
};

// =====================================
// DELETE DRIVER
// =====================================
const deleteDriver = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    // Prevent deletion if assigned to active trip
    const activeTrip = await Trip.findOne({
      driver: driver._id,
      status: {
        $in: ["Draft", "Dispatched", "In Progress"],
      },
    });

    if (activeTrip) {
      return res.status(400).json({
        message:
          "Driver cannot be deleted while assigned to an active trip.",
      });
    }

    await driver.deleteOne();

    await createNotification(
      "Driver Removed",
      `${driver.name} removed from fleet.`,
      "driver"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Driver Deleted",
      entity: "Driver",
      entityId: driver._id,
      metadata: { licenseNumber: driver.licenseNumber },
    });

    res.status(200).json({
      message: "Driver deleted successfully",
    });
  } catch (error) {
    console.error("Driver deletion failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to delete driver." });
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  updateDriverCompliance,
  deleteDriver,
};