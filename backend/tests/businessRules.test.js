const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("node:crypto");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const Maintenance = require("../models/Maintenance");
const FuelLog = require("../models/FuelLog");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const { authorize, protect } = require("../middleware/authMiddleware");
const tripController = require("../controllers/tripController");
const vehicleController = require("../controllers/vehicleController");
const maintenanceController = require("../controllers/maintenanceController");
const fuelController = require("../controllers/fuelController");
const expenseController = require("../controllers/expenseController");
const dashboardController = require("../controllers/dashboardController");
const reportController = require("../controllers/reportController");
const { recordAuditLog } = require("../controllers/auditController");
const authController = require("../controllers/authController");
const notificationController = require("../controllers/notificationController");

const restorers = [];
const stub = (target, key, replacement) => {
  const original = target[key];
  restorers.push(() => {
    target[key] = original;
  });
  target[key] = replacement;
};

const response = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const query = (value) => ({ session: async () => value });

const newSession = () => ({
  withTransaction: async (callback) => callback(),
  endSession: async () => {},
});

const makeTrip = (status = "Draft") => ({
  _id: "trip-1",
  source: "Depot",
  destination: "Terminal",
  vehicle: "vehicle-1",
  driver: "driver-1",
  cargoWeight: 80,
  status,
  plannedDistance: 10,
});

const makeVehicle = (status = "Available") => ({
  _id: "vehicle-1",
  vehicleName: "Transit truck",
  maximumLoadCapacity: 100,
  odometer: 120,
  status,
});

const makeDriver = (status = "Available", expiry = new Date(Date.now() + 86400000)) => ({
  _id: "driver-1",
  name: "Test Driver",
  licenseExpiryDate: expiry,
  status,
});

test.beforeEach(() => {
  stub(mongoose, "startSession", async () => newSession());
  stub(Notification, "create", async (data) => data);
  stub(AuditLog, "create", async (data) => data);
});

test.afterEach(() => {
  while (restorers.length) restorers.pop()();
});

const invokeTripCreation = async ({ vehicle, driver, cargoWeight = 80 }) => {
  stub(Vehicle, "findById", async () => vehicle);
  stub(Driver, "findById", async () => driver);
  const res = response();
  await tripController.createTrip(
    {
      body: {
        source: "Depot",
        destination: "Terminal",
        vehicle: "vehicle-1",
        driver: "driver-1",
        cargoWeight,
        plannedDistance: 10,
      },
    },
    res
  );
  return res;
};

const invokeDispatch = async ({ vehicle, driver, trip = makeTrip() }) => {
  stub(Trip, "findById", () => query(trip));
  stub(Vehicle, "findById", () => query(vehicle));
  stub(Driver, "findById", () => query(driver));
  stub(Vehicle, "findOneAndUpdate", async (filter, update) => {
    if (vehicle._id !== filter._id || vehicle.status !== filter.status) return null;
    Object.assign(vehicle, update.$set);
    return vehicle;
  });
  stub(Driver, "findOneAndUpdate", async (filter, update) => {
    if (driver._id !== filter._id || driver.status !== filter.status) return null;
    Object.assign(driver, update.$set);
    return driver;
  });
  stub(Trip, "findOneAndUpdate", async (filter, update) => {
    if (trip._id !== filter._id || trip.status !== filter.status) return null;
    Object.assign(trip, update.$set);
    return trip;
  });
  const res = response();
  await tripController.dispatchTrip({ params: { id: trip._id } }, res);
  return { res, vehicle, driver, trip };
};

test("retired vehicle cannot be dispatched", async () => {
  const { res } = await invokeDispatch({
    vehicle: makeVehicle("Retired"),
    driver: makeDriver(),
  });
  assert.equal(res.statusCode, 400);
});

test("vehicle in maintenance cannot be dispatched", async () => {
  const { res } = await invokeDispatch({
    vehicle: makeVehicle("In Shop"),
    driver: makeDriver(),
  });
  assert.equal(res.statusCode, 400);
});

