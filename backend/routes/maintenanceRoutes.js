const express = require("express");

const router = express.Router();

const {
  createMaintenance,
  getMaintenance,
  completeMaintenance,
  deleteMaintenance,
} = require("../controllers/maintenanceController");

const {
  protect,
  authorize,
  validateObjectIdParam,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  authorize("Fleet Manager"),
  getMaintenance
);

router.post(
  "/",
  protect,
  authorize("Fleet Manager"),
  createMaintenance
);

router.put(
  "/:id/complete",
  protect,
  authorize("Fleet Manager"),
  validateObjectIdParam,
  completeMaintenance
);

router.delete(
  "/:id",
  protect,
  authorize("Fleet Manager"),
  validateObjectIdParam,
  deleteMaintenance
);

module.exports = router;