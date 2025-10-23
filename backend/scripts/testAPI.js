const axios = require('axios');

async function testAPI() {
  const barcode = '3017620422003'; // Nutella
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
  
  const { data } = await axios.get(url);
  
  console.log('\n📡 Réponse API OpenFoodFacts:\n');
  console.log('nova_group:', data.product?.nova_group);
  console.log('nutriscore_grade:', data.product?.nutriscore_grade);
  console.log('ecoscore_grade:', data.product?.ecoscore_grade);
  console.log('\nAdditives tags:', data.product?.additives_tags?.slice(0, 3));
}

testAPI();
