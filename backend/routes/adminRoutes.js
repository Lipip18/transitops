const express = require("express");

const router = express.Router();

const {
  getUsers,
  createUser,
  updateUser,
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
  authorize("Admin"),
  getUsers
);

router.post(
  "/users",
  protect,
  authorize("Admin"),
  createUser
);

router.put(
  "/users/:id",
  protect,
  authorize("Admin"),
  validateObjectIdParam,
  updateUser
);

router.delete(
  "/users/:id",
  protect,
  authorize("Admin"),
  validateObjectIdParam,
  deleteUser
);

module.exports = router;