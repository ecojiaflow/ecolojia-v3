const { EnhancedOFFClient } = require("./src/services/EnhancedOFFClient");
const { ScoringV2Service } = require("./src/services/ScoringV2Service");

async function testScoringV2() {
  const client = new EnhancedOFFClient();

  const tests = [
    { code: "3017620422003", domain: "food", name: "Nutella" },
    { code: "4005900756114", domain: "beauty", name: "Nivea" },
    { code: "8001841568898", domain: "detergent", name: "Ariel" }
  ];

  for (const test of tests) {
    console.log(`\n=== ANALYSE ${test.name.toUpperCase()} (${test.domain}) ===`);
    
    const productData = await client.fetchProduct(test.code, test.domain);
    if (!productData.success) {
      console.log(`❌ Échec récupération: ${productData.error}`);
      continue;
    }

    const scoring = ScoringV2Service.calculateScores(productData.product, test.domain);
    
    console.log(`📊 Scores:`, JSON.stringify(scoring.scores, null, 2));
    console.log(`📋 Détails:`, JSON.stringify(scoring.details, null, 2));
    console.log(`💡 Recommandations: ${scoring.recommendations.join(' • ')}`);
  }
}

testScoringV2().catch(console.error);
