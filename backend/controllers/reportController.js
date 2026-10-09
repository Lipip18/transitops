const FuelLog = require("../models/FuelLog");
const Maintenance = require("../models/Maintenance");
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");

const sumField = (field) => [
  {
    $group: {
      _id: null,
      total: { $sum: { $ifNull: [`$${field}`, 0] } },
    },
  },
];

const numericValue = (value) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const safeAdd = (...values) => {
  const total = values.reduce((sum, value) => sum + numericValue(value), 0);
  return Number.isFinite(total) ? total : 0;
};

const safeRatio = (numerator, denominator, precision) => {
  if (denominator <= 0) return 0;
  const ratio = numerator / denominator;
  return Number.isFinite(ratio) ? Number(ratio.toFixed(precision)) : 0;
};

const getAnalytics = async (req, res) => {
  try {
    const [tripTotals, fuelTotals, maintenanceTotals, fleetTotals] =
      await Promise.all([
        Trip.aggregate([
          {
            $group: {
              _id: null,
              totalTrips: { $sum: 1 },
              totalDistance: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", "Completed"] },
                    { $ifNull: ["$actualDistance", 0] },
                    0,
                  ],
                },
              },
              revenue: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", "Completed"] },
                    { $ifNull: ["$revenue", 0] },
                    0,
                  ],
                },
              },
            },
          },
        ]),
        FuelLog.aggregate([
          {
            $group: {
              _id: null,
              totalFuel: { $sum: { $ifNull: ["$liters", 0] } },
              fuelCost: { $sum: { $ifNull: ["$cost", 0] } },
            },
          },
        ]),
        Maintenance.aggregate([
          { $match: { status: { $in: ["Active", "Completed"] } } },
          ...sumField("cost"),
        ]),
        Vehicle.aggregate([
          ...sumField("acquisitionCost"),
        ]),
      ]);

    const trips = tripTotals[0] || {};
    const fuel = fuelTotals[0] || {};
    const totalDistance = numericValue(trips.totalDistance);
    const totalFuel = numericValue(fuel.totalFuel);
    const fuelCost = numericValue(fuel.fuelCost);
    const maintenanceCost = numericValue(maintenanceTotals[0]?.total);
    const acquisitionCost = numericValue(fleetTotals[0]?.total);
    const revenue = numericValue(trips.revenue);
    const operationalCost = safeAdd(fuelCost, maintenanceCost);

    const fleetStatus = await Vehicle.aggregate([
      { $match: { status: { $ne: "Retired" } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const onTripVehicles = fleetStatus.find((item) => item._id === "On Trip")?.count || 0;
    const activeVehicles = fleetStatus.reduce(
      (total, item) => total + numericValue(item.count),
      0
    );

    return res.status(200).json({
      totalTrips: numericValue(trips.totalTrips),
      totalDistance,
      totalFuel,
      fuelEfficiency: safeRatio(totalDistance, totalFuel, 2),
      fuelCost,
      maintenanceCost,
      operationalCost,
      fleetUtilization:
        activeVehicles > 0
          ? safeRatio(onTripVehicles * 100, activeVehicles, 2)
          : 0,
      revenue,
      vehicleROI:
        acquisitionCost > 0
          ? safeRatio(safeAdd(revenue, -operationalCost) * 100, acquisitionCost, 2)
          : 0,
    });
  } catch (error) {
    console.error("Analytics query failed:", error.name || "Error");
    return res.status(500).json({ message: "Unable to load analytics." });
  }
};

module.exports = { getAnalytics };
