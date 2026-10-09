const Expense = require("../models/Expense");
const Vehicle = require("../models/Vehicle");
const { recordAuditLog } = require("./auditController");

const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("vehicle")
      .sort({ createdAt: -1 });

    res.status(200).json(expenses);
  } catch (error) {
    console.error("Expense query failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to load expenses." });
  }
};

const createExpense = async (req, res) => {
  try {
    const { vehicle, expenseType, amount, description, date } = req.body;
    const numericAmount = Number(amount);

    if (
      !vehicle ||
      !["Fuel", "Maintenance", "Toll", "Insurance", "Salary", "Other"].includes(
        expenseType
      ) ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        message: "A valid vehicle, expense type, and amount greater than zero are required.",
      });
    }

    const selectedVehicle = await Vehicle.findById(vehicle);
    if (!selectedVehicle) {
      return res.status(404).json({ message: "Vehicle not found." });
    }

    const expense = await Expense.create({
      vehicle: selectedVehicle._id,
      expenseType,
      amount: numericAmount,
      description,
      date: date || new Date(),
    });

    await recordAuditLog({
      actor: req.user,
      action: "Expense Created",
      entity: "Expense",
      entityId: expense._id,
      metadata: {
        vehicle: selectedVehicle.registrationNumber,
        expenseType: expense.expenseType,
        amount: expense.amount,
      },
    });
    return res.status(201).json(expense);
  } catch (error) {
    const isBadRequest =
      error.name === "ValidationError" || error.name === "CastError";
    if (!isBadRequest) {
      console.error("Expense creation failed:", error.name || "Error");
    }
    return res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? error.message : "Unable to create expense.",
    });
  }
};

module.exports = {
  getExpenses,
  createExpense,
};