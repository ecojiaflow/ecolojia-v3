const axios = require("axios");

class RetryService {
  static async fetchWithRetry(url, options = {}) {
    const maxRetries = options.retries || 3;
    const timeout = options.timeout || 15000;
    const delay = options.delay || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[RetryService] Tentative ${attempt}/${maxRetries}: ${url}`);
        
        const response = await axios.get(url, {
          timeout,
          headers: {
            'User-Agent': 'ECOLOJIA/3.0 (https://ecolojia.com)',
            ...options.headers
          }
        });

        if (response.status === 200 && response.data) {
          console.log(`[RetryService] Succès après ${attempt} tentative(s)`);
          return response.data;
        }
        
        throw new Error(`Status ${response.status}`);
      } catch (error) {
        console.warn(`[RetryService] Échec tentative ${attempt}: ${error.message}`);
        
        if (attempt === maxRetries) {
          console.error(`[RetryService] Abandon après ${maxRetries} tentatives`);
          throw new Error(`Échec après ${maxRetries} tentatives: ${error.message}`);
        }
        
        // Attendre avant retry (backoff exponentiel)
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  static async fetchMultipleSources(urls, options = {}) {
    const results = await Promise.allSettled(
      urls.map(url => this.fetchWithRetry(url, options))
    );

    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    if (successful.length === 0) {
      throw new Error('Toutes les sources ont échoué');
    }

    return successful;
  }
}

module.exports = { RetryService };
