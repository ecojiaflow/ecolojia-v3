// /src/hooks/useSEO.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  price?: string;
  currency?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'preorder';
  category?: string;
  brand?: string;
}

export const useSEO = (seoData: SEOData = {}) => {
  const location = useLocation();

  useEffect(() => {
    // Construire l'URL complète
    const baseUrl = 'https://ecolojia.com';
    const fullUrl = `${baseUrl}${location.pathname}${location.search}`;

    // Données SEO par défaut selon la page
    const getDefaultSEO = (): SEOData => {
      const pathname = location.pathname;
      
      if (pathname === '/') {
        return {
          title: 'Ecolojia - Trouvez des produits éco-responsables et durables',
          description: 'Découvrez des milliers de produits éthiques avec des scores écologiques vérifiés par IA. Shampoing bio, vêtements éthiques, alimentation durable.',
          keywords: 'produits écologiques, bio, éthique, développement durable, score écologique, IA'
        };
      }
      
      if (pathname.startsWith('/product/')) {
        return {
          type: 'product' as const,
          title: 'Produit éco-responsable',
          description: 'Découvrez ce produit éco-responsable avec son score environnemental détaillé.'
        };
      }
      
      if (pathname.startsWith('/category/')) {
        const category = pathname.split('/')[2];
        return {
          title: `Produits ${category} éco-responsables - Ecolojia`,
          description: `Découvrez notre sélection de produits ${category} éthiques et durables avec scores écologiques vérifiés.`
        };
      }

      return {
        title: 'Ecolojia - Produits éco-responsables',
        description: 'Plateforme de découverte de produits éthiques et durables.'
      };
    };

    // Merger les données par défaut avec celles fournies
    const finalSEOData = {
      ...getDefaultSEO(),
      ...seoData,
      url: fullUrl
    };

    // Mettre à jour les meta tags
    updatePageSEO(finalSEOData);

  }, [location, seoData]);
};

const updatePageSEO = (data: SEOData & { url?: string }) => {
  // Title
  if (data.title) {
    document.title = data.title;
  }

  // Meta description
  if (data.description) {
    updateOrCreateMeta('description', data.description);
  }

  // Meta keywords
  if (data.keywords) {
    updateOrCreateMeta('keywords', data.keywords);
  }

  // Canonical URL
  if (data.url) {
    updateOrCreateLink('canonical', data.url);
  }
};

const updateOrCreateMeta = (name: string, content: string) => {
  let meta = document.querySelector(`meta[name="${name}"]`);
  
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  
  meta.setAttribute('content', content);
};

const updateOrCreateLink = (rel: string, href: string) => {
  let link = document.querySelector(`link[rel="${rel}"]`);
  
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  
  link.setAttribute('href', href);
};