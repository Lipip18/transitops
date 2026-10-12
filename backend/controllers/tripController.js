const mongoose = require("mongoose");
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const { createNotification } = require("./notificationController");
const { recordAuditLog } = require("./auditController");

const fail = (status, message) => {
  const error = new Error(message);
  error.statusCode = status;
  throw error;
};

const getTrips = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "Driver") {
      const driver = await Driver.findOne({
        email: String(req.user.email).trim().toLowerCase(),
      });
      if (!driver) {
        return res.status(200).json([]);
      }
      filter.driver = driver._id;
    }

    let tripsQuery = Trip.find(filter)
      .populate({
        path: "vehicle",
        select: "vehicleName registrationNumber type status odometer",
      })
      .populate({
        path: "driver",
        select: "name licenseNumber licenseCategory licenseExpiryDate safetyScore status",
      })
      .sort({ createdAt: -1 });
    if (req.query.limit !== undefined) {
      const requestedLimit = Number.parseInt(req.query.limit, 10);
      if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
        return res.status(400).json({ message: "Trip limit must be a positive integer." });
      }
      tripsQuery = tripsQuery.limit(Math.min(requestedLimit, 100));
    }
    const trips = await tripsQuery.lean();

    return res.status(200).json(trips);
  } catch (error) {
    return res.status(500).json({ message: "Unable to load trips." });
  }
};

const createTrip = async (req, res) => {
  try {
    const {
      source,
      destination,
      vehicle: vehicleId,
      driver: driverId,
      cargoWeight,
      plannedDistance,
      cargoType,
      estimatedDuration,
    } = req.body;
    const weight = Number(cargoWeight);
    const distance = Number(plannedDistance);

    if (
      !String(source || "").trim() ||
      !String(destination || "").trim() ||
      !Number.isFinite(weight) ||
      weight < 0 ||
      !Number.isFinite(distance) ||
      distance <= 0
    ) {
      return res.status(400).json({
        message: "Source, destination, valid cargo weight, and planned distance greater than zero are required.",
      });
    }

    const [vehicle, driver] = await Promise.all([
      Vehicle.findById(vehicleId),
      Driver.findById(driverId),
    ]);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found." });
    }
    if (!driver) {
      return res.status(404).json({ message: "Driver not found." });
    }
    if (vehicle.status !== "Available") {
      return res.status(400).json({
        message: "Only available vehicles can be assigned to a trip.",
      });
    }
    if (driver.status === "Suspended") {
      return res.status(400).json({
        message: "Suspended drivers cannot be assigned to a trip.",
      });
    }
    if (driver.status !== "Available") {
      return res.status(400).json({
        message: "Only available drivers can be assigned to a trip.",
      });
    }
    if (new Date(driver.licenseExpiryDate) <= new Date()) {
      return res.status(400).json({
        message: "Driver license has expired.",
      });
    }
    if (weight > vehicle.maximumLoadCapacity) {
      return res.status(400).json({
        message: "Cargo exceeds vehicle capacity.",
      });
    }

    const trip = await Trip.create({
      source: String(source).trim(),
      destination: String(destination).trim(),
      vehicle: vehicle._id,
      driver: driver._id,
      cargoWeight: weight,
      plannedDistance: distance,
      cargoType,
      estimatedDuration:
        estimatedDuration === undefined ? undefined : Number(estimatedDuration),
    });

    await createNotification(
      "Trip Created",
      `Trip ${trip._id} has been scheduled.`,
      "trip"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Trip Created",
      entity: "Trip",
      entityId: trip._id,
      metadata: {
        vehicle: vehicle.registrationNumber,
        driver: driver.name,
        source: trip.source,
        destination: trip.destination,
      },
    });
    return res.status(201).json(trip);
  } catch (error) {
    if (
      error.code === 11000 ||
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({ message: "Invalid trip details." });
    }
    return res.status(500).json({ message: "Unable to create trip." });
  }
};

const updateDraftTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    if (trip.status !== "Draft") {
      return res.status(400).json({ message: "Only draft trips can be edited." });
    }

    const fields = [
      "source",
      "destination",
      "vehicle",
      "driver",
      "cargoWeight",
      "cargoType",
      "plannedDistance",
      "estimatedDuration",
    ];
    const updates = Object.fromEntries(
      fields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])
    );
    const source = String(updates.source ?? trip.source).trim();
    const destination = String(updates.destination ?? trip.destination).trim();
    const vehicleId = updates.vehicle ?? trip.vehicle;
    const driverId = updates.driver ?? trip.driver;
    const cargoWeight = Number(updates.cargoWeight ?? trip.cargoWeight);
    const plannedDistance = Number(updates.plannedDistance ?? trip.plannedDistance);

    if (
      !source ||
      !destination ||
      !Number.isFinite(cargoWeight) ||
      cargoWeight < 0 ||
      !Number.isFinite(plannedDistance) ||
      plannedDistance <= 0
    ) {
      return res.status(400).json({ message: "Trip details and planned distance must be valid." });
    }

    const [vehicle, driver] = await Promise.all([
      Vehicle.findById(vehicleId),
      Driver.findById(driverId),
    ]);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
    if (!driver) return res.status(404).json({ message: "Driver not found." });
    if (vehicle.status !== "Available") {
      return res.status(400).json({ message: "Only available vehicles can be assigned to a trip." });
    }
    if (driver.status !== "Available") {
      return res.status(400).json({ message: "Only available drivers can be assigned to a trip." });
    }
    if (new Date(driver.licenseExpiryDate) <= new Date()) {
      return res.status(400).json({ message: "Driver license has expired." });
    }
    if (cargoWeight > vehicle.maximumLoadCapacity) {
      return res.status(400).json({ message: "Cargo exceeds vehicle capacity." });
    }

    Object.assign(trip, updates, {
      source,
      destination,
      vehicle: vehicle._id,
      driver: driver._id,
      cargoWeight,
      plannedDistance,
    });
    await trip.save();
    await recordAuditLog({
      actor: req.user,
      action: "Trip Updated",
      entity: "Trip",
      entityId: trip._id,
      metadata: { source, destination },
    });
    return res.status(200).json(trip);
  } catch (error) {
    const isBadRequest = ["ValidationError", "CastError", "BSONError"].includes(error.name);
    if (!isBadRequest) console.error("Trip update failed:", error.name || "Error");
    return res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? error.message : "Unable to update trip.",
    });
  }
};

const deleteDraftTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: "Trip not found." });
    if (trip.status !== "Draft") {
      return res.status(400).json({ message: "Only draft trips can be deleted." });
    }

    await trip.deleteOne();
    await recordAuditLog({
      actor: req.user,
      action: "Trip Deleted",
      entity: "Trip",
      entityId: trip._id,
      metadata: { source: trip.source, destination: trip.destination },
    });
    return res.status(200).json({ message: "Draft trip deleted successfully." });
  } catch (error) {
    const isBadRequest = error.name === "CastError";
    if (!isBadRequest) console.error("Trip deletion failed:", error.name || "Error");
    return res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? "Invalid trip id." : "Unable to delete trip.",
    });
  }
};

