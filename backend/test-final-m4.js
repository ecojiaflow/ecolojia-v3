const { EnhancedOFFClient } = require("./src/services/EnhancedOFFClient");

async function fullTest() {
  const client = new EnhancedOFFClient();
  
  const tests = [
    { code: "3017620422003", domain: "food", name: "Nutella" },
    { code: "4005900756114", domain: "beauty", name: "Nivea" }, 
    { code: "8001841568898", domain: "detergent", name: "Ariel" },
    { code: "1111111111111", domain: "food", name: "Inexistant" }
  ];
  
  for (const test of tests) {
    console.log(`\n=== ${test.name} (${test.domain}) ===`);
    const start = Date.now();
    const result = await client.fetchProduct(test.code, test.domain);
    const duration = Date.now() - start;
    
    console.log(`Durée: ${duration}ms`);
    console.log(`Statut: ${result.success ? "✅ OK" : `❌ ${result.error}`}`);
    if (result.success) {
      console.log(`Source: ${result.source}`);
      console.log(`Nom: ${result.product.product_name || result.product.name || "Sans nom"}`);
    }
  }
}

fullTest().catch(console.error);
