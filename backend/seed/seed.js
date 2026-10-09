const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const Maintenance = require("../models/Maintenance");
const FuelLog = require("../models/FuelLog");
const Expense = require("../models/Expense");

const SEED_MARKER = "[TransitOps Seed]";
const PASSWORD = "TransitOpsDemo2026!";
const DAY_MS = 24 * 60 * 60 * 1000;

const roles = [
  ["fleetmanager", "Maya Kapoor", "Fleet Manager"],
  ["driver", "Arjun Mehta", "Driver"],
  ["safetyofficer", "Priya Nair", "Safety Officer"],
  ["financialanalyst", "Rohan Shah", "Financial Analyst"],
  ["admin", "Ananya Rao", "Admin"],
];

const vehicleTypes = [
  ["Truck", "Tata", "Prima 5530.S", 18000, 31_000_000, "Diesel"],
  ["Truck", "Ashok Leyland", "AVTR 4825", 16000, 27_000_000, "Diesel"],
  ["Bus", "Volvo", "B8R Intercity", 2500, 18_000_000, "Diesel"],
  ["Van", "Force", "Traveller 3350", 1400, 3_800_000, "Diesel"],
  ["Mini Truck", "Tata", "407 Gold", 2500, 2_100_000, "Diesel"],
  ["Pickup", "Mahindra", "Bolero Pik-Up", 1250, 1_900_000, "Diesel"],
  ["Car", "Maruti Suzuki", "Ertiga Tour", 500, 1_450_000, "Petrol"],
  ["Truck", "BharatBenz", "3528C", 14000, 29_000_000, "Diesel"],
  ["Van", "Tata", "Winger Cargo", 1100, 2_400_000, "Diesel"],
  ["Pickup", "Isuzu", "D-Max V-Cross", 1000, 2_800_000, "Diesel"],
];

const driverNames = [
  "Aarav Sharma", "Ishita Verma", "Vihaan Patel", "Anaya Reddy", "Aditya Iyer",
  "Meera Joshi", "Kabir Singh", "Diya Menon", "Reyansh Gupta", "Sara Khan",
  "Arnav Desai", "Kiara Nair", "Vivaan Kulkarni", "Aadhya Rao", "Dhruv Shah",
  "Myra Pillai", "Advait Das", "Saanvi Bhat", "Ritvik Shetty", "Nisha Thomas",
  "Karan Malhotra", "Pooja Krishnan", "Manav Chawla", "Tara Fernandes",
  "Neil D'Souza", "Riya Ghosh", "Yash Patil", "Lavanya Sethi", "Om Prakash",
  "Zoya Ali",
];

const locations = [
  "Bengaluru", "Mysuru", "Chennai", "Hyderabad", "Pune", "Mumbai",
  "Kochi", "Mangaluru", "Coimbatore", "Hubballi", "Vijayawada", "Goa",
];

const maintenanceTypes = [
  "Preventive", "Corrective", "Engine Repair", "Oil Change", "Brake Service",
  "Tyre Replacement", "Battery Replacement", "General Service",
];

const expenseTypes = ["Toll", "Insurance", "Salary", "Other", "Maintenance"];
const paymentMethods = ["Cash", "Card", "UPI", "Company Account"];

const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);
const randomBetween = (min, max) =>
  Math.round(min + Math.random() * (max - min));
const pick = (items, index) => items[index % items.length];
const isDuplicateKeyError = (error) => error && error.code === 11000;

