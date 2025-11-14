// ========================================
// RECALCUL SCORES ECOLOJIA - 8 COMPOSANTES
// ========================================

const mongoose = require('mongoose');
require('dotenv').config();

// PONDÉRATIONS ECOLOJIA
const WEIGHTS = {
  naturalness: 0.20,      // 20%
  health: 0.20,           // 20%
  environmental: 0.15,    // 15%
  social: 0.10,           // 10%
  transparency: 0.10,     // 10%
  processing: 0.10,       // 10%
  packaging: 0.08,        // 8%
  origin: 0.07            // 7%
};

// Calcul Naturalité
function calculateNaturalness(product) {
  let score = 50;
  
  // Bonus labels bio/organic
  const bioLabels = ['organic', 'bio', 'ab-agriculture-biologique', 'eu-organic'];
  const hasBio = product.labels?.some(l => 
    bioLabels.some(bio => l.toLowerCase().includes(bio))
  );
  if (hasBio) score += 25;
  
  // Pénalité additifs
  const additives = product.labels?.filter(l => l.startsWith('en:e')) || [];
  if (additives.length === 0) score += 15;
  else if (additives.length <= 3) score += 5;
  else if (additives.length <= 5) score -= 5;
  else score -= 15;
  
  // Bonus ingrédients naturels
  const hasIngredients = product.ingredientsText && product.ingredientsText.length > 0;
  if (hasIngredients) {
    const natural = ['naturel', 'natural', 'bio', 'organic'];
    const hasNatural = natural.some(n => product.ingredientsText.toLowerCase().includes(n));
    if (hasNatural) score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

// Calcul Santé
function calculateHealth(product) {
  let score = 50;
  
  // Nutri-Score (fort impact)
  if (product.nutriscore_grade) {
    const nutriBonus = { 'a': 30, 'b': 20, 'c': 10, 'd': -10, 'e': -20 };
    score += nutriBonus[product.nutriscore_grade.toLowerCase()] || 0;
  }
  
  // Analyse nutritionnelle détaillée (si alimentaire)
  if (product.categoryType === 'food' && product.nutriments) {
    const n = product.nutriments;
    
    // Pénalité sucre
    if (n.sugars_100g > 20) score -= 15;
    else if (n.sugars_100g > 10) score -= 10;
    else if (n.sugars_100g < 5) score += 5;
    
    // Pénalité sel
    if (n.salt_100g > 2) score -= 15;
    else if (n.salt_100g > 1) score -= 10;
    else if (n.salt_100g < 0.5) score += 5;
    
    // Pénalité graisses saturées
    if (n.saturated_fat_100g > 10) score -= 10;
    else if (n.saturated_fat_100g > 5) score -= 5;
    
    // Bonus fibres
    if (n.fiber_100g > 5) score += 10;
    else if (n.fiber_100g > 3) score += 5;
    
    // Bonus protéines
    if (n.proteins_100g > 10) score += 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

// Calcul Impact environnemental
function calculateEnvironmental(product) {
  let score = 50;
  
  // Eco-Score (fort impact)
  if (product.ecoscore_grade) {
    const ecoBonus = { 'a': 30, 'b': 20, 'c': 10, 'd': -10, 'e': -20 };
    score += ecoBonus[product.ecoscore_grade.toLowerCase()] || 0;
  }
  
  // Labels environnementaux
  const ecoLabels = ['rainforest-alliance', 'sustainable', 'eco', 'msc', 'asc'];
  const hasEcoLabel = product.labels?.some(l => 
    ecoLabels.some(eco => l.toLowerCase().includes(eco))
  );
  if (hasEcoLabel) score += 15;
  
  // Emballage recyclable (indicateurs)
  const recyclableKeywords = ['recyclable', 'recycled', 'carton', 'verre'];
  const packaging = JSON.stringify(product.labels || []).toLowerCase();
  if (recyclableKeywords.some(k => packaging.includes(k))) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

// Calcul Impact social
function calculateSocial(product) {
  let score = 50;
  
  // Labels équitables
  const fairLabels = ['fair-trade', 'fairtrade', 'equitable', 'max-havelaar'];
  const hasFairLabel = product.labels?.some(l => 
    fairLabels.some(fair => l.toLowerCase().includes(fair))
  );
  if (hasFairLabel) score += 25;
  
  // Labels sociaux
  const socialLabels = ['b-corp', 'entreprise-solidaire', 'commerce-equitable'];
  const hasSocialLabel = product.labels?.some(l => 
    socialLabels.some(social => l.toLowerCase().includes(social))
  );
  if (hasSocialLabel) score += 15;
  
  return Math.max(0, Math.min(100, score));
}

// Calcul Transparence
function calculateTransparency(product) {
  let score = 50;
  
  // Complétude données
  if (product.barcode) score += 5;
  if (product.brand) score += 5;
  if (product.name) score += 5;
  if (product.ingredientsText && product.ingredientsText.length > 10) score += 15;
  if (product.image_url) score += 5;
  if (product.nutriments && Object.keys(product.nutriments).length > 3) score += 10;
  if (product.labels && product.labels.length > 0) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

// Calcul Niveau de transformation
function calculateProcessing(product) {
  let score = 50;
  
  // NOVA (impact majeur)
  if (product.nova_group) {
    const novaScores = { 1: 100, 2: 70, 3: 40, 4: 10 };
    score = novaScores[product.nova_group] || 50;
  }
  
  // Nombre d'ingrédients
  const nbIngredients = product.ingredients?.length || 0;
  if (nbIngredients > 0) {
    if (nbIngredients <= 5) score += 10;
    else if (nbIngredients <= 10) score += 5;
    else if (nbIngredients > 20) score -= 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

// Calcul Emballage
function calculatePackaging(product) {
  let score = 50;
  
  // Analyse labels emballage
  const packagingLabels = product.labels?.filter(l => 
    l.includes('packaging') || l.includes('recyclable') || l.includes('plastic')
  ) || [];
  
  // Bonus recyclable
  if (packagingLabels.some(l => l.includes('recyclable'))) score += 20;
  
  // Pénalité plastique excessif
  if (packagingLabels.some(l => l.includes('plastic') && !l.includes('recycled'))) score -= 15;
  
  // Bonus emballage minimal
  if (packagingLabels.some(l => l.includes('minimal'))) score += 15;
  
  return Math.max(0, Math.min(100, score));
}

// Calcul Origine
function calculateOrigin(product) {
  let score = 50;
  
  // Labels origine
  const originLabels = ['france', 'local', 'aoc', 'aop', 'igp', 'made-in-france'];
  const hasOriginLabel = product.labels?.some(l => 
    originLabels.some(origin => l.toLowerCase().includes(origin))
  );
  if (hasOriginLabel) score += 30;
  
  // Bonus circuit court
  const shortCircuit = ['producteur', 'fermier', 'artisan', 'local'];
  const hasShortCircuit = product.labels?.some(l => 
    shortCircuit.some(sc => l.toLowerCase().includes(sc))
  );
  if (hasShortCircuit) score += 20;
  
  return Math.max(0, Math.min(100, score));
}

// Calcul score global pondéré
function calculateOverallScore(scores) {
  return Math.round(
    scores.naturalness * WEIGHTS.naturalness +
    scores.health * WEIGHTS.health +
    scores.environmental * WEIGHTS.environmental +
    scores.social * WEIGHTS.social +
    scores.transparency * WEIGHTS.transparency +
    scores.processing * WEIGHTS.processing +
    scores.packaging * WEIGHTS.packaging +
    scores.origin * WEIGHTS.origin
  );
}

// Recalculer tous les scores
async function recalculateAllScores() {
  console.log('\n🔢 RECALCUL SCORES ECOLOJIA - 8 COMPOSANTES');
  console.log('================================================\n');
  
  try {
    console.log('🔄 Connexion MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à:', mongoose.connection.db.databaseName);
    
    const db = mongoose.connection.db;
    const productsCol = db.collection('products');
    
    const totalProducts = await productsCol.countDocuments();
    console.log(`📊 Produits à recalculer: ${totalProducts.toLocaleString()}`);
    
    console.log('\n🔢 RECALCUL EN COURS...');
    console.log('================================================\n');
    
    const startTime = Date.now();
    let processed = 0;
    const BATCH_SIZE = 100;
    
    // Traiter par lots
    const cursor = productsCol.find();
    let batch = [];
    
    for await (const product of cursor) {
      // Calculer les 8 composantes
      const scores = {
        naturalness: calculateNaturalness(product),
        health: calculateHealth(product),
        environmental: calculateEnvironmental(product),
        social: calculateSocial(product),
        transparency: calculateTransparency(product),
        processing: calculateProcessing(product),
        packaging: calculatePackaging(product),
        origin: calculateOrigin(product)
      };
      
      // Calculer score global
      scores.overallScore = calculateOverallScore(scores);
      
      // Ajouter au batch
      batch.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { scores: scores, lastUpdated: new Date() } }
        }
      });
      
      processed++;
      
      // Exécuter le batch
      if (batch.length >= BATCH_SIZE) {
        await productsCol.bulkWrite(batch);
        batch = [];
        process.stdout.write(`\r   📊 Progression: ${processed.toLocaleString()}/${totalProducts.toLocaleString()} produits (${((processed/totalProducts)*100).toFixed(1)}%)`);
      }
    }
    
    // Dernier batch
    if (batch.length > 0) {
      await productsCol.bulkWrite(batch);
    }
    
    console.log(`\n\n✅ Recalcul terminé: ${processed.toLocaleString()} produits`);
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    console.log(`⏱️  Durée: ${duration} minutes`);
    
    // Statistiques finales
    console.log('\n📊 STATISTIQUES FINALES:');
    console.log('================================================');
    
    const scoreRanges = [
      { label: 'Excellent (80-100)', min: 80, max: 100 },
      { label: 'Bon (60-79)', min: 60, max: 79 },
      { label: 'Moyen (40-59)', min: 40, max: 59 },
      { label: 'Faible (20-39)', min: 20, max: 39 },
      { label: 'Très faible (0-19)', min: 0, max: 19 }
    ];
    
    for (const range of scoreRanges) {
      const count = await productsCol.countDocuments({
        'scores.overallScore': { $gte: range.min, $lte: range.max }
      });
      const percent = ((count / totalProducts) * 100).toFixed(1);
      console.log(`   ${range.label}: ${count.toLocaleString()} (${percent}%)`);
    }
    
    // Moyennes par composante
    console.log('\n📊 MOYENNES PAR COMPOSANTE:');
    console.log('================================================');
    
    const avgScores = await productsCol.aggregate([
      {
        $group: {
          _id: null,
          avgOverall: { $avg: '$scores.overallScore' },
          avgNaturalness: { $avg: '$scores.naturalness' },
          avgHealth: { $avg: '$scores.health' },
          avgEnvironmental: { $avg: '$scores.environmental' },
          avgSocial: { $avg: '$scores.social' },
          avgTransparency: { $avg: '$scores.transparency' },
          avgProcessing: { $avg: '$scores.processing' },
          avgPackaging: { $avg: '$scores.packaging' },
          avgOrigin: { $avg: '$scores.origin' }
        }
      }
    ]).toArray();
    
    if (avgScores.length > 0) {
      const avg = avgScores[0];
      console.log(`   Score global: ${avg.avgOverall.toFixed(1)}/100`);
      console.log(`   Naturalité: ${avg.avgNaturalness.toFixed(1)}/100`);
      console.log(`   Santé: ${avg.avgHealth.toFixed(1)}/100`);
      console.log(`   Environnement: ${avg.avgEnvironmental.toFixed(1)}/100`);
      console.log(`   Social: ${avg.avgSocial.toFixed(1)}/100`);
      console.log(`   Transparence: ${avg.avgTransparency.toFixed(1)}/100`);
      console.log(`   Transformation: ${avg.avgProcessing.toFixed(1)}/100`);
      console.log(`   Emballage: ${avg.avgPackaging.toFixed(1)}/100`);
      console.log(`   Origine: ${avg.avgOrigin.toFixed(1)}/100`);
    }
    
    console.log('\n✅ RECALCUL TERMINÉ AVEC SUCCÈS !');
    console.log('================================================\n');
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

recalculateAllScores();