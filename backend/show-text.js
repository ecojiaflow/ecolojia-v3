const vision = require('@google-cloud/vision');
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

async function showDetectedText() {
  console.log('Affichage du texte detecte par Google Vision\n');
  
  const client = new vision.ImageAnnotatorClient({
    keyFilename: './google-vision-key.json'
  });
  
  try {
    // Telecharger image Nutella
    console.log('Telechargement image Nutella...');
    await downloadImage('https://fr.openfoodfacts.org/images/products/301/762/042/5035/front_fr.288.full.jpg', 'nutella-test.jpg');
    
    // Detection de texte
    const [result] = await client.textDetection('./nutella-test.jpg');
    
    if (result.textAnnotations && result.textAnnotations.length > 0) {
      console.log('\n=== TEXTE COMPLET DETECTE ===\n');
      console.log(result.textAnnotations[0].description);
      console.log('\n=== FIN DU TEXTE ===\n');
      
      // Analyser le texte
      const fullText = result.textAnnotations[0].description;
      
      // Recherche code-barres
      console.log('RECHERCHE CODE-BARRES:');
      const barcodeMatch = fullText.match(/\b(\d{13})\b/);
      console.log('- Code-barres:', barcodeMatch ? barcodeMatch[1] : 'Non trouve');
      
      // Recherche marque
      console.log('\nRECHERCHE MARQUE:');
      const brandMatch = fullText.match(/NUTELLA|Ferrero/i);
      console.log('- Marque:', brandMatch ? brandMatch[0] : 'Non trouvee');
      
      // Recherche ingredients
      console.log('\nRECHERCHE INGREDIENTS:');
      const ingredientsMatch = fullText.match(/ingredients?:?\s*([^\n]+)/i);
      console.log('- Ingredients:', ingredientsMatch ? ingredientsMatch[1].substring(0, 50) + '...' : 'Non trouves');
      
      // Mots individuels
      console.log('\nMOTS DETECTES (10 premiers):');
      result.textAnnotations.slice(1, 11).forEach(annotation => {
        console.log('- ' + annotation.description);
      });
    } else {
      console.log('Aucun texte detecte');
    }
    
    // Test avec le VisionService corrige
    console.log('\n\n=== TEST VISIONSERVICE CORRIGE ===');
    const VisionService = require('./src/services/vision/VisionService');
    
    // Initialiser directement sans Tesseract
    VisionService.googleVisionClient = client;
    VisionService.initialized = true;
    
    const serviceResult = await VisionService.analyzeImage('./nutella-test.jpg', {
      useGoogleVision: true,
      language: 'fr'
    });
    
    console.log('Analyse reussie:', serviceResult.success);
    console.log('Methode:', serviceResult.method);
    console.log('Donnees extraites:', serviceResult.data.extractedData);
    
    // Nettoyer
    fs.unlinkSync('./nutella-test.jpg');
    
  } catch (error) {
    console.error('Erreur:', error.message);
    console.error('Stack:', error.stack);
  }
}

showDetectedText();
