const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware");
const User = require("../models/User");

// GET /api/users/profile
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ success: false, error: "Utilisateur non trouvé" });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("[User] Profile error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/users/profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ success: true, data: user });
  } catch (error) {
    console.error("[User] Update error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/users
router.delete("/", authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ success: true, message: "Compte supprimé" });
  } catch (error) {
    console.error("[User] Delete error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
