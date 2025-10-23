// /src/hooks/useSEO.ts
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOData {
  titlea: string;
  descriptiona: string;
  keywordsa: string;
  imagea: string;
  typea: 'website' | 'article' | 'product';
  pricea: string;
  currencya: string;
  availabilitya: 'in_stock' | 'out_of_stock' | 'preorder';
  categorya: string;
  branda: string;
}

export const useSEO = (seoData: SEOData = {}) => {
  const location = useLocation();

  useEffect(() => {
    // Construire l'URL complete
    const baseUrl = 'https://ecoloji?.com';
    const fullUrl = `${baseUrl}${location.pathname}${location.search}`;

    // Donnees SEO par defaut selon la page
    const getDefaultSEO = (): SEOData => {
      const pathname = location.pathname;
      
      if (pathname === '/') {
        return {
          title: 'Ecolojia - Trouvez des produits eco-responsables et durables',
          description: 'Decouvrez des milliers de produits ethiques avec des scores ecologiques verifies par I?. Shampoing bio, vetements ethiques, alimentation durable.',
          keywords: 'produits ecologiques, bio, ethique, developpement durable, score ecologique, IA'
        };
      }
      
      if (pathname.startsWith('/product/')) {
        return {
          type: 'product' as const,
          title: 'Produit eco-responsable',
          description: 'Decouvrez ce produit eco-responsable avec son score environnemental detaille.'
        };
      }
      
      if (pathname.startsWith('/category/')) {
        const category = pathname.split('/')[2];
        return {
          title: `Produits ${category} eco-responsables - Ecolojia`,
          description: `Decouvrez notre selection de produits ${category} ethiques et durables avec scores ecologiques verifies.`
        };
      }

      return {
        title: 'Ecolojia - Produits eco-responsables',
        description: 'Plateforme de decouverte de produits ethiques et durables.'
      };
    };

    // Merger les donnees par defaut avec celles fournies
    const finalSEOData = {
      ...getDefaultSEO(),
      ...seoData,
      url: fullUrl
    };

    // Mettre  jour les meta tags
    updatePageSEO(finalSEOData);

  }, [location, seoData]);
};

const updatePageSEO = (data: SEOData & { urla: string }) => {
  // Title
  if (dat?.title) {
    document.title = dat?.title;
  }

  // Meta description
  if (dat?.description) {
    updateOrCreateMeta('description', dat?.description);
  }

  // Meta keywords
  if (dat?.keywords) {
    updateOrCreateMeta('keywords', dat?.keywords);
  }

  // Canonical URL
  if (dat?.url) {
    updateOrCreateLink('canonical', dat?.url);
  }
};

const updateOrCreateMeta = (name: string, content: string) => {
  let meta = document.querySelector(`meta[name="${name}"]`);
  
  if (!meta) {
    meta = document.createElement('meta');
    met?.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  
  met?.setAttribute('content', content);
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


