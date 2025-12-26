const mongoose = require('mongoose');
require('dotenv').config();

const logger = {
  info: (...args) => console.log('[MIGRATION-002]', ...args),
  success: (...args) => console.log('\x1b[32m%s\x1b[0m', '[MIGRATION-002 ✅]', ...args),
  error: (...args) => console.error('\x1b[31m%s\x1b[0m', '[MIGRATION-002 ❌]', ...args)
};

async function createPhotoIndexes() {
  const startTime = Date.now();
  
  try {
    logger.info('🚀 Début migration index photo...');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI manquante dans .env');
    }
    
    await mongoose.connect(mongoUri);
    logger.success('Connecté à MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('products');
    
    const existingIndexes = await collection.indexes();
    const indexNames = existingIndexes.map(idx => idx.name);
    
    logger.info(`Index actuels: ${indexNames.length}`);
    
    if (!indexNames.includes('photoHash_1')) {
      logger.info('Création index photoHash...');
      await collection.createIndex(
        { photoHash: 1 },
        { unique: true, sparse: true, name: 'photoHash_1', background: true }
      );
      logger.success('Index photoHash créé');
    } else {
      logger.info('Index photoHash existe déjà');
    }
    
    if (!indexNames.includes('extractedBy_1_extractedAt_-1')) {
      logger.info('Création index extractedBy...');
      await collection.createIndex(
        { extractedBy: 1, extractedAt: -1 },
        { name: 'extractedBy_1_extractedAt_-1', background: true }
      );
      logger.success('Index extractedBy créé');
    } else {
      logger.info('Index extractedBy existe déjà');
    }
    
    const finalIndexes = await collection.indexes();
    const photoIndexes = finalIndexes.filter(idx => 
      idx.name.includes('photoHash') || idx.name.includes('extractedBy')
    );
    
    logger.success(`${photoIndexes.length} index photo opérationnels`);
    
    const stats = await collection.stats();
    logger.info(`Documents: ${stats.count.toLocaleString()}`);
    logger.info(`Index total: ${stats.nindexes}`);
    
    const duration = Date.now() - startTime;
    logger.success(`Migration terminée en ${duration}ms`);
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    logger.error('Erreur:', error.message);
    process.exit(1);
  }
}

createPhotoIndexes();