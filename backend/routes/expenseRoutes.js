const express = require("express");

const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

const {
  protect,
  authorize,
  validateObjectIdParam,
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

router
  .route("/:id")
  .put(
    protect,
    authorize("Fleet Manager", "Financial Analyst"),
    validateObjectIdParam,
    updateExpense
  )
  .delete(
    protect,
    authorize("Fleet Manager", "Financial Analyst"),
    validateObjectIdParam,
    deleteExpense
  );

module.exports = router;