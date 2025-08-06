// test-production-api.js
const axios = require('axios');

const API_URL = 'https://ecolojia-backendvf.onrender.com';

async function testAPI() {
    console.log('🔍 Test de l\'API ECOLOJIA en production...\n');
    
    const tests = [
        {
            name: 'Health Check',
            method: 'GET',
            url: '/api/v1/health',
            expectStatus: [200, 404]
        },
        {
            name: 'Liste des produits',
            method: 'GET',
            url: '/api/v1/products?limit=5',
            expectStatus: [200]
        },
        {
            name: 'Recherche de produit',
            method: 'GET',
            url: '/api/v1/products/search?q=nutella',
            expectStatus: [200]
        },
        {
            name: 'Test d\'authentification',
            method: 'POST',
            url: '/api/v1/auth/login',
            data: {
                email: 'test@example.com',
                password: 'wrongpassword'
            },
            expectStatus: [401, 400]
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`\n📍 ${test.name}...`);
            const config = {
                method: test.method,
                url: API_URL + test.url,
                data: test.data,
                validateStatus: () => true
            };
            
            const response = await axios(config);
            
            if (test.expectStatus.includes(response.status)) {
                console.log(`✅ OK - Status: ${response.status}`);
                if (response.data && Object.keys(response.data).length > 0) {
                    console.log('   Données reçues:', 
                        JSON.stringify(response.data).substring(0, 100) + '...');
                }
            } else {
                console.log(`⚠️ Status inattendu: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Erreur: ${error.message}`);
        }
    }
    
    console.log('\n✅ Tests terminés!');
}

// Lancer les tests
testAPI().catch(console.error);
