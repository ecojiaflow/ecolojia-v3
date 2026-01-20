require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Trouver un produit avec NOVA
  const withNova = await Product.findOne({ nova_group: { $gte: 1 } }).select("name barcode nova_group nutriscore_grade foodData.novaGroup foodData.nutriScore").lean();
  console.log("\n📦 EXEMPLE PRODUIT AVEC NOVA:");
  console.log("  Nom: " + withNova?.name);
  console.log("  nova_group: " + withNova?.nova_group);
  console.log("  nutriscore_grade: " + withNova?.nutriscore_grade);
  console.log("  foodData.novaGroup: " + withNova?.foodData?.novaGroup);
  console.log("  foodData.nutriScore: " + withNova?.foodData?.nutriScore);

  // Vérifier Nutella FR
  const nutella = await Product.findOne({ barcode: "3017620422003" }).lean();
  console.log("\n📦 NUTELLA FR (3017620422003):");
  console.log("  nova_group: " + nutella?.nova_group);
  console.log("  nutriscore_grade: " + nutella?.nutriscore_grade);
  console.log("  foodData.novaGroup: " + nutella?.foodData?.novaGroup);
  console.log("  foodData.nutriScore: " + nutella?.foodData?.nutriScore);
  
  // Vérifier les champs du Nutella
  const keys = Object.keys(nutella || {}).filter(k => k.toLowerCase().includes("nova") || k.toLowerCase().includes("nutri") || k.toLowerCase().includes("score"));
  console.log("  Champs contenant nova/nutri/score: " + JSON.stringify(keys));

  await mongoose.disconnect();
}
check();
