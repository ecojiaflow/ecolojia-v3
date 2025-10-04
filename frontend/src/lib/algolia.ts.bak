import algoliasearch from 'algoliasearch';

// Configuration Algolia pour Ecolojia
const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID || 'A2KJGZ2811';
const ALGOLIA_SEARCH_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_KEY || '085aeee2b3ec8efa66dabb7691a01b67';
export const ALGOLIA_INDEX_NAME = import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'products';

// Client Algolia
const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);

// Configuration de recherche optimisee
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
    .replace(//g, 'e')
    .replace(//g, '')
    .replace(/e/g, 'e')
    .replace(/e/g, 'e')
    .replace(/c/g, 'c')
    .replace(/o/g, 'o')
    .replace(//g, '')
    .replace(/i/g, 'i')
    .replace(/a/g, 'a')
    .replace(/aaa/g, 'aa')
    .replace(/aaaa/g, 'a')
    .replace(//g, '')
    .replace(/e/g, 'e')
    .replace(/aa/g, '')
    .replace(/aa/g, '')
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


