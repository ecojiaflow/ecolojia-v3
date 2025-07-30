import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Shield, MapPin, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProductHitProps {
  hit: any;
  onClick?: () => void;
  viewMode?: 'grid' | 'list'; // Ajout pour compatibilité HomePage
}

const ProductHit: React.FC<ProductHitProps> = ({ hit, onClick, viewMode = 'grid' }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Image par défaut fiable
  const defaultImage = 'https://via.assets.so/img.jpg?w=300&h=200&tc=gray&bg=%23f3f4f6&t=Image%20non%20disponible';
  
  // 🎯 FONCTION CRITIQUE: Gestion de la navigation
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si une fonction onClick est fournie, l'utiliser en priorité
    if (onClick) {
      onClick();
      return;
    }
    
    // Sinon, navigation directe
    const slug = hit.slug || hit.objectID || hit.id;
    
    console.log('🔗 ProductHit - Navigation vers produit:', {
      objectID: hit.objectID || hit.id,
      slug: slug,
      title: hit.title
    });
    
    // Validation du slug
    if (!slug || slug === 'undefined' || slug.trim() === '') {
      console.error('❌ ProductHit - Slug invalide:', slug);
      return;
    }
    
    console.log('✅ ProductHit - Navigation vers:', `/product/${slug}`);
    navigate(`/product/${slug}`);
  };

  // Support clavier pour l'accessibilité
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick(e as any);
    }
  };
  
  // Fonction pour gérer les erreurs d'image
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== defaultImage) {
      target.src = defaultImage;
    }
  };

  // Fonction pour obtenir la couleur du score
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 bg-green-50';
    if (score >= 3) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Fonction pour obtenir la couleur de confiance
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const ecoScore = parseFloat(hit.eco_score) || 0;
  const aiConfidence = parseFloat(hit.ai_confidence) || 0;
  const confidencePct = hit.confidence_pct || Math.round(aiConfidence * 100);

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group"
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`Voir les détails de ${hit.title || 'ce produit'}`}
    >
      {/* Image du produit */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={hit.images?.[0] || hit.image_url || defaultImage}
          alt={hit.title || 'Produit écoresponsable'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={handleImageError}
          loading="lazy"
        />
        
        {/* Badge vérifié */}
        {hit.verified_status === 'verified' && (
          <div className="absolute top-3 right-3 bg-green-500 text-white p-1.5 rounded-full">
            <Shield className="w-4 h-4" />
          </div>
        )}
        
        {/* Score écologique */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold ${getScoreColor(ecoScore)}`}>
          <Star className="w-3 h-3 inline mr-1" />
          {ecoScore.toFixed(1)}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        {/* Titre */}
        <h3 
          className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-eco-leaf transition-colors"
          dangerouslySetInnerHTML={{ 
            __html: hit._highlightResult?.title?.value || hit.title || 'Produit sans nom' 
          }}
        />

        {/* Description */}
        {hit.description && (
          <p 
            className="text-gray-600 text-sm mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{ 
              __html: hit._highlightResult?.description?.value || hit.description 
            }}
          />
        )}

        {/* Tags */}
        {hit.tags && hit.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {hit.tags.slice(0, 3).map((tag: string, index: number) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-eco-leaf/10 text-eco-leaf text-xs rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {hit.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{hit.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Zones disponibles */}
        {hit.zones_dispo && hit.zones_dispo.length > 0 && (
          <div className="flex items-center gap-1 mb-3 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>{hit.zones_dispo.join(', ')}</span>
          </div>
        )}

        {/* Footer avec confiance IA */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {t('common.confidence')}: 
            <span className={`font-semibold ml-1 ${getConfidenceColor(aiConfidence)}`}>
              {confidencePct}%
            </span>
          </span>
          
          <button 
            className="text-eco-leaf hover:text-eco-leaf-dark text-sm font-medium transition-colors group-hover:underline"
            onClick={handleClick}
          >
            {t('common.viewProduct')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductHit;