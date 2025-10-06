require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../src/models/Product");

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const cosmetics = await Product.updateMany(
    { category: "cosmetics", "scores.overallScore": null },
    { $set: { scores: { overallScore: 65, healthScore: 70, environmentScore: 60 } } }
  );
  
  const detergents = await Product.updateMany(
    { category: "detergents", "scores.overallScore": null },
    { $set: { scores: { overallScore: 55, healthScore: 50, environmentScore: 60 } } }
  );
  
  console.log("Cosmetics fixes:", cosmetics.modifiedCount);
  console.log("Detergents fixes:", detergents.modifiedCount);
  process.exit(0);
}
fix();
