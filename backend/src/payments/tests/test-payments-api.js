const http = require('http');
const https = require('https');

class PaymentsAPITester {
  constructor() {
    this.baseURL = 'http://localhost:10000';
    this.testResults = [];
  }

  async runAllTests() {
    console.log('DÃ‰MARRAGE TESTS BACKEND M11 PAYMENTS');
    console.log('===================================');
    console.log('');

    // Tests de base
    await this.testHealthEndpoint();
    await this.testWebhookHealth();
    
    // Tests avec donnÃ©es mock
    await this.testCreateCheckoutValidation();
    await this.testPremiumCheckWithoutAuth();
    
    // Affichage rÃ©sultats
    this.displayResults();
  }

  async makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseURL + path);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsedBody = body ? JSON.parse(body) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parsedBody
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: body
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async testHealthEndpoint() {
    console.log('TEST 1: Health Endpoint');
    try {
      const response = await this.makeRequest('GET', '/api/health');
      
      if (response.status === 200) {
        this.addResult('Health Endpoint', 'PASS', 'Serveur opÃ©rationnel');
      } else {
        this.addResult('Health Endpoint', 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      this.addResult('Health Endpoint', 'ERROR', error.message);
    }
  }

  async testWebhookHealth() {
    console.log('TEST 2: Webhook Health');
    try {
      const response = await this.makeRequest('GET', '/api/webhooks/health');
      
      if (response.status === 200 && response.body.success) {
        this.addResult('Webhook Health', 'PASS', 'Webhook endpoint opÃ©rationnel');
      } else {
        this.addResult('Webhook Health', 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      this.addResult('Webhook Health', 'ERROR', error.message);
    }
  }

  async testCreateCheckoutValidation() {
    console.log('TEST 3: Create Checkout Validation');
    try {
      // Test avec donnÃ©es invalides
      const invalidData = {
        userEmail: 'invalid-email',
        userId: 'invalid-id'
      };

      const response = await this.makeRequest('POST', '/api/payments/create-checkout', invalidData);
      
      if (response.status === 400) {
        this.addResult('Checkout Validation', 'PASS', 'Validation des donnÃ©es fonctionne');
      } else {
        this.addResult('Checkout Validation', 'FAIL', `Status unexpected: ${response.status}`);
      }
    } catch (error) {
      this.addResult('Checkout Validation', 'ERROR', error.message);
    }
  }

  async testPremiumCheckWithoutAuth() {
    console.log('TEST 4: Premium Check Sans Auth');
    try {
      const response = await this.makeRequest('GET', '/api/payments/check-premium/123456789012345678901234');
      
      if (response.status === 401 || response.status === 403) {
        this.addResult('Premium Auth Check', 'PASS', 'Protection auth fonctionne');
      } else {
        this.addResult('Premium Auth Check', 'FAIL', `Status: ${response.status}`);
      }
    } catch (error) {
      this.addResult('Premium Auth Check', 'ERROR', error.message);
    }
  }

  async testLemonSqueezyConfig() {
    console.log('TEST 5: Configuration LemonSqueezy');
    try {
      // VÃ©rifier que les variables d'environnement sont prÃ©sentes
      const envCheck = {
        hasApiKey: !!process.env.LEMONSQUEEZY_API_KEY,
        hasStoreId: !!process.env.LEMONSQUEEZY_STORE_ID,
        hasProductId: !!process.env.LEMONSQUEEZY_PRODUCT_ID
      };

      if (envCheck.hasApiKey && envCheck.hasStoreId && envCheck.hasProductId) {
        this.addResult('LemonSqueezy Config', 'PASS', 'Variables environnement configurÃ©es');
      } else {
        this.addResult('LemonSqueezy Config', 'FAIL', `Missing config: ${JSON.stringify(envCheck)}`);
      }
    } catch (error) {
      this.addResult('LemonSqueezy Config', 'ERROR', error.message);
    }
  }

  addResult(testName, status, message) {
    this.testResults.push({ testName, status, message });
    console.log(`  ${status}: ${message}`);
    console.log('');
  }

  displayResults() {
    console.log('RÃ‰SULTATS TESTS BACKEND M11');
    console.log('===========================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    
    console.log(`PASS: ${passed}`);
    console.log(`FAIL: ${failed}`);
    console.log(`ERROR: ${errors}`);
    console.log(`TOTAL: ${this.testResults.length}`);
    console.log('');
    
    if (failed === 0 && errors === 0) {
      console.log('STATUT: BACKEND M11 PRÃŠT POUR FRONTEND');
    } else {
      console.log('STATUT: CORRECTIONS REQUISES AVANT FRONTEND');
      console.log('');
      console.log('DÃ‰TAILS ERREURS:');
      this.testResults
        .filter(r => r.status !== 'PASS')
        .forEach(r => {
          console.log(`  ${r.testName}: ${r.message}`);
        });
    }
  }
}

// ExÃ©cution des tests si script appelÃ© directement
if (require.main === module) {
  const tester = new PaymentsAPITester();
  tester.runAllTests().catch(console.error);
}

module.exports = PaymentsAPITester;