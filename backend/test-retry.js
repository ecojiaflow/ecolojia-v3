const { EnhancedOFFClient } = require("./src/services/EnhancedOFFClient");

async function testRetryService() {
  const client = new EnhancedOFFClient();
  
  console.log("=== Test 1: Produit alimentaire ===");
  const food = await client.fetchProduct("3017620422003", "food");
  console.log("Résultat food:", food.success ? "✅ OK" : `❌ ${food.error}`);
  
  console.log("\n=== Test 2: Produit cosmétique ===");  
  const beauty = await client.fetchProduct("4005900756114", "beauty");
  console.log("Résultat beauty:", beauty.success ? "✅ OK" : `❌ ${beauty.error}`);
  
  console.log("\n=== Test 3: Produit détergent ===");
  const detergent = await client.fetchProduct("4987176126634", "detergent");  
  console.log("Résultat detergent:", detergent.success ? "✅ OK" : `❌ ${detergent.error}`);
  
  console.log("\n=== Test 4: Code inexistant (test timeout) ===");
  const notFound = await client.fetchProduct("0000000000000", "food");
  console.log("Résultat inexistant:", notFound.success ? "⚠️ Trouvé" : "✅ Échec attendu");
}

testRetryService().catch(console.error);
