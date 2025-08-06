// test-vision-ecolojia-fixed.js
const VisionService = require('./src/services/vision/VisionService');
const fs = require('fs').promises;
const https = require('https');
const path = require('path');

async function downloadImage(url, filepath) {
  const file = require('fs').createWriteStream(filepath);
  
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath);
      reject(err);
    });
  });
}

async function testEcolojiaVision() {
  console.log('🧪 Test du VisionService ECOLOJIA\n');
  
  try {
    // Test 1: Initialisation
    console.log('1️⃣ Initialisation du service...');
    await VisionService.initialize();
    console.log('✅ Service initialisé\n');
    
    // Test 2: Analyse d'une image de produit
    console.log('2️⃣ Test avec une image de produit alimentaire...');
    
    // Image de test (Nutella)
    const imageUrl = 'https://images.openfoodfacts.org/images/products/301/762/042/5035/front_fr.84.400.jpg';
    const tempFile = path.join(__dirname, 'test-nutella.jpg');
    
    console.log('📥 Téléchargement de l\'image de test...');
    await downloadImage(imageUrl, tempFile);
    console.log('✅ Image téléchargée\n');
    
    // Analyser l'image
    console.log('🔍 Analyse de l\'image...');
    const result = await VisionService.analyzeImage(tempFile, {
      useGoogleVision: true,
      language: 'fr'
    });
    
    console.log('✅ Analyse terminée !');
    console.log('\n📊 Résultats:');
    console.log('- Méthode utilisée:', result.method);
    console.log('- Confiance:', result.data.confidence);
    console.log('- Type de produit détecté:', result.data.productType);
    
    if (result.data.extractedData) {
      console.log('\n📝 Données extraites:');
      const data = result.data.extractedData;
      console.log('- Nom:', data.productName || 'Non détecté');
      console.log('- Marque:', data.brand || 'Non détectée');
      console.log('- Code-barres:', data.barcode || 'Non détecté');
      console.log('- Catégorie:', data.category || 'Non détectée');
      
      if (data.ingredients) {
        console.log('- Ingrédients détectés:', data.ingredients.substring(0, 100) + '...');
      }
    }
    
    if (result.data.labels && result.data.labels.length > 0) {
      console.log('\n🏷️ Labels Google Vision:');
      result.data.labels.slice(0, 5).forEach(label => {
        console.log(`- ${label.name} (${Math.round(label.score * 100)}%)`);
      });
    }
    
    // Test 3: Tester avec Tesseract uniquement (fallback)
    console.log('\n3️⃣ Test du fallback Tesseract...');
    const tesseractResult = await VisionService.analyzeImage(tempFile, {
      useGoogleVision: false,
      language: 'fr'
    });
    
    console.log('✅ Analyse Tesseract terminée');
    console.log('- Méthode:', tesseractResult.method);
    console.log('- Confiance:', tesseractResult.data.confidence);
    
    // Nettoyer
    await fs.unlink(tempFile).catch(() => {});
    
    console.log('\n✅ Tous les tests réussis !');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    console.log('\n🧹 Fermeture du service...');
    await VisionService.shutdown();
  }
}

// Lancer le test
testEcolojiaVision().catch(console.error);