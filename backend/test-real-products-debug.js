// Test des vrais produits cosmétiques et détergents avec debug

const axios = require('axios');
const colors = require('colors');

const API_URL = 'http://localhost:5001/api';
let token = '';

// Configuration axios pour voir les erreurs détaillées
axios.defaults.validateStatus = () => true;

async function login() {
  try {
    console.log('🔐 Tentative de connexion...'.cyan);
    console.log(`   URL: ${API_URL}/auth/login`.gray);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log(`   Status: ${response.status}`.gray);
    console.log(`   Response:`, response.data);
    
    if (response.status === 200 && response.data.token) {
      token = response.data.token;
      console.log('✅ Connexion réussie'.green);
      return true;
    } else {
      console.log('❌ Erreur de connexion:'.red, response.data.error || 'Identifiants invalides');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur connexion:'.red);
    console.log('   Message:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('   ⚠️  Le serveur ne répond pas sur le port 5001'.yellow);
      console.log('   ℹ️  Vérifiez que le serveur est démarré avec: npm start'.cyan);
    }
    return false;
  }
}

async function testCosmeticByBarcode(barcode, productName) {
  try {
    console.log(`\n🧴 Test cosmétique: ${productName}`.cyan);
    console.log(`   Code-barres: ${barcode}`.gray);
    
    const response = await axios.post(
      `${API_URL}/cosmetic/analyze/barcode`,
      { barcode },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log(`   Status: ${response.status}`.gray);
    
    if (response.status === 200) {
      console.log('✅ Analyse réussie:'.green);
      console.log(`   - Scores: Sécurité ${response.data.scores.safety}/100, Naturalité ${response.data.scores.naturalness}/100`);
      console.log(`   - ${response.data.details.inci.length} ingrédients analysés`);
      if (response.data.details.concerns.length > 0) {
        console.log(`   - ⚠️  ${response.data.details.concerns.length} préoccupations détectées`.yellow);
      }
    } else {
      console.log('❌ Erreur:'.red, response.data.error || response.data.message);
    }
  } catch (error) {
    console.log('❌ Erreur test cosmétique:'.red, error.message);
  }
}

async function testDetergentByBarcode(barcode, productName) {
  try {
    console.log(`\n🧽 Test détergent: ${productName}`.cyan);
    console.log(`   Code-barres: ${barcode}`.gray);
    
    const response = await axios.post(
      `${API_URL}/detergent/analyze/barcode`,
      { barcode },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log(`   Status: ${response.status}`.gray);
    
    if (response.status === 200) {
      console.log('✅ Analyse réussie:'.green);
      console.log(`   - Scores: Écologique ${response.data.scores.ecological}/100, Efficacité ${response.data.scores.efficiency}/100`);
      console.log(`   - Biodégradabilité: ${response.data.details.biodegradability}%`);
      if (response.data.certifications.euEcolabel) {
        console.log(`   - 🌿 Certifié EU Ecolabel`.green);
      }
    } else {
      console.log('❌ Erreur:'.red, response.data.error || response.data.message);
    }
  } catch (error) {
    console.log('❌ Erreur test détergent:'.red, error.message);
  }
}

async function checkServerStatus() {
  try {
    console.log('🔍 Vérification du serveur...'.cyan);
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    console.log('✅ Serveur accessible'.green);
    return true;
  } catch (error) {
    console.log('❌ Serveur inaccessible'.red);
    console.log('   Assurez-vous que le serveur est démarré avec: npm start'.yellow);
    return false;
  }
}

async function runTests() {
  console.log('🧪 TEST DES VRAIS PRODUITS ECOLOJIA'.cyan.bold);
  console.log('='.repeat(50).gray);
  
  // Vérifier d'abord si le serveur est accessible
  const serverOk = await checkServerStatus();
  if (!serverOk) {
    return;
  }
  
  // Connexion
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n💡 Conseil: Créez d\'abord un compte test avec:'.yellow);
    console.log('   POST /api/auth/register'.gray);
    console.log('   { email: "test@example.com", password: "password123", name: "Test User" }'.gray);
    return;
  }
  
  // Tests cosmétiques
  console.log('\n📋 TESTS COSMÉTIQUES'.magenta.bold);
  console.log('='.repeat(50).gray);
  
  await testCosmeticByBarcode('3337875708838', 'Crème Hydratante Neutrogena');
  await testCosmeticByBarcode('3600523306268', 'Gel Douche Tahiti');
  await testCosmeticByBarcode('8710908825729', 'Déodorant Dove');
  
  // Tests détergents
  console.log('\n📋 TESTS DÉTERGENTS'.magenta.bold);
  console.log('='.repeat(50).gray);
  
  await testDetergentByBarcode('3178041320584', 'Ariel Original Lessive');
  await testDetergentByBarcode('8001090306593', 'Skip Ultimate Lessive');
  await testDetergentByBarcode('3450376010779', 'L\'Arbre Vert Lessive');
  
  console.log('\n✨ Tests terminés'.green.bold);
}

// Lancer les tests
runTests();