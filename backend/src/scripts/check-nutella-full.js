require("dotenv").config();
const mongoose = require("mongoose");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const nutella = await db.collection("products").findOne({ barcode: "3017620422003" });
  
  console.log("\n=== NUTELLA FR - DONNÉES COMPLÈTES ===\n");
  console.log("Nom:", nutella.name);
  console.log("Portion:", nutella.serving_size || nutella.portion || "non définie");
  console.log("\nNutriments (pour 100g):");
  console.log(JSON.stringify(nutella.nutriments, null, 2));
  console.log("\nSubcategory:", nutella.subcategory);
  console.log("NOVA:", nutella.nova_group);
  console.log("Nutri-Score:", nutella.nutriscore_grade);
  
  await mongoose.disconnect();
}
check();