test("vehicle already on a trip cannot be assigned to another trip", async () => {
  const res = await invokeTripCreation({
    vehicle: makeVehicle("On Trip"),
    driver: makeDriver(),
  });
  assert.equal(res.statusCode, 400);
});

test("expired driver cannot be assigned", async () => {
  const res = await invokeTripCreation({
    vehicle: makeVehicle(),
    driver: makeDriver("Available", new Date(Date.now() - 1000)),
  });
  assert.equal(res.statusCode, 400);
});

test("suspended driver cannot be assigned", async () => {
  const res = await invokeTripCreation({
    vehicle: makeVehicle(),
    driver: makeDriver("Suspended"),
  });
  assert.equal(res.statusCode, 400);
});

test("off-duty driver cannot be assigned", async () => {
  const res = await invokeTripCreation({
    vehicle: makeVehicle(),
    driver: makeDriver("Off Duty"),
  });
  assert.equal(res.statusCode, 400);
});

test("cargo above vehicle capacity is rejected", async () => {
  const res = await invokeTripCreation({
    vehicle: makeVehicle(),
    driver: makeDriver(),
    cargoWeight: 101,
  });
  assert.equal(res.statusCode, 400);
});

test("planned distance must be greater than zero", async () => {
  const res = response();
  await tripController.createTrip(
    {
      body: {
        source: "Depot",
        destination: "Terminal",
        vehicle: "vehicle-1",
        driver: "driver-1",
        cargoWeight: 10,
        plannedDistance: 0,
      },
    },
    res
  );
  assert.equal(res.statusCode, 400);
});

test("dispatch atomically marks the vehicle and driver On Trip", async () => {
  const result = await invokeDispatch({
    vehicle: makeVehicle(),
    driver: makeDriver(),
  });
  assert.equal(result.res.statusCode, 200);
  assert.equal(result.vehicle.status, "On Trip");
  assert.equal(result.driver.status, "On Trip");
  assert.equal(result.trip.status, "Dispatched");
});

