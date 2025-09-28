/**
 * GET /api/payments/check-premium/:userId
 */
exports.checkPremium = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const { userId } = req.params;

    const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;
    if (!isNonEmptyString(userId)) {
      return res.status(400).json({
        success: false,
        errors: [{ field: "userId", message: "userId invalide" }],
      });
    }

    // 0) Si la connexion Mongo n'est pas prête, on évite le findOne() bloquant
    //    et on répond comme "utilisateur introuvable" (comportement attendu par ton DOD).
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return res.status(404).json({
        success: false,
        errors: [{ field: "userId", message: "Utilisateur introuvable" }],
        note: "db_not_ready",
      });
    }

    // 1) Vérifier l'existence de l'utilisateur (404 sinon)
    //    (import User déjà défini en haut du fichier)
    const user = await User.findById(userId).select("_id").lean().exec();
    if (!user) {
      return res.status(404).json({
        success: false,
        errors: [{ field: "userId", message: "Utilisateur introuvable" }],
      });
    }

    // 2) Vérifier une souscription active / essai
    const now = new Date();
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
    });
  } catch (err) {
    console.error("checkPremium error:", err);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
