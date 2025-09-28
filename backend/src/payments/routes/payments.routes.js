"use strict";

const express = require("express");
const { paymentsEnabled } = require("../config");
const router = express.Router();

if (!paymentsEnabled) {
  // ====== PAYMENTS OFF ======
  router.post("/create-checkout", (_req, res) => {
    return res.status(501).json({
      success: false,
      message: "Payments disabled (feature flag).",
      mode: "disabled",
    });
  });

  router.get("/check-premium/:userId", (req, res) => {
    return res.status(200).json({
      success: true,
      premium: false,
      userId: req.params.userId,
      mode: "disabled",
    });
  });

  router.get("/subscriptions", (_req, res) => {
    return res.status(200).json({
      success: true,
      subscriptions: [],
      mode: "disabled",
    });
  });

  module.exports = router;
} else {
  // ====== PAYMENTS ON ======
  const ctrl = require("../controllers/subscription.controller");
  router.post("/create-checkout", ctrl.createCheckout);
  router.get("/check-premium/:userId", ctrl.checkPremium);
  router.get("/subscriptions", ctrl.getUserSubscriptions);
  module.exports = router;
}
