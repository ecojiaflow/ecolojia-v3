// backend/test-analyze-direct.js
const fetch = require('node-fetch');

async function testAnalyze() {
  const API_URL = 'http://localhost:5001/api';
  
  // 1. Se connecter
  console.log('1. Connexion...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@test.com',
      password: 'Demo123!'
    })
  });
  
  const loginData = await loginRes.json();
  const token = loginData.accessToken || loginData.token;
  console.log('Token obtenu:', token ? '✓' : '✗');
  
  // 2. Analyser le Nutella
  console.log('\n2. Analyse du Nutella (3017620425035)...');
  const analyzeRes = await fetch(`${API_URL}/products/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      barcode: '3017620425035',
      category: 'food'
    })
  });
  
  const analyzeData = await analyzeRes.json();
  console.log('\nRéponse complète:');
  console.log(JSON.stringify(analyzeData, null, 2));
  
  // 3. Vérifier les valeurs
  console.log('\n📊 Valeurs extraites:');
  console.log('NOVA:', analyzeData.data?.scores?.nova);
  console.log('Nutri-Score:', analyzeData.data?.scores?.nutriscore);
  console.log('Score santé:', analyzeData.data?.scores?.health);
  console.log('Additifs:', analyzeData.data?.details?.additives?.length || 0);
}

testAnalyze().catch(console.error);