const crypto = require('crypto');

class AICacheService {
  constructor() {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
    console.log('✅ AI Cache Service initialized');
  }
  
  async get(key) {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      this.stats.hits++;
      console.log('✅ Cache HIT:', key.substring(0, 40));
      return cached.data;
    }
    this.stats.misses++;
    return null;
  }
  
  async set(key, data, ttlSeconds = 86400) {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }
  
  hash(text) {
    return crypto.createHash('md5').update(text.toLowerCase().trim()).digest('hex');
  }
  
  detectType(question) {
    const q = question.toLowerCase();
    if (/\b(bon|sain|dangereux|santé)\b/.test(q)) return 'health';
    if (/\b(allergen|allergique)\b/.test(q)) return 'allergen';
    if (/\b(enfant|bébé)\b/.test(q)) return 'children';
    if (/\b(alternative|mieux)\b/.test(q)) return 'alternative';
    return 'general';
  }
  
  async getCachedOrGenerate(productId, question, generateFn) {
    const exactKey = `ai:exact:${productId}:${this.hash(question)}`;
    let response = await this.get(exactKey);
    if (response) return { ...response, _cached: true };
    
    const typeKey = `ai:type:${productId}:${this.detectType(question)}`;
    response = await this.get(typeKey);
    if (response) return { ...response, _cached: true };
    
    console.log('⚠️ Cache MISS - Calling AI API');
    response = await generateFn();
    await this.set(exactKey, response, 86400);
    return { ...response, _cached: false };
  }
  
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total ? Math.round((this.stats.hits / total) * 100) : 0,
      cacheSize: this.cache.size
    };
  }
}

module.exports = new AICacheService();
