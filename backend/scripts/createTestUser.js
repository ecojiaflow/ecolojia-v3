const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const User = require(path.join(__dirname, "..", "src", "models", "User"));

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connecté");

    // Supprimer ancien user test
    await User.deleteOne({ email: "test@ecolojia.fr" });

    // Créer nouveau user premium
    const userData = {
      email: "test@ecolojia.fr",
      password: "TestEcolojia2025!",
      name: "Testeur Premium",
      isEmailVerified: true,
      isPremium: true,
      role: "user"
    };

    // Ajouter premiumUntil si le champ existe
    try {
      userData.premiumUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    } catch (e) {}

    // Ajouter quotas IA si les champs existent
    try {
      userData.aiQuotaDaily = 999;
      userData.aiQuotaUsedToday = 0;
    } catch (e) {}

    const testUser = await User.create(userData);

    console.log("\n✅ ========================================");
    console.log("   UTILISATEUR TEST CRÉÉ AVEC SUCCÈS");
    console.log("========================================");
    console.log("\n📧 Email:    test@ecolojia.fr");
    console.log("🔑 Password: TestEcolojia2025!");
    console.log("👑 Premium:  OUI");
    console.log("🆔 User ID:  " + testUser._id);
    console.log("\n✅ Vous pouvez maintenant vous connecter!");
    console.log("========================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erreur:", error.message);
    if (error.code === 11000) {
      console.log("\n⚠️  L'utilisateur existe déjà. Tentative de mise à jour...");
      
      try {
        const updated = await User.findOneAndUpdate(
          { email: "test@ecolojia.fr" },
          { 
            isPremium: true,
            isEmailVerified: true,
            aiQuotaDaily: 999,
            aiQuotaUsedToday: 0
          },
          { new: true }
        );
        
        console.log("\n✅ Utilisateur mis à jour:");
        console.log("📧 Email:    test@ecolojia.fr");
        console.log("🔑 Password: TestEcolojia2025!");
        console.log("👑 Premium:  OUI\n");
      } catch (updateError) {
        console.error("Erreur mise à jour:", updateError.message);
      }
    }
    
    await mongoose.disconnect();
    process.exit(1);
  }
}

createTestUser();