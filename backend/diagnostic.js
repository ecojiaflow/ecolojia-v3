const vision = require('@google-cloud/vision');

async function diagnosticTest() {
  console.log('=== DIAGNOSTIC GOOGLE VISION ===\n');
  
  const client = new vision.ImageAnnotatorClient({
    keyFilename: './google-vision-key.json'
  });
  
  try {
    // Test 1: Image simple avec du texte clair
    console.log('1. Test avec image de texte simple...');
    const testUrl = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png';
    
    const [result1] = await client.textDetection(testUrl);
    console.log('Texte detecte:', result1.textAnnotations ? result1.textAnnotations.length : 0, 'annotations');
    
    // Test 2: Avec annotateImage (methode complete)
    console.log('\n2. Test avec annotateImage...');
    const [result2] = await client.annotateImage({
      image: { source: { imageUri: testUrl } },
      features: [
        { type: 'TEXT_DETECTION' },
        { type: 'LABEL_DETECTION' },
        { type: 'LOGO_DETECTION' },
        { type: 'DOCUMENT_TEXT_DETECTION' }
      ]
    });
    
    console.log('Reponses recues:');
    console.log('- textAnnotations:', result2.textAnnotations?.length || 0);
    console.log('- fullTextAnnotation:', result2.fullTextAnnotation ? 'OUI' : 'NON');
    console.log('- labelAnnotations:', result2.labelAnnotations?.length || 0);
    console.log('- logoAnnotations:', result2.logoAnnotations?.length || 0);
    
    // Test 3: Verifier les erreurs
    if (result2.error) {
      console.log('\nERREUR API:', result2.error.message);
    }
    
    // Test 4: Tester avec une image locale en base64
    console.log('\n3. Test avec image en base64...');
    const fs = require('fs');
    if (fs.existsSync('./nutella-real.jpg')) {
      const imageBuffer = fs.readFileSync('./nutella-real.jpg');
      const base64Image = imageBuffer.toString('base64');
      
      const [result3] = await client.annotateImage({
        image: { content: base64Image },
        features: [{ type: 'TEXT_DETECTION' }]
      });
      
      console.log('Resultat base64:', result3.textAnnotations?.length || 0, 'annotations');
    }
    
  } catch (error) {
    console.error('ERREUR:', error.message);
    console.error('Code:', error.code);
    console.error('Details:', error.details);
  }
}

diagnosticTest();
