// tests/complete-test-suite.js
const axios = require('axios');
const crypto = require('crypto');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_USER = {
  email: 'test@ecolojia.app',
  password: 'Test123!@#'
};

// ═══════════════════════════════════════════════════════════════════════
// TESTS AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════════════════

async function testAuth() {
  console.log('\n🔐 TESTS AUTHENTIFICATION');
  
  try {
    // 1. Register
    console.log('→ Register new user...');
    const registerRes = await axios.post(`${API_URL}/api/auth/register`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      firstName: 'Test',
      lastName: 'User'
    });
    console.log('✅ Register:', registerRes.data.success ? 'OK' : 'FAILED');
    
    // 2. Login
    console.log('→ Login...');
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    const token = loginRes.data.token;
    console.log('✅ Login:', token ? 'OK' : 'FAILED');
    
    // 3. Get profile
    console.log('→ Get profile...');
    const profileRes = await axios.get(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile:', profileRes.data.user ? 'OK' : 'FAILED');
    
    return { success: true, token };
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.response?.data || error.message);
    return { success: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TESTS PROXY SÉCURISÉ
// ═══════════════════════════════════════════════════════════════════════

async function testSecureProxy(token) {
  console.log('\n🔒 TESTS PROXY SÉCURISÉ');
  
  try {
    const headers = { Authorization: `Bearer ${token}` };
    
    // 1. Algolia token
    console.log('→ Get Algolia search token...');
    const algoliaRes = await axios.post(`${API_URL}/api/proxy/algolia/search-token`, 
      { indices: ['ecolojia_products'] },
      { headers }
    );
    console.log('✅ Algolia token:', algoliaRes.data.token ? 'OK' : 'FAILED');
    
    // 2. AI Chat (quota check)
    console.log('→ Test AI chat with quota...');
    try {
      const aiRes = await axios.post(`${API_URL}/api/proxy/ai/chat`,
        { message: 'Qu\'est-ce que le Nutri-Score ?' },
        { headers }
      );
      console.log('✅ AI chat:', aiRes.data.response ? 'OK' : 'FAILED');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('⚠️ AI chat: Quota épuisé (comportement attendu pour Free)');
      } else throw error;
    }
    
    // 3. Upload signature
    console.log('→ Get upload signature...');
    const uploadRes = await axios.post(`${API_URL}/api/proxy/upload/signature`,
      { uploadPreset: 'ecolojia_products' },
      { headers }
    );
    console.log('✅ Upload signature:', uploadRes.data.signature ? 'OK' : 'FAILED');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Proxy test failed:', error.response?.data || error.message);
    return { success: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TESTS QUOTAS
// ═══════════════════════════════════════════════════════════════════════

async function testQuotas(token) {
  console.log('\n📊 TESTS QUOTAS');
  
  try {
    const headers = { Authorization: `Bearer ${token}` };
    
    // 1. Get quota status
    console.log('→ Get quota status...');
    const statusRes = await axios.get(`${API_URL}/api/users/quota-status`, { headers });
    console.log('✅ Quota status:', statusRes.data);
    
    // 2. Test scan quota
    console.log('→ Test scan quota consumption...');
    let scansSuccess = 0;
    for (let i = 0; i < 3; i++) {
      try {
        await axios.post(`${API_URL}/api/analyses`, 
          { barcode: `123456789${i}`, method: 'scan' },
          { headers }
        );
        scansSuccess++;
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`⚠️ Scan ${i + 1}: Quota atteint`);
          break;
        }
      }
    }
    console.log(`✅ Scans réussis: ${scansSuccess}/3`);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Quota test failed:', error.response?.data || error.message);
    return { success: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TESTS RGPD
// ═══════════════════════════════════════════════════════════════════════

async function testGDPR(token) {
  console.log('\n🛡️ TESTS RGPD');
  
  try {
    const headers = { Authorization: `Bearer ${token}` };
    
    // 1. Accès aux données
    console.log('→ Droit d\'accès (Art. 15)...');
    const accessRes = await axios.get(`${API_URL}/api/gdpr/access`, { headers });
    console.log('✅ Accès données:', accessRes.data.data ? 'OK' : 'FAILED');
    
    // 2. Consentements
    console.log('→ Get consents...');
    const consentsRes = await axios.get(`${API_URL}/api/gdpr/consent`, { headers });
    console.log('✅ Consents:', consentsRes.data.consents);
    
    // 3. Update consents
    console.log('→ Update consents...');
    const updateRes = await axios.put(`${API_URL}/api/gdpr/consent`,
      { consents: { analytics: true, healthData: true, marketing: false } },
      { headers }
    );
    console.log('✅ Update consents:', updateRes.data.success ? 'OK' : 'FAILED');
    
    // 4. Export données
    console.log('→ Export données JSON...');
    try {
      const exportRes = await axios.post(`${API_URL}/api/gdpr/export`,
        { format: 'json', categories: ['profile', 'preferences'] },
        { headers }
      );
      console.log('✅ Export:', exportRes.data ? 'OK' : 'FAILED');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('⚠️ Export: Quota épuisé (comportement attendu pour Free)');
      } else throw error;
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ GDPR test failed:', error.response?.data || error.message);
    return { success: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TESTS WEBHOOKS
// ═══════════════════════════════════════════════════════════════════════

async function testWebhooks() {
  console.log('\n🪝 TESTS WEBHOOKS');
  
  try {
    // 1. Health check
    console.log('→ Webhook health check...');
    const healthRes = await axios.get(`${API_URL}/api/webhooks/health`);
    console.log('✅ Health:', healthRes.data.status === 'ok' ? 'OK' : 'FAILED');
    
    // 2. Test webhook signature
    console.log('→ Test webhook signature validation...');
    const testPayload = {
      meta: {
        event_name: 'test',
        event_created_at: new Date().toISOString()
      },
      data: { id: 'test-123' }
    };
    
    const signature = crypto
      .createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET || 'test-secret')
      .update(JSON.stringify(testPayload))
      .digest('hex');
    
    try {
      await axios.post(`${API_URL}/api/webhooks/lemonsqueezy`, testPayload, {
        headers: { 'x-signature': signature }
      });
      console.log('✅ Webhook signature: Valid');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('❌ Webhook signature: Invalid (check secret)');
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Webhook test failed:', error.response?.data || error.message);
    return { success: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TESTS CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════════════════════

async function testCircuitBreaker(token) {
  console.log('\n⚡ TESTS CIRCUIT BREAKER');
  
  try {
    const headers = { Authorization: `Bearer ${token}` };
    
    // 1. Status
    console.log('→ Circuit breaker status...');
    const statusRes = await axios.get(`${API_URL}/api/ai/circuit-breaker/status`, { headers });
    console.log('✅ Status:', statusRes.data);
    
    // 2. Simulate failures
    console.log('→ Simulate AI failures...');
    for (let i = 0; i < 5; i++) {
      try {
        await axios.post(`${API_URL}/api/proxy/ai/chat`,
          { message: 'test', simulateError: true },
          { headers }
        );
      } catch (error) {
        console.log(`  Failure ${i + 1}: ${error.response?.status}`);
      }
    }
    
    // 3. Check if circuit opened
    const newStatus = await axios.get(`${API_URL}/api/ai/circuit-breaker/status`, { headers });
    console.log('✅ Circuit state:', newStatus.data.state);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Circuit breaker test failed:', error.response?.data || error.message);
    return { success: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TESTS RATE LIMITING
// ═══════════════════════════════════════════════════════════════════════

async function testRateLimiting(token) {
  console.log('\n🚦 TESTS RATE LIMITING');
  
  try {
    const headers = { Authorization: `Bearer ${token}` };
    
    console.log('→ Stress test rate limiting...');
    const requests = [];
    for (let i = 0; i < 110; i++) {
      requests.push(
        axios.get(`${API_URL}/api/proxy/health`, { headers })
          .catch(err => ({ error: err.response?.status }))
      );
    }
    
    const results = await Promise.all(requests);
    const rateLimited = results.filter(r => r.error === 429).length;
    const success = results.filter(r => !r.error).length;
    
    console.log(`✅ Requests: ${success} success, ${rateLimited} rate-limited`);
    console.log(rateLimited > 0 ? '✅ Rate limiting: Working' : '❌ Rate limiting: Not working');
    
    return { success: rateLimited > 0 };
    
  } catch (error) {
    console.error('❌ Rate limit test failed:', error.message);
    return { success: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('🧪 ECOLOJIA V3 - SUITE DE TESTS COMPLÈTE');
  console.log('=====================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`Date: ${new Date().toLocaleString()}`);
  
  const results = {
    auth: false,
    proxy: false,
    quotas: false,
    gdpr: false,
    webhooks: false,
    circuitBreaker: false,
    rateLimiting: false
  };
  
  try {
    // 1. Auth (required for other tests)
    const authResult = await testAuth();
    results.auth = authResult.success;
    
    if (!authResult.token) {
      console.error('\n❌ Auth failed - cannot continue tests');
      return;
    }
    
    const token = authResult.token;
    
    // 2. Run other tests
    results.proxy = (await testSecureProxy(token)).success;
    results.quotas = (await testQuotas(token)).success;
    results.gdpr = (await testGDPR(token)).success;
    results.webhooks = (await testWebhooks()).success;
    results.circuitBreaker = (await testCircuitBreaker(token)).success;
    results.rateLimiting = (await testRateLimiting(token)).success;
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
  }
  
  // Summary
  console.log('\n📊 RÉSUMÉ DES TESTS');
  console.log('==================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const totalPassed = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
  
  console.log(`\n🎯 Score: ${totalPassed}/${totalTests} (${successRate}%)`);
  
  // Cleanup
  if (results.auth) {
    console.log('\n🧹 Cleaning up test user...');
    try {
      await axios.delete(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authResult.token}` }
      });
      console.log('✅ Test user deleted');
    } catch (error) {
      console.log('⚠️ Could not delete test user');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runAllTests };