const clearExistingSeedData = async () => {
  const seedVehicles = await Vehicle.find({
    notes: SEED_MARKER,
  }).select("_id");
  const seedDrivers = await Driver.find({
    employeeId: /^\[TransitOps Seed\] Driver \d{2}$/,
  }).select("_id");

  const vehicleIds = seedVehicles.map(({ _id }) => _id);
  const driverIds = seedDrivers.map(({ _id }) => _id);

  const [unownedTrips, unownedMaintenance, unownedFuel, unownedExpenses] =
    await Promise.all([
      Trip.countDocuments({
        $or: [
          { vehicle: { $in: vehicleIds }, source: { $not: /^\[TransitOps Seed\]/ } },
          { driver: { $in: driverIds }, source: { $not: /^\[TransitOps Seed\]/ } },
        ],
      }),
      Maintenance.countDocuments({
        vehicle: { $in: vehicleIds },
        description: { $not: /^\[TransitOps Seed\]/ },
      }),
      FuelLog.countDocuments({
        $or: [
          { vehicle: { $in: vehicleIds } },
          { driver: { $in: driverIds } },
        ],
        receiptNumber: { $not: /^TRANSITOPS-SEED-/ },
      }),
      Expense.countDocuments({
        vehicle: { $in: vehicleIds },
        description: { $not: /^\[TransitOps Seed\]/ },
      }),
    ]);

  if (unownedTrips + unownedMaintenance + unownedFuel + unownedExpenses > 0) {
    throw new Error(
      "Seed-owned vehicles or drivers have non-seed records linked to them. No records were cleared."
    );
  }

  await Promise.all([
    Trip.deleteMany({ source: /^\[TransitOps Seed\]/ }),
    Maintenance.deleteMany({ description: /^\[TransitOps Seed\]/ }),
    FuelLog.deleteMany({ receiptNumber: /^TRANSITOPS-SEED-/ }),
    Expense.deleteMany({ description: /^\[TransitOps Seed\]/ }),
  ]);
  await Promise.all([
    Vehicle.deleteMany({ _id: { $in: vehicleIds } }),
    Driver.deleteMany({ _id: { $in: driverIds } }),
  ]);
};

