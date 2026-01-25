require("dotenv").config();
const mongoose = require("mongoose");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const nutella = await db.collection("products").findOne({ barcode: "3017620422003" });
  
  // Lister toutes les clés du document
  const keys = Object.keys(nutella);
  console.log("\n=== CLÉS DU DOCUMENT ===");
  console.log(keys.join(", "));
  
  // Chercher les clés qui contiennent "nutri" ou "sugar" ou "fat"
  console.log("\n=== DONNÉES NUTRITION POSSIBLES ===");
  keys.filter(k => k.toLowerCase().includes("nutri") || k.toLowerCase().includes("sugar") || k.toLowerCase().includes("fat") || k.toLowerCase().includes("energy") || k.toLowerCase().includes("salt")).forEach(k => {
    console.log(k + ":", JSON.stringify(nutella[k]).substring(0, 200));
  });
  
  // Vérifier foodData
  if (nutella.foodData) {
    console.log("\n=== foodData ===");
    console.log(JSON.stringify(nutella.foodData, null, 2).substring(0, 1000));
  }
  
  await mongoose.disconnect();
}
check();
