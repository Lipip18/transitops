const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");

const vehicleTypes = ["Truck", "Bus", "Van", "Mini Truck", "Pickup", "Car"];
const vehicleStatuses = ["Available", "On Trip", "In Shop", "Retired"];

const getDashboard = async (req, res) => {
  const { vehicleType, vehicleStatus, region } = req.query;

  if (vehicleType && !vehicleTypes.includes(vehicleType)) {
    return res.status(400).json({ message: "Invalid vehicle type filter." });
  }
  if (vehicleStatus && !vehicleStatuses.includes(vehicleStatus)) {
    return res.status(400).json({ message: "Invalid vehicle status filter." });
  }

  const vehicleFilter = {};
  if (vehicleType) vehicleFilter.type = vehicleType;
  if (vehicleStatus) vehicleFilter.status = vehicleStatus;
  if (region) {
    const normalizedRegion = String(region).trim();
    if (!normalizedRegion || normalizedRegion.length > 100) {
      return res.status(400).json({ message: "Invalid region filter." });
    }
    vehicleFilter.currentLocation = normalizedRegion;
  }

  try {
    const [vehicleGroups, tripGroups, filterOptions, availableDrivers] =
      await Promise.all([
        Vehicle.aggregate([
          { $match: vehicleFilter },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        Trip.aggregate([
          {
            $lookup: {
              from: Vehicle.collection.name,
              localField: "vehicle",
              foreignField: "_id",
              as: "vehicleData",
            },
          },
          { $unwind: "$vehicleData" },
          ...(Object.keys(vehicleFilter).length
            ? [
                {
                  $match: Object.fromEntries(
                    Object.entries(vehicleFilter).map(([key, value]) => [
                      `vehicleData.${key}`,
                      value,
                    ])
                  ),
                },
              ]
            : []),
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              drivers: {
                $addToSet: {
                  $cond: [
                    { $eq: ["$status", "Dispatched"] },
                    "$driver",
                    null,
                  ],
                },
              },
            },
          },
        ]),
        Vehicle.aggregate([
          {
            $group: {
              _id: null,
              types: { $addToSet: "$type" },
              regions: { $addToSet: "$currentLocation" },
            },
          },
          {
            $project: {
              _id: 0,
              types: 1,
              regions: {
                $filter: {
                  input: "$regions",
                  as: "region",
                  cond: {
                    $and: [
                      { $ne: ["$$region", null] },
                      { $ne: ["$$region", ""] },
                    ],
                  },
                },
              },
            },
          },
        ]),
        Driver.countDocuments({ status: "Available" }),
      ]);

    const vehicles = Object.fromEntries(
      vehicleGroups.map(({ _id, count }) => [_id, count])
    );
    const trips = Object.fromEntries(
      tripGroups.map(({ _id, count }) => [_id, count])
    );
    const dispatchedDrivers = tripGroups.reduce(
      (total, group) =>
        total +
        (group._id === "Dispatched"
          ? group.drivers.filter(Boolean).length
          : 0),
      0
    );

    const activeVehicles =
      (vehicles.Available || 0) +
      (vehicles["On Trip"] || 0) +
      (vehicles["In Shop"] || 0);
    const vehiclesOnTrip = vehicles["On Trip"] || 0;
    const fleetUtilization =
      activeVehicles > 0
        ? Number(((vehiclesOnTrip / activeVehicles) * 100).toFixed(1))
        : 0;
    const options = filterOptions[0] || { types: [], regions: [] };

    return res.json({
      activeVehicles,
      totalVehicles: activeVehicles,
      availableVehicles: vehicles.Available || 0,
      vehiclesInMaintenance: vehicles["In Shop"] || 0,
      retiredVehicles: vehicles.Retired || 0,
      activeTrips: trips.Dispatched || 0,
      pendingTrips: trips.Draft || 0,
      completedTrips: trips.Completed || 0,
      driversOnDuty: availableDrivers + dispatchedDrivers,
      vehiclesOnTrip,
      fleetUtilization,
      filterOptions: {
        vehicleTypes: options.types.sort(),
        regions: options.regions.sort(),
      },
    });
  } catch (error) {
    console.error("Dashboard query failed:", error.name || "Error");
    return res.status(500).json({ message: "Unable to load dashboard data." });
  }
};

module.exports = { getDashboard };
