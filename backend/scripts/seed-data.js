// backend/scripts/seed-data.js
// Script pour insérer des données de test dans MongoDB

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Schémas simplifiés
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  profile: {
    firstName: String,
    lastName: String
  },
  tier: { type: String, default: 'free' },
  status: { type: String, default: 'active' },
  quotas: {
    scansPerMonth: { type: Number, default: 30 },
    scansRemaining: { type: Number, default: 30 },
    aiChatsPerDay: { type: Number, default: 5 },
    aiChatsRemaining: { type: Number, default: 5 }
  }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  barcode: String,
  name: String,
  brand: String,
  category: String,
  ingredients: String,
  images: {
    front: String
  },
  foodData: {
    nova: Number,
    nutriscore: String,
    ecoscore: String,
    additives: Array
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);

// Données de test
const testData = {
  users: [
    {
      email: 'demo@ecolojia.com',
      password: 'Demo123!',
      name: 'Demo User',
      profile: {
        firstName: 'Demo',
        lastName: 'User'
      },
      tier: 'free'
    },
    {
      email: 'premium@ecolojia.com',
      password: 'Premium123!',
      name: 'Premium User',
      profile: {
        firstName: 'Premium',
        lastName: 'User'
      },
      tier: 'premium',
      quotas: {
        scansPerMonth: -1,
        scansRemaining: -1,
        aiChatsPerDay: -1,
        aiChatsRemaining: -1
      }
    }
  ],
  
  products: [
    // PRODUITS ALIMENTAIRES
    {
      barcode: '3017620425035',
      name: 'Nutella',
      brand: 'Ferrero',
      category: 'food',
      ingredients: 'Sucre, huile de palme, NOISETTES 13%, cacao maigre 7,4%, LAIT écrémé en poudre 6,6%, LACTOSERUM en poudre, émulsifiants : lécithines (SOJA), vanilline',
      images: { front: 'https://images.openfoodfacts.org/images/products/301/762/042/5035/front_fr.jpg' },
      foodData: {
        nova: 4,
        nutriscore: 'E',
        ecoscore: 'E',
        additives: ['E322']
      }
    },
    {
      barcode: '3268840001008',
      name: 'Coca-Cola',
      brand: 'Coca-Cola',
      category: 'food',
      ingredients: 'Eau gazéifiée, sucre, colorant : caramel E150d, acidifiant : acide phosphorique, arômes naturels dont caféine',
      images: { front: 'https://images.openfoodfacts.org/images/products/326/884/000/1008/front_fr.jpg' },
      foodData: {
        nova: 4,
        nutriscore: 'E',
        ecoscore: 'D',
        additives: ['E150d', 'E338']
      }
    },
    {
      barcode: '3329770057258',
      name: 'Petits pois et carottes',
      brand: 'Bonduelle',
      category: 'food',
      ingredients: 'Petits pois (50%), carottes (30%), eau, sucre, sel',
      images: { front: 'https://images.openfoodfacts.org/images/products/332/977/005/7258/front_fr.jpg' },
      foodData: {
        nova: 3,
        nutriscore: 'A',
        ecoscore: 'B',
        additives: []
      }
    },
    {
      barcode: '7613034626844',
      name: 'KitKat',
      brand: 'Nestlé',
      category: 'food',
      ingredients: 'Sucre, farine de blé, beurre de cacao, lait écrémé en poudre, pâte de cacao, matière grasse végétale',
      foodData: {
        nova: 4,
        nutriscore: 'D',
        ecoscore: 'D',
        additives: ['E322', 'E476']
      }
    },
    
    // PRODUITS COSMÉTIQUES
    {
      barcode: '3600541273894',
      name: 'Crème Hydratante Nivea',
      brand: 'Nivea',
      category: 'cosmetic',
      ingredients: 'AQUA, GLYCERIN, CETEARYL ALCOHOL, METHYLPARABEN, PARFUM'
    },
    {
      barcode: '3600542021234',
      name: 'Shampoing Doux',
      brand: "L'Oréal",
      category: 'cosmetic',
      ingredients: 'AQUA, SODIUM LAURETH SULFATE, COCAMIDOPROPYL BETAINE, GLYCERIN, PARFUM, LINALOOL'
    },
    
    // PRODUITS DÉTERGENTS
    {
      barcode: '3450201234567',
      name: 'Lessive Écologique',
      brand: 'Ecover',
      category: 'detergent',
      ingredients: 'Sodium Carbonate (15-30%), Sodium Citrate (5-15%), Soap (5-15%), Enzymes'
    },
    {
      barcode: '3450201234568',
      name: 'Liquide Vaisselle',
      brand: 'Paic',
      category: 'detergent',
      ingredients: 'Aqua, Sodium Laureth Sulfate (15-30%), Sodium Chloride, Citric Acid'
    }
  ]
};

// Fonction pour insérer les données
async function seedDatabase() {
  try {
    console.log('🌱 Début de l\'insertion des données de test...\n');
    
    // Nettoyer les collections existantes
    await User.deleteMany({ email: { $in: testData.users.map(u => u.email) } });
    await Product.deleteMany({ barcode: { $in: testData.products.map(p => p.barcode) } });
    
    // Insérer les utilisateurs
    console.log('👤 Insertion des utilisateurs...');
    for (const userData of testData.users) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      console.log(`✅ Utilisateur créé: ${userData.email} (mot de passe: ${userData.password})`);
    }
    
    // Insérer les produits
    console.log('\n📦 Insertion des produits...');
    for (const product of testData.products) {
      await Product.create(product);
      console.log(`✅ Produit créé: ${product.name} (${product.barcode})`);
    }
    
    console.log('\n✨ Données de test insérées avec succès !');
    
    // Afficher les identifiants de test
    console.log('\n📋 IDENTIFIANTS DE TEST:');
    console.log('========================');
    testData.users.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Mot de passe: ${user.password}`);
      console.log(`Type: ${user.tier}`);
      console.log('---');
    });
    
    console.log('\n📱 CODES-BARRES DE TEST:');
    console.log('========================');
    testData.products.forEach(product => {
      console.log(`${product.barcode} - ${product.name} (${product.category})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Connexion fermée');
  }
}

// Lancer le script
seedDatabase();