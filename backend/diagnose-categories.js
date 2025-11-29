/**
 * DIAGNOSTIC CATÉGORIES MONGODB
 * 
 * Objectif : Identifier produits mal catégorisés
 * 
 * Règles détection :
 * 1. Keywords produits (ex: "mouliné bébé" = food, pas detergent)
 * 2. Codes catégories Open Food Facts
 * 3. Incohérences scoring (ex: detergent avec nutriscore)
 * 4. Champs manquants (categoryType undefined)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://salim:Salimbenamara78@ecolojia.mongodb.net/ecolojia?retryWrites=true&w=majority';

// Règles de catégorisation intelligente
const CATEGORIZATION_RULES = {
  food: {
    keywords: [
      'mouliné', 'bébé', 'baby', 'infantile', 'lait', 'yaourt', 'fromage',
      'pain', 'chocolat', 'biscuit', 'céréales', 'jus', 'soda', 'boisson',
      'viande', 'poisson', 'fruit', 'légume', 'sauce', 'huile', 'sucre',
      'confiture', 'miel', 'pâtes', 'riz', 'farine', 'œuf', 'pizza',
      'burger', 'sandwich', 'salade', 'soupe', 'plat', 'dessert'
    ],
    offCategoryCodes: [
      'en:baby-foods', 'en:dairies', 'en:beverages', 'en:snacks',
      'en:plant-based-foods', 'en:meats', 'en:seafood', 'en:fruits',
      'en:vegetables', 'en:cereals-and-potatoes', 'en:sweets'
    ]
  },
  
  cosmetic: {
    keywords: [
      'shampoing', 'savon', 'crème', 'lotion', 'dentifrice', 'déodorant',
      'parfum', 'maquillage', 'vernis', 'gel', 'baume', 'sérum',
      'masque', 'gommage', 'huile', 'lait corporel', 'soin'
    ],
    offCategoryCodes: [
      'en:hygiene', 'en:cosmetics', 'en:beauty', 'en:personal-care'
    ]
  },
  
  detergent: {
    keywords: [
      'lessive', 'détergent', 'nettoyant', 'liquide vaisselle', 'javel',
      'désinfectant', 'adoucissant', 'produit ménage', 'spray', 'nettoyeur'
    ],
    offCategoryCodes: [
      'en:household', 'en:cleaning-products', 'en:detergents'
    ]
  }
};

// Fonction de détection catégorie correcte
function detectCorrectCategory(product) {
  const name = (product.product_name || '').toLowerCase();
  const categories = (product.categories || '').toLowerCase();
  
  // Scoring par catégorie
  const scores = {
    food: 0,
    cosmetic: 0,
    detergent: 0
  };
  
  // 1. Analyse keywords dans nom produit
  for (const [category, rules] of Object.entries(CATEGORIZATION_RULES)) {
    for (const keyword of rules.keywords) {
      if (name.includes(keyword.toLowerCase())) {
        scores[category] += 10;
      }
    }
  }
  
  // 2. Analyse codes catégories OFF
  for (const [category, rules] of Object.entries(CATEGORIZATION_RULES)) {
    for (const code of rules.offCategoryCodes) {
      if (categories.includes(code)) {
        scores[category] += 20;
      }
    }
  }
  
  // 3. Analyse champs spécifiques
  if (product.nutriscore_grade || product.nova_group) {
    scores.food += 15; // Nutriscore = alimentaire
  }
  
  if (product.ingredients_text && product.ingredients_text.length > 0) {
    scores.food += 5;
    scores.cosmetic += 5;
  }
  
  // Retourner catégorie avec score max
  const maxScore = Math.max(...Object.values(scores));
  const suggestedCategory = Object.keys(scores).find(cat => scores[cat] === maxScore);
  
  return {
    suggested: suggestedCategory,
    confidence: maxScore,
    scores: scores
  };
}

async function diagnoseCategoriesIssues() {
  try {
    console.log('🔌 Connexion MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false, collection: 'products' }));
    
    console.log('📊 Récupération produits...');
    const products = await Product.find({}).lean();
    console.log(`✅ ${products.length} produits chargés\n`);
    
    // Analyse
    const issues = [];
    let totalAnalyzed = 0;
    let withoutCategory = 0;
    let potentialMiscategorized = 0;
    
    console.log('🔍 Analyse catégorisation...\n');
    
    for (const product of products) {
      totalAnalyzed++;
      
      // Cas 1 : Pas de catégorie
      if (!product.categoryType) {
        withoutCategory++;
        const detection = detectCorrectCategory(product);
        
        issues.push({
          barcode: product.code,
          name: product.product_name,
          currentCategory: 'undefined',
          suggestedCategory: detection.suggested,
          confidence: detection.confidence,
          reason: 'categoryType manquant',
          scores: detection.scores
        });
        continue;
      }
      
      // Cas 2 : Catégorie potentiellement incorrecte
      const detection = detectCorrectCategory(product);
      
      if (detection.suggested !== product.categoryType && detection.confidence > 20) {
        potentialMiscategorized++;
        
        issues.push({
          barcode: product.code,
          name: product.product_name,
          currentCategory: product.categoryType,
          suggestedCategory: detection.suggested,
          confidence: detection.confidence,
          reason: 'Incohérence détectée',
          scores: detection.scores
        });
      }
      
      // Progress
      if (totalAnalyzed % 5000 === 0) {
        console.log(`  Analysés: ${totalAnalyzed}/${products.length} (${Math.round(totalAnalyzed/products.length*100)}%)`);
      }
    }
    
    console.log(`\n✅ Analyse terminée : ${totalAnalyzed} produits`);
    console.log(`\n📊 RÉSULTATS:`);
    console.log(`  • Sans catégorie: ${withoutCategory}`);
    console.log(`  • Potentiellement mal catégorisés: ${potentialMiscategorized}`);
    console.log(`  • Total anomalies: ${issues.length}`);
    
    // Tri par confiance décroissante
    issues.sort((a, b) => b.confidence - a.confidence);
    
    // Rapport JSON
    const reportPath = path.join(__dirname, 'diagnostic-categories-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      date: new Date().toISOString(),
      totalProducts: products.length,
      totalIssues: issues.length,
      withoutCategory: withoutCategory,
      potentialMiscategorized: potentialMiscategorized,
      issues: issues
    }, null, 2), 'utf8');
    
    console.log(`\n✅ Rapport JSON: ${reportPath}`);
    
    // Top 20 anomalies haute confiance
    console.log(`\n🔝 TOP 20 ANOMALIES (confiance > 30):\n`);
    const topIssues = issues.filter(i => i.confidence > 30).slice(0, 20);
    
    topIssues.forEach((issue, idx) => {
      console.log(`${idx + 1}. ${issue.name}`);
      console.log(`   Barcode: ${issue.barcode}`);
      console.log(`   Actuel: ${issue.currentCategory} → Suggéré: ${issue.suggestedCategory}`);
      console.log(`   Confiance: ${issue.confidence}/100`);
      console.log(`   Raison: ${issue.reason}\n`);
    });
    
    await mongoose.disconnect();
    console.log('✅ Déconnecté MongoDB');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

diagnoseCategoriesIssues();