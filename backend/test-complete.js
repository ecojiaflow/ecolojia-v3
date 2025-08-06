const VisionService = require('./VisionServiceFixed');
const https = require('https');
const fs = require('fs');

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
}

async function testCompleteFlow() {
  console.log('=== TEST COMPLET VISIONSERVICE ===\n');
  
  try {
    // 1. Télécharger une image Nutella
    console.log('1. Téléchargement image Nutella...');
    await downloadImage(
      'https://images.openfoodfacts.org/images/products/301/762/042/5035/front_fr.42.full.jpg',
      'nutella-test.jpg'
    );
    console.log('✅ Image téléchargée\n');
    
    // 2. Initialiser le service
    console.log('2. Initialisation VisionService...');
    await VisionService.initialize();
    
    // 3. Analyser l'image
    console.log('3. Analyse de l\'image...\n');
    const result = await VisionService.analyzeImage('./nutella-test.jpg');
    
    // 4. Afficher les résultats
    console.log('=== RESULTATS ===');
    console.log('Success:', result.success);
    console.log('Méthode:', result.method);
    console.log('Confiance:', result.data.confidence);
    console.log('Type produit:', result.data.productType);
    
    console.log('\n=== DONNEES EXTRAITES ===');
    const data = result.data.extractedData;
    console.log('Nom produit:', data.productName || 'Non trouvé');
    console.log('Marque:', data.brand || 'Non trouvée');
    console.log('Code-barres:', data.barcode || 'Non trouvé');
    console.log('Ingrédients:', data.ingredients ? data.ingredients.substring(0, 50) + '...' : 'Non trouvés');
    console.log('Poids:', data.weight || 'Non trouvé');
    console.log('Catégorie:', data.category || 'Non trouvée');
    
    console.log('\n=== TEXTE BRUT (200 premiers caractères) ===');
    if (result.data.rawText) {
      console.log(result.data.rawText.substring(0, 200));
      console.log('... (Total:', result.data.rawText.length, 'caractères)');
    } else {
      console.log('Aucun texte détecté');
    }
    
    console.log('\n=== LABELS DETECTES ===');
    if (result.data.labels.length > 0) {
      result.data.labels.slice(0, 5).forEach(label => {
        console.log('- ' + label.name + ' (' + Math.round(label.score * 100) + '%)');
      });
    } else {
      console.log('Aucun label détecté');
    }
    
    console.log('\n=== LOGOS DETECTES ===');
    if (result.data.logos.length > 0) {
      result.data.logos.forEach(logo => {
        console.log('- ' + logo.name + ' (' + Math.round(logo.score * 100) + '%)');
      });
    } else {
      console.log('Aucun logo détecté');
    }
    
    // 5. Sauvegarder le texte complet pour analyse
    if (result.data.rawText) {
      fs.writeFileSync('nutella-texte-complet.txt', result.data.rawText);
      console.log('\n✅ Texte complet sauvegardé dans nutella-texte-complet.txt');
    }
    
    // 6. Nettoyer
    await VisionService.cleanup();
    fs.unlinkSync('./nutella-test.jpg');
    
    console.log('\n✅ Test terminé avec succès !');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCompleteFlow();
