// backend/test-real-products.js
// Test des vrais produits cosmétiques et détergents

const axios = require('axios');
const colors = require('colors');

const API_URL = 'http://localhost:5001/api';
let token = '';

async function login() {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    token = res.data.token || res.data.accessToken;
    console.log('✅ Connecté'.green);
    return true;
  } catch (error) {
    console.log('❌ Erreur connexion'.red);
    return false;
  }
}

async function testCosmeticBarcode() {
  console.log('\n🧴 TEST COSMÉTIQUE PAR CODE-BARRES'.cyan);
  console.log('='.repeat(50));
  
  try {
    // Test avec un vrai shampooing L'Oréal
    const res = await axios.post(
      `${API_URL}/cosmetic/analyze/barcode`,
      { barcode: '3600551018638' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Produit trouvé:'.green, res.data.data.product.name);
    console.log('   Marque:', res.data.data.product.brand);
    console.log('   Score sécurité:', res.data.data.scores.safety + '/100');
    console.log('   Score naturalité:', res.data.data.scores.naturalness + '/100');
    console.log('   Ingrédients détectés:', res.data.data.analysis.totalIngredients);
    
  } catch (error) {
    console.log('❌ Erreur:'.red, error.response?.data?.error || error.message);
  }
}

async function testDetergentBarcode() {
  console.log('\n🧽 TEST DÉTERGENT PAR CODE-BARRES'.cyan);
  console.log('='.repeat(50));
  
  try {
    // Test avec Ariel Original
    const res = await axios.post(
      `${API_URL}/detergent/analyze/barcode`,
      { barcode: '3178041320584' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Produit trouvé:'.green, res.data.data.product.name);
    console.log('   Marque:', res.data.data.product.brand);
    console.log('   Score écologique:', res.data.data.scores.ecological + '/100');
    console.log('   Biodégradabilité:', res.data.data.details.biodegradability);
    console.log('   CDV:', res.data.data.details.cdv);
    
  } catch (error) {
    console.log('❌ Erreur:'.red, error.response?.data?.error || error.message);
  }
}

async function testCertifiedDetergents() {
  console.log('\n🌿 TEST DÉTERGENTS CERTIFIÉS'.cyan);
  console.log('='.repeat(50));
  
  try {
    const res = await axios.get(
      `${API_URL}/detergent/certified`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Produits certifiés trouvés:'.green, res.data.total);
    res.data.data.forEach(product => {
      console.log(`   - ${product.name} (${product.brand})`);
    });
    
  } catch (error) {
    console.log('❌ Erreur:'.red, error.response?.data?.error || error.message);
  }
}

async function getExamples() {
  console.log('\n📋 EXEMPLES DE CODES-BARRES'.cyan);
  console.log('='.repeat(50));
  
  try {
    // Cosmétiques
    const cosmeticRes = await axios.get(`${API_URL}/cosmetic/examples`);
    console.log('\n🧴 Cosmétiques:'.yellow);
    cosmeticRes.data.data.forEach(ex => {
      console.log(`   ${ex.barcode} - ${ex.name} (${ex.type})`);
    });
    
    // Détergents
    const detergentRes = await axios.get(`${API_URL}/detergent/examples`);
    console.log('\n🧽 Détergents:'.yellow);
    detergentRes.data.data.forEach(ex => {
      console.log(`   ${ex.barcode} - ${ex.name} (${ex.type})${ex.certified ? ' ✅' : ''}`);
    });
    
  } catch (error) {
    console.log('❌ Erreur récupération exemples'.red);
  }
}

async function main() {
  console.log('🧪 TEST DES VRAIS PRODUITS ECOLOJIA'.bold.blue);
  
  if (await login()) {
    await getExamples();
    await testCosmeticBarcode();
    await testDetergentBarcode();
    await testCertifiedDetergents();
  }
  
  console.log('\n✨ Tests terminés'.green);
}

main();