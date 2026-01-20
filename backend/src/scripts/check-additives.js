require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Vérifier les différents champs possibles
  const tags = await Product.countDocuments({ additives_tags: { $exists: true, $not: { $size: 0 } } });
  const extracted = await Product.countDocuments({ additives_extracted: { $exists: true, $not: { $size: 0 } } });
  const foodData = await Product.countDocuments({ "foodData.additives": { $exists: true, $not: { $size: 0 } } });
  
  console.log("\n📦 ADDITIFS - OU SONT-ILS ?");
  console.log("  additives_tags:      " + tags);
  console.log("  additives_extracted: " + extracted);
  console.log("  foodData.additives:  " + foodData);

  // Exemple avec additifs
  const example = await Product.findOne({ additives_extracted: { $exists: true, $not: { $size: 0 } } }).select("name additives_extracted additives_tags").lean();
  if (example) {
    console.log("\n📝 EXEMPLE:");
    console.log("  " + example.name);
    console.log("  additives_extracted: " + JSON.stringify(example.additives_extracted?.slice(0,3)));
  }

  await mongoose.disconnect();
}
check();
