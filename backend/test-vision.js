const vision = require('@google-cloud/vision');

async function testVisionAPI() {
  try {
    const client = new vision.ImageAnnotatorClient({
      keyFilename: './google-vision-key.json'
    });
    
    console.log('✅ Client Google Vision créé avec succès');
    
    // Test avec une image publique
    const [result] = await client.labelDetection(
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Books_HD_%288314929977%29.jpg/640px-Books_HD_%288314929977%29.jpg'
    );
    
    console.log('Labels détectés:');
    result.labelAnnotations.forEach(label => {
      console.log(`- ${label.description} (${Math.round(label.score * 100)}%)`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testVisionAPI();
