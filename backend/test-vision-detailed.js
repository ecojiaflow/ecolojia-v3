const vision = require('@google-cloud/vision');

async function testGoogleVisionDetailed() {
  console.log('Test detaille Google Vision API\n');
  
  try {
    const client = new vision.ImageAnnotatorClient({
      keyFilename: './google-vision-key.json'
    });
    
    // Essayer avec une image de meilleure qualite
    const imageUrl = 'https://cdn.pixabay.com/photo/2014/12/10/11/25/nutella-563125_960_720.jpg';
    
    console.log('Test 1: Detection de texte...');
    const [textResult] = await client.textDetection(imageUrl);
    
    if (textResult.textAnnotations && textResult.textAnnotations.length > 0) {
      console.log('Texte trouve:', textResult.textAnnotations[0].description);
    } else {
      console.log('Aucun texte detecte');
    }
    
    console.log('\nTest 2: Detection de labels...');
    const [labelResult] = await client.labelDetection(imageUrl);
    
    if (labelResult.labelAnnotations && labelResult.labelAnnotations.length > 0) {
      console.log('Labels trouves:');
      labelResult.labelAnnotations.forEach(label => {
        console.log('- ' + label.description + ' (score: ' + label.score + ')');
      });
    }
    
    console.log('\nTest 3: Detection de logos...');
    const [logoResult] = await client.logoDetection(imageUrl);
    
    if (logoResult.logoAnnotations && logoResult.logoAnnotations.length > 0) {
      console.log('Logos trouves:');
      logoResult.logoAnnotations.forEach(logo => {
        console.log('- ' + logo.description);
      });
    } else {
      console.log('Aucun logo detecte');
    }
    
    // Test avec une image locale
    console.log('\n\nTest 4: Analyse du fichier test-vision.js comme texte...');
    const [localResult] = await client.documentTextDetection('./test-vision.js');
    
    if (localResult.fullTextAnnotation) {
      console.log('Texte du fichier detecte (debut):');
      console.log(localResult.fullTextAnnotation.text.substring(0, 100) + '...');
    }
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

testGoogleVisionDetailed();
