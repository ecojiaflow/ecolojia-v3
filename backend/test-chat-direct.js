// test-chat-direct.js
const fetch = require('node-fetch');

async function testChat() {
  const API_URL = 'http://localhost:5001/api';
  
  try {
    // 1. Se connecter avec le compte demo
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
    console.log('Login response:', loginData);
    
    if (!loginData.accessToken && !loginData.token) {
      console.error('Pas de token reçu');
      return;
    }
    
    const token = loginData.accessToken || loginData.token;
    console.log('Token obtenu:', token.substring(0, 50) + '...');
    
    // 2. Tester le chat
    console.log('\n2. Test du chat IA...');
    const chatRes = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: 'Qu\'est-ce que le score NOVA ?'
      })
    });
    
    console.log('Status:', chatRes.status);
    console.log('Headers:', chatRes.headers.raw());
    
    const text = await chatRes.text();
    console.log('Raw response:', text);
    
    try {
      const chatData = JSON.parse(text);
      console.log('Parsed response:', chatData);
    } catch (e) {
      console.log('Could not parse as JSON');
    }
    
  } catch (error) {
    console.error('Erreur:', error);
  }
}

testChat();