require("dotenv").config();
const mongoose = require("mongoose");

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Product = mongoose.connection.collection("products");
  
  const cosmetics = await Product.updateMany(
    { 
      category: "cosmetics",
      $or: [
        { "scores.overallScore": { $exists: false } },
        { "scores.overallScore": null }
      ]
    },
    { $set: { scores: { overallScore: 65, healthScore: 70, environmentScore: 60 } } }
  );
  
  const detergents = await Product.updateMany(
    { 
      category: "detergents",
      $or: [
        { "scores.overallScore": { $exists: false } },
        { "scores.overallScore": null }
      ]
    },
    { $set: { scores: { overallScore: 55, healthScore: 50, environmentScore: 60 } } }
  );
  
  console.log("Cosmetics fixes:", cosmetics.modifiedCount);
  console.log("Detergents fixes:", detergents.modifiedCount);
  process.exit(0);
}
fix();
