// test-dashboard-complete.js - Test complet de toutes les routes dashboard

const axios = require('axios');
const colors = require('colors');

const API_URL = 'http://localhost:5001/api';
let token = '';

async function testDashboard() {
  console.log('🧪 TEST COMPLET DU DASHBOARD ECOLOJIA'.cyan.bold);
  console.log('='.repeat(50).gray);
  
  try {
    // 1. Connexion
    console.log('\n🔐 Connexion...'.cyan);
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    if (loginResponse.data.token) {
      token = loginResponse.data.token;
      console.log('✅ Connexion réussie'.green);
    } else {
      throw new Error('Pas de token reçu');
    }
    
    // Configuration axios pour les prochaines requêtes
    const authAxios = axios.create({
      baseURL: API_URL,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // 2. Test des stats
    console.log('\n📊 Test /dashboard/stats...'.cyan);
    const statsResponse = await authAxios.get('/dashboard/stats?range=month');
    console.log('✅ Stats récupérées:'.green);
    console.log('   - Total scans:', statsResponse.data.overview.totalScans);
    console.log('   - Score moyen:', statsResponse.data.overview.averageHealthScore);
    console.log('   - Produits analysés:', statsResponse.data.overview.productsAnalyzed);
    
    // 3. Test de l'historique
    console.log('\n📜 Test /dashboard/history...'.cyan);
    const historyResponse = await authAxios.get('/dashboard/history?page=1&limit=5');
    console.log('✅ Historique récupéré:'.green);
    console.log('   - Total:', historyResponse.data.total);
    console.log('   - Page:', historyResponse.data.pagination.page);
    console.log('   - Items:', historyResponse.data.data.length);
    
    // 4. Test du résumé hebdomadaire
    console.log('\n📅 Test /dashboard/weekly-summary...'.cyan);
    const weeklyResponse = await authAxios.get('/dashboard/weekly-summary');
    console.log('✅ Résumé hebdomadaire:'.green);
    console.log('   - Total scans semaine:', weeklyResponse.data.summary.totalScans);
    console.log('   - Score moyen semaine:', weeklyResponse.data.summary.avgScore);
    
    // 5. Test de la distribution des produits
    console.log('\n📈 Test /dashboard/product-distribution...'.cyan);
    const distResponse = await authAxios.get('/dashboard/product-distribution');
    console.log('✅ Distribution récupérée:'.green);
    console.log('   - Par catégorie:', distResponse.data.distribution.byCategory);
    console.log('   - Par score:', distResponse.data.distribution.byScore);
    
    // 6. Test des tendances santé
    console.log('\n📉 Test /dashboard/health-trends...'.cyan);
    const trendsResponse = await authAxios.get('/dashboard/health-trends?period=7');
    console.log('✅ Tendances récupérées:'.green);
    console.log('   - Amélioration:', trendsResponse.data.summary.improvement + '%');
    console.log('   - Moyenne actuelle:', trendsResponse.data.summary.currentAvg);
    
    // 7. Test des scans récents
    console.log('\n🔍 Test /dashboard/recent-scans...'.cyan);
    const scansResponse = await authAxios.get('/dashboard/recent-scans?limit=3');
    console.log('✅ Scans récents:'.green);
    console.log('   - Nombre:', scansResponse.data.scans.length);
    if (scansResponse.data.scans.length > 0) {
      console.log('   - Dernier produit:', scansResponse.data.scans[0].product.name);
    }
    
    // 8. Test des achievements
    console.log('\n🏆 Test /dashboard/achievements...'.cyan);
    const achievResponse = await authAxios.get('/dashboard/achievements');
    console.log('✅ Achievements récupérés:'.green);
    console.log('   - Total:', achievResponse.data.achievements.length);
    console.log('   - Débloqués:', achievResponse.data.unlockedCount);
    console.log('   - Points totaux:', achievResponse.data.totalPoints);
    
    // 9. Test des recommandations
    console.log('\n💡 Test /dashboard/recommendations...'.cyan);
    const recoResponse = await authAxios.get('/dashboard/recommendations');
    console.log('✅ Recommandations:'.green);
    console.log('   - Nombre:', recoResponse.data.recommendations.length);
    console.log('   - Basées sur:', recoResponse.data.basedOn.scansCount, 'analyses');
    
    // 10. Test de l'export
    console.log('\n📤 Test /dashboard/export...'.cyan);
    const exportResponse = await authAxios.post('/dashboard/export', {
      format: 'json',
      dateRange: 'last30days'
    });
    console.log('✅ Export généré:'.green);
    console.log('   - Format:', 'json');
    console.log('   - Analyses exportées:', exportResponse.data.data.analyses.length);
    
    // 11. Test du partage
    console.log('\n🔗 Test /dashboard/share...'.cyan);
    const shareResponse = await authAxios.post('/dashboard/share', {
      platform: 'twitter',
      message: 'Mes progrès ECOLOJIA'
    });
    console.log('✅ Lien de partage créé:'.green);
    console.log('   - URL:', shareResponse.data.shareUrl);
    console.log('   - Expire dans:', shareResponse.data.expiresIn);
    
    console.log('\n🎉 TOUS LES TESTS RÉUSSIS !'.green.bold);
    console.log('✅ Le dashboard est 100% fonctionnel'.green);
    
  } catch (error) {
    console.log('\n❌ Erreur:'.red);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data.error || error.response.data.message);
      console.log('   URL:', error.config?.url);
    } else {
      console.log('   Message:', error.message);
    }
  }
}

// Afficher les routes disponibles
console.log('\n📋 ROUTES DASHBOARD DISPONIBLES:'.yellow);
console.log('   GET  /api/dashboard/stats');
console.log('   GET  /api/dashboard/history');
console.log('   GET  /api/dashboard/weekly-summary');
console.log('   GET  /api/dashboard/product-distribution');
console.log('   GET  /api/dashboard/health-trends');
console.log('   GET  /api/dashboard/recent-scans');
console.log('   GET  /api/dashboard/achievements');
console.log('   GET  /api/dashboard/recommendations');
console.log('   POST /api/dashboard/export');
console.log('   POST /api/dashboard/share');

// Lancer le test
testDashboard();