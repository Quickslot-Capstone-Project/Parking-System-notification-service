const express = require("express");
const { createNotification, getNotifications } = require("../controllers/notificationController");
const { authenticate, requireInternalKey } = require("../middleware/auth");

const router = express.Router();

router.get("/health", (_req, res) => res.json({ service: "notification-service", status: "ok" }));
router.get("/notifications", authenticate, getNotifications);
router.post("/internal/notify", requireInternalKey, createNotification);

module.exports = router;

