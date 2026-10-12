const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { recordAuditLog } = require("./auditController");

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isStrongPassword = (password) =>
  password.length >= 8 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password);

// REGISTER
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (
      normalizedName.length < 2 ||
      normalizedName.length > 100 ||
      !isValidEmail(normalizedEmail) ||
      typeof password !== "string" ||
      !isStrongPassword(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a name, valid email, and password with at least 8 characters, one uppercase letter, one lowercase letter, and one number.",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await recordAuditLog({
      actor: user,
      action: "User Registered",
      entity: "User",
      entityId: user._id,
      metadata: { role: user.role },
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Sign in to continue.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }
    const isBadRequest = error.name === "ValidationError";
    if (!isBadRequest) {
      console.error("User registration failed:", error.name || "Error");
    }
    return res.status(isBadRequest ? 400 : 500).json({
      success: false,
      message: isBadRequest ? "Invalid registration details." : "Unable to register user.",
    });
  }
};


// LOGIN
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    await recordAuditLog({
      actor: user,
      action: "User Login",
      entity: "User",
      entityId: user._id,
      metadata: { role: user.role },
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error("User login failed:", error.name || "Error");
    res.status(500).json({
      success: false,
      message: "Unable to sign in.",
    });
  }
};

const getCurrentUser = (req, res) => {
  res.json({ user: req.user });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};