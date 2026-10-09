const User = require("../models/User");
const { recordAuditLog } = require("./auditController");

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

// Delete user
const deleteUser = async (req, res) => {
  try {
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
  deleteUser,
};