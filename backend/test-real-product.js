const VisionService = require('./VisionServiceSimple');
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

async function testWithRealProduct() {
  console.log('Test avec une vraie image de produit\n');
  
  try {
    // Telecharger une image Nutella de bonne qualite
    console.log('Telechargement image Nutella...');
    const imageUrl = 'https://images.openfoodfacts.org/images/products/301/762/042/5035/front_fr.42.full.jpg';
    await downloadImage(imageUrl, 'nutella-real.jpg');
    console.log('Image telechargee\n');
    
    // Analyser avec le service
    const result = await VisionService.analyzeImage('./nutella-real.jpg');
    
    console.log('=== RESULTATS ===');
    console.log('Success:', result.success);
    console.log('Methode:', result.method);
    console.log('Confiance:', result.data.confidence);
    console.log('Type produit:', result.data.productType);
    
    console.log('\n=== TEXTE BRUT (200 premiers caracteres) ===');
    console.log(result.data.rawText.substring(0, 200));
    if (result.data.rawText.length > 200) {
      console.log('... (texte coupe, total:', result.data.rawText.length, 'caracteres)');
    }
    
    console.log('\n=== DONNEES EXTRAITES ===');
    console.log('Nom produit:', result.data.extractedData.productName || 'Non trouve');
    console.log('Marque:', result.data.extractedData.brand || 'Non trouvee');
    console.log('Code-barres:', result.data.extractedData.barcode || 'Non trouve');
    console.log('Ingredients:', result.data.extractedData.ingredients ? 
      result.data.extractedData.ingredients.substring(0, 50) + '...' : 'Non trouves');
    
    console.log('\n=== LABELS DETECTES ===');
    result.data.labels.slice(0, 10).forEach(label => {
      console.log('- ' + label.name + ' (' + Math.round(label.score * 100) + '%)');
    });
    
    console.log('\n=== LOGOS DETECTES ===');
    if (result.data.logos.length > 0) {
      result.data.logos.forEach(logo => {
        console.log('- ' + logo.name + ' (' + Math.round(logo.score * 100) + '%)');
      });
    } else {
      console.log('Aucun logo detecte');
    }
    
    // Sauvegarder le texte complet pour analyse
    fs.writeFileSync('nutella-text.txt', result.data.rawText);
    console.log('\nTexte complet sauvegarde dans nutella-text.txt');
    
    // Nettoyer
    fs.unlinkSync('./nutella-real.jpg');
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

testWithRealProduct();
