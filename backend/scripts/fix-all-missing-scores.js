require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../src/models/Product");

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const products = await Product.find({
    category: { $in: ["cosmetics", "detergents"] },
    $or: [
      { scores: { $exists: false } },
      { "scores.overallScore": { $exists: false } },
      { "scores.overallScore": null }
    ]
  });
  
  console.log("Produits a fixer:", products.length);
  
  let fixed = 0;
  for (const p of products) {
    const score = p.category === "cosmetics" ? 65 : 55;
    p.scores = { overallScore: score, healthScore: score, environmentScore: 60 };
    await p.save();
    fixed++;
  }
  
  console.log("Produits fixes:", fixed);
  process.exit(0);
}
fix();
