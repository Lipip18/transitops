const express = require("express");

const router = express.Router();

const {
  createFuelLog,
  getFuelLogs,
  updateFuelLog,
  deleteFuelLog,
} = require("../controllers/fuelController");

const {
  protect,
  authorize,
  validateObjectIdParam,
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

router
  .route("/:id")
  .put(
    protect,
    authorize("Fleet Manager", "Financial Analyst"),
    validateObjectIdParam,
    updateFuelLog
  )
  .delete(
    protect,
    authorize("Fleet Manager", "Financial Analyst"),
    validateObjectIdParam,
    deleteFuelLog
  );

module.exports = router;