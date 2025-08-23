// PATH: frontend/src/services/productService.ts
import { get } from './apiClient';

export interface Product {
  _id: string;
  barcode: string;
  name: string;
  brand?: string;
  category: 'food' | 'cosmetics' | 'detergents';
  scores?: {
    healthScore?: number;
    environmentScore?: number;
    nova?: number;
    nutriscore?: string;
    ecoscore?: string;
  };
  images?: {
    front?: string;
    ingredients?: string;
    nutrition?: string;
  };
}

export async function getByBarcode(code: string): Promise<Product> {
  const clean = encodeURIComponent((code || '').trim());
  return await get<Product>(`/products/barcode/${clean}`);
}

export async function searchProducts(query: string) {
  return await get(`/products/search?q=${encodeURIComponent(query)}`);
}

export async function getTrendingProducts() {
  return await get('/products/trending');
}

export async function getProductById(id: string) {
  return await get<Product>(`/products/${id}`);
}

export async function getAlternatives(productId: string) {
  return await get(`/products/${productId}/alternatives`);
}

export const productService = { 
  getByBarcode,
  searchProducts,
  getTrendingProducts,
  getProductById,
  getAlternatives
};

export default productService;