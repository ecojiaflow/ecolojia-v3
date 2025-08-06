// test-api-routes.js
const axios = require('axios');

const API_URL = 'https://ecolojia-backendvf.onrender.com';

async function findRoutes() {
    console.log('🔍 Recherche des routes disponibles...\n');
    
    // Endpoints à tester basés sur les logs
    const endpoints = [
        // Auth routes
        '/auth/login',
        '/auth/register',
        '/api/auth/login',
        '/api/v1/auth/login',
        
        // Product routes
        '/products',
        '/api/products',
        '/api/v1/products',
        
        // Analysis routes
        '/analysis',
        '/api/analysis',
        '/api/v1/analysis',
        
        // Root
        '/',
        '/api',
        '/api/v1',
        
        // Health
        '/health',
        '/api/health',
        '/api/v1/health'
    ];
    
    const foundRoutes = [];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(API_URL + endpoint, {
                validateStatus: (status) => status < 500
            });
            
            if (response.status !== 404) {
                console.log(`✅ ${endpoint} - Status: ${response.status}`);
                foundRoutes.push({
                    endpoint,
                    status: response.status,
                    requiresAuth: response.status === 401
                });
            }
        } catch (error) {
            if (error.response && error.response.status !== 404) {
                console.log(`⚠️ ${endpoint} - Error: ${error.message}`);
            }
        }
    }
    
    console.log('\n📊 Résumé des routes trouvées:');
    console.log('================================');
    foundRoutes.forEach(route => {
        console.log(`${route.endpoint} - ${route.requiresAuth ? '🔒 Auth requise' : '✅ Publique'}`);
    });
    
    if (foundRoutes.length === 0) {
        console.log('❌ Aucune route trouvée. Vérifiez la configuration du serveur.');
    }
}

findRoutes().catch(console.error);
