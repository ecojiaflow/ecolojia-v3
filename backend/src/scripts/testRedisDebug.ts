// PATH: backend/src/scripts/testRedisDebug.ts
import dotenv from 'dotenv';
dotenv.config();

import Redis from 'ioredis';

async function debugRedisConnection() {
  console.log('ðŸ” Redis Debug Script - Diagnostic DÃ©taillÃ©\n');
  
  // 1. Afficher la configuration (sans mot de passe)
  console.log('ðŸ“‹ Configuration dÃ©tectÃ©e :');
  console.log('REDIS_URL:', process.env.REDIS_URL ? 'DÃ©fini âœ…' : 'Non dÃ©fini âŒ');
  console.log('REDIS_TLS:', process.env.REDIS_TLS);
  
  if (process.env.REDIS_URL) {
    const urlParts = process.env.REDIS_URL.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (urlParts) {
      console.log('User:', urlParts[1]);
      console.log('Password:', '****' + urlParts[2].slice(-4)); // Affiche seulement les 4 derniers caractÃ¨res
      console.log('Host:', urlParts[3]);
      console.log('Port:', urlParts[4]);
    }
  }
  
  console.log('\nðŸ”§ Test 1: Connexion simple sans TLS');
  try {
    const redis1 = new Redis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      enableReadyCheck: false
    });
    
    await new Promise((resolve, reject) => {
      redis1.on('connect', () => {
        console.log('âœ… Connexion sans TLS rÃ©ussie !');
        resolve(true);
      });
      redis1.on('error', (err) => {
        console.log('âŒ Erreur sans TLS:', err.message);
        reject(err);
      });
      
      // Timeout aprÃ¨s 5 secondes
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    await redis1.disconnect();
  } catch (error: any) {
    console.log('âŒ Ã‰chec connexion sans TLS:', error.message);
  }
  
  console.log('\nðŸ”§ Test 2: Connexion avec TLS (rediss://)');
  try {
    const urlWithTls = process.env.REDIS_URL?.replace('redis://', 'rediss://');
    const redis2 = new Redis(urlWithTls as string, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      enableReadyCheck: false,
      tls: {
        rejectUnauthorized: false
      }
    });
    
    await new Promise((resolve, reject) => {
      redis2.on('connect', () => {
        console.log('âœ… Connexion avec TLS rÃ©ussie !');
        resolve(true);
      });
      redis2.on('error', (err) => {
        console.log('âŒ Erreur avec TLS:', err.message);
        reject(err);
      });
      
      // Timeout aprÃ¨s 5 secondes
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    await redis2.disconnect();
  } catch (error: any) {
    console.log('âŒ Ã‰chec connexion avec TLS:', error.message);
  }
  
  console.log('\nðŸ”§ Test 3: Connexion avec configuration manuelle');
  try {
    const urlParts = process.env.REDIS_URL?.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (!urlParts) throw new Error('URL Redis invalide');
    
    const redis3 = new Redis({
      host: urlParts[3],
      port: parseInt(urlParts[4]),
      username: urlParts[1],
      password: urlParts[2],
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      enableReadyCheck: false,
      tls: process.env.REDIS_TLS === 'true' ? {
        rejectUnauthorized: false,
        servername: urlParts[3]
      } : undefined
    });
    
    await new Promise((resolve, reject) => {
      redis3.on('connect', () => {
        console.log('âœ… Connexion manuelle rÃ©ussie !');
        resolve(true);
      });
      redis3.on('error', (err) => {
        console.log('âŒ Erreur connexion manuelle:', err.message);
        reject(err);
      });
      
      // Timeout aprÃ¨s 5 secondes
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    // Si connexion rÃ©ussie, tester une commande
    console.log('\nðŸ”§ Test PING...');
    const pong = await redis3.ping();
    console.log('âœ… PING rÃ©ussi:', pong);
    
    await redis3.disconnect();
  } catch (error: any) {
    console.log('âŒ Ã‰chec connexion manuelle:', error.message);
  }
  
  console.log('\nðŸ”§ Test 4: Test avec redis-cli (commande pour terminal)');
  console.log('Essayez cette commande dans votre terminal :');
  console.log(`redis-cli -u "${process.env.REDIS_URL}"`);
  console.log('OU avec TLS :');
  console.log(`redis-cli -u "${process.env.REDIS_URL?.replace('redis://', 'rediss://')}"`);
  
  console.log('\nðŸ“‹ Diagnostic terminÃ© !');
  console.log('\nðŸ’¡ Solutions possibles :');
  console.log('1. VÃ©rifiez que le mot de passe ne contient pas de caractÃ¨res spÃ©ciaux');
  console.log('2. Essayez avec et sans TLS');
  console.log('3. VÃ©rifiez que Redis Cloud accepte les connexions depuis votre IP');
  console.log('4. Dans Redis Cloud, vÃ©rifiez Security > Default User > Password');
  
  process.exit(0);
}

// Gestion erreur globale
process.on('unhandledRejection', (err) => {
  console.error('\nâŒ Erreur non gÃ©rÃ©e:', err);
  process.exit(1);
});

// Lancer le debug
debugRedisConnection().catch(console.error);
