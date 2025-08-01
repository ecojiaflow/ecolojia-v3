// backend/src/debug-routes.js
// Script pour vérifier quelles routes sont réellement chargées

const express = require('express');
const app = express();

// Charger les routes une par une et afficher leur contenu
console.log('\n=== VERIFICATION DES ROUTES ===\n');

// 1. Vérifier products.js
console.log('1. Checking products.js...');
try {
  const productRoutes = require('./routes/products');
  console.log('✅ products.js loaded successfully');
  console.log('Type:', typeof productRoutes);
  console.log('Is Router?', productRoutes && productRoutes.stack ? 'Yes' : 'No');
  
  if (productRoutes && productRoutes.stack) {
    console.log('Routes found:');
    productRoutes.stack.forEach(layer => {
      if (layer.route) {
        console.log(`  - ${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
      }
    });
  }
} catch (error) {
  console.log('❌ Error loading products.js:', error.message);
}

console.log('\n---\n');

// 2. Vérifier dashboard.js
console.log('2. Checking dashboard.js...');
try {
  const dashboardRoutes = require('./routes/dashboard');
  console.log('✅ dashboard.js loaded successfully');
  console.log('Type:', typeof dashboardRoutes);
  console.log('Is Router?', dashboardRoutes && dashboardRoutes.stack ? 'Yes' : 'No');
  
  if (dashboardRoutes && dashboardRoutes.stack) {
    console.log('Routes found:');
    dashboardRoutes.stack.forEach(layer => {
      if (layer.route) {
        console.log(`  - ${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
      }
    });
  }
} catch (error) {
  console.log('❌ Error loading dashboard.js:', error.message);
}

console.log('\n---\n');

// 3. Vérifier analyze.routes.js
console.log('3. Checking analyze.routes.js...');
try {
  const analyzeRoutes = require('./routes/analyze.routes');
  console.log('✅ analyze.routes.js loaded successfully');
  console.log('Type:', typeof analyzeRoutes);
  console.log('Is Router?', analyzeRoutes && analyzeRoutes.stack ? 'Yes' : 'No');
  
  if (analyzeRoutes && analyzeRoutes.stack) {
    console.log('Routes found:');
    analyzeRoutes.stack.forEach(layer => {
      if (layer.route) {
        console.log(`  - ${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
      }
    });
  }
} catch (error) {
  console.log('❌ Error loading analyze.routes.js:', error.message);
}

console.log('\n---\n');

// 4. Vérifier ai.js
console.log('4. Checking ai.js...');
try {
  const aiRoutes = require('./routes/ai');
  console.log('✅ ai.js loaded successfully');
  console.log('Type:', typeof aiRoutes);
  console.log('Is Router?', aiRoutes && aiRoutes.stack ? 'Yes' : 'No');
  
  if (aiRoutes && aiRoutes.stack) {
    console.log('Routes found:');
    aiRoutes.stack.forEach(layer => {
      if (layer.route) {
        console.log(`  - ${Object.keys(layer.route.methods).join(', ').toUpperCase()} ${layer.route.path}`);
      }
    });
  }
} catch (error) {
  console.log('❌ Error loading ai.js:', error.message);
}

console.log('\n=== FIN DE LA VERIFICATION ===\n');