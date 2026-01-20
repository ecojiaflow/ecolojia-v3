require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

async function normalize() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("\n🔧 NORMALISATION DES CHAMPS NOVA/NUTRISCORE\n");

  // 1. Copier foodData.novaGroup vers nova_group si manquant
  const novaResult = await Product.updateMany(
    { 
      "foodData.novaGroup": { $gte: 1, $lte: 4 },
      $or: [{ nova_group: { $exists: false } }, { nova_group: null }]
    },
    [{ $set: { nova_group: "$foodData.novaGroup" } }]
  );
  console.log("✅ NOVA normalise: " + novaResult.modifiedCount + " produits");

  // 2. Copier foodData.nutriScore vers nutriscore_grade si manquant
  const nutriResult = await Product.updateMany(
    { 
      "foodData.nutriScore": { $in: ["a","b","c","d","e","A","B","C","D","E"] },
      $or: [
        { nutriscore_grade: { $exists: false } }, 
        { nutriscore_grade: null },
        { nutriscore_grade: "unknown" }
      ]
    },
    [{ $set: { nutriscore_grade: "$foodData.nutriScore" } }]
  );
  console.log("✅ Nutri-Score normalise: " + nutriResult.modifiedCount + " produits");

  // 3. Vérifier Nutella FR
  const nutella = await Product.findOne({ barcode: "3017620422003" }).select("name nova_group nutriscore_grade foodData.novaGroup foodData.nutriScore").lean();
  console.log("\n📦 NUTELLA FR apres normalisation:");
  console.log("  nova_group: " + nutella?.nova_group);
  console.log("  nutriscore_grade: " + nutella?.nutriscore_grade);
  console.log("  foodData.novaGroup: " + nutella?.foodData?.novaGroup);

  // 4. Stats finales
  const totalFood = await Product.countDocuments({ categoryType: "food" });
  const withNova = await Product.countDocuments({ categoryType: "food", nova_group: { $gte: 1, $lte: 4 } });
  const withNutriScore = await Product.countDocuments({ categoryType: "food", nutriscore_grade: { $in: ["a","b","c","d","e","A","B","C","D","E"] } });

  console.log("\n📊 STATS APRES NORMALISATION:");
  console.log("  NOVA:       " + withNova + " / " + totalFood + " (" + (withNova/totalFood*100).toFixed(1) + "%)");
  console.log("  NutriScore: " + withNutriScore + " / " + totalFood + " (" + (withNutriScore/totalFood*100).toFixed(1) + "%)");

  await mongoose.disconnect();
  console.log("\n✅ Normalisation terminee\n");
}

normalize().catch(err => {
  console.error("Erreur:", err);
  process.exit(1);
});
