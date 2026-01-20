require("dotenv").config();
const mongoose = require("mongoose");

async function update() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const db = mongoose.connection.db;
  
  const result = await db.collection("products").updateOne(
    { barcode: "3017620422003" },
    { 
      $set: { 
        nutriscore_grade: "e",
        nutriscore_score: 31
      } 
    }
  );
  
  console.log("✅ Mise à jour directe: " + result.modifiedCount);
  
  // Vérifier
  const nutella = await db.collection("products").findOne({ barcode: "3017620422003" });
  console.log("\n📦 NUTELLA APRÈS UPDATE DIRECT:");
  console.log("  nutriscore_grade: " + nutella.nutriscore_grade);
  console.log("  foodData.nutriScore: " + nutella.foodData?.nutriScore);
  
  await mongoose.disconnect();
}
update();
