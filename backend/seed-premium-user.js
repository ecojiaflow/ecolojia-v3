const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importer le modèle User
const User = require('./src/models/User');

const PREMIUM_USER = {
  email: 'test@ecolojia.fr',
  password: 'TestEcolojia2025!',
  profile: {
    firstName: 'Test',
    lastName: 'Premium',
    dietType: 'balanced',
    allergies: [],
    goals: ['health']
  },
  isPremium: true,
  premiumStartDate: new Date(),
  premiumEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
  quotas: {
    aiQuestionsUsed: 0,
    aiQuestionsLimit: 999999,
    aiQuestionsResetAt: new Date(),
    mealPlansUsed: 0,
    mealPlansLimit: 999,
    ocrAnalysisUsed: 0,
    ocrAnalysisLimit: 999,
    shoppingListsCount: 0,
    shoppingListsLimit: 999
  },
  emailVerified: true
};

async function seedPremiumUser() {
  try {
    console.log('🔗 Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à:', mongoose.connection.name);

    // Vérifier si l'utilisateur existe
    let user = await User.findOne({ email: PREMIUM_USER.email });

    if (user) {
      console.log('⚠️  Utilisateur existant trouvé');
      console.log('📝 Mise à jour avec Premium...');
      
      // Mettre à jour avec Premium
      user.isPremium = true;
      user.premiumStartDate = PREMIUM_USER.premiumStartDate;
      user.premiumEndDate = PREMIUM_USER.premiumEndDate;
      user.quotas = PREMIUM_USER.quotas;
      user.emailVerified = true;
      
      // Réinitialiser le mot de passe (au cas où)
      const hashedPassword = await bcrypt.hash(PREMIUM_USER.password, 10);
      user.password = hashedPassword;
      
      await user.save();
      console.log('✅ Utilisateur mis à jour avec succès !');
    } else {
      console.log('➕ Création nouvel utilisateur Premium...');
      
      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(PREMIUM_USER.password, 10);
      
      // Créer l'utilisateur
      user = new User({
        ...PREMIUM_USER,
        password: hashedPassword
      });
      
      await user.save();
      console.log('✅ Utilisateur Premium créé avec succès !');
    }

    console.log('\n📊 Détails utilisateur:');
    console.log('Email:', user.email);
    console.log('Premium:', user.isPremium);
    console.log('Premium jusqu\'au:', user.premiumEndDate.toLocaleDateString('fr-FR'));
    console.log('Quotas IA:', user.quotas.aiQuestionsLimit);
    console.log('Quotas Plans Repas:', user.quotas.mealPlansLimit);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connexion fermée');
    process.exit(0);
  }
}

// Exécuter
seedPremiumUser();