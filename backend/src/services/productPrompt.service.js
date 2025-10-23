// === ECOLOJIA V3 - Product Prompt Enrichment Service ===
const Product = require('../models/Product');

async function enrichPromptWithProduct(productId) {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      return null;
    }
    
    const systemPrompt = `Tu es un assistant nutritionnel expert d'ECOLOJIA.

PRODUIT ANALYSÉ:
- Nom: ${product.product_name || 'Non disponible'}
- Marque: ${product.brands || 'Non disponible'}
- Catégorie: ${product.categories || 'Non disponible'}
- Code-barre: ${product.code || 'Non disponible'}
- Nutri-Score: ${product.nutriscore_grade || 'Non évalué'}
- NOVA: ${product.nova_group || 'Non évalué'}
- Éco-Score: ${product.ecoscore_grade || 'Non évalué'}

INGRÉDIENTS:
${product.ingredients_text || 'Non disponibles'}

ADDITIFS:
${product.additives_tags ? product.additives_tags.join(', ') : 'Aucun'}

ALLERGÈNES:
${product.allergens_tags ? product.allergens_tags.join(', ') : 'Aucun'}

VALEURS NUTRITIONNELLES (pour 100g):
- Énergie: ${product.nutriments?.energy_100g || 'N/A'} kcal
- Graisses: ${product.nutriments?.fat_100g || 'N/A'} g
- Glucides: ${product.nutriments?.carbohydrates_100g || 'N/A'} g
- Protéines: ${product.nutriments?.proteins_100g || 'N/A'} g
- Sel: ${product.nutriments?.salt_100g || 'N/A'} g

⚠️ DISCLAIMER OBLIGATOIRE:
Les informations fournies sont éducatives et ne remplacent pas l'avis d'un professionnel de santé. Consultez un médecin ou nutritionniste pour des conseils personnalisés.

Réponds de manière claire, pédagogique et objective aux questions sur ce produit.`;

    return {
      systemPrompt,
      productData: {
        name: product.product_name,
        brands: product.brands,
        nutriscoreGrade: product.nutriscore_grade,
        novaGroup: product.nova_group,
        ecoscoreGrade: product.ecoscore_grade
      }
    };
  } catch (error) {
    console.error('Erreur enrichissement prompt:', error);
    return null;
  }
}

module.exports = { enrichPromptWithProduct };