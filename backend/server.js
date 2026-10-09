require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const driverRoutes = require("./routes/driverRoutes");
const tripRoutes = require("./routes/tripRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const fuelRoutes = require("./routes/fuelRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const auditRoutes = require("./routes/auditRoutes");

const app = express();

/* ==========================
   Middleware
========================== */

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

/* ==========================
   API Routes
========================== */

app.use("/api/auth", authRoutes);

app.use("/api/vehicles", vehicleRoutes);

app.use("/api/drivers", driverRoutes);

app.use("/api/trips", tripRoutes);

app.use("/api/maintenance", maintenanceRoutes);

app.use("/api/fuel", fuelRoutes);

app.use("/api/expenses", expenseRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/reports", reportRoutes);

app.use("/api/users", userRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/notifications", notificationRoutes);

app.use("/api/audit", auditRoutes);

app.get("/api/health", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    status: databaseConnected ? "healthy" : "unhealthy",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

/* ==========================
   Root Route
========================== */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🚚 TransitOps API is running successfully",
  });
});

/* ==========================
   404 Route
========================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ==========================
   Global Error Handler
========================== */

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const isBadRequest =
    err.status === 400 ||
    err.name === "ValidationError" ||
    err.name === "CastError";
  const statusCode = isBadRequest ? 400 : 500;

  if (statusCode === 500) {
    console.error("API request failed:", err.name || "Error");
  }

  res.status(statusCode).json({
    success: false,
    message: isBadRequest ? "Invalid request." : "Internal server error.",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  const missingVariables = ["MONGO_URI", "JWT_SECRET"].filter(
    (name) => !process.env[name]?.trim()
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`
    );
  }

  process.env.MONGO_URI = process.env.MONGO_URI.trim();
  if (!/^mongodb(?:\+srv)?:\/\//i.test(process.env.MONGO_URI)) {
    throw new Error("MONGO_URI must be a MongoDB connection string.");
  }

  try {
    await connectDB();
  } catch (error) {
    console.error("MongoDB connection failed; the HTTP server was not started.");
    console.error("Database error type:", error.name || "Error");
    const safeMessage = String(error.message || "Unknown database error")
      .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, "MongoDB URI [redacted]")
      .replace(
        /(username|user|password|pwd)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,]+)/gi,
        "$1=[redacted]"
      );
    console.error("Database connection detail:", safeMessage);
    process.exitCode = 1;
    return;
  }

  const server = app.listen(PORT, () => {
    console.log(`TransitOps API listening on port ${PORT}`);
  });

  let isShuttingDown = false;
  const shutdown = (signal) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`${signal} received; shutting down gracefully.`);
    server.close(async (error) => {
      if (error) {
        console.error("HTTP server shutdown failed:", error.name || "Error");
        process.exitCode = 1;
      }

      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        console.error(
          "MongoDB shutdown failed:",
          disconnectError.name || "Error"
        );
        process.exitCode = 1;
      }
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer().catch((error) => {
  console.error("TransitOps API startup failed:", error.message);
  process.exitCode = 1;
});