const dispatchTrip = async (req, res) => {
  const session = await mongoose.startSession();
  let dispatchedTrip;

  try {
    await session.withTransaction(async () => {
      const trip = await Trip.findById(req.params.id).session(session);
      if (!trip) {
        fail(404, "Trip not found.");
      }
      if (trip.status !== "Draft") {
        fail(400, "Only draft trips can be dispatched.");
      }
      if (
        !Number.isFinite(Number(trip.plannedDistance)) ||
        Number(trip.plannedDistance) <= 0 ||
        !Number.isFinite(Number(trip.cargoWeight)) ||
        Number(trip.cargoWeight) < 0
      ) {
        fail(400, "Trip cargo weight or planned distance is invalid.");
      }

      const vehicle = await Vehicle.findById(trip.vehicle).session(session);
      const driver = await Driver.findById(trip.driver).session(session);
      if (!vehicle) {
        fail(400, "Trip vehicle no longer exists.");
      }
      if (vehicle.status === "Retired" || vehicle.status === "In Shop") {
        fail(400, `A ${vehicle.status.toLowerCase()} vehicle cannot be dispatched.`);
      }
      if (vehicle.status !== "Available") {
        fail(400, "Vehicle is not available for dispatch.");
      }
      if (!driver) {
        fail(400, "Trip driver no longer exists.");
      }
      if (driver.status === "Suspended") {
        fail(400, "Suspended drivers cannot be dispatched.");
      }
      if (driver.status !== "Available") {
        fail(400, "Driver is not available for dispatch.");
      }
      if (new Date(driver.licenseExpiryDate) <= new Date()) {
        fail(400, "Driver license has expired.");
      }
      if (trip.cargoWeight > vehicle.maximumLoadCapacity) {
        fail(400, "Cargo exceeds vehicle capacity.");
      }

      const claimedVehicle = await Vehicle.findOneAndUpdate(
        { _id: vehicle._id, status: "Available" },
        { $set: { status: "On Trip" } },
        { new: true, session }
      );
      if (!claimedVehicle) {
        fail(400, "Vehicle was assigned to another trip.");
      }

      const claimedDriver = await Driver.findOneAndUpdate(
        {
          _id: driver._id,
          status: "Available",
          licenseExpiryDate: { $gt: new Date() },
        },
        { $set: { status: "On Trip" } },
        { new: true, session }
      );
      if (!claimedDriver) {
        fail(400, "Driver is no longer available or has an expired license.");
      }

      dispatchedTrip = await Trip.findOneAndUpdate(
        { _id: trip._id, status: "Draft" },
        { $set: { status: "Dispatched", departureTime: new Date() } },
        { new: true, session }
      );
      if (!dispatchedTrip) {
        fail(400, "Trip is no longer in draft.");
      }
    });

    await createNotification(
      "Trip Dispatched",
      `Trip ${dispatchedTrip._id} has started.`,
      "trip"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Trip Dispatched",
      entity: "Trip",
      entityId: dispatchedTrip._id,
      metadata: { vehicle: dispatchedTrip.vehicle, driver: dispatchedTrip.driver },
    });
    return res.status(200).json(dispatchedTrip);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.statusCode ? error.message : "Unable to dispatch trip." });
  } finally {
    await session.endSession();
  }
};

