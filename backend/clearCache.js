const aiCache = require('./src/services/aiCache.service');

async function clearCache() {
  try {
    await aiCache.client.flushall();
    console.log('✅ Cache vidé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

clearCache();