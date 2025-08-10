// PATH: backend\scripts\dev\seedUserAndToken.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Parser les arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};

const email = getArg('email') || 'test@ecolojia.dev';
const password = getArg('password') || 'Test1234!';
const name = getArg('name') || 'Test User';

async function createTestUser() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Charger le modèle User
    const User = require('../../src/models/User');

    // Vérifier si l'utilisateur existe
    let user = await User.findOne({ email });

    if (user) {
      console.log('ℹ️ Utilisateur existant trouvé');
    } else {
      // Créer l'utilisateur
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        email,
        password: hashedPassword,
        name,
        subscription: {
          plan: 'monthly', // Plan payant pour les tests
          status: 'active',
          periodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 an
        },
        quotas: {
          scans: { used: 0, limit: 9999 },
          aiChats: { used: 0, limit: 9999 },
          exports: { used: 0, limit: 9999 }
        }
      });

      await user.save();
      console.log('✅ Utilisateur de test créé');
    }

    // Générer un token JWT
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        plan: user.subscription.plan
      },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '30d' }
    );

    // Sauvegarder le token
    const tokenPath = path.join(__dirname, 'token.txt');
    await fs.writeFile(tokenPath, token);
    
    console.log('\n✅ Token JWT généré avec succès!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🎫 Token:', token.substring(0, 50) + '...');
    console.log('📁 Token sauvegardé dans:', tokenPath);
    console.log('\n📋 Pour utiliser ce token:');
    console.log(`$env:JWT_TOKEN = "${token}"`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser();