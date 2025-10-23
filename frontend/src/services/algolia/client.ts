// PATH: frontend/src/services/algolia/client.ts
import algoliasearch from 'algoliasearch';

// Configuration Algolia avec les BONNES cles
export const ALGOLIA_CONFIG = {
  appId: import.meta.env.VITE_ALGOLIA_APP_ID || 'A2KJGZ2811',
  apiKey: import.meta.env.VITE_ALGOLIA_SEARCH_KEY || '085aeee2b3ec8efa66dabb7691a01b67',
  indexName: import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'products'
};

// Client Algolia pour le frontend
export const searchClient = algoliasearch(
  ALGOLIA_CONFIG.appId,
  ALGOLIA_CONFIG.apiKey
);

console.log('Â°Ã…Â¸Ã¢â‚¬ÂÃ‚Â Algolia configure:', {
  appId: ALGOLIA_CONFIG.appId,
  indexName: ALGOLIA_CONFIG.indexName
});

export default searchClient;


