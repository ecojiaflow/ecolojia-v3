// PATH: frontend/ecolojiaFrontV3/src/services/algolia/client.ts
import algoliasearch from 'algoliasearch';
import { InstantSearch } from 'react-instantsearch';

// ✅ Configuration Algolia avec vraies clés
export const ALGOLIA_CONFIG = {
  appId: import.meta.env.VITE_ALGOLIA_APP_ID || 'A2KJGZ2811',
  apiKey: import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY || '085aeee2b3ec8efa66dabb7691a01b67',
  indexName: import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'ecolojia_products_staging'
};

// Client Algolia pour le frontend
export const searchClient = algoliasearch(
  ALGOLIA_CONFIG.appId,
  ALGOLIA_CONFIG.apiKey
);

console.log('🔍 Algolia configuré:', {
  appId: ALGOLIA_CONFIG.appId,
  indexName: ALGOLIA_CONFIG.indexName,
  apiKeyLength: ALGOLIA_CONFIG.apiKey.length
});

// ✅ Interface pour les produits Algolia
export interface AlgoliaProduct {
  objectID: string;
  id: string;
  product_name: string;
  brands?: string;
  categories?: string;
  nova_group?: number;
  nutriscore_grade?: string;
  image_url?: string;
  ingredients_text?: string;
  confidence_color?: 'green' | 'orange' | 'red';
  verification_status?: 'verified' | 'ai_analyzed' | 'pending';
  category?: string;
  created_at?: string;
  updated_at?: string;
}

// ✅ Configuration des facettes pour les filtres
export const ALGOLIA_FACETS = {
  category: 'Catégorie',
  nova_group: 'Groupe NOVA',
  nutriscore_grade: 'Nutri-Score',
  verification_status: 'Statut',
  confidence_color: 'Confiance'
};

// ✅ Helper pour formater les résultats de recherche
export const formatSearchHit = (hit: any): AlgoliaProduct => {
  return {
    objectID: hit.objectID,
    id: hit.id || hit.objectID,
    product_name: hit.product_name || 'Produit sans nom',
    brands: hit.brands || '',
    categories: hit.categories || '',
    nova_group: hit.nova_group || 0,
    nutriscore_grade: hit.nutriscore_grade || '',
    image_url: hit.image_url || '',
    ingredients_text: hit.ingredients_text || '',
    confidence_color: hit.confidence_color || 'orange',
    verification_status: hit.verification_status || 'pending',
    category: hit.category || 'alimentaire',
    created_at: hit.created_at,
    updated_at: hit.updated_at
  };
};

// ✅ Configuration par défaut pour InstantSearch
export const INSTANT_SEARCH_CONFIG = {
  indexName: ALGOLIA_CONFIG.indexName,
  searchClient,
  routing: true, // URL routing pour les recherches
  stalledSearchDelay: 500 // Délai avant d'afficher "Recherche en cours..."
};

// ✅ Helper pour les couleurs NOVA
export const getNovaColor = (novaGroup: number): string => {
  switch (novaGroup) {
    case 1: return 'text-green-600 bg-green-100';
    case 2: return 'text-yellow-600 bg-yellow-100';
    case 3: return 'text-orange-600 bg-orange-100';
    case 4: return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// ✅ Helper pour les couleurs de confiance
export const getConfidenceColor = (color: string): string => {
  switch (color) {
    case 'green': return 'text-green-600 bg-green-100';
    case 'orange': return 'text-orange-600 bg-orange-100';
    case 'red': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// ✅ Helper pour vérifier la connexion Algolia
export const testAlgoliaConnection = async (): Promise<boolean> => {
  try {
    const index = searchClient.initIndex(ALGOLIA_CONFIG.indexName);
    const result = await index.search('', { hitsPerPage: 1 });
    console.log('✅ Algolia connecté:', result.nbHits, 'produits disponibles');
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion Algolia:', error);
    return false;
  }
};

// ✅ Export par défaut
export default searchClient;
// EOF

// ✅ Interface pour les produits Algolia
export interface AlgoliaProduct {
  objectID: string;
  id: string;
  product_name: string;
  brands?: string;
  categories?: string;
  nova_group?: number;
  nutriscore_grade?: string;
  image_url?: string;
  ingredients_text?: string;
  confidence_color?: 'green' | 'orange' | 'red';
  verification_status?: 'verified' | 'ai_analyzed' | 'pending';
  category?: string;
  created_at?: string;
  updated_at?: string;
}

// ✅ Configuration des facettes pour les filtres
export const ALGOLIA_FACETS = {
  category: 'Catégorie',
  nova_group: 'Groupe NOVA',
  nutriscore_grade: 'Nutri-Score',
  verification_status: 'Statut',
  confidence_color: 'Confiance'
};

// ✅ Helper pour formater les résultats de recherche
export const formatSearchHit = (hit: any): AlgoliaProduct => {
  return {
    objectID: hit.objectID,
    id: hit.id || hit.objectID,
    product_name: hit.product_name || 'Produit sans nom',
    brands: hit.brands || '',
    categories: hit.categories || '',
    nova_group: hit.nova_group || 0,
    nutriscore_grade: hit.nutriscore_grade || '',
    image_url: hit.image_url || '',
    ingredients_text: hit.ingredients_text || '',
    confidence_color: hit.confidence_color || 'orange',
    verification_status: hit.verification_status || 'pending',
    category: hit.category || 'alimentaire',
    created_at: hit.created_at,
    updated_at: hit.updated_at
  };
};

// ✅ Configuration par défaut pour InstantSearch
export const INSTANT_SEARCH_CONFIG = {
  indexName: ALGOLIA_CONFIG.indexName,
  searchClient,
  routing: true, // URL routing pour les recherches
  stalledSearchDelay: 500 // Délai avant d'afficher "Recherche en cours..."
};

// ✅ Helper pour les couleurs NOVA
export const getNovaColor = (novaGroup: number): string => {
  switch (novaGroup) {
    case 1: return 'text-green-600 bg-green-100';
    case 2: return 'text-yellow-600 bg-yellow-100';
    case 3: return 'text-orange-600 bg-orange-100';
    case 4: return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// ✅ Helper pour les couleurs de confiance
export const getConfidenceColor = (color: string): string => {
  switch (color) {
    case 'green': return 'text-green-600 bg-green-100';
    case 'orange': return 'text-orange-600 bg-orange-100';
    case 'red': return 'text-red-600 bg-red-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

// ✅ Export par défaut
export default searchClient;
// EOF