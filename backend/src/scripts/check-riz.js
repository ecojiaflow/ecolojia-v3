require("dotenv").config();
const mongoose = require("mongoose");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const riz = await db.collection("products").findOne({ barcode: "3596710325016" });
  
  console.log("\n=== RIZ BIO - DIAGNOSTIC ===\n");
  console.log("Nom:", riz.name);
  console.log("Marque:", riz.brand);
  console.log("Subcategory:", riz.subcategory);
  console.log("\n--- NOVA ---");
  console.log("nova_group (racine):", riz.nova_group);
  console.log("foodData.novaGroup:", riz.foodData?.novaGroup);
  console.log("\n--- FLAGS (constitution) ---");
  console.log("constitution.healthReflex.flags:", JSON.stringify(riz.constitution?.healthReflex?.flags));
  console.log("constitution.healthReflex.level:", riz.constitution?.healthReflex?.level);
  console.log("constitution.healthReflex.levelLabel:", riz.constitution?.healthReflex?.levelLabel);
  console.log("\n--- ADDITIFS ---");
  console.log("additives_extracted:", JSON.stringify(riz.additives_extracted));
  console.log("additives_tags:", JSON.stringify(riz.additives_tags));
  console.log("\n--- INGREDIENTS ---");
  console.log("ingredients_text:", riz.ingredients_text?.substring(0, 200));
  
  await mongoose.disconnect();
}
check();
