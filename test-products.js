// test-products.js - Test rapide des routes produits
// Exécuter avec : node test-products.js

const API_URL = 'https://ecolojia-backendvf.onrender.com/api';

async function testRoute(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(data && { body: JSON.stringify(data) })
    };

    console.log(`\n🔍 Testing ${method} ${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ SUCCESS (${response.status})`);
      console.log('Response:', JSON.stringify(result, null, 2).substring(0, 200) + '...');
    } else {
      console.log(`❌ ERROR (${response.status}): ${result.error || result.message}`);
    }
    
    return { ok: response.ok, data: result };
  } catch (error) {
    console.log(`💥 NETWORK ERROR: ${error.message}`);
    return { ok: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 ECOLOJIA - Test des routes produits\n');
  console.log('Backend:', API_URL);
  console.log('=' .repeat(50));

  // 1. Test de santé
  console.log('\n1️⃣ TEST DE SANTÉ');
  await testRoute('GET', '/health');

  // 2. Test des routes produits
  console.log('\n2️⃣ ROUTES PRODUITS (sans auth)');
  await testRoute('GET', '/products/search?q=nutella');
  await testRoute('GET', '/products/trending');
  await testRoute('GET', '/products/barcode/3017620422003');

  // 3. Test du dashboard (sans auth - devrait échouer)
  console.log('\n3️⃣ DASHBOARD (sans auth - doit échouer)');
  await testRoute('GET', '/dashboard/stats');

  console.log('\n✨ Tests terminés!');
}

// Lancer les tests
runTests().catch(console.error);