const completeTrip = async (req, res) => {
  const session = await mongoose.startSession();
  let completedTrip;

  try {
    await session.withTransaction(async () => {
      const trip = await Trip.findById(req.params.id).session(session);
      if (!trip) {
        fail(404, "Trip not found.");
      }
      if (trip.status !== "Dispatched") {
        fail(400, "Only dispatched trips can be completed.");
      }

      const finalOdometer = Number(req.body.finalOdometer);
      const fuelConsumed = Number(req.body.fuelConsumed);
      const fuelCost = req.body.fuelCost === undefined ? 0 : Number(req.body.fuelCost);
      const revenue = req.body.revenue === undefined ? 0 : Number(req.body.revenue);
      const hasValidNumericInput = (value) =>
        value !== undefined &&
        value !== null &&
        String(value).trim() !== "" &&
        Number.isFinite(Number(value));
      if (
        !hasValidNumericInput(req.body.finalOdometer) ||
        !hasValidNumericInput(req.body.fuelConsumed) ||
        (req.body.fuelCost !== undefined &&
          !hasValidNumericInput(req.body.fuelCost)) ||
        (req.body.revenue !== undefined &&
          !hasValidNumericInput(req.body.revenue)) ||
        req.body.finalOdometer === undefined ||
        !Number.isFinite(finalOdometer) ||
        fuelConsumed < 0 ||
        !Number.isFinite(fuelConsumed) ||
        !Number.isFinite(fuelCost) ||
        fuelCost < 0 ||
        !Number.isFinite(revenue) ||
        revenue < 0
      ) {
        fail(400, "A valid final odometer and non-negative fuel consumption are required.");
      }

      const vehicle = await Vehicle.findById(trip.vehicle).session(session);
      const driver = await Driver.findById(trip.driver).session(session);
      if (!vehicle || !driver) {
        fail(400, "Trip vehicle or driver no longer exists.");
      }
      if (vehicle.status !== "On Trip" || driver.status !== "On Trip") {
        fail(400, "Trip vehicle and driver must both be on this dispatched trip.");
      }
      if (finalOdometer < vehicle.odometer) {
        fail(400, "Final odometer cannot be lower than the current odometer.");
      }
      const actualDistance = finalOdometer - vehicle.odometer;
      if (actualDistance <= 0) {
        fail(400, "Final odometer must be greater than the current odometer.");
      }

      const updatedVehicle = await Vehicle.findOneAndUpdate(
        { _id: vehicle._id, status: "On Trip" },
        { $set: { status: "Available", odometer: finalOdometer } },
        { new: true, session }
      );
      const updatedDriver = await Driver.findOneAndUpdate(
        { _id: driver._id, status: "On Trip" },
        { $set: { status: "Available" } },
        { new: true, session }
      );
      if (!updatedVehicle || !updatedDriver) {
        fail(400, "Trip resource status changed; completion was not applied.");
      }

      const completionTime = new Date();
      completedTrip = await Trip.findOneAndUpdate(
        { _id: trip._id, status: "Dispatched" },
        {
          $set: {
            status: "Completed",
            actualDistance,
            fuelConsumed,
            arrivalTime: completionTime,
            completedAt: completionTime,
            fuelCost,
            revenue,
            remarks: req.body.remarks || "",
          },
        },
        { new: true, runValidators: true, session }
      );
      if (!completedTrip) {
        fail(400, "Trip is no longer dispatched.");
      }
    });

    await createNotification(
      "Trip Completed",
      `Trip ${completedTrip._id} has been completed.`,
      "trip"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Trip Completed",
      entity: "Trip",
      entityId: completedTrip._id,
      metadata: {
        actualDistance: completedTrip.actualDistance,
        fuelConsumed: completedTrip.fuelConsumed,
        revenue: completedTrip.revenue,
      },
    });
    return res.status(200).json(completedTrip);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.statusCode ? error.message : "Unable to complete trip." });
  } finally {
    await session.endSession();
  }
};

const cancelTrip = async (req, res) => {
  const session = await mongoose.startSession();
  let cancelledTrip;

  try {
    await session.withTransaction(async () => {
      const trip = await Trip.findById(req.params.id).session(session);
      if (!trip) {
        fail(404, "Trip not found.");
      }
      if (!["Draft", "Dispatched"].includes(trip.status)) {
        fail(400, "Only draft or dispatched trips can be cancelled.");
      }

      if (trip.status === "Dispatched") {
        const vehicle = await Vehicle.findById(trip.vehicle).session(session);
        const driver = await Driver.findById(trip.driver).session(session);
        if (!vehicle || !driver) {
          fail(400, "Trip vehicle or driver no longer exists.");
        }
        const updatedVehicle = await Vehicle.findOneAndUpdate(
          { _id: vehicle._id, status: "On Trip" },
          { $set: { status: "Available" } },
          { new: true, session }
        );
        const updatedDriver = await Driver.findOneAndUpdate(
          { _id: driver._id, status: "On Trip" },
          { $set: { status: "Available" } },
          { new: true, session }
        );
        if (!updatedVehicle || !updatedDriver) {
          fail(400, "Trip resource status changed; cancellation was not applied.");
        }
      }

      cancelledTrip = await Trip.findOneAndUpdate(
        { _id: trip._id, status: trip.status },
        { $set: { status: "Cancelled" } },
        { new: true, session }
      );
      if (!cancelledTrip) {
        fail(400, "Trip status changed; cancellation was not applied.");
      }
    });

    await createNotification(
      "Trip Cancelled",
      `Trip ${cancelledTrip._id} has been cancelled.`,
      "trip"
    );
    await recordAuditLog({
      actor: req.user,
      action: "Trip Cancelled",
      entity: "Trip",
      entityId: cancelledTrip._id,
      metadata: { status: cancelledTrip.status },
    });
    return res.status(200).json(cancelledTrip);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.statusCode ? error.message : "Unable to cancel trip." });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getTrips,
  createTrip,
  updateDraftTrip,
  deleteDraftTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
};
