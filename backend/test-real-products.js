const vision = require('@google-cloud/vision');
const https = require('https');
const fs = require('fs');
const path = require('path');

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

async function testRealProducts() {
  console.log('Test Google Vision avec de vrais produits ECOLOJIA\n');
  
  const client = new vision.ImageAnnotatorClient({
    keyFilename: './google-vision-key.json'
  });
  
  try {
    // Image 1: Nutella haute qualite
    console.log('=== TEST 1: NUTELLA ===');
    const nutellaUrl = 'https://fr.openfoodfacts.org/images/products/301/762/042/5035/front_fr.288.full.jpg';
    await downloadImage(nutellaUrl, 'nutella.jpg');
    
    const [nutellaText] = await client.textDetection('./nutella.jpg');
    const [nutellaLabels] = await client.labelDetection('./nutella.jpg');
    const [nutellaLogos] = await client.logoDetection('./nutella.jpg');
    
    console.log('Texte detecte:', nutellaText.textAnnotations ? 'OUI' : 'NON');
    if (nutellaText.textAnnotations && nutellaText.textAnnotations.length > 0) {
      const fullText = nutellaText.textAnnotations[0].description;
      console.log('Extrait:', fullText.substring(0, 100) + '...');
      
      // Chercher le code-barres
      const barcodeMatch = fullText.match(/3017620425035/);
      console.log('Code-barres trouve:', barcodeMatch ? barcodeMatch[0] : 'NON');
      
      // Chercher ingredients
      const ingredientsMatch = fullText.match(/sucre|sugar|huile|oil|noisettes|hazelnuts/i);
      console.log('Ingredients detectes:', ingredientsMatch ? 'OUI' : 'NON');
    }
    
    console.log('\nLabels:');
    nutellaLabels.labelAnnotations?.slice(0, 5).forEach(label => {
      console.log('- ' + label.description + ' (' + Math.round(label.score * 100) + '%)');
    });
    
    console.log('\nLogos:', nutellaLogos.logoAnnotations?.length || 0);
    nutellaLogos.logoAnnotations?.forEach(logo => {
      console.log('- ' + logo.description);
    });
    
    // Image 2: Produit cosmetique
    console.log('\n\n=== TEST 2: PRODUIT COSMETIQUE ===');
    const cosmeticUrl = 'https://cdn.pixabay.com/photo/2020/08/14/15/22/shampoo-5488235_960_720.jpg';
    await downloadImage(cosmeticUrl, 'cosmetic.jpg');
    
    const [cosmeticLabels] = await client.labelDetection('./cosmetic.jpg');
    console.log('Labels cosmetiques:');
    cosmeticLabels.labelAnnotations?.slice(0, 5).forEach(label => {
      console.log('- ' + label.description);
    });
    
    // Detecter la categorie
    const isCosmetic = cosmeticLabels.labelAnnotations?.some(label => 
      ['cosmetics', 'shampoo', 'bottle', 'personal care'].includes(label.description.toLowerCase())
    );
    console.log('Categorie detectee:', isCosmetic ? 'COSMETIQUE' : 'AUTRE');
    
    // Test avec VisionService
    console.log('\n\n=== TEST 3: AVEC VISIONSERVICE ===');
    const VisionService = require('./src/services/vision/VisionService');
    
    // Bypasser Tesseract
    VisionService.initialized = true;
    VisionService.googleVisionClient = client;
    
    const result = await VisionService.analyzeWithGoogleVision('./nutella.jpg', 'fr');
    console.log('Methode:', result.method);
    console.log('Confiance:', result.confidence);
    console.log('Type produit:', result.productType);
    
    if (result.extractedData) {
      console.log('\nDonnees extraites:');
      console.log('- Nom:', result.extractedData.productName);
      console.log('- Marque:', result.extractedData.brand);
      console.log('- Code-barres:', result.extractedData.barcode);
      console.log('- Categorie:', result.extractedData.category);
    }
    
    // Nettoyer
    fs.unlinkSync('./nutella.jpg');
    fs.unlinkSync('./cosmetic.jpg');
    
    console.log('\n✅ Tests termines avec succes !');
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

testRealProducts();
