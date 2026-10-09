const mongoose = require("mongoose");
const Notification = require("../models/Notification");

const notificationRoles = {
  trip: ["Fleet Manager", "Driver", "Admin"],
  maintenance: ["Fleet Manager", "Admin"],
  fuel: ["Fleet Manager", "Financial Analyst", "Admin"],
  vehicle: ["Fleet Manager", "Admin"],
  driver: ["Fleet Manager", "Safety Officer", "Admin"],
};

const visibleNotificationFilter = (user) => ({
  $or: [
    { recipientUser: user._id },
    { roles: user.role },
    { roles: { $exists: false }, recipientUser: null },
  ],
});

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find(visibleNotificationFilter(req.user))
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.status(200).json(
      notifications.map(({ readBy = [], ...notification }) => ({
        ...notification,
        isRead:
          notification.isRead ||
          readBy.some((userId) => String(userId) === String(req.user._id)),
      }))
    );
  } catch (error) {
    console.error("Notification query failed:", error.name || "Error");
    return res.status(500).json({ message: "Unable to load notifications." });
  }
};

const createNotification = async (title, message, type, scope = {}) => {
  try {
    return await Notification.create({
      title,
      message,
      type,
      roles: scope.roles || notificationRoles[type] || ["Fleet Manager", "Admin"],
      recipientUser: scope.recipientUser || null,
    });
  } catch (error) {
    console.error("Notification write failed:", error.name || "Error");
    return null;
  }
};

const markAsRead = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid notification id." });
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        ...visibleNotificationFilter(req.user),
      },
      { $addToSet: { readBy: req.user._id } },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }
    return res.status(200).json(notification);
  } catch (error) {
    console.error("Notification update failed:", error.name || "Error");
    return res.status(500).json({ message: "Unable to update notification." });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
};
