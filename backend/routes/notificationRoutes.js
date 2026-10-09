const express = require("express");

const router = express.Router();

const {
  getNotifications,
  markAsRead,
} = require("../controllers/notificationController");

const {
  protect,
  validateObjectIdParam,
} = require("../middleware/authMiddleware");

router.get("/", protect, getNotifications);

router.put(
  "/:id",
  protect,
  validateObjectIdParam,
  markAsRead
);

module.exports = router;