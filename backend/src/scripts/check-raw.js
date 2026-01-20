require("dotenv").config();
const mongoose = require("mongoose");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Accès direct sans le modèle
  const db = mongoose.connection.db;
  const nutella = await db.collection("products").findOne({ barcode: "3017620422003" });
  
  console.log("\n📦 DOCUMENT BRUT NUTELLA:");
  console.log("  nutriscore_grade: " + nutella.nutriscore_grade);
  console.log("  nutriscore_score: " + nutella.nutriscore_score);
  console.log("  foodData.nutriScore: " + nutella.foodData?.nutriScore);
  
  // Vérifier le schéma - enum autorisé
  console.log("\n  Type de nutriscore_grade: " + typeof nutella.nutriscore_grade);
  
  await mongoose.disconnect();
}
check();
