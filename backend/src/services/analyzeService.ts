import Product from '../models/Product';
import { fetchFromOpenFoodFacts, fetchFromOpenBeautyFacts } from './offClient';
import { scoreFood } from '../scorers/foodScorer';
import { scoreCosmetics } from '../scorers/cosmeticsScorer';
import { scoreDetergent } from '../scorers/detergentScorer';
import { findDuplicateCandidate } from './dedupService';

type Category = 'food'|'cosmetics'|'detergents';

export async function analyzeAutoSvc(input: { barcode?: string; name?: string; ingredients?: string; category: Category }) {
  const { barcode, name, ingredients, category } = input;

  if (barcode) {
    const cached = await Product.findOne({ barcode }).lean();
    if (cached?.scores?.global) return cached;
  }

  let ext: any = null;
  if (barcode) {
    ext = category === 'cosmetics' ? await fetchFromOpenBeautyFacts(barcode)
                                   : await fetchFromOpenFoodFacts(barcode);
  }

  if (!barcode && (name || ext?.name)) {
    const duplicate = await findDuplicateCandidate(name || ext?.name, ext?.brand);
    if (duplicate) return duplicate;
  }

  const merged = {
    barcode: barcode || ext?.barcode,
    name: ext?.name || name || 'Produit',
    brand: ext?.brand,
    ingredients: ext?.ingredients || ingredients,
    nutriScore: ext?.nutriScore,
    novaGroup: ext?.novaGroup,
    ecoScore: ext?.ecoScore,
    imageUrl: ext?.imageUrl,
    category
  };

  let scores;
  if (category === 'food') scores = scoreFood(merged as any);
  else if (category === 'cosmetics') scores = scoreCosmetics(merged as any);
  else scores = scoreDetergent(merged as any);

  const saved = await Product.findOneAndUpdate(
    { barcode: merged.barcode ?? null, name: merged.name },
    { $set: { ...merged, scores, lastAnalyzedAt: new Date() } },
    { new: true, upsert: true }
  );
  return saved.toObject();
}
