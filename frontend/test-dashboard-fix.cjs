// test-dashboard-fix.js - Script de test pour vérifier la correction

const axios = require('axios');
const colors = require('colors');

const API_URL = 'http://localhost:5001/api';
let token = '';

async function testDashboard() {
  console.log('🧪 TEST DU DASHBOARD APRÈS CORRECTION'.cyan.bold);
  console.log('='.repeat(50).gray);
  
  try {
    // 1. Connexion
    console.log('🔐 Connexion...'.cyan);
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.token) {
      token = loginResponse.data.token;
      console.log('✅ Connexion réussie'.green);
      console.log(`   Token: ${token.substring(0, 20)}...`.gray);
    } else {
      throw new Error('Pas de token reçu');
    }
    
    // 2. Test du profil (pour vérifier que le token fonctionne)
    console.log('\n📋 Test du profil...'.cyan);
    const profileResponse = await axios.get(`${API_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Profil récupéré:'.green, profileResponse.data.user.email);
    
    // 3. Test des stats dashboard
    console.log('\n📊 Test des stats dashboard...'.cyan);
    const statsResponse = await axios.get(`${API_URL}/dashboard/stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { range: 'month' }
    });
    
    console.log('✅ Stats récupérées:'.green);
    console.log('   - Scans ce mois:', statsResponse.data.overview.totalScans);
    console.log('   - Score santé moyen:', statsResponse.data.overview.averageHealthScore);
    console.log('   - Produits analysés:', statsResponse.data.overview.productsAnalyzed);
    
    // 4. Test de l'historique
    console.log('\n📜 Test de l\'historique...'.cyan);
    const historyResponse = await axios.get(`${API_URL}/dashboard/history`, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { page: 1, limit: 10 }
    });
    
    console.log('✅ Historique récupéré:'.green);
    console.log('   - Total:', historyResponse.data.total);
    console.log('   - Items:', historyResponse.data.data.length);
    
    // 5. Test du résumé hebdomadaire
    console.log('\n📅 Test du résumé hebdomadaire...'.cyan);
    const weeklyResponse = await axios.get(`${API_URL}/dashboard/weekly-summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✅ Résumé hebdomadaire récupéré:'.green);
    console.log('   - Jours avec données:', weeklyResponse.data.data.length);
    
    console.log('\n🎉 TOUS LES TESTS DASHBOARD PASSENT !'.green.bold);
    
  } catch (error) {
    console.log('\n❌ Erreur:'.red);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data.error || error.response.data.message);
      console.log('   URL:', error.config?.url);
      
      if (error.response.status === 401) {
        console.log('\n💡 Vérifiez que:'.yellow);
        console.log('   1. Le middleware authMiddleware est bien importé dans dashboard.routes.js');
        console.log('   2. Il n\'y a pas de double vérification du token');
        console.log('   3. Le JWT_SECRET est le même partout');
      }
    } else {
      console.log('   Message:', error.message);
    }
  }
}

// Lancer le test
testDashboard();