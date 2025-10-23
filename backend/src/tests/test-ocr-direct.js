const ProductOCRService = require('../services/vision/ProductOCRService');
const path = require('path');

async function testOCR() {
    console.log("?? Test direct du service OCR");
    
    const imagePath = path.join(__dirname, 'sample.jpg');
    
    try {
        // Initialiser le service
        await ProductOCRService.initialize();
        console.log("? Service initialisÃ©");
        
        // Analyser l'image
        const result = await ProductOCRService.analyzeProduct(imagePath, {
            userTier: 'free',
            category: 'food'
        });
        
        console.log("\n?? RÃ©sultat OCR:");
        console.log("- Service utilisÃ©:", result.service);
        console.log("- Confiance:", result.confidence);
        console.log("- Temps:", result.processingTime + "ms");
        
        if (result.data) {
            console.log("\n?? DonnÃ©es extraites:");
            console.log("- Nom produit:", result.data.productName);
            console.log("- Marque:", result.data.brand);
            console.log("- CatÃ©gorie:", result.data.category);
            console.log("- Code-barres:", result.data.barcode);
            console.log("- IngrÃ©dients:", result.data.ingredients ? 
                result.data.ingredients.substring(0, 100) + "..." : "Non dÃ©tectÃ©s");
        }
        
        // Shutdown
        await ProductOCRService.shutdown();
        console.log("\n? Test terminÃ© avec succÃ¨s!");
        
    } catch (error) {
        console.error("? Erreur:", error.message);
    }
}

testOCR();
