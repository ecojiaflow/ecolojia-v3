// PATH: src/services/productService.ts
import api from './apiClient';

export async function getByBarcode(code: string): Promise<any> {
  const clean = encodeURIComponent((code || '').trim());
  return await api.get<any>(`/api/products/scan/${clean}`);
}

export const productService = { getByBarcode };
export default productService;


