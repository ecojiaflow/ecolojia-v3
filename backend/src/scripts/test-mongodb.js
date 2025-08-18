// backend/src/scripts/test-mongodb.js
require('dotenv').config();
const mongoose = require('mongoose');

// Import des modeles
const User = require('../models/User');
const Product = require('../models/Product');
const Analysis = require('../models/Analysis');
const AffiliateClick = require('../models/AffiliateClick');

async function testMongoDB() {
  console.log('ðŸ”§ Test de connexion MongoDB...\n');
  
  try {
    // 1. Connexion
    console.log('ðŸ“¡ Connexion   MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('âœ… Connecte   MongoDB Atlas!\n');

    // 2. Creer un utilisateur test
    console.log('ðŸ‘¤ Creation utilisateur test...');
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
    console.log('âœ… Utilisateur cree:', testUser.email);

    // 3. Creer un produit test
    console.log('\nðŸ“¦ Creation produit test...');
    const testProduct = await Product.findOneAndUpdate(
      { barcode: '3017620422003' },
      {
        barcode: '3017620422003',
        name: 'Nutella Pate   Tartiner',
        brand: 'Ferrero',
        category: 'food',
        imageUrl: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.jpg',
        foodData: {
          ingredients: ["Sucre", "huile de palme", "NOISETTES 13%", "cacao maigre 7.4%", "LAIT ecreme en poudre", "LACTOS‰RUM en poudre", "emulsifiants (lecithines E322)", "vanilline"],
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
    console.log('âœ… Produit cree:', testProduct.name);

    // 4. Creer une analyse test
    console.log('\nðŸ“Š Creation analyse test...');
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
          summary: "Produit ultra-transforme avec score nutritionnel faible",
          recommendations: ["Preferer des pates   tartiner bio sans huile de palme"],
          warnings: ["Teneur elevee en sucre et graisses saturees"]
        }
      }
    });
    console.log('âœ… Analyse creee:', testAnalysis._id);

    // 5. Test affiliation
    console.log('\nðŸ”— Test modele affiliation...');
    const testClick = await AffiliateClick.create({
      userId: testUser._id,
      productId: testProduct._id,
      partner: 'lafourche',
      originalUrl: 'https://lafourche.fr/nutella-bio',
      affiliateUrl: 'https://lafourche.fr/nutella-bio?aff=ecolojia-001',
      source: 'product_page' // Utiliser une valeur enum valide
    });
    console.log('âœ… Click affilie cree:', testClick.clickId);

    // 6. Statistiques
    console.log('\nðŸ“ˆ Statistiques base de donnees:');
    const stats = {
      users: await User.countDocuments(),
      products: await Product.countDocuments(),
      analyses: await Analysis.countDocuments(),
      affiliateClicks: await AffiliateClick.countDocuments()
    };
    console.table(stats);

    console.log('\nâœ… Tous les tests sont passes avec succes!');
    console.log('ðŸŽ‰ MongoDB est operationnel pour ECOLOJIA!\n');

  } catch (error) {
    console.error('âŒ Erreur:', error.message);
    console.error('Details:', error);
  } finally {
    await mongoose.connection.close();
    console.log('ðŸ”Œ Connexion fermee');
  }
}

// Executer le test
testMongoDB();