const createUsers = async () => {
  const password = await bcrypt.hash(PASSWORD, 10);
  const driverEmail = "seed.driver@transitops.test";
  const documents = roles.map(([key, name, role], index) => ({
    name,
    email: `seed.${key}@transitops.test`,
    password,
    role,
    phone: `+91 98${String(10000000 + index).slice(-8)}`,
    isActive: true,
  }));
  const users = await Promise.all(
    documents.map((document) =>
      User.findOneAndUpdate(
        { email: document.email },
        { $set: document },
        {
          returnDocument: "after",
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      )
    )
  );
  return {
    users,
    driverEmail,
  };
};

const createVehicles = async () => {
  const statuses = [
    ...Array(12).fill("Available"),
    ...Array(8).fill("On Trip"),
    ...Array(5).fill("In Shop"),
    ...Array(5).fill("Retired"),
  ];
  const documents = statuses.map((status, index) => {
    const [type, manufacturer, model, capacity, acquisitionCost, fuelType] =
      pick(vehicleTypes, index);
    const year = randomBetween(2016, 2025);
    const odometer = randomBetween(22_000, 315_000);
    return {
      registrationNumber: `KA-01-TS-${String(index + 1).padStart(3, "0")}`,
      vehicleName: `${manufacturer} ${model}`,
      type,
      model,
      manufacturer,
      year,
      maximumLoadCapacity: capacity,
      odometer,
      fuelType,
      fuelTankCapacity: type === "Car" ? 45 : type === "Bus" ? 300 : 200,
      averageMileage: type === "Bus" ? 4 : type === "Truck" ? 5.2 : 10.5,
      acquisitionCost,
      currentValue: Math.round(acquisitionCost * randomBetween(42, 86) / 100),
      insuranceNumber: `INS-SEED-${String(index + 1).padStart(3, "0")}`,
      insuranceExpiry: daysAgo(-randomBetween(60, 340)),
      pollutionExpiry: daysAgo(-randomBetween(30, 300)),
      lastServiceDate: daysAgo(randomBetween(5, 120)),
      nextServiceDate: daysAgo(-randomBetween(20, 150)),
      currentLocation: pick(locations, index),
      gpsEnabled: index % 4 !== 0,
      status,
      notes: SEED_MARKER,
    };
  });
  return Vehicle.insertMany(documents);
};

const createDrivers = async (driverEmail) => {
  const statuses = [
    ...Array(13).fill("Available"),
    ...Array(8).fill("On Trip"),
    ...Array(5).fill("Off Duty"),
    ...Array(4).fill("Suspended"),
  ];
  const documents = statuses.map((status, index) => {
    const expired = [24, 26, 27, 28].includes(index);
    const name = index === 0 ? "Arjun Mehta" : driverNames[index];
    return {
      name,
      employeeId: `${SEED_MARKER} Driver ${String(index + 1).padStart(2, "0")}`,
      licenseNumber: `KA-SEED-${String(index + 1).padStart(5, "0")}`,
      licenseCategory:
        index % 5 === 0 ? "LMV" : index % 3 === 0 ? "Transport" : "Commercial",
      licenseExpiryDate: expired
        ? daysAgo(randomBetween(10, 600))
        : daysAgo(-randomBetween(90, 1200)),
      contactNumber: `+91 97${String(10000000 + index).slice(-8)}`,
      email: index === 0
        ? driverEmail
        : `seed.driver${String(index + 1).padStart(2, "0")}@transitops.test`,
      address: `${100 + index}, ${pick(locations, index)} Main Road`,
      emergencyContactName: `Emergency Contact ${index + 1}`,
      emergencyContactNumber: `+91 96${String(10000000 + index).slice(-8)}`,
      dateOfBirth: daysAgo(randomBetween(25 * 365, 58 * 365)),
      joiningDate: daysAgo(randomBetween(150, 3650)),
      yearsOfExperience: randomBetween(2, 28),
      salary: randomBetween(24_000, 68_000),
      safetyScore: randomBetween(68, 100),
      totalTrips: randomBetween(8, 320),
      totalDistanceDriven: randomBetween(12_000, 480_000),
      accidents: index % 8 === 0 ? 1 : 0,
      medicalCertificateExpiry: daysAgo(-randomBetween(30, 300)),
      status,
      remarks: SEED_MARKER,
    };
  });
  return Driver.insertMany(documents);
};

const createTrips = async (vehicles, drivers) => {
  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "Available");
  const onTripVehicles = vehicles.filter((vehicle) => vehicle.status === "On Trip");
  const availableDrivers = drivers.filter((driver) => driver.status === "Available");
  const onTripDrivers = drivers.filter((driver) => driver.status === "On Trip");
  const eligibleVehicles = [...availableVehicles, ...onTripVehicles];
  const eligibleDrivers = [...availableDrivers, ...onTripDrivers];
  const documents = [];
  const routePairs = [
    ["Bengaluru", "Chennai"], ["Mysuru", "Pune"], ["Hyderabad", "Mumbai"],
    ["Kochi", "Coimbatore"], ["Mangaluru", "Goa"], ["Hubballi", "Bengaluru"],
    ["Vijayawada", "Hyderabad"], ["Mumbai", "Pune"],
  ];
  const addTrip = (status, index, vehicle, driver, daysOld) => {
    const plannedDistance = randomBetween(85, 1250);
    const cargoWeight = randomBetween(
      120,
      Math.max(121, Math.floor(vehicle.maximumLoadCapacity * 0.85))
    );
    const [source, destination] = pick(routePairs, index);
    const createdAt = daysAgo(daysOld);
    const actualDistance = Math.round(plannedDistance * (0.94 + Math.random() * 0.13));
    documents.push({
      source: `${SEED_MARKER} ${source}`,
      destination,
      vehicle: vehicle._id,
      driver: driver._id,
      cargoWeight,
      cargoType: pick(["Packaged food", "Building materials", "Retail goods", "Machinery", "Textiles"], index),
      plannedDistance,
      actualDistance: status === "Completed" ? actualDistance : 0,
      estimatedDuration: Math.ceil(plannedDistance / 55),
      actualDuration: status === "Completed" ? Math.ceil(actualDistance / 48) : 0,
      departureTime:
        status === "Dispatched" ? daysAgo(randomBetween(0, 4)) : status === "Completed" ? createdAt : undefined,
      arrivalTime: status === "Completed" ? new Date(createdAt.getTime() + randomBetween(3, 18) * 60 * 60 * 1000) : undefined,
      completedAt: status === "Completed" ? createdAt : undefined,
      fuelConsumed: status === "Completed" ? Number((actualDistance / randomBetween(4, 12)).toFixed(1)) : 0,
      fuelCost: status === "Completed" ? randomBetween(4_500, 42_000) : 0,
      tollCharges: status === "Completed" ? randomBetween(0, 4_500) : 0,
      otherExpenses: status === "Completed" ? randomBetween(0, 2_500) : 0,
      revenue: status === "Completed" ? randomBetween(12_000, 135_000) : 0,
      remarks: SEED_MARKER,
      status,
      createdAt,
      updatedAt: createdAt,
    });
  };

  for (let index = 0; index < 70; index += 1) {
    addTrip(
      "Completed",
      index,
      pick(eligibleVehicles, index),
      pick(eligibleDrivers, index),
      randomBetween(15, 650)
    );
  }
  for (let index = 0; index < 10; index += 1) {
    addTrip(
      "Cancelled",
      index + 70,
      pick(availableVehicles, index),
      pick(availableDrivers, index),
      randomBetween(1, 250)
    );
  }
  for (let index = 0; index < 12; index += 1) {
    addTrip(
      "Draft",
      index + 80,
      pick(availableVehicles, index),
      pick(availableDrivers, index),
      randomBetween(0, 45)
    );
  }
  for (let index = 0; index < 8; index += 1) {
    addTrip(
      "Dispatched",
      index + 92,
      onTripVehicles[index],
      onTripDrivers[index],
      randomBetween(0, 4)
    );
  }
  return Trip.insertMany(documents);
};

