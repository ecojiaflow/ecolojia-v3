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

async function testMultipleProductImages() {
  console.log('=== TEST AVEC DIFFERENTES IMAGES DE PRODUITS ===\n');
  
  const client = new vision.ImageAnnotatorClient({
    keyFilename: './google-vision-key.json'
  });
  
  const testImages = [
    {
      name: 'Nutella (OpenFoodFacts)',
      url: 'https://images.openfoodfacts.org/images/products/301/762/042/5035/front_fr.42.full.jpg'
    },
    {
      name: 'Coca Cola',
      url: 'https://images.openfoodfacts.org/images/products/544/900/000/0996/front_fr.119.full.jpg'
    },
    {
      name: 'Pringles',
      url: 'https://images.openfoodfacts.org/images/products/503/827/220/1008/front_fr.127.full.jpg'
    },
    {
      name: 'Image test avec texte',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Ingredientslabel.jpg/640px-Ingredientslabel.jpg'
    }
  ];
  
  for (const testImage of testImages) {
    console.log('\\n--- Test:', testImage.name, '---');
    
    try {
      // Telecharger
      const filename = testImage.name.replace(/[^a-z0-9]/gi, '_') + '.jpg';
      await downloadImage(testImage.url, filename);
      
      // Analyser avec annotateImage complet
      const [result] = await client.annotateImage({
        image: { content: fs.readFileSync(filename) },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 50 },
          { type: 'DOCUMENT_TEXT_DETECTION' },
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'LOGO_DETECTION', maxResults: 5 }
        ]
      });
      
      // Afficher resultats
      console.log('Texte detecte:', result.textAnnotations ? 'OUI' : 'NON');
      if (result.textAnnotations && result.textAnnotations.length > 0) {
        console.log('- Nombre annotations:', result.textAnnotations.length);
        console.log('- Premier texte:', result.textAnnotations[0].description.substring(0, 100).replace(/\\n/g, ' '));
      }
      
      if (result.fullTextAnnotation) {
        const fullText = result.fullTextAnnotation.text;
        console.log('- Texte complet longueur:', fullText.length);
        
        // Chercher code-barres
        const barcodeMatch = fullText.match(/\\b(\\d{8,13})\\b/);
        if (barcodeMatch) {
          console.log('- CODE-BARRES TROUVE:', barcodeMatch[1]);
        }
        
        // Chercher ingredients
        if (fullText.toLowerCase().includes('ingredient')) {
          console.log('- INGREDIENTS: OUI');
        }
      }
      
      console.log('Labels:', result.labelAnnotations?.length || 0);
      if (result.labelAnnotations && result.labelAnnotations.length > 0) {
        console.log('- Top 3:', result.labelAnnotations.slice(0, 3).map(l => l.description).join(', '));
      }
      
      console.log('Logos:', result.logoAnnotations?.length || 0);
      if (result.logoAnnotations && result.logoAnnotations.length > 0) {
        console.log('- Logos:', result.logoAnnotations.map(l => l.description).join(', '));
      }
      
      // Sauvegarder le texte si trouve
      if (result.fullTextAnnotation) {
        fs.writeFileSync(filename + '.txt', result.fullTextAnnotation.text);
        console.log('- Texte sauvegarde dans:', filename + '.txt');
      }
      
      // Nettoyer
      fs.unlinkSync(filename);
      
    } catch (error) {
      console.error('Erreur:', error.message);
    }
  }
  
  console.log('\\n=== TESTS TERMINES ===');
}

testMultipleProductImages();
