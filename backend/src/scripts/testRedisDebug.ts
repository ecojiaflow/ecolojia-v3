// PATH: backend/src/scripts/testRedisDebug.ts
import dotenv from 'dotenv';
dotenv.config();

import Redis from 'ioredis';

async function debugRedisConnection() {
  console.log('🔍 Redis Debug Script - Diagnostic Détaillé\n');
  
  // 1. Afficher la configuration (sans mot de passe)
  console.log('📋 Configuration détectée :');
  console.log('REDIS_URL:', process.env.REDIS_URL ? 'Défini ✅' : 'Non défini ❌');
  console.log('REDIS_TLS:', process.env.REDIS_TLS);
  
  if (process.env.REDIS_URL) {
    const urlParts = process.env.REDIS_URL.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (urlParts) {
      console.log('User:', urlParts[1]);
      console.log('Password:', '****' + urlParts[2].slice(-4)); // Affiche seulement les 4 derniers caractères
      console.log('Host:', urlParts[3]);
      console.log('Port:', urlParts[4]);
    }
  }
  
  console.log('\n🔧 Test 1: Connexion simple sans TLS');
  try {
    const redis1 = new Redis(process.env.REDIS_URL as string, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      enableReadyCheck: false
    });
    
    await new Promise((resolve, reject) => {
      redis1.on('connect', () => {
        console.log('✅ Connexion sans TLS réussie !');
        resolve(true);
      });
      redis1.on('error', (err) => {
        console.log('❌ Erreur sans TLS:', err.message);
        reject(err);
      });
      
      // Timeout après 5 secondes
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    await redis1.disconnect();
  } catch (error: any) {
    console.log('❌ Échec connexion sans TLS:', error.message);
  }
  
  console.log('\n🔧 Test 2: Connexion avec TLS (rediss://)');
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
        console.log('✅ Connexion avec TLS réussie !');
        resolve(true);
      });
      redis2.on('error', (err) => {
        console.log('❌ Erreur avec TLS:', err.message);
        reject(err);
      });
      
      // Timeout après 5 secondes
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    await redis2.disconnect();
  } catch (error: any) {
    console.log('❌ Échec connexion avec TLS:', error.message);
  }
  
  console.log('\n🔧 Test 3: Connexion avec configuration manuelle');
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
        console.log('✅ Connexion manuelle réussie !');
        resolve(true);
      });
      redis3.on('error', (err) => {
        console.log('❌ Erreur connexion manuelle:', err.message);
        reject(err);
      });
      
      // Timeout après 5 secondes
      setTimeout(() => reject(new Error('Timeout')), 5000);
    });
    
    // Si connexion réussie, tester une commande
    console.log('\n🔧 Test PING...');
    const pong = await redis3.ping();
    console.log('✅ PING réussi:', pong);
    
    await redis3.disconnect();
  } catch (error: any) {
    console.log('❌ Échec connexion manuelle:', error.message);
  }
  
  console.log('\n🔧 Test 4: Test avec redis-cli (commande pour terminal)');
  console.log('Essayez cette commande dans votre terminal :');
  console.log(`redis-cli -u "${process.env.REDIS_URL}"`);
  console.log('OU avec TLS :');
  console.log(`redis-cli -u "${process.env.REDIS_URL?.replace('redis://', 'rediss://')}"`);
  
  console.log('\n📋 Diagnostic terminé !');
  console.log('\n💡 Solutions possibles :');
  console.log('1. Vérifiez que le mot de passe ne contient pas de caractères spéciaux');
  console.log('2. Essayez avec et sans TLS');
  console.log('3. Vérifiez que Redis Cloud accepte les connexions depuis votre IP');
  console.log('4. Dans Redis Cloud, vérifiez Security > Default User > Password');
  
  process.exit(0);
}

// Gestion erreur globale
process.on('unhandledRejection', (err) => {
  console.error('\n❌ Erreur non gérée:', err);
  process.exit(1);
});

// Lancer le debug
debugRedisConnection().catch(console.error);
