"use strict";

const express = require("express");
const ctrl = require("../controllers/subscription.controller");

const router = express.Router();

/**
 * M11 Payments routes
 * Base mount (main.js) : app.use("/api/payments", router)
 */

// Crée une session de checkout LemonSqueezy
router.post("/create-checkout", ctrl.createCheckout);

// Vérifie si un user est premium
router.get("/check-premium/:userId", ctrl.checkPremium);

// (Optionnel) Récupère les abonnements de l'utilisateur courant (401 si non auth)
router.get("/subscriptions", ctrl.getUserSubscriptions);

module.exports = router;
