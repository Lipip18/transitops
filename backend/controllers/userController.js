const User = require("../models/User");

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

module.exports = {
  getProfile,
};