const createMaintenance = async (vehicles) => {
  const shopVehicles = vehicles.filter((vehicle) => vehicle.status === "In Shop");
  const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "Available");
  const documents = [];

  shopVehicles.forEach((vehicle, index) => {
    documents.push({
      vehicle: vehicle._id,
      maintenanceType: pick(maintenanceTypes, index),
      description: `${SEED_MARKER} Active service: ${pick(["brake inspection", "engine diagnostics", "scheduled service", "cooling system repair"], index)}.`,
      serviceCenter: pick(["Apex Fleet Care", "Metro Auto Works", "National Truck Service"], index),
      technician: `Technician ${index + 1}`,
      invoiceNumber: `SEED-MNT-A-${String(index + 1).padStart(3, "0")}`,
      partsCost: randomBetween(4_000, 36_000),
      laborCost: randomBetween(2_000, 18_000),
      cost: randomBetween(7_000, 52_000),
      odometerReading: vehicle.odometer,
      priority: pick(["Low", "Medium", "High", "Critical"], index),
      status: "Active",
      startDate: daysAgo(randomBetween(0, 12)),
    });
  });

  for (let index = 0; index < 35; index += 1) {
    const vehicle = pick(availableVehicles, index);
    const startDate = daysAgo(randomBetween(20, 730));
    documents.push({
      vehicle: vehicle._id,
      maintenanceType: pick(maintenanceTypes, index + 2),
      description: `${SEED_MARKER} Completed ${pick(["preventive inspection", "tyre replacement", "oil and filter change", "annual service"], index)}.`,
      serviceCenter: pick(["Apex Fleet Care", "Metro Auto Works", "National Truck Service"], index + 1),
      technician: `Technician ${(index % 12) + 1}`,
      invoiceNumber: `SEED-MNT-C-${String(index + 1).padStart(3, "0")}`,
      partsCost: randomBetween(1_500, 28_000),
      laborCost: randomBetween(1_000, 14_000),
      cost: randomBetween(3_000, 42_000),
      odometerReading: vehicle.odometer,
      priority: pick(["Low", "Medium", "High"], index),
      status: "Completed",
      startDate,
      completedDate: new Date(startDate.getTime() + randomBetween(1, 5) * DAY_MS),
      nextServiceDate: daysAgo(-randomBetween(30, 365)),
    });
  }
  return Maintenance.insertMany(documents);
};

