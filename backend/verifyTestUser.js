const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./src/models/User");

async function verifyUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: "test@ecolojia.fr" });
    
    console.log("\n✅ VÉRIFICATION UTILISATEUR");
    console.log("   Email:", user.email);
    console.log("   Premium:", user.isPremium);
    console.log("   Verified:", user.isEmailVerified);
    console.log("   ID:", user._id.toString());
    console.log("\n✅ Prêt pour connexion!\n");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

verifyUser();