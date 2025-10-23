import stringSimilarity from 'string-similarity';
import Product from '../models/Product';

export async function findDuplicateCandidate(name?: string, brand?: string) {
  if (!name) return null;
  const q: any = brand ? { brand } : {};
  const candidates = await Product.find(q, 'name brand').limit(25).lean();
  if (!candidates.length) return null;
  const best = stringSimilarity.findBestMatch(name, candidates.map(c=>c.name));
  if (best.bestMatch.rating >= 0.92) return candidates[best.bestMatchIndex];
  return null;
}
