// POST /api/algolia/sync - Synchroniser MongoDB -> Algolia
router.post('/sync', asyncHandler(async (req, res) => {
  const Product = require('../models/Product');
  const products = await Product.find({}).lean();
  
  // Transformer les produits pour Algolia
  const transformProduct = (product) => ({
    objectID: product._id.toString(),
    title: product.name || '',
    brand: product.brand || '',
    category: product.category || '',
    barcode: product.barcode || '',
    ingredients: product.ingredients?.text || '',
    healthScore: product.analysisData?.healthScore || 0,
    environmentScore: product.analysisData?.environmentScore || 0,
    novaGroup: product.nova_group || product.nova || 0,
    nutriscoreGrade: product.nutriscore_grade || '',
    imageUrl: product.imageUrl || product.image_url || ''
  });
  
  // Indexer par batch de 100
  const batchSize = 100;
  let totalIndexed = 0;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const transformed = batch.map(transformProduct);
    await algoliaService.index.saveObjects(transformed);
    totalIndexed += transformed.length;
  }
  
  res.json({ 
    success: true, 
    message: `${totalIndexed} produits synchronisés sur ${products.length}` 
  });
}));
