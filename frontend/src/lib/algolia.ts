import algoliasearch from 'algoliasearch';

// Configuration Algolia pour Ecolojia
const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID || 'A2KJGZ2811';
const ALGOLIA_SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY || '085aeee2b3ec8efa66dabb7691a01b67';
export const ALGOLIA_INDEX_NAME = import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'products';

// Client Algolia
const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

// Configuration de recherche optimisée
export const searchConfig = {
  hitsPerPage: 12,
  attributesToRetrieve: [
    'objectID',
    'title',
    'description', 
    'slug',
    'eco_score',
    'ai_confidence',
    'confidence_color',
    'confidence_pct',
    'tags',
    'zones_dispo',
    'images',
    'resume_fr',
    'verified_status'
  ],
  attributesToHighlight: [
    'title',
    'description',
    'tags'
  ],
  highlightPreTag: '<mark class="bg-eco-leaf/20 text-eco-text">',
  highlightPostTag: '</mark>',
  typoTolerance: 'min',
  minWordSizefor1Typo: 4,
  minWordSizefor2Typos: 8
};

// Fonction de nettoyage des textes
export const cleanText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/�/g, 'é')
    .replace(/Ã /g, 'à')
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã»/g, 'û')
    .replace(/Ã®/g, 'î')
    .replace(/Ã¢/g, 'â')
    .replace(/Ã‰/g, 'É')
    .replace(/Ã€/g, 'À')
    .replace(/Ã¹/g, 'ù')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã«/g, 'ë')
    .replace(/Ã¯/g, 'ï')
    .trim();
};

// Fonction pour filtrer les tags
export const cleanTags = (tags: string[]): string[] => {
  if (!tags || !Array.isArray(tags)) return [];
  
  return tags.filter(tag => {
    const lowerTag = tag.toLowerCase();
    return !lowerTag.includes('recherche') && 
           !lowerTag.includes('search') && 
           tag.length > 1 &&
           tag.length < 25;
  });
};

export default searchClient;