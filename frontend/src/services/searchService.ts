// PATH: frontend/src/services/searchService.ts
import { API_BASE_URL } from '../config/constants';

class SearchService {
  async searchProducts(query: string, filters: any = {}): Promise<any> {
    const params = new URLSearchParams({
      q: query,
      page: String(filters.page || 1),
      limit: String(filters.limit || 20),
      ...(filters.category && { category: filters.category })
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/algolia/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Search error: ${response.status}`);
      }

      const data = await response.json();
      return {
        products: data.data?.products || data.products || [],
        pagination: data.data?.pagination || data.pagination || {
          total: 0,
          page: 1,
          pages: 1
        }
      };
    } catch (error) {
      console.error('Search error:', error);
      return {
        products: [],
        pagination: { total: 0, page: 1, pages: 1 }
      };
    }
  }
}

export const searchService = new SearchService();
export default searchService;

