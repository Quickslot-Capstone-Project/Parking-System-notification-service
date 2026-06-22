const { createNotification: putNotification, listNotifications } = require("../models/Notification");

const createNotification = async (req, res) => {
  try {
    const { recipientUserId, bookingId, type, channel = "console", message, metadata = {} } = req.body;
    if (!recipientUserId || !type || !message) {
      return res.status(400).json({ message: "recipientUserId, type, and message are required" });
    }

    const notification = await putNotification({
      recipientUserId,
      bookingId,
      type,
      channel,
      message,
      metadata,
    });

    console.log(`[Notification:${channel}] user=${recipientUserId} type=${type} message=${message}`);
    return res.status(201).json({ message: "Notification queued", notification });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create notification", error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await listNotifications({
      isAdmin: req.user.role === "admin",
      recipientUserId: req.user.id,
    });
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load notifications", error: error.message });
  }
};

module.exports = { createNotification, getNotifications };