test("completion restores vehicle and driver and records final odometer", async () => {
  const trip = makeTrip("Dispatched");
  const vehicle = makeVehicle("On Trip");
  const driver = makeDriver("On Trip");
  stub(Trip, "findById", () => query(trip));
  stub(Vehicle, "findById", () => query(vehicle));
  stub(Driver, "findById", () => query(driver));
  stub(Vehicle, "findOneAndUpdate", async (filter, update) => {
    if (vehicle.status !== filter.status) return null;
    Object.assign(vehicle, update.$set);
    return vehicle;
  });
  stub(Driver, "findOneAndUpdate", async (filter, update) => {
    if (driver.status !== filter.status) return null;
    Object.assign(driver, update.$set);
    return driver;
  });
  stub(Trip, "findOneAndUpdate", async (filter, update) => {
    if (trip.status !== filter.status) return null;
    Object.assign(trip, update.$set);
    return trip;
  });
  const res = response();
  await tripController.completeTrip(
    { params: { id: trip._id }, body: { finalOdometer: 150, fuelConsumed: 5 } },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(vehicle.status, "Available");
  assert.equal(vehicle.odometer, 150);
  assert.equal(driver.status, "Available");
  assert.equal(trip.status, "Completed");
  assert.equal(trip.actualDistance, 30);
  assert.ok(trip.completedAt instanceof Date);
});

test("cancelling a dispatched trip restores vehicle and driver", async () => {
  const trip = makeTrip("Dispatched");
  const vehicle = makeVehicle("On Trip");
  const driver = makeDriver("On Trip");
  stub(Trip, "findById", () => query(trip));
  stub(Vehicle, "findById", () => query(vehicle));
  stub(Driver, "findById", () => query(driver));
  stub(Vehicle, "findOneAndUpdate", async (filter, update) => {
    if (vehicle.status !== filter.status) return null;
    Object.assign(vehicle, update.$set);
    return vehicle;
  });
  stub(Driver, "findOneAndUpdate", async (filter, update) => {
    if (driver.status !== filter.status) return null;
    Object.assign(driver, update.$set);
    return driver;
  });
  stub(Trip, "findOneAndUpdate", async (filter, update) => {
    if (trip.status !== filter.status) return null;
    Object.assign(trip, update.$set);
    return trip;
  });
  const res = response();
  await tripController.cancelTrip({ params: { id: trip._id } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(vehicle.status, "Available");
  assert.equal(driver.status, "Available");
  assert.equal(trip.status, "Cancelled");
});

test("completed trips cannot be cancelled", async () => {
  const trip = makeTrip("Completed");
  stub(Trip, "findById", () => query(trip));
  const res = response();
  await tripController.cancelTrip({ params: { id: trip._id } }, res);
  assert.equal(res.statusCode, 400);
});

test("starting maintenance marks an available vehicle In Shop", async () => {
  const vehicle = makeVehicle();
  const maintenance = { _id: "maintenance-1", status: "Active" };
  stub(Vehicle, "findById", () => query(vehicle));
  stub(Vehicle, "findOneAndUpdate", async (filter, update) => {
    if (vehicle.status !== filter.status) return null;
    Object.assign(vehicle, update.$set);
    return vehicle;
  });
  stub(Maintenance, "create", async ([record]) => [{ ...record, ...maintenance }]);
  const res = response();
  await maintenanceController.createMaintenance(
    {
      body: {
        vehicle: vehicle._id,
        maintenanceType: "General Service",
        description: "Scheduled service",
        cost: 10,
      },
    },
    res
  );
  assert.equal(res.statusCode, 201);
  assert.equal(vehicle.status, "In Shop");
  assert.equal(res.body.status, "Active");
});

test("vehicles On Trip cannot enter maintenance", async () => {
  const vehicle = makeVehicle("On Trip");
  stub(Vehicle, "findById", () => query(vehicle));
  const res = response();
  await maintenanceController.createMaintenance(
    { body: { vehicle: vehicle._id } },
    res
  );
  assert.equal(res.statusCode, 400);
  assert.equal(vehicle.status, "On Trip");
});

test("completing active maintenance restores an In Shop vehicle", async () => {
  const vehicle = makeVehicle("In Shop");
  const maintenance = {
    _id: "maintenance-1",
    vehicle: vehicle._id,
    status: "Active",
  };
  let maintenanceLookups = 0;
  stub(Maintenance, "findById", () => {
    maintenanceLookups += 1;
    return query(maintenanceLookups === 1 ? maintenance : completedMaintenance);
  });
  stub(Maintenance, "updateOne", async () => ({ matchedCount: 1 }));
  stub(Vehicle, "findById", () => query(vehicle));
  stub(Vehicle, "findOneAndUpdate", async (filter, update) => {
    if (vehicle.status !== filter.status) return null;
    Object.assign(vehicle, update.$set);
    return vehicle;
  });
  const completedMaintenance = { ...maintenance, status: "Completed" };
  const res = response();
  await maintenanceController.completeMaintenance(
    { params: { id: maintenance._id } },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(vehicle.status, "Available");
  assert.equal(res.body.status, "Completed");
});

test("In Shop vehicles are excluded from dispatch selection", async () => {
  let observedFilter;
  stub(Vehicle, "countDocuments", async (filter) => {
    observedFilter = filter;
    return 0;
  });
  stub(Vehicle, "find", () => ({
    sort: () => ({
      skip: () => ({
        limit: () => ({
          lean: async () => [],
        }),
      }),
    }),
  }));
  const res = response();
  await vehicleController.getVehicles(
    { query: { availableForDispatch: "true" }, user: { role: "Fleet Manager" } },
    res
  );
  assert.equal(observedFilter.status, "Available");
  assert.equal(res.statusCode, 200);
});

test("authenticated but unauthorized role receives HTTP 403", () => {
  const res = response();
  authorize("Fleet Manager")({ user: { role: "Driver" } }, res, () => {
    assert.fail("Unauthorized request should not continue");
  });
  assert.equal(res.statusCode, 403);
});

test("unauthenticated request receives HTTP 401", async () => {
  const res = response();
  await protect({ headers: {} }, res, () => {
    assert.fail("Unauthenticated request should not continue");
  });
  assert.equal(res.statusCode, 401);
});

test("invalid and expired JWTs receive HTTP 401", async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = randomBytes(32).toString("hex");
  try {
    const invalidResponse = response();
    await protect(
      { headers: { authorization: "Bearer invalid.token.value" } },
      invalidResponse,
      () => assert.fail("Invalid token should not continue")
    );
    assert.equal(invalidResponse.statusCode, 401);

    const expiredToken = jwt.sign(
      { id: "507f1f77bcf86cd799439011" },
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );
    const expiredResponse = response();
    await protect(
      { headers: { authorization: `Bearer ${expiredToken}` } },
      expiredResponse,
      () => assert.fail("Expired token should not continue")
    );
    assert.equal(expiredResponse.statusCode, 401);
    assert.match(expiredResponse.body.message, /expired/i);
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test("JWT role claims are ignored in favor of the database user role", async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = randomBytes(32).toString("hex");
  stub(User, "findById", () => ({
    select: async () => ({
      _id: "507f1f77bcf86cd799439011",
      role: "Driver",
      isActive: true,
    }),
  }));
  try {
    const token = jwt.sign(
      { id: "507f1f77bcf86cd799439011", role: "Admin" },
      process.env.JWT_SECRET
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = response();
    await protect(req, res, () => {});
    assert.equal(req.user.role, "Driver");
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test("fuel logs reject zero liters and price per liter", async () => {
  stub(Vehicle, "findById", async () => makeVehicle());
  const res = response();
  await fuelController.createFuelLog(
    {
      body: {
        vehicle: "vehicle-1",
        liters: 0,
        pricePerLiter: 0,
        odometerReading: 0,
      },
    },
    res
  );
  assert.equal(res.statusCode, 400);
});

test("expenses reject invalid types and non-positive amounts", async () => {
  stub(Vehicle, "findById", async () => makeVehicle());
  const res = response();
  await expenseController.createExpense(
    {
      body: {
        vehicle: "vehicle-1",
        expenseType: "Invalid",
        amount: 0,
      },
    },
    res
  );
  assert.equal(res.statusCode, 400);
});

test("dashboard counts and utilization exclude retired vehicles and honor filters", async () => {
  let observedVehicleFilter;
  stub(Vehicle, "aggregate", async (pipeline) => {
    if (pipeline[pipeline.length - 1].$group?._id === "$status") {
      observedVehicleFilter = pipeline[0].$match;
      return [
        { _id: "Available", count: 2 },
        { _id: "On Trip", count: 1 },
        { _id: "In Shop", count: 3 },
        { _id: "Retired", count: 99 },
      ];
    }
    return [{ types: ["Truck"], regions: ["North"] }];
  });
  stub(Trip, "aggregate", async () => [
    { _id: "Dispatched", count: 1, drivers: ["driver-1"] },
    { _id: "Draft", count: 4, drivers: [null] },
  ]);
  stub(Driver, "countDocuments", async () => 2);
  const res = response();

  await dashboardController.getDashboard(
    {
      query: { vehicleType: "Truck", vehicleStatus: "On Trip", region: "North" },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.activeVehicles, 6);
  assert.equal(res.body.pendingTrips, 4);
  assert.equal(res.body.driversOnDuty, 3);
  assert.equal(res.body.fleetUtilization, 16.7);
  assert.equal(observedVehicleFilter.type, "Truck");
  assert.equal(observedVehicleFilter.status, "On Trip");
  assert.equal(observedVehicleFilter.currentLocation, "North");
});

test("report analytics use stored revenue and safe zero denominators", async () => {
  stub(Trip, "aggregate", async () => [
    { totalTrips: 4, totalDistance: 120, revenue: 300 },
  ]);
  stub(FuelLog, "aggregate", async () => [
    { totalFuel: 0, fuelCost: 0 },
  ]);
  stub(Maintenance, "aggregate", async () => [{ total: 50 }]);
  let vehicleAggregateCalls = 0;
  stub(Vehicle, "aggregate", async () => {
    vehicleAggregateCalls += 1;
    return vehicleAggregateCalls === 1 ? [{ total: 0 }] : [];
  });
  const res = response();

  await reportController.getAnalytics({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.fuelEfficiency, 0);
  assert.equal(res.body.fleetUtilization, 0);
  assert.equal(res.body.vehicleROI, 0);
  assert.equal(res.body.revenue, 300);
  assert.equal(res.body.maintenanceCost, 50);
  assert.equal(res.body.operationalCost, 50);
});

test("report analytics calculate fuel efficiency, operational cost and ROI", async () => {
  stub(Trip, "aggregate", async () => [
    { totalTrips: 2, totalDistance: 120, revenue: 300 },
  ]);
  stub(FuelLog, "aggregate", async () => [
    { totalFuel: 20, fuelCost: 200 },
  ]);
  stub(Maintenance, "aggregate", async () => [{ total: 50 }]);
  let vehicleAggregateCalls = 0;
  stub(Vehicle, "aggregate", async () => {
    vehicleAggregateCalls += 1;
    return vehicleAggregateCalls === 1
      ? [{ total: 1000 }]
      : [
          { _id: "Available", count: 2 },
          { _id: "On Trip", count: 1 },
          { _id: "In Shop", count: 1 },
        ];
  });
  const res = response();

  await reportController.getAnalytics({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.fuelEfficiency, 6);
  assert.equal(res.body.fuelCost, 200);
  assert.equal(res.body.maintenanceCost, 50);
  assert.equal(res.body.operationalCost, 250);
  assert.equal(res.body.fleetUtilization, 25);
  assert.equal(res.body.revenue, 300);
  assert.equal(res.body.vehicleROI, 5);
  for (const value of Object.values(res.body)) {
    if (typeof value === "number") assert.equal(Number.isFinite(value), true);
  }
});

test("audit records redact credential-like metadata and include actor/entity", async () => {
  let stored;
  stub(AuditLog, "create", async (record) => {
    stored = record;
  });

  await recordAuditLog({
    actor: { _id: "user-1", name: "Test User" },
    action: "User Login",
    entity: "User",
    entityId: "user-1",
    metadata: { role: "Admin", token: "must-not-be-stored", result: { password: "secret" } },
  });

  assert.equal(stored.user, "Test User");
  assert.equal(stored.entityId, "user-1");
  assert.deepEqual(stored.metadata, { role: "Admin", result: {} });
  assert.doesNotMatch(stored.details, /must-not-be-stored|secret/);
});

test("public registration ignores a client-supplied privileged role", async () => {
  let savedUser;
  stub(User, "findOne", async () => null);
  stub(User, "create", async (data) => {
    savedUser = data;
    return {
      ...data,
      _id: "user-1",
      role: "Driver",
    };
  });
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = randomBytes(32).toString("hex");
  const res = response();

  try {
    await authController.registerUser(
      {
        body: {
          name: "Test User",
          email: "TEST@example.com",
          password: "valid-password",
          role: "Admin",
        },
      },
      res
    );
  } finally {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }

  assert.equal(res.statusCode, 201);
  assert.equal(savedUser.email, "test@example.com");
  assert.equal(savedUser.role, undefined);
  assert.equal(res.body.user.role, "Driver");
  assert.equal(Object.hasOwn(res.body.user, "password"), false);
  assert.equal(typeof res.body.token, "string");
  assert.equal(savedUser.password === "valid-password", false);
});

test("notifications are scoped to the authenticated role and user", async () => {
  let notificationFilter;
  stub(Notification, "find", (filter) => {
    notificationFilter = filter;
    return {
      sort: () => ({
        limit: () => ({
          lean: async () => [],
        }),
      }),
    };
  });
  const res = response();

  await notificationController.getNotifications(
    { user: { _id: "user-1", role: "Safety Officer" } },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.ok(notificationFilter.$or.some((condition) => condition.roles === "Safety Officer"));
  assert.ok(notificationFilter.$or.some((condition) => condition.recipientUser === "user-1"));
});
