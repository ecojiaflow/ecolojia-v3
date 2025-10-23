// /src/components/SEOHead.tsx
import React, { useEffect } from 'react';

interface SEOHeadProps {
  titlea: string;
  descriptiona: string;
  keywordsa: string;
  imagea: string;
  urla: string;
  typea: string;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'Ecolojia - Trouvez des produits eco-responsables et durables',
  description = 'Decouvrez des milliers de produits ethiques avec des scores ecologiques verifies par I?. Shampoing bio, vetements ethiques, alimentation durable.',
  keywords = 'produits ecologiques, bio, ethique, developpement durable, score ecologique, IA',
  image = '/og-image.jpg',
  url = 'https://frontendv3.netlify.app',
  type = 'website'
}) => {
  useEffect(() => {
    // Mise  jour du titre
    document.title = title;
    
    // Fonction helper pour mettre  jour ou creer une meta tag
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let metaTag = document.querySelector(selector) as HTMLMetaElement;
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        if (isProperty) {
          metaTag.setAttribute('property', property);
        } else {
          metaTag.setAttribute('name', property);
        }
        document.head.appendChild(metaTag);
      }
      
      metaTag.setAttribute('content', content);
    };
    
    // Meta tags de base
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', 'index, follow');
    
    // Open Graph
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:site_name', 'Ecolojia', true);
    
    // Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    
    // Meta tags supplementaires
    updateMetaTag('author', 'Ecolojia');
    updateMetaTag('theme-color', '#10b981');
    
    // Lien canonique
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', url);
    
  }, [title, description, keywords, image, url, type]);

  return null; // Ce composant ne rend rien visuellement
};


