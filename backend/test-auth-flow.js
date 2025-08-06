// test-auth-flow.js
const axios = require('axios');

const API_URL = 'https://ecolojia-backendvf.onrender.com';

async function testAuth() {
    console.log('🔐 Test du flux d\'authentification ECOLOJIA\n');
    
    // 1. Test d'inscription
    const testUser = {
        email: `test${Date.now()}@example.com`,
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
    };
    
    console.log('1️⃣ Test d\'inscription...');
    try {
        const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
        console.log('✅ Inscription réussie!');
        console.log('   Token:', registerResponse.data.token ? '✓' : '✗');
        console.log('   User ID:', registerResponse.data.user?._id || 'Non fourni');
        
        // 2. Test de connexion
        console.log('\n2️⃣ Test de connexion...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Connexion réussie!');
        const token = loginResponse.data.token;
        
        // 3. Test d'accès aux routes protégées
        console.log('\n3️⃣ Test d\'accès aux routes protégées...');
        const protectedEndpoints = [
            '/api/dashboard',
            '/api/analysis',
            '/api/ai/chat'
        ];
        
        for (const endpoint of protectedEndpoints) {
            try {
                const response = await axios.get(`${API_URL}${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log(`✅ ${endpoint} - Accès autorisé`);
            } catch (error) {
                console.log(`❌ ${endpoint} - ${error.response?.status || error.message}`);
            }
        }
        
    } catch (error) {
        console.log('❌ Erreur:', error.response?.data?.message || error.message);
        
        // Si l'inscription échoue, essayer de se connecter (utilisateur existant)
        if (error.response?.status === 409) {
            console.log('\n📝 L\'utilisateur existe déjà, test de connexion...');
            try {
                const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                    email: 'test@example.com',
                    password: 'Test123!'
                });
                console.log('✅ Connexion réussie avec compte existant');
            } catch (loginError) {
                console.log('❌ Connexion échouée:', loginError.response?.data?.message);
            }
        }
    }
    
    // 4. Test de l'endpoint products (public)
    console.log('\n4️⃣ Test de l\'endpoint public /api/products...');
    try {
        const response = await axios.get(`${API_URL}/api/products?limit=5`);
        console.log(`✅ ${response.data.products?.length || 0} produits récupérés`);
        if (response.data.products?.[0]) {
            console.log(`   Exemple: ${response.data.products[0].name}`);
        }
    } catch (error) {
        console.log('❌ Erreur:', error.message);
    }
}

testAuth().catch(console.error);
