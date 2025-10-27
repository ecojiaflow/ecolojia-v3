const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./src/models/User");

async function fixTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Mise à jour avec la BONNE structure
    const user = await User.findOneAndUpdate(
      { email: "test@ecolojia.fr" },
      {
        $set: {
          "plan.code": "premium",
          "plan.periodEnd": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isEmailVerified: true,
          role: "user"
        }
      },
      { new: true }
    );
    
    console.log("\n✅ ========================================");
    console.log("   UTILISATEUR PREMIUM ACTIVÉ");
    console.log("========================================");
    console.log("\n📧 Email:       test@ecolojia.fr");
    console.log("🔑 Password:    TestEcolojia2025!");
    console.log("👑 Plan Code:   " + user.plan.code);
    console.log("📅 Period End:  " + (user.plan.periodEnd ? user.plan.periodEnd.toLocaleDateString() : "N/A"));
    console.log("✅ Verified:    " + (user.isEmailVerified || false));
    console.log("\n✅ CONNEXION PRÊTE!\n");
    console.log("========================================\n");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erreur:", error.message);
    process.exit(1);
  }
}

fixTestUser();