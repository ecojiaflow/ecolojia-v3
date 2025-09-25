const { EnhancedOFFClient } = require("./src/services/EnhancedOFFClient");

async function testRealDetergent() {
  const client = new EnhancedOFFClient();
  
  // Codes détergents réels dans OpenProductsFacts
  const detergentCodes = [
    "8001841568898", // Ariel All-in-1 Pods  
    "8006540723432", // Fairy Washing-Up Liquid
    "4084500900509"  // Alternative Fairy
  ];
  
  for (const code of detergentCodes) {
    console.log(`\n=== Test détergent: ${code} ===`);
    const result = await client.fetchProduct(code, "detergent");
    console.log(`Résultat: ${result.success ? "✅ OK" : `❌ ${result.error}`}`);
    if (result.success) {
      console.log(`Produit: ${result.product.product_name || "Sans nom"}`);
      break; // On s'arrête au premier qui marche
    }
  }
}

testRealDetergent().catch(console.error);
