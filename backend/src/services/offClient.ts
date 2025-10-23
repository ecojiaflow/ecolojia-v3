import http from '../lib/http';
import { z } from 'zod';

const OffProduct = z.object({
  product: z.object({
    product_name: z.string().optional(),
    brands: z.string().optional(),
    categories: z.string().optional(),
    ingredients_text: z.string().optional(),
    nutriscore_grade: z.string().optional(),
    nova_group: z.number().optional(),
    ecoscore_grade: z.string().optional(),
    image_url: z.string().optional(),
    quantity: z.string().optional(),
    code: z.string().optional()
  }).optional(),
  status: z.number(),
});

export type NormalizedExternal = {
  name?: string; brand?: string; ingredients?: string;
  nutriScore?: 'A'|'B'|'C'|'D'|'E'; novaGroup?: 1|2|3|4; ecoScore?: 'A'|'B'|'C'|'D'|'E';
  imageUrl?: string; quantity?: string; barcode?: string;
};

const grade = (v?: string) => v ? v.toUpperCase() as any : undefined;

export async function fetchFromOpenFoodFacts(barcode: string): Promise<NormalizedExternal | null> {
  const { data } = await http.get(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
  const parsed = OffProduct.safeParse(data);
  if (!parsed.success || parsed.data.status !== 1 || !parsed.data.product) return null;
  const p = parsed.data.product;
  return {
    name: p.product_name || undefined,
    brand: p.brands?.split(',')?.[0]?.trim(),
    ingredients: p.ingredients_text || undefined,
    nutriScore: grade(p.nutriscore_grade),
    novaGroup: p.nova_group as any,
    ecoScore: grade(p.ecoscore_grade),
    imageUrl: p.image_url || undefined,
    quantity: p.quantity || undefined,
    barcode: p.code || barcode
  };
}

export async function fetchFromOpenBeautyFacts(barcode: string): Promise<NormalizedExternal | null> {
  const { data } = await http.get(`https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`);
  const parsed = OffProduct.safeParse(data);
  if (!parsed.success || parsed.data.status !== 1 || !parsed.data.product) return null;
  const p = parsed.data.product;
  return {
    name: p.product_name || undefined,
    brand: p.brands?.split(',')?.[0]?.trim(),
    ingredients: p.ingredients_text || undefined,
    imageUrl: p.image_url || undefined,
    quantity: p.quantity || undefined,
    barcode: p.code || barcode
  };
}
