require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

async function update() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const result = await Product.updateOne(
    { barcode: "3017620422003" },
    { 
      $set: { 
        nutriscore_grade: "e",
        "foodData.nutriScore": "e",
        nutriscore_score: 31
      } 
    }
  );
  
  console.log("✅ Nutella FR mis à jour: " + result.modifiedCount + " document");
  
  // Vérifier
  const nutella = await Product.findOne({ barcode: "3017620422003" }).select("name nova_group nutriscore_grade").lean();
  console.log("\n📦 NUTELLA FR:");
  console.log("  NOVA: " + nutella.nova_group);
  console.log("  Nutri-Score: " + nutella.nutriscore_grade);
  
  await mongoose.disconnect();
}
update();
