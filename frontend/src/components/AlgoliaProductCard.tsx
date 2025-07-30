import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ExternalLink, Star, MapPin, Shield, Zap } from 'lucide-react';

interface AlgoliaProductCardProps {
  hit: any;
}

const AlgoliaProductCard: React.FC<AlgoliaProductCardProps> = ({ hit }) => {
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return { color: 'bg-green-100 text-green-800 border-green-200', text: 'IA Certifiée', icon: Shield };
    } else if (confidence >= 0.7) {
      return { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'IA Validée', icon: Zap };
    } else {
      return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'En analyse', icon: Zap };
    }
  };

  const getEcoScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getEcoScoreStars = (score: number) => {
    const stars = Math.round(score * 5);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < stars ? 'fill-current text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const confidence = hit.ai_confidence || 0;
  const confidenceBadge = getConfidenceBadge(confidence);
  const ConfidenceIcon = confidenceBadge.icon;
  const ecoScore = hit.eco_score || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-gray-100">
      {/* Image du produit */}
      <div className="relative h-48 bg-gradient-to-br from-eco-leaf/10 to-eco-leaf/5 flex items-center justify-center">
        {hit.images && hit.images.length > 0 ? (
          <img
            src={hit.images[0]}
            alt={hit.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-eco-leaf/50">
            <Leaf className="h-16 w-16 mb-2" />
            <span className="text-xs">Image bientôt disponible</span>
          </div>
        )}
        
        {/* Badge de confiance IA */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium border ${confidenceBadge.color} flex items-center gap-1`}>
          <ConfidenceIcon className="h-3 w-3" />
          {confidenceBadge.text}
        </div>

        {/* Score écologique */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-full px-2 py-1 flex items-center gap-1">
          <div className="flex">
            {getEcoScoreStars(ecoScore)}
          </div>
          <span className={`text-xs font-bold ${getEcoScoreColor(ecoScore)}`}>
            {(ecoScore * 5).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        {/* Titre et description */}
        <h3 className="font-semibold text-lg text-eco-text mb-2 line-clamp-2 group-hover:text-eco-leaf transition-colors">
          {hit.title}
        </h3>
        
        <p className="text-eco-text/70 text-sm mb-4 line-clamp-3">
          {hit.description}
        </p>

        {/* Tags */}
        {hit.tags && hit.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {hit.tags.slice(0, 3).map((tag: string, index: number) => (
              <span
                key={index}
                className="px-2 py-1 bg-eco-leaf/10 text-eco-leaf text-xs rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
            {hit.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{hit.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Zones et score détaillé */}
        <div className="flex items-center justify-between mb-4 text-sm">
          {/* Zones disponibles */}
          {hit.zones_dispo && hit.zones_dispo.length > 0 && (
            <div className="flex items-center gap-1 text-eco-text/60">
              <MapPin className="h-4 w-4" />
              <span>{hit.zones_dispo.join(', ')}</span>
            </div>
          )}

          {/* Score détaillé */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-eco-text/60">Score éco:</span>
            <span className={`font-bold text-sm ${getEcoScoreColor(ecoScore)}`}>
              {(ecoScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Link 
            to={`/product/${hit.objectID || hit.id}`}
            className="flex-1 bg-eco-leaf hover:bg-eco-leaf/90 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Voir le produit
          </Link>
          
          <button className="px-3 py-2 border border-eco-leaf/20 text-eco-leaf hover:bg-eco-leaf/10 rounded-lg transition-colors">
            <Leaf className="h-4 w-4" />
          </button>
        </div>

        {/* Indicateur de confiance détaillé */}
        {confidence > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-eco-text/60">
              <span>Confiance IA</span>
              <span className="font-medium">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-eco-leaf h-1 rounded-full transition-all duration-300"
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlgoliaProductCard;