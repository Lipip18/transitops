const express = require("express");

const router = express.Router();

const {
  createTrip,
  updateDraftTrip,
  deleteDraftTrip,
  getTrips,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} = require("../controllers/tripController");

const {
  protect,
  authorize,
  validateObjectIdParam,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  authorize("Fleet Manager", "Driver"),
  getTrips
);

router.post(
  "/",
  protect,
  authorize("Fleet Manager"),
  createTrip
);

router.put(
  "/:id",
  protect,
  authorize("Fleet Manager"),
  validateObjectIdParam,
  updateDraftTrip
);

router.delete(
  "/:id",
  protect,
  authorize("Fleet Manager"),
  validateObjectIdParam,
  deleteDraftTrip
);

router.put(
  "/:id/dispatch",
  protect,
  authorize("Fleet Manager"),
  validateObjectIdParam,
  dispatchTrip
);

router.put(
  "/:id/complete",
  protect,
  authorize("Fleet Manager"),
  validateObjectIdParam,
  completeTrip
);

router.put(
  "/:id/cancel",
  protect,
  authorize("Fleet Manager"),
  validateObjectIdParam,
  cancelTrip
);

module.exports = router;