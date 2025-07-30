export interface Product {
  id: string;
  title: string;
  slug: string;
  image_url?: string;
  images?: string[];
  eco_score?: string | number;
  ai_confidence?: string | number;
  tags?: string[];
  zones_dispo?: string[];
  verified_status?: string;
  ethicalScore?: number;
  tagsKeys?: string[];
}

export interface AlgoliaHit {
  objectID: string;
  title: string;
  slug: string;
  image_url: string | null | undefined;
  eco_score: string | number;
  ai_confidence: string | number;
  tags: string[];
  zones_dispo: string[];
  verified_status: string;
  [key: string]: any;
}

export function normalizeAlgoliaProduct(hit: AlgoliaHit): Product {
  console.log('🔍 Debug Algolia hit:', {
    objectID: hit.objectID,
    title: hit.title,
    image_url: hit.image_url,
    image_url_type: typeof hit.image_url,
    image_url_length: hit.image_url?.length || 0
  });

  const normalizedImageUrl = (() => {
    if (!hit.image_url) return undefined;
    
    const trimmed = String(hit.image_url).trim();
    
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
      return undefined;
    }
    
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      console.warn(`⚠️ URL invalide pour ${hit.title}:`, trimmed);
      return undefined;
    }
  })();

  return {
    id: hit.objectID || hit.id,
    title: hit.title || '',
    slug: hit.slug || '',
    image_url: normalizedImageUrl,
    images: normalizedImageUrl ? [normalizedImageUrl] : undefined,
    eco_score: hit.eco_score,
    ai_confidence: hit.ai_confidence,
    tags: Array.isArray(hit.tags) ? hit.tags : [],
    zones_dispo: Array.isArray(hit.zones_dispo) ? hit.zones_dispo : [],
    verified_status: hit.verified_status || '',
    ethicalScore: typeof hit.eco_score === 'number' 
      ? hit.eco_score 
      : parseFloat(String(hit.eco_score || 0)),
    tagsKeys: Array.isArray(hit.tags) ? hit.tags : []
  };
}