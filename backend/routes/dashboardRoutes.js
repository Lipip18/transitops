const express = require("express");
const router = express.Router();

const { getDashboard } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  authorize("Fleet Manager", "Financial Analyst", "Admin"),
  getDashboard
);

module.exports = router;