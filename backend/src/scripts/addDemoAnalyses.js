// backend/scripts/addDemoAnalyses.js
// Script pour ajouter des analyses de démonstration via l'API

const fetch = require('node-fetch');

const API_URL = 'http://localhost:5001/api';
const AUTH_TOKEN = 'test-token-507f1f77bcf86cd799439011';

// Données de démonstration
const demoAnalyses = [
  {
    productName: 'Yaourt Nature Bio Danone',
    category: 'food',
    healthScore: 92,
    novaGroup: 1,
    ingredients: 'Lait entier bio, ferments lactiques',
    barcode: '3033710065967'
  },
  {
    productName: 'Nutella Pâte à Tartiner',
    category: 'food',
    healthScore: 45,
    novaGroup: 4,
    ingredients: 'Sucre, huile de palme, noisettes 13%, cacao maigre, lait écrémé en poudre',
    barcode: '3017620422003'
  },
  {
    productName: 'Coca-Cola Original',
    category: 'food',
    healthScore: 38,
    novaGroup: 4,
    ingredients: 'Eau gazéifiée, sucre, colorant E150d, acidifiant E338',
    barcode: '5449000000996'
  },
  {
    productName: 'Pommes Bio Gala',
    category: 'food',
    healthScore: 95,
    novaGroup: 1,
    ingredients: 'Pommes biologiques',
    barcode: '3560070976394'
  },
  {
    productName: 'Shampoing Doux Sans Sulfate L\'Oréal',
    category: 'cosmetics',
    healthScore: 78,
    ingredients: 'Aqua, Sodium Cocoyl Isethionate, Coco-Betaine, Sodium Lauryl Sulfoacetate',
    barcode: '3600523998647'
  },
  {
    productName: 'Crème Hydratante Nivea',
    category: 'cosmetics',
    healthScore: 72,
    ingredients: 'Aqua, Glycerin, Cetearyl Alcohol, Mineral Oil',
    barcode: '4005808119349'
  },
  {
    productName: 'Lessive Écologique Arbre Vert',
    category: 'detergents',
    healthScore: 85,
    ingredients: 'Agents de surface anioniques, agents de surface non ioniques, savon',
    barcode: '3450601030277'
  },
  {
    productName: 'Chips Lay\'s Original',
    category: 'food',
    healthScore: 42,
    novaGroup: 4,
    ingredients: 'Pommes de terre, huile de tournesol, sel',
    barcode: '3168930009265'
  }
];

async function addDemoAnalyses() {
  console.log('🚀 Ajout des analyses de démonstration...\n');

  for (const [index, analysis] of demoAnalyses.entries()) {
    try {
      // Simuler un délai entre les analyses
      const delay = index * 24 * 60 * 60 * 1000; // 1 jour entre chaque
      const analysisDate = new Date(Date.now() - delay);

      const response = await fetch(`${API_URL}/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify({
          ...analysis,
          date: analysisDate.toISOString(),
          source: 'scan'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${index + 1}. ${analysis.productName} - Score: ${analysis.healthScore}/100`);
      } else {
        console.log(`❌ Erreur pour ${analysis.productName}: ${response.statusText}`);
      }

    } catch (error) {
      console.error(`❌ Erreur pour ${analysis.productName}:`, error.message);
    }

    // Petite pause entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✨ Analyses de démonstration ajoutées !');
  console.log('📊 Retournez sur le dashboard pour voir les résultats');
}

// Note: Pour l'instant, sans base de données, ces analyses ne seront pas persistées
// Mais le dashboard affichera des données de démo intégrées

console.log('ℹ️  Note: Sans MongoDB, les analyses ne sont pas persistées.');
console.log('    Le dashboard affiche des données de démonstration intégrées.\n');

// Si vous voulez quand même exécuter le script (pour tester l'API)
// Décommentez la ligne suivante :
// addDemoAnalyses();

console.log('📊 Votre dashboard devrait maintenant afficher des données de démo !');
console.log('🔗 Accédez à: http://localhost:3000/dashboard');
