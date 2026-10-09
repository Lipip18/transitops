const express = require("express");

const {
  getExpenses,
  createExpense,
} = require("../controllers/expenseController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router
  .route("/")
  .get(
    protect,
    authorize("Fleet Manager", "Financial Analyst"),
    getExpenses
  )
  .post(
    protect,
    authorize("Fleet Manager", "Financial Analyst"),
    createExpense
  );

module.exports = router;