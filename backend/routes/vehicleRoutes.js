const express = require("express");

const router = express.Router();

const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} = require("../controllers/vehicleController");

const {
  protect,
  authorize,
  validateObjectIdParam,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  authorize("Fleet Manager", "Driver", "Financial Analyst"),
  getVehicles
);

router.get(
  "/:id",
  protect,
  authorize("Fleet Manager", "Driver", "Financial Analyst"),
  validateObjectIdParam,
  getVehicleById
);

// Only Fleet Manager can modify vehicles
router.post(
  "/",
  protect,
  authorize("Fleet Manager"),
  createVehicle
);

router.put(
  "/:id",
  protect,
  authorize("Fleet Manager"),
  validateObjectIdParam,
  updateVehicle
);

router.delete(
  "/:id",
  protect,
  authorize("Fleet Manager"),
  validateObjectIdParam,
  deleteVehicle
);

module.exports = router;