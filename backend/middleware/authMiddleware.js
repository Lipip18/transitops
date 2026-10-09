const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);

  if (!tokenMatch) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(tokenMatch[1], process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Authentication token has expired."
          : "Invalid authentication token.",
    });
  }

  const userId = decoded.id || decoded.userId;
  if (
    !userId ||
    typeof userId !== "string" ||
    !/^[a-f\d]{24}$/i.test(userId)
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }

  req.user = await User.findById(userId).select("-password");

  if (!req.user || !req.user.isActive) {
    return res.status(401).json({
      success: false,
      message: "User account is unavailable.",
    });
  }

  return next();
};

const validateObjectIdParam = (req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid resource id.",
    });
  }
  return next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
  validateObjectIdParam,
};