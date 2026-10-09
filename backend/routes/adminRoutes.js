const express = require("express");

const router = express.Router();

const {
  getUsers,
  deleteUser,
} = require("../controllers/adminController");

const {
  protect,
  authorize,
  validateObjectIdParam,
} = require("../middleware/authMiddleware");

router.get(
  "/users",
  protect,
  authorize("Admin", "Fleet Manager"),
  getUsers
);

router.delete(
  "/users/:id",
  protect,
  authorize("Admin", "Fleet Manager"),
  validateObjectIdParam,
  deleteUser
);

module.exports = router;