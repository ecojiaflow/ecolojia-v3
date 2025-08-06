const VisionService = require('./VisionServiceSimple');

async function testSimpleVision() {
  console.log('Test VisionService Simplifie\n');
  
  try {
    // Utiliser l'image de test précédente
    console.log('Analyse de test-vision.js...');
    const result = await VisionService.analyzeImage('./test-vision.js');
    
    console.log('\nResultat:');
    console.log('- Success:', result.success);
    console.log('- Methode:', result.method);
    console.log('- Confiance:', result.data.confidence);
    console.log('- Type produit:', result.data.productType);
    
    console.log('\nTexte detecte (50 premiers caracteres):');
    console.log(result.data.rawText.substring(0, 50) + '...');
    
    console.log('\nDonnees extraites:');
    console.log(result.data.extractedData);
    
    console.log('\nLabels (5 premiers):');
    result.data.labels.slice(0, 5).forEach(label => {
      console.log('- ' + label.name + ' (' + Math.round(label.score * 100) + '%)');
    });
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

testSimpleVision();
