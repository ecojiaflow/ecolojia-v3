"use strict";

/**
 * M11 Payments — Subscription Controller (DEV-friendly)
 * - En DEV:
 *   - checkPremium: si userId non-ObjectId -> premium:false sans DB
 *   - createCheckout: fallback URL de test si le service échoue
 */

const mongoose = require("mongoose");
const Subscription = require("../models/subscription.model");
const lemon = require("../services/lemonsqueezy.service");
const isDev = process.env.NODE_ENV !== "production";

// Import "safe" du modèle User
let User;
try {
  User = mongoose.model("User");
} catch {
  User = require("../../models/user.model");
}

const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

/**
 * POST /api/payments/create-checkout
 */
exports.createCheckout = async (req, res) => {
  try {
    const { userId, priceId, productId, metadata } = req.body || {};

    if (!isNonEmptyString(userId)) {
      return res.status(400).json({
        success: false,
        errors: [{ field: "userId", message: "userId est requis" }],
      });
    }

    // En PROD: vérifier l'existence de l'utilisateur
    if (!isDev) {
      const user = await User.findById(userId).lean().exec();
      if (!user) {
        return res.status(404).json({
          success: false,
          errors: [{ field: "userId", message: "Utilisateur introuvable" }],
        });
      }
    }

    // Appel provider
    try {
      const checkout = await lemon.createCheckoutSession({
        userId,
        priceId,
        productId,
        metadata,
      });

      return res.status(201).json({
        success: true,
        checkoutUrl: checkout?.url || null,
        provider: "lemonsqueezy",
        mode: isDev ? "dev" : "prod",
      });
    } catch (providerErr) {
      console.warn("createCheckout provider error:", providerErr?.message || providerErr);
      if (isDev) {
        // Fallback pour tester le front en dev
        const url = `https://example.com/checkout-dev?userId=${encodeURIComponent(userId)}`;
        return res.status(201).json({
          success: true,
          checkoutUrl: url,
          provider: "lemonsqueezy-dev-fallback",
          mode: "dev",
        });
      }
      throw providerErr;
    }
  } catch (err) {
    console.error("createCheckout error:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/**
 * GET /api/payments/subscriptions
 */
exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Auth requise" });
    }
    const subs = await Subscription.find({ userId }).lean().exec();
    return res.status(200).json({ success: true, subscriptions: subs });
  } catch (err) {
    console.error("getUserSubscriptions error:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/**
 * GET /api/payments/check-premium/:userId
 * - DEV: si userId n'est pas un ObjectId valide -> premium:false (sans DB)
 * - DEV: si ObjectId valide -> on interroge Subscription par userId
 * - PROD: vérif stricte de l'utilisateur + Subscription
 */
exports.checkPremium = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isNonEmptyString(userId)) {
      return res.status(400).json({
        success: false,
        errors: [{ field: "userId", message: "userId invalide" }],
      });
    }

    const now = new Date();

    if (isDev) {
      // 1) Si l'ID n'est pas un ObjectId (ex: "dev-user-123") => pas de cast, pas de DB
      if (!mongoose.isValidObjectId(userId)) {
        return res.status(200).json({
          success: true,
          premium: false,
          userId,
          checkedAt: now.toISOString(),
          mode: "dev",
          reason: "non_objectid",
        });
      }

      // 2) Sinon, on peut interroger la DB avec l'ObjectId
      const premium = await Subscription.exists({
        userId,
        status: { $in: ["active", "on_trial", "paused", "resumed"] },
        $or: [
          { currentPeriodEnd: { $gte: now } },
          { trialEndsAt: { $gte: now } },
        ],
      });

      return res.status(200).json({
        success: true,
        premium: !!premium,
        userId,
        checkedAt: now.toISOString(),
        mode: "dev",
      });
    }

    // PROD strict
    const user = await User.findById(userId).select("_id").lean().exec();
    if (!user) {
      return res.status(404).json({
        success: false,
        errors: [{ field: "userId", message: "Utilisateur introuvable" }],
      });
    }

    const premium = await Subscription.exists({
      userId: user._id,
      status: { $in: ["active", "on_trial", "paused", "resumed"] },
      $or: [
        { currentPeriodEnd: { $gte: now } },
        { trialEndsAt: { $gte: now } },
      ],
    });

    return res.status(200).json({
      success: true,
      premium: !!premium,
      userId: String(user._id),
      checkedAt: now.toISOString(),
      mode: "prod",
    });
  } catch (err) {
    console.error("checkPremium error:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
