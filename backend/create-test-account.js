// Script pour crÃ©er un compte test ECOLOJIA

const axios = require('axios');
const colors = require('colors');

const API_URL = 'http://localhost:5001/api';

async function createTestAccount() {
  console.log('ðŸ”§ CRÃ‰ATION DU COMPTE TEST ECOLOJIA'.cyan.bold);
  console.log('='.repeat(50).gray);
  
  try {
    // 1. VÃ©rifier si le serveur est accessible
    console.log('ðŸ” VÃ©rification du serveur...'.cyan);
    try {
      await axios.get(`${API_URL}/health`, { timeout: 5000 });
      console.log('âœ… Serveur accessible'.green);
    } catch (error) {
      console.log('âŒ Serveur inaccessible sur le port 5001'.red);
      console.log('   DÃ©marrez le serveur avec: npm start'.yellow);
      return;
    }
    
    // 2. CrÃ©er le compte
    console.log('\nðŸ“ CrÃ©ation du compte test...'.cyan);
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
      console.log('âœ… Compte crÃ©Ã© avec succÃ¨s!'.green);
      console.log('   Token:', response.data.token ? 'âœ“ ReÃ§u' : 'âœ— Non reÃ§u');
      
      // 3. Tester la connexion
      console.log('\nðŸ” Test de connexion...'.cyan);
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: userData.email,
        password: userData.password
      });
      
      if (loginResponse.status === 200) {
        console.log('âœ… Connexion rÃ©ussie!'.green);
        console.log('\nðŸŽ‰ Vous pouvez maintenant lancer les tests:'.green.bold);
        console.log('   node test-real-products-debug.js'.cyan);
      }
    } else if (response.status === 409) {
      console.log('âš ï¸  Le compte existe dÃ©jÃ '.yellow);
      
      // Tester la connexion
      console.log('\nðŸ” Test de connexion avec le compte existant...'.cyan);
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: userData.email,
        password: userData.password
      }, { validateStatus: () => true });
      
      if (loginResponse.status === 200) {
        console.log('âœ… Connexion rÃ©ussie avec le compte existant!'.green);
        console.log('\nðŸŽ‰ Vous pouvez lancer les tests:'.green.bold);
        console.log('   node test-real-products-debug.js'.cyan);
      } else {
        console.log('âŒ Impossible de se connecter'.red);
        console.log('   Le mot de passe du compte existant est peut-Ãªtre diffÃ©rent'.yellow);
      }
    } else {
      console.log('âŒ Erreur lors de la crÃ©ation:'.red);
      console.log('   Message:', response.data.error || response.data.message || 'Erreur inconnue');
    }
    
  } catch (error) {
    console.log('âŒ Erreur:'.red, error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('   Le serveur ne rÃ©pond pas. Assurez-vous qu\'il est dÃ©marrÃ©.'.yellow);
    }
  }
}

// Lancer la crÃ©ation
createTestAccount();