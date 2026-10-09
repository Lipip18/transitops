const express = require("express");

const router = express.Router();

const {
  createFuelLog,
  getFuelLogs,
} = require("../controllers/fuelController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  authorize("Fleet Manager", "Financial Analyst"),
  getFuelLogs
);

router.post(
  "/",
  protect,
  authorize(
    "Fleet Manager",
    "Financial Analyst"
  ),
  createFuelLog
);

module.exports = router;