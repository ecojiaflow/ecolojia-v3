// backend/src/scripts/testRedis.ts
import dotenv from 'dotenv';
dotenv.config();

import { cacheService } from '../services/CacheService';

async function testRedisConnection() {
  console.log('ðŸ§ª Testing Redis Frankfurt connection...');
  console.log('ðŸ“¡ Redis URL:', process.env.REDIS_URL?.replace(/:[^:@]+@/, ':****@'));
  
  try {
    // Test 1: Ping
    console.log('\n1ï¸âƒ£ Testing basic connection...');
    const testKey = `test:${Date.now()}`;
    await cacheService.cacheSession(testKey, { test: true }, 60);
    console.log('âœ… Write successful');
    
    // Test 2: Read
    const result = await cacheService.getSession(testKey);
    console.log('âœ… Read successful:', result);
    
    // Test 3: Delete
    await cacheService.deleteSession(testKey);
    console.log('âœ… Delete successful');
    
    // Test 4: Stats
    console.log('\n2ï¸âƒ£ Getting cache stats...');
    const stats = await cacheService.getCacheStats();
    console.log('âœ… Stats:', JSON.stringify(stats, null, 2));
    
    console.log('\nðŸŽ‰ All tests passed! Redis Frankfurt is working!');
    process.exit(0);
  } catch (error) {
    console.error('\nâŒ Test failed:', error);
    process.exit(1);
  }
}

// Run test
testRedisConnection();
