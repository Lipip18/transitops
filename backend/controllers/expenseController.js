const Expense = require("../models/Expense");
const Vehicle = require("../models/Vehicle");
const { recordAuditLog } = require("./auditController");
const expenseTypes = ["Fuel", "Maintenance", "Toll", "Insurance", "Salary", "Other"];

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
      !expenseTypes.includes(expenseType) ||
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

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found." });

    const updates = {};
    if (req.body.vehicle !== undefined) {
      const vehicle = await Vehicle.findById(req.body.vehicle).select("_id");
      if (!vehicle) return res.status(404).json({ message: "Vehicle not found." });
      updates.vehicle = vehicle._id;
    }
    if (req.body.expenseType !== undefined) {
      if (!expenseTypes.includes(req.body.expenseType)) {
        return res.status(400).json({ message: "Invalid expense type." });
      }
      updates.expenseType = req.body.expenseType;
    }
    if (req.body.amount !== undefined) {
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: "Expense amount must be greater than zero." });
      }
      updates.amount = amount;
    }
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.date !== undefined) {
      const date = new Date(req.body.date);
      if (Number.isNaN(date.getTime())) return res.status(400).json({ message: "Invalid expense date." });
      updates.date = date;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "At least one expense field must be provided." });
    }

    Object.assign(expense, updates);
    await expense.save();
    await recordAuditLog({
      actor: req.user,
      action: "Expense Updated",
      entity: "Expense",
      entityId: expense._id,
      metadata: { expenseType: expense.expenseType, amount: expense.amount },
    });
    return res.status(200).json(expense);
  } catch (error) {
    const isBadRequest = error.name === "ValidationError" || error.name === "CastError";
    if (!isBadRequest) console.error("Expense update failed:", error.name || "Error");
    return res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? error.message : "Unable to update expense.",
    });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found." });
    await recordAuditLog({
      actor: req.user,
      action: "Expense Deleted",
      entity: "Expense",
      entityId: expense._id,
      metadata: { expenseType: expense.expenseType, amount: expense.amount },
    });
    return res.status(200).json({ message: "Expense deleted successfully." });
  } catch (error) {
    const isBadRequest = error.name === "CastError";
    if (!isBadRequest) console.error("Expense deletion failed:", error.name || "Error");
    return res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? "Invalid expense id." : "Unable to delete expense.",
    });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};