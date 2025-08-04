// Script pour créer un compte test ECOLOJIA

const axios = require('axios');
const colors = require('colors');

const API_URL = 'http://localhost:5001/api';

async function createTestAccount() {
  console.log('🔧 CRÉATION DU COMPTE TEST ECOLOJIA'.cyan.bold);
  console.log('='.repeat(50).gray);
  
  try {
    // 1. Vérifier si le serveur est accessible
    console.log('🔍 Vérification du serveur...'.cyan);
    try {
      await axios.get(`${API_URL}/health`, { timeout: 5000 });
      console.log('✅ Serveur accessible'.green);
    } catch (error) {
      console.log('❌ Serveur inaccessible sur le port 5001'.red);
      console.log('   Démarrez le serveur avec: npm start'.yellow);
      return;
    }
    
    // 2. Créer le compte
    console.log('\n📝 Création du compte test...'.cyan);
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };
    
    console.log('   Email:', userData.email.gray);
    console.log('   Password:', userData.password.gray);
    
    const response = await axios.post(`${API_URL}/auth/register`, userData, {
      validateStatus: () => true
    });
    
    console.log(`   Status: ${response.status}`.gray);
    
    if (response.status === 201) {
      console.log('✅ Compte créé avec succès!'.green);
      console.log('   Token:', response.data.token ? '✓ Reçu' : '✗ Non reçu');
      
      // 3. Tester la connexion
      console.log('\n🔐 Test de connexion...'.cyan);
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      
      if (loginResponse.status === 200) {
        console.log('✅ Connexion réussie!'.green);
        console.log('\n🎉 Vous pouvez maintenant lancer les tests:'.green.bold);
        console.log('   node test-real-products-debug.js'.cyan);
      }
    } else if (response.status === 409) {
      console.log('⚠️  Le compte existe déjà'.yellow);
      
      // Tester la connexion
      console.log('\n🔐 Test de connexion avec le compte existant...'.cyan);
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: userData.email,
        password: userData.password
      }, { validateStatus: () => true });
      
      if (loginResponse.status === 200) {
        console.log('✅ Connexion réussie avec le compte existant!'.green);
        console.log('\n🎉 Vous pouvez lancer les tests:'.green.bold);
        console.log('   node test-real-products-debug.js'.cyan);
      } else {
        console.log('❌ Impossible de se connecter'.red);
        console.log('   Le mot de passe du compte existant est peut-être différent'.yellow);
      }
    } else {
      console.log('❌ Erreur lors de la création:'.red);
      console.log('   Message:', response.data.error || response.data.message || 'Erreur inconnue');
    }
    
  } catch (error) {
    console.log('❌ Erreur:'.red, error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('   Le serveur ne répond pas. Assurez-vous qu\'il est démarré.'.yellow);
    }
  }
}

// Lancer la création
createTestAccount();