const createFuelLogs = async (vehicles, drivers, trips) => {
  const completedTrips = trips.filter((trip) => trip.status === "Completed");
  const paymentOptions = ["Cash", "Card", "UPI", "Company Account"];
  const documents = Array.from({ length: 100 }, (_, index) => {
    const trip = pick(completedTrips, index);
    const vehicle = vehicles.find(({ _id }) => _id.equals(trip.vehicle));
    const driver = drivers.find(({ _id }) => _id.equals(trip.driver));
    const liters = Number((randomBetween(22_000, 68_000) / 100).toFixed(2));
    const pricePerLiter = Number((randomBetween(9200, 11200) / 100).toFixed(2));
    const date = new Date(
      trip.completedAt.getTime() - randomBetween(0, 3) * DAY_MS
    );
    return {
      vehicle: vehicle._id,
      driver: driver._id,
      trip: trip._id,
      fuelType: vehicle.fuelType,
      fuelStation: pick(["IndianOil Highway Station", "Bharat Petroleum", "HP Fuel Point", "Shell Express"], index),
      odometerReading: Math.max(0, vehicle.odometer - randomBetween(0, 8_000)),
      liters,
      pricePerLiter,
      cost: Number((liters * pricePerLiter).toFixed(2)),
      paymentMethod: pick(paymentOptions, index),
      receiptNumber: `TRANSITOPS-SEED-FUEL-${String(index + 1).padStart(3, "0")}`,
      filledBy: driver.name,
      fuelEfficiency: Number((randomBetween(38, 110) / 10).toFixed(1)),
      remarks: SEED_MARKER,
      date,
      createdAt: date,
      updatedAt: date,
    };
  });
  return FuelLog.insertMany(documents);
};

const createExpenses = async (vehicles) => {
  const operationalVehicles = vehicles.filter((vehicle) => vehicle.status !== "Retired");
  const documents = Array.from({ length: 100 }, (_, index) => {
    const date = daysAgo(randomBetween(0, 730));
    return {
      vehicle: pick(operationalVehicles, index)._id,
      expenseType: pick(expenseTypes, index),
      amount: Number(randomBetween(750, 48_000).toFixed(2)),
      description: `${SEED_MARKER} ${pick(["highway tolls", "route permit", "tyre repair", "parking and loading", "fleet operations"], index)} #${index + 1}`,
      date,
      createdAt: date,
      updatedAt: date,
    };
  });
  return Expense.insertMany(documents);
};

const run = async () => {
  if (!process.env.MONGO_URI?.trim()) {
    throw new Error("MONGO_URI is required in backend/.env.");
  }
  if (!/^mongodb(?:\+srv)?:\/\//i.test(process.env.MONGO_URI.trim())) {
    throw new Error("MONGO_URI must be a MongoDB connection string.");
  }

  await mongoose.connect(process.env.MONGO_URI.trim());
  await clearExistingSeedData();

  const { driverEmail } = await createUsers();
  const vehicles = await createVehicles();
  const drivers = await createDrivers(driverEmail);
  const trips = await createTrips(vehicles, drivers);
  const maintenance = await createMaintenance(vehicles);
  const fuelLogs = await createFuelLogs(vehicles, drivers, trips);
  const expenses = await createExpenses(vehicles);

  console.log("\nSeed completed successfully.\n");
  console.log(`Users: ${roles.length}`);
  console.log(`Vehicles: ${vehicles.length}`);
  console.log(`Drivers: ${drivers.length}`);
  console.log(`Trips: ${trips.length}`);
  console.log(`Maintenance Logs: ${maintenance.length}`);
  console.log(`Fuel Logs: ${fuelLogs.length}`);
  console.log(`Expenses: ${expenses.length}\n`);
  console.log("Seeded account login credentials:");
  console.log(`Password for all accounts: ${PASSWORD}`);
  roles.forEach(([key, , role]) => {
    console.log(`- ${role}: seed.${key}@transitops.test`);
  });
  console.log("\nSeed-owned fleet records are replaced and demo accounts are updated in place on the next run.");
  console.log("All other records are preserved.");
};

run()
  .catch((error) => {
    console.error(
      `Seed failed: ${isDuplicateKeyError(error) ? "A seeded unique value conflicts with existing data." : error.message}`
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
