const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./src/models/User");

async function fixUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOneAndUpdate(
      { email: "test@ecolojia.fr" },
      {
        $set: {
          isEmailVerified: true,
          role: "user"
        }
      },
      { new: true }
    );
    
    console.log("\n✅ UTILISATEUR CORRIGÉ");
    console.log("=====================================");
    console.log("Email Verified:", user.isEmailVerified);
    console.log("Role:          ", user.role);
    console.log("Plan Code:     ", user.plan.code);
    console.log("=====================================\n");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

fixUser();