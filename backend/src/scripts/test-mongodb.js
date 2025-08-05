// backend/src/scripts/test-mongodb.js
require('dotenv').config();
const mongoose = require('mongoose');

// Import des modèles
const User = require('../models/User');
const Product = require('../models/Product');
const Analysis = require('../models/Analysis');
const AffiliateClick = require('../models/AffiliateClick');

async function testMongoDB() {
  console.log('🔧 Test de connexion MongoDB...\n');
  
  try {
    // 1. Connexion
    console.log('📡 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB Atlas!\n');

    // 2. Créer un utilisateur test
    console.log('👤 Création utilisateur test...');
    const testUser = await User.findOneAndUpdate(
      { email: 'test@ecolojia.app' },
      {
        email: 'test@ecolojia.app',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiGH4CJ0V7C.', // password: Test123!
        name: 'Utilisateur Test',
        tier: 'premium',
        isEmailVerified: true,
        quotas: {
          analyses: -1,
          aiQuestions: -1,
          exports: 10,
          apiCalls: 1000
        }
      },
      { upsert: true, new: true }
    );
    console.log('✅ Utilisateur créé:', testUser.email);

    // 3. Créer un produit test
    console.log('\n📦 Création produit test...');
    const testProduct = await Product.findOneAndUpdate(
      { barcode: '3017620422003' },
      {
        barcode: '3017620422003',
        name: 'Nutella Pâte à Tartiner',
        brand: 'Ferrero',
        category: 'food',
        imageUrl: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.jpg',
        foodData: {
          ingredients: ["Sucre", "huile de palme", "NOISETTES 13%", "cacao maigre 7.4%", "LAIT écrémé en poudre", "LACTOSÉRUM en poudre", "émulsifiants (lécithines E322)", "vanilline"],
          novaScore: 4,
          nutriScore: 'E',
          allergens: ['lait', 'noisettes', 'soja']
        },
        analysisData: {
          healthScore: 25,
          lastAnalyzedAt: new Date(),
          version: '1.0',
          confidence: 95
        }
      },
      { upsert: true, new: true }
    );
    console.log('✅ Produit créé:', testProduct.name);

    // 4. Créer une analyse test
    console.log('\n📊 Création analyse test...');
    const testAnalysis = await Analysis.create({
      userId: testUser._id,
      productId: testProduct._id,
      productSnapshot: {
        name: testProduct.name,
        brand: testProduct.brand,
        barcode: testProduct.barcode,
        category: testProduct.category
      },
      results: {
        healthScore: 25,
        foodAnalysis: {
          novaScore: 4,
          nutriScore: 'E',
          additiveCount: 2,
          ultraTransformScore: 85
        },
        aiInsights: {
          summary: "Produit ultra-transformé avec score nutritionnel faible",
          recommendations: ["Préférer des pâtes à tartiner bio sans huile de palme"],
          warnings: ["Teneur élevée en sucre et graisses saturées"]
        }
      }
    });
    console.log('✅ Analyse créée:', testAnalysis._id);

    // 5. Test affiliation
    console.log('\n🔗 Test modèle affiliation...');
    const testClick = await AffiliateClick.create({
      userId: testUser._id,
      productId: testProduct._id,
      partner: 'lafourche',
      originalUrl: 'https://lafourche.fr/nutella-bio',
      affiliateUrl: 'https://lafourche.fr/nutella-bio?aff=ecolojia-001',
      source: 'product_page' // Utiliser une valeur enum valide
    });
    console.log('✅ Click affilié créé:', testClick.clickId);

    // 6. Statistiques
    console.log('\n📈 Statistiques base de données:');
    const stats = {
      users: await User.countDocuments(),
      products: await Product.countDocuments(),
      analyses: await Analysis.countDocuments(),
      affiliateClicks: await AffiliateClick.countDocuments()
    };
    console.table(stats);

    console.log('\n✅ Tous les tests sont passés avec succès!');
    console.log('🎉 MongoDB est opérationnel pour ECOLOJIA!\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Détails:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter le test
testMongoDB();
