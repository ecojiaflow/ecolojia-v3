const axios = require('axios');
const { z } = require('zod');

const OffProduct = z.object({
  product: z.object({
    product_name: z.string().optional(),
    brands: z.string().optional(),
    ingredients_text: z.string().optional(),
    nutriscore_grade: z.string().optional(),
    nova_group: z.number().optional(),
    ecoscore_grade: z.string().optional(),
    image_url: z.string().optional(),
    additives_tags: z.array(z.string()).optional(),
  }).optional(),
  status: z.number(),
});

const normalizeGrade = (v) => {
  const grade = v?.toUpperCase();
  if (grade && ['A', 'B', 'C', 'D', 'E'].includes(grade)) {
    return grade;
  }
  return undefined;
};

async function fetchFromOpenFoodFacts(barcode) {
  try {
    console.log(`Fetching from OFF: ${barcode}`);
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const { data } = await axios.get(url, { timeout: 7000 });
    
    const parsed = OffProduct.safeParse(data);
    if (!parsed.success || parsed.data.status !== 1 || !parsed.data.product) {
      return null;
    }
    
    const p = parsed.data.product;
    
    // Validation stricte : au moins product_name doit être défini
    if (!p.product_name || p.product_name.trim() === '') {
      console.log('OFF returned product but no name - treating as not found');
      return null;
    }
    
    return {
      code: barcode,  // Ajouter le code-barre
      product_name: p.product_name,
      generic_name: p.generic_name,
      brands: p.brands,
      ingredients_text: p.ingredients_text,
      nutriscore_grade: p.nutriscore_grade,
      nova_group: p.nova_group,
      ecoscore_grade: p.ecoscore_grade,
      image_url: p.image_url,
      additives_tags: p.additives_tags || [],
      labels_tags: p.labels_tags || [],
      nutriments: p.nutriments || {},
      packaging: p.packaging,
      origins: p.origins
    };
  } catch (error) {
    console.error(`Error OFF: ${error.message}`);
    return null;
  }
}

async function fetchFromOpenBeautyFacts(barcode) {
  try {
    const url = `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`;
    const { data } = await axios.get(url, { timeout: 7000 });
    const parsed = OffProduct.safeParse(data);
    if (!parsed.success || parsed.data.status !== 1) return null;
    
    const p = parsed.data.product;
    return {
      name: p.product_name,
      brand: p.brands?.split(',')?.[0]?.trim(),
      ingredients: p.ingredients_text,
      imageUrl: p.image_url
    };
  } catch (error) {
    return null;
  }
}

async function fetchExternalData(barcode, category) {
  if (category === 'cosmetics') {
    return fetchFromOpenBeautyFacts(barcode);
  }
  return fetchFromOpenFoodFacts(barcode);
}

module.exports = { fetchFromOpenFoodFacts, fetchFromOpenBeautyFacts, fetchExternalData };
