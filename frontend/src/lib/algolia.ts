// frontend/src/lib/algolia.ts
import algoliasearch from 'algoliasearch/lite';
import { buildAlgoliaFilters, FilterState } from '../utils/buildAlgoliaFilters';

const client = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID || 'A2KJGZ2811',
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY || '8a6393c1ff95165413e7f0bfea804357'
);

const index = client.initIndex(import.meta.env.VITE_ALGOLIA_INDEX || 'products');

export interface SearchParams {
  query: string;
  filters?: FilterState;
  page?: number;
  hitsPerPage?: number;
}

export const searchProducts = async ({ 
  query, 
  filters = {}, 
  page = 0, 
  hitsPerPage = 20 
}: SearchParams) => {
  try {
    const { facetFilters, numericFilters } = buildAlgoliaFilters(filters);
    
    const searchParams: any = {
      query,
      page,
      hitsPerPage,
      attributesToRetrieve: [
        'barcode',
        'name',
        'brands',
        'categories',
        'productType',
        'imageUrl',
        'score',
        'nutriScore',
        'novaGroup',
        'ecoScore'
      ],
      facets: ['brands', 'categories.lvl0', 'productType', 'score']
    };
    
    if (facetFilters) {
      searchParams.facetFilters = facetFilters;
    }
    
    if (numericFilters) {
      searchParams.numericFilters = numericFilters;
    }
    
    console.log('Algolia search params:', searchParams);
    
    const results = await index.search(query, searchParams);
    
    return {
      hits: results.hits,
      nbHits: results.nbHits,
      page: results.page,
      nbPages: results.nbPages,
      facets: results.facets || {}
    };
  } catch (error) {
    console.error('Algolia search error:', error);
    return {
      hits: [],
      nbHits: 0,
      page: 0,
      nbPages: 0,
      facets: {}
    };
  }
};
