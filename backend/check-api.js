const vision = require('@google-cloud/vision');

async function checkAPIStatus() {
  console.log('Verification du statut de l\'API Google Vision\n');
  
  try {
    const client = new vision.ImageAnnotatorClient({
      keyFilename: './google-vision-key.json'
    });
    
    console.log('1. Client cree avec succes');
    console.log('2. Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID || 'Non defini');
    
    // Test simple avec une petite image
    console.log('\n3. Test avec une petite image...');
    
    // Creer une petite image de test en base64
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(testImageBase64, 'base64');
    
    const [result] = await client.annotateImage({
      image: { content: buffer },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 5 },
        { type: 'TEXT_DETECTION', maxResults: 5 }
      ]
    });
    
    console.log('Reponse recue:', result ? 'OUI' : 'NON');
    console.log('Labels:', result.labelAnnotations ? result.labelAnnotations.length : 0);
    console.log('Texte:', result.textAnnotations ? result.textAnnotations.length : 0);
    
    console.log('\n4. API fonctionnelle !');
    
  } catch (error) {
    console.error('ERREUR API:');
    console.error('- Message:', error.message);
    console.error('- Code:', error.code);
    console.error('- Details:', error.details);
    
    if (error.message.includes('Cloud Vision API has not been used')) {
      console.error('\n⚠️  L\'API Cloud Vision n\'est pas activee !');
      console.error('Allez sur: https://console.cloud.google.com/apis/library/vision.googleapis.com');
      console.error('Et cliquez sur "Activer"');
    }
  }
}

checkAPIStatus();
