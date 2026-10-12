const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { recordAuditLog } = require("./auditController");

const roles = [
  "Fleet Manager",
  "Driver",
  "Safety Officer",
  "Financial Analyst",
  "Admin",
];

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("User list query failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to load users." });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (
      !String(name || "").trim() ||
      !normalizedEmail ||
      typeof password !== "string" ||
      password.length < 6 ||
      !roles.includes(role)
    ) {
      return res.status(400).json({
        message: "Name, valid email, password (at least 6 characters), and a valid role are required.",
      });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role,
      phone: phone === undefined ? "" : String(phone).trim(),
    });

    await recordAuditLog({
      actor: req.user,
      action: "User Created",
      entity: "User",
      entityId: user._id,
      metadata: { email: user.email, role: user.role },
    });
    return res.status(201).json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email address already exists." });
    }
    const isBadRequest = error.name === "ValidationError" || error.name === "CastError";
    if (!isBadRequest) {
      console.error("User creation failed:", error.name || "Error");
    }
    return res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? error.message : "Unable to create user.",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.email !== undefined) {
      updates.email = String(req.body.email).trim().toLowerCase();
    }
    if (req.body.role !== undefined) {
      if (!roles.includes(req.body.role)) {
        return res.status(400).json({ message: "Invalid user role." });
      }
      updates.role = req.body.role;
    }
    if (req.body.phone !== undefined) updates.phone = String(req.body.phone).trim();
    if (req.body.isActive !== undefined) {
      if (typeof req.body.isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean." });
      }
      updates.isActive = req.body.isActive;
    }
    if (req.body.password !== undefined && req.body.password !== "") {
      if (typeof req.body.password !== "string" || req.body.password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters." });
      }
      updates.password = await bcrypt.hash(req.body.password, 10);
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "At least one user field must be provided." });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await recordAuditLog({
      actor: req.user,
      action: "User Updated",
      entity: "User",
      entityId: user._id,
      metadata: { email: user.email, role: user.role, changedFields: Object.keys(updates).filter((field) => field !== "password") },
    });
    return res.status(200).json(user);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email address already exists." });
    }
    const isBadRequest = error.name === "ValidationError" || error.name === "CastError";
    if (!isBadRequest) {
      console.error("User update failed:", error.name || "Error");
    }
    return res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? error.message : "Unable to update user.",
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await recordAuditLog({
      actor: req.user,
      action: "User Deleted",
      entity: "User",
      entityId: user._id,
      metadata: { email: user.email, role: user.role },
    });
    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    const isBadRequest = error.name === "CastError";
    res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? "Invalid user id." : "Unable to delete user.",
    });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};