// PATH: frontend/src/services/searchService.ts
import api from './api';
import { SearchFilters, ProductHit } from '@/types';

interface SearchParams {
  query: string;
  filters?: SearchFilters;
  page?: number;
  hitsPerPage?: number;
}

interface SearchResponse {
  hits: ProductHit[];
  totalHits: number;
  page: number;
  totalPages: number;
  processingTimeMs: number;
}

class SearchService {
  async search(params: SearchParams): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      const response = await api.get('/products');
      
      console.log('API Response:', response);
      
      // Extraire les produits du format { success: true, products: [...] }
      let products = [];
      if (response.data?.success && response.data?.products) {
        products = response.data?.products;
      } else if (response.data?.products) {
        products = response.data?.products;
      } else if (Array.isArray(response.data)) {
        products = response.data;
      }
      
      console.log(`Found ${products.length} products in total`);
      
      // Filtrer seulement si une query specifique est fournie
      let filteredProducts = products;
      if (params.query && params.query.trim() !== '') {
        const searchTerm = params.query.toLowerCase().trim();
        
        // Si la recherche est vide ou generique, montrer tous les produits
        if (searchTerm === '' || searchTerm === 'tous' || searchTerm === 'all') {
          filteredProducts = products;
        } else {
          // Filtre plus flexible
          filteredProducts = products.filter((p: any) => {
            const name = (p.name || '').toLowerCase();
            const brand = (p.brand || '').toLowerCase();
            const barcode = (p.barcode || '').toLowerCase();
            const category = (p.category || '').toLowerCase();
            
            // Recherche partielle dans tous les champs
            return name.includes(searchTerm) || 
                   brand.includes(searchTerm) || 
                   barcode.includes(searchTerm) ||
                   category.includes(searchTerm) ||
                   // Recherche par mots individuels
                   searchTerm.split(' ').some(word => 
                     name.includes(word) || brand.includes(word)
                   );
          });
        }
        console.log(`Filtered to ${filteredProducts.length} products for query: "${params.query}"`);
      } else {
        console.log('No query provided, showing all products');
      }
      
      // Mapper vers ProductHit avec toutes les donnees
      const hits = filteredProducts.map((product: any, index: number) => {
        console.log(`Mapping product ${index + 1}:`, product);
        
        const hit: ProductHit = {
          objectID: product._id || product.id || `product-${index}`,
          name: product.name || 'Produit sans nom',
          brand: product.brand || 'Marque inconnue',
          image: product.imageUrl || product.image || '/placeholder.png',
          imageUrl: product.imageUrl || product.image || '/placeholder.png',
          barcode: product.barcode || '',
          category: product.category || 'food',
          ingredients: product.ingredients || '',
          nova: product.nova,
          additives: product.additives || []
        };
        
        // Ajouter les scores depuis analysisData
        if (product.analysisData) {
          hit.healthScore = product.analysisdata?.healthScore || 0;
          hit.environmentScore = product.analysisdata?.environmentScore || 0;
          hit.socialScore = product.analysisdata?.socialScore;
          
          // Si les scores detailles existent
          if (product.analysisdata?.scores) {
            hit.healthScore = product.analysisdata?.scores.healthScore || hit.healthScore;
            hit.environmentScore = product.analysisdata?.scores.environmentScore || hit.environmentScore;
          }
          
          // Nutriscore et ecoscore depuis details
          if (product.analysisdata?.details) {
            hit.nutriScore = product.analysisdata?.details.nutriscore;
            hit.ecoScore = product.analysisdata?.details.ecoscore;
          }
        }
        
        // Calculer un score global si non fourni
        if (!hit.globalScore && (hit.healthScore || hit.environmentScore)) {
          hit.globalScore = Math.round(
            ((hit.healthScore || 0) + (hit.environmentScore || 0)) / 2
          );
        }
        
        console.log(`Mapped product:`, hit);
        
        return hit;
      });
      
      console.log('Final hits array:', hits);
      
      return {
        hits,
        totalHits: hits.length,
        page: 0,
        totalPages: 1,
        processingTimeMs: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Search error:', error);
      return {
        hits: [],
        totalHits: 0,
        page: 0,
        totalPages: 0,
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  async searchByBarcode(barcode: string): Promise<ProductHit | null> {
    try {
      const response = await api.get(`/products/barcode/${barcode}`);
      
      if (!response.data || response.data?.success === false) {
        return null;
      }
      
      const product = response.data?.product || response.data;
      
      return {
        objectID: product._id || product.id || product.barcode,
        name: product.name || 'Sans nom',
        brand: product.brand || '',
        image: product.imageUrl || product.image || '/placeholder.png',
        imageUrl: product.imageUrl || product.image || '/placeholder.png',
        barcode: product.barcode,
        category: product.category || 'food',
        ingredients: product.ingredients || '',
        nova: product.nova,
        additives: product.additives || [],
        healthScore: product.analysisData?.healthScore || 0,
        environmentScore: product.analysisData?.environmentScore || 0,
        socialScore: product.analysisData?.socialScore,
        nutriScore: product.analysisData?.details?.nutriscore,
        ecoScore: product.analysisData?.details?.ecoscore
      };
    } catch (error) {
      console.error('Barcode search error:', error);
      return null;
    }
  }

  async getSuggestions(query: string): Promise<string[]> {
    try {
      const response = await api.get('/products');
      const products = response.data?.products || [];
      
      // Extraire les noms et marques uniques
      const suggestions = new Set<string>();
      products.forEach((p: any) => {
        if (p.name) suggestions.add(p.name);
        if (p.brand) suggestions.add(p.brand);
      });
      
      return Array.from(suggestions).slice(0, 10);
    } catch (error) {
      return [];
    }
  }

  async searchWithFacets(params: SearchParams): Promise<any> {
    return this.search(params);
  }
}

export function extractProducts(response: SearchResponse | any): ProductHit[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response?.hits) {
    return response.hits;
  }
  if (response?.data?.hits) {
    return response.data?.hits;
  }
  if (response?.data?.products) {
    return response.data?.products;
  }
  if (response?.products) {
    return response.products;
  }
  return [];
}

const searchService = new SearchService();
export default searchService;
export { searchService };



