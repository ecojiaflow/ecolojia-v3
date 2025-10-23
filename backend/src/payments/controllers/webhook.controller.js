"use strict";

const crypto = require("crypto");
const Subscription = require("../models/subscription.model");
const asyncHandler = require("../../utils/asyncHandler");

/**
 * Vérifie (si configuré) la signature HMAC du webhook.
 * Retourne true si la signature est valide ou si aucun secret n'est défini.
 */
function verifySignature(rawBody, headers) {
  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!webhookSecret) return true;

  // Adapter la clé de header si LemonSqueezy en utilise une spécifique.
  const signature = headers["x-signature"] || headers["x-signature-hmac"] || headers["x-lemonsqueezy-signature"];
  if (!signature || !rawBody) return false;

  const computed = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  return signature === computed;
}

class WebhookController {
  /**
   * POST /api/webhooks/lemonsqueezy
   * Corps: JSON brut (req.rawBody fourni par la route), plus req.body parsé.
   */
  handleLemonSqueezyWebhook = asyncHandler(async (req, res) => {
    console.log("Webhook LemonSqueezy reçu");

    // Sécurité signature (optionnelle)
    try {
      const ok = verifySignature(req.rawBody, req.headers);
      if (!ok) {
        console.warn("Signature webhook invalide");
        return res.status(401).json({ success: false, message: "Invalid signature" });
      }
    } catch (e) {
      console.warn("Erreur vérification signature:", e && e.message);
      // On continue mais on log
    }

    const payload = req.body || {};
    const eventName = payload.event_name;
    const data = payload.data;

    if (!eventName) {
      // Toujours 200 pour éviter les retries agressifs côté provider
      return res.status(200).json({ success: false, message: "event_name manquant" });
    }

    console.log(`Event webhook: ${eventName}`);

    try {
      switch (eventName) {
        case "subscription_created":
          await this.handleSubscriptionCreated(data);
          break;
        case "subscription_updated":
          await this.handleSubscriptionUpdated(data);
          break;
        case "subscription_cancelled":
          await this.handleSubscriptionCancelled(data);
          break;
        case "subscription_resumed":
          await this.handleSubscriptionResumed(data);
          break;
        case "subscription_expired":
          await this.handleSubscriptionExpired(data);
          break;
        default:
          console.log(`Événement webhook non géré: ${eventName}`);
      }

      return res.status(200).json({ success: true, message: "Webhook traité", event: eventName });
    } catch (err) {
      console.error("Erreur traitement webhook:", err && err.message);
      // On renvoie 200 malgré tout pour éviter les retries multiples
      return res.status(200).json({ success: false, message: "Erreur traitement webhook" });
    }
  });

  /**
   * Création d'abonnement
   */
  handleSubscriptionCreated = async (data) => {
    if (!data || !data.id || !data.attributes) return;

    const a = data.attributes;
    const sub = new Subscription({
      lemonSqueezyId: data.id,
      lemonSqueezyOrderId: a.order_id,
      lemonSqueezyCustomerId: a.customer_id,
      lemonSqueezyProductId: a.product_id,
      userId: a.custom_data && a.custom_data.userId,
      status: a.status,
      currentPeriodStart: a.current_period_start ? new Date(a.current_period_start) : null,
      currentPeriodEnd: a.current_period_end ? new Date(a.current_period_end) : null,
      trialEndsAt: a.trial_ends_at ? new Date(a.trial_ends_at) : null,
      price: a.subtotal,
      currency: a.currency
    });

    await sub.save();
    console.log("Abonnement créé et sauvegardé:", sub.lemonSqueezyId);
  };

  /**
   * Mise à jour d'abonnement
   */
  handleSubscriptionUpdated = async (data) => {
    if (!data || !data.id || !data.attributes) return;

    const a = data.attributes;
    const sub = await Subscription.findOne({ lemonSqueezyId: data.id });
    if (sub) {
      sub.status = a.status || sub.status;
      sub.currentPeriodStart = a.current_period_start ? new Date(a.current_period_start) : sub.currentPeriodStart;
      sub.currentPeriodEnd = a.current_period_end ? new Date(a.current_period_end) : sub.currentPeriodEnd;
      sub.updatedAt = new Date();
      await sub.save();
      console.log("Abonnement mis à jour:", sub.lemonSqueezyId);
    }
  };

  /**
   * Annulation
   */
  handleSubscriptionCancelled = async (data) => {
    if (!data || !data.id) return;
    const sub = await Subscription.findOne({ lemonSqueezyId: data.id });
    if (sub) {
      sub.status = "cancelled";
      sub.cancelledAt = new Date();
      await sub.save();
      console.log("Abonnement annulé:", sub.lemonSqueezyId);
    }
  };

  /**
   * Reprise
   */
  handleSubscriptionResumed = async (data) => {
    if (!data || !data.id || !data.attributes) return;
    const a = data.attributes;
    const sub = await Subscription.findOne({ lemonSqueezyId: data.id });
    if (sub) {
      sub.status = a.status || "active";
      sub.cancelledAt = null;
      await sub.save();
      console.log("Abonnement repris:", sub.lemonSqueezyId);
    }
  };

  /**
   * Expiration
   */
  handleSubscriptionExpired = async (data) => {
    if (!data || !data.id) return;
    const sub = await Subscription.findOne({ lemonSqueezyId: data.id });
    if (sub) {
      sub.status = "expired";
      await sub.save();
      console.log("Abonnement expiré:", sub.lemonSqueezyId);
    }
  };

  /**
   * Endpoint de test (dev)
   */
  testWebhook = asyncHandler(async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ success: false, message: "Disponible en développement uniquement" });
    }
    return res.status(200).json({ success: true, message: "Test webhook OK", ts: new Date().toISOString() });
  });
}

module.exports = new WebhookController();
