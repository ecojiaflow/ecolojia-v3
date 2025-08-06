const vision = require('@google-cloud/vision');

async function testGoogleVision() {
  console.log('Test Google Vision API pour ECOLOJIA');
  
  try {
    const client = new vision.ImageAnnotatorClient({
      keyFilename: './google-vision-key.json'
    });
    
    console.log('Client Google Vision OK');
    
    const imageUrl = 'https://images.openfoodfacts.org/images/products/301/762/042/5035/front_fr.84.400.jpg';
    
    console.log('Analyse image Nutella...');
    
    const [textResult] = await client.textDetection(imageUrl);
    const [labelResult] = await client.labelDetection(imageUrl);
    
    console.log('\nTEXTE DETECTE:');
    const text = textResult.fullTextAnnotation ? textResult.fullTextAnnotation.text : 'Aucun texte';
    console.log(text.substring(0, 200));
    
    console.log('\nLABELS DETECTES:');
    if (labelResult.labelAnnotations) {
      labelResult.labelAnnotations.slice(0, 5).forEach(label => {
        const score = Math.round(label.score * 100);
        console.log('- ' + label.description + ' (' + score + '%)');
      });
    }
    
    console.log('\nTest reussi !');
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

testGoogleVision();
