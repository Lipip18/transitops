const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { recordAuditLog } = require("./auditController");

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (password) =>
  password.length >= 8 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password);

// GET PROFILE
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.json(user);
  } catch (error) {
    console.error("User profile query failed:", error.name || "Error");
    res.status(500).json({ message: "Unable to load user profile." });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length < 2 || name.length > 100) {
        return res.status(400).json({ message: "Name must be between 2 and 100 characters." });
      }
      updates.name = name;
    }
    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Enter a valid email address." });
      }
      updates.email = email;
    }
    if (req.body.phone !== undefined) {
      const phone = String(req.body.phone).trim();
      if (phone.length > 30) {
        return res.status(400).json({ message: "Phone number must be 30 characters or fewer." });
      }
      updates.phone = phone;
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: "Provide at least one profile field to update." });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    await recordAuditLog({
      actor: user,
      action: "Profile Updated",
      entity: "User",
      entityId: user._id,
      metadata: { changedFields: Object.keys(updates) },
    });
    return res.json({ user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    const isBadRequest = error.name === "ValidationError";
    if (!isBadRequest) console.error("Profile update failed:", error.name || "Error");
    return res.status(isBadRequest ? 400 : 500).json({
      message: isBadRequest ? "Invalid profile details." : "Unable to update profile.",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({ message: "Current and new passwords are required." });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: "New password must have at least 8 characters, one uppercase letter, one lowercase letter, and one number.",
      });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await recordAuditLog({
      actor: user,
      action: "Password Changed",
      entity: "User",
      entityId: user._id,
    });
    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Password change failed:", error.name || "Error");
    return res.status(500).json({ message: "Unable to change password." });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};