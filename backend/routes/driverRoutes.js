const express = require("express");

const router = express.Router();

const {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  updateDriverCompliance,
  deleteDriver,
} = require("../controllers/driverController");

const {
  protect,
  authorize,
  validateObjectIdParam,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  authorize("Fleet Manager", "Safety Officer"),
  getDrivers
);

router.get(
  "/:id",
  protect,
  authorize("Fleet Manager", "Safety Officer"),
  validateObjectIdParam,
  getDriverById
);

router.patch(
  "/:id/compliance",
  protect,
  authorize("Safety Officer"),
  validateObjectIdParam,
  updateDriverCompliance
);

router.post(
  "/",
  protect,
  authorize("Fleet Manager"),
  createDriver
);

router.put(
  "/:id",
  protect,
  authorize("Fleet Manager"),
  validateObjectIdParam,
  updateDriver
);

router.delete(
  "/:id",
  protect,
  authorize("Fleet Manager"),
  validateObjectIdParam,
  deleteDriver
);

module.exports = router;