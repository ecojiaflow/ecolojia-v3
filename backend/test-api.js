// Créez ce fichier test-api.js et exécutez avec: node test-api.js

const API_URL = 'https://ecolojia-backendvf.onrender.com/api';

// Couleurs pour la console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function testEndpoint(method, endpoint, data = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { body: JSON.stringify(data) })
    };

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.text();
    
    let jsonResult;
    try {
      jsonResult = JSON.parse(result);
    } catch {
      jsonResult = result;
    }

    if (response.ok) {
      console.log(`${colors.green}✅ ${method} ${endpoint} - ${response.status}${colors.reset}`);
      return { success: true, data: jsonResult };
    } else {
      console.log(`${colors.red}❌ ${method} ${endpoint} - ${response.status}${colors.reset}`);
      console.log(`   Erreur: ${JSON.stringify(jsonResult)}`);
      return { success: false, error: jsonResult };
    }
  } catch (error) {
    console.log(`${colors.red}💥 ${method} ${endpoint} - ERREUR${colors.reset}`);
    console.log(`   ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('\n🚀 TESTS API ECOLOJIA V3\n');
  
  // 1. Test routes de base
  console.log('1️⃣ Routes de base:');
  await testEndpoint('GET', '/health');
  await testEndpoint('GET', '/test');
  await testEndpoint('GET', '/auth/test');
  
  // 2. Créer un nouvel utilisateur
  console.log('\n2️⃣ Création utilisateur:');
  const timestamp = Date.now();
  const registerResult = await testEndpoint('POST', '/auth/register', {
    email: `test${timestamp}@ecolojia.app`,
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User'
  });
  
  let token = null;
  if (registerResult.success && registerResult.data.token) {
    token = registerResult.data.token;
    console.log(`   ${colors.yellow}Token obtenu: ${token.substring(0, 20)}...${colors.reset}`);
  }
  
  // 3. Test login avec le nouvel utilisateur
  console.log('\n3️⃣ Test login:');
  const loginResult = await testEndpoint('POST', '/auth/login', {
    email: `test${timestamp}@ecolojia.app`,
    password: 'Test123!'
  });
  
  if (loginResult.success && loginResult.data.token) {
    token = loginResult.data.token;
  }
  
  // 4. Test routes produits
  console.log('\n4️⃣ Routes produits:');
  await testEndpoint('GET', '/products/search?q=nutella');
  await testEndpoint('GET', '/products/trending');
  await testEndpoint('GET', '/products/barcode/3017620422003');
  
  // 5. Test routes dashboard (avec auth)
  console.log('\n5️⃣ Routes dashboard:');
  await testEndpoint('GET', '/dashboard/stats', null, token);
  await testEndpoint('GET', '/dashboard/export', null, token);
  
  // 6. Test analyse produit (avec auth)
  console.log('\n6️⃣ Analyse produit:');
  if (token) {
    await testEndpoint('POST', '/products/analyze', {
      barcode: '3017620422003',
      category: 'food'
    }, token);
  }
  
  console.log('\n✨ Tests terminés!\n');
}

// Lancer les tests
runTests().catch(console.error);