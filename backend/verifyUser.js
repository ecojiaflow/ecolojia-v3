const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./src/models/User");

async function verifyAndDisplay() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: "test@ecolojia.fr" });
    
    if (!user) {
      console.log("\n❌ UTILISATEUR NON TROUVÉ\n");
      process.exit(1);
    }
    
    console.log("\n✅ UTILISATEUR TROUVÉ");
    console.log("=====================================");
    console.log("Email:         ", user.email);
    console.log("Name:          ", user.name);
    console.log("Plan Code:     ", user.plan?.code || "NON DÉFINI");
    console.log("Plan Period:   ", user.plan?.periodEnd || "NON DÉFINI");
    console.log("Email Verified:", user.isEmailVerified);
    console.log("Role:          ", user.role);
    console.log("User ID:       ", user._id);
    console.log("=====================================");
    console.log("\n✅ Utilisateur OK pour LOCAL et RENDER");
    console.log("   Email:    test@ecolojia.fr");
    console.log("   Password: TestEcolojia2025!\n");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    process.exit(1);
  }
}

verifyAndDisplay();