const VisionService = require('./VisionServiceFixed');

async function testFixedService() {
  console.log('=== TEST VISIONSERVICE CORRIGE ===\n');
  
  try {
    await VisionService.initialize();
    
    // Tester avec l'image Nutella
    console.log('Test avec Nutella...');
    const result = await VisionService.analyzeImage('./Nutella__OpenFoodFacts_.jpg');
    
    console.log('\nRESULTAT:');
    console.log('- Success:', result.success);
    console.log('- Confiance:', result.data.confidence);
    console.log('- Type:', result.data.productType);
    
    console.log('\nDONNEES EXTRAITES:');
    console.log(JSON.stringify(result.data.extractedData, null, 2));
    
    console.log('\nTEXTE (100 premiers caractères):');
    console.log(result.data.rawText.substring(0, 100));
    
    console.log('\nLABELS:', result.data.labels.length);
    if (result.data.labels.length > 0) {
      result.data.labels.slice(0, 5).forEach(l => {
        console.log('- ' + l.name + ' (' + Math.round(l.score * 100) + '%)');
      });
    }
    
    await VisionService.cleanup();
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

testFixedService();
