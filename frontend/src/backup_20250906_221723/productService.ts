// PATH: frontend/src/services/productService.ts
import apiClient from "./apiClient";

export type Category = "food" | "cosmetics" | "detergents";

export type Product = {
  _id?: string; 
  id?: string; 
  productName?: string; 
  name?: string;
  brand?: string; 
  barcode?: string; 
  category?: Category | string; 
  imageUrl?: string;
  score?: number;
  nutriScore?: "A"|"B"|"C"|"D"|"E"; 
  ecoScore?: "A"|"B"|"C"|"D"|"E";
  novaGroup?: 1|2|3|4;
  [k: string]: any;
};

export async function getProductByBarcode(barcode: string): Promise<Product> {
  try {
    const response = await apiClient.get(`/products/barcode/${encodeURIComponent(barcode)}`);
    const data = response.data || response;
    return { 
      ...data, 
      id: data?._id ?? data?.id, 
      productName: data?.productName ?? data?.name 
    };
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    throw error;
  }
}

export async function getProductById(id: string): Promise<Product> {
  try {
    const response = await apiClient.get(`/products/${encodeURIComponent(id)}`);
    const data = response.data || response;
    return { 
      ...data, 
      id: data?._id ?? data?.id, 
      productName: data?.productName ?? data?.name 
    };
  } catch (error) {
    console.error('Error fetching product by id:', error);
    throw error;
  }
}

const productService = {
  async getByBarcode(barcode: string): Promise<Product> {
    return getProductByBarcode(barcode);
  },
  async getById(id: string): Promise<Product> {
    return getProductById(id);
  },
};

export default productService;
// Ajout des exports avec les noms attendus
export const getByBarcode = getProductByBarcode;
export const getById = getProductById;
export const getAlternatives = async (productId: string) => {
  const { data } = await apiClient.get(`/products/${encodeURIComponent(productId)}/alternatives`);
  return data;
};
