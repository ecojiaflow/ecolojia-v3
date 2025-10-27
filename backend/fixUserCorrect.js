const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./src/models/User");

async function fixUserCorrect() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOneAndUpdate(
      { email: "test@ecolojia.fr" },
      {
        $set: {
          emailVerified: true,
          lastLogin: new Date()
        }
      },
      { new: true }
    );
    
    console.log("\n✅ UTILISATEUR FINALISÉ");
    console.log("=====================================");
    console.log("Email:         ", user.email);
    console.log("Email Verified:", user.emailVerified);
    console.log("Plan Code:     ", user.plan.code);
    console.log("Plan Status:   ", user.plan.status);
    console.log("=====================================");
    console.log("\n✅✅✅ PRÊT POUR CONNEXION ✅✅✅");
    console.log("\n   Email:    test@ecolojia.fr");
    console.log("   Password: TestEcolojia2025!\n");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

fixUserCorrect();