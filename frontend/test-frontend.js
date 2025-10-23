// test-frontend.js
const API_URL = 'https://ecolojia-backendvf.onrender.com';

async function testConnections() {
  console.log('ðŸ§ª Test de connexion Frontend -> Backend\n');
  
  const tests = [
    { name: 'Dashboard Stats', url: '/api/dashboard/stats' },
    { name: 'Analysis Manual', url: '/api/analysis/manual', method: 'POST', body: { name: 'Test', category: 'food', ingredients: { text: 'test' } } },
    { name: 'Products Stats', url: '/api/products/stats' }
  ];
  
  for (const test of tests) {
    try {
      const options = {
        method: test.method || 'GET',
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(API_URL + test.url, options);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`âœ… ${test.name}: OK (${response.status})`);
      } else {
        console.log(`âŒ ${test.name}: Erreur ${response.status}`);
      }
    } catch (error) {
      console.log(`âŒ ${test.name}: ${error.message}`);
    }
  }
}

testConnections();
