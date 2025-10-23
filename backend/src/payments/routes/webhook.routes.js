"use strict";

const express = require("express");
const webhookController = require("../controllers/webhook.controller");

const router = express.Router();

router.post(
  "/lemonsqueezy",
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    try {
      req.rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
      if (req.rawBody && typeof req.body !== "object") {
        try {
          req.body = JSON.parse(req.rawBody);
        } catch { /* ignore JSON parse error */ }
      }
      next();
    } catch (err) {
      next(err);
    }
  },
  webhookController.handleLemonSqueezyWebhook
);

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Webhooks M11 opérationnels",
    timestamp: new Date().toISOString(),
    service: "lemonsqueezy-webhooks",
  });
});

if (process.env.NODE_ENV === "development") {
  router.post("/test", webhookController.testWebhook);
}

router.use((error, _req, res, _next) => {
  console.error("❌ Erreur dans routes webhook:", error);
  res.status(200).json({
    success: false,
    message: "Webhook error handled",
    error: process.env.NODE_ENV === "development" ? String(error?.message || error) : "Internal error",
  });
});

module.exports = router;
