import React from 'react';
import { ExternalLink, CheckCircle, Tag, Shield, MapPin } from 'lucide-react';
import { Product } from '../types';
import { useTranslation } from 'react-i18next';
import ConfidenceBadge from "../components/ConfidenceBadge";

interface ProductCardProps {
  product: Product;
  onClick: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { t } = useTranslation();

  const scoreColor = () => {
    const score = product.ethicalScore || 0;
    if (score >= 0.8) return 'bg-eco-leaf';
    if (score >= 0.6) return 'bg-eco-glow';
    if (score >= 0.4) return 'bg-yellow-400';
    if (score >= 0.2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const productName = product.nameKey ? t(product.nameKey) : product.nameKey || t('common.unavailable');
  const productBrand = product.brandKey ? t(product.brandKey) : product.brandKey || t('common.unavailable');
  const productDescription = product.descriptionKey ? t(product.descriptionKey) : product.descriptionKey || t('common.noDescription');
  const translatedTags = Array.isArray(product.tagsKeys) 
    ? product.tagsKeys.map(tagKey => t(tagKey) || tagKey || t('common.unknownTag'))
    : [];

  const imageUrl = product.image_url?.trim() || product.images?.[0] || '/placeholder-image.jpg';

  const linkId = product.partnerLinks?.[0]?.id;
  const trackingUrl = linkId 
    ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/track/${linkId}` 
    : null;

  return (
    <div 
      className="bg-white/90 backdrop-blur rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full border border-eco-text/5"
      onClick={() => onClick(product.id)}
      onKeyPress={(e) => e.key === 'Enter' && onClick(product.id)}
      tabIndex={0}
      role="button"
      aria-label={t('accessibility.openProductDetails', { name: productName })}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={imageUrl}
          alt={t('accessibility.productImage', { name: productName })}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-image.jpg';
          }}
          loading="lazy"
        />

        {product.verified && (
          <div className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-md" aria-label={t('common.verified')}>
            <CheckCircle size={20} className="text-eco-leaf" />
          </div>
        )}

        {product.confidence_pct !== undefined && product.confidence_color && (
          <div className="absolute top-3 left-3">
            <ConfidenceBadge pct={product.confidence_pct} color={product.confidence_color} />
          </div>
        )}

        <div className={`absolute bottom-3 left-3 ${scoreColor()} text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-sm`}>
          {(product.ethicalScore || 0).toFixed(1)}
        </div>

        {!product.verified && !product.aiConfidence && (
          <div className="absolute bottom-3 right-3 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium border border-blue-200">
            Analyse IA en cours...
          </div>
        )}
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-eco-text line-clamp-1">{productName}</h3>
            <p className="text-sm text-eco-text/70">{productBrand}</p>
          </div>
          <span className="text-lg font-medium text-eco-text">
            {product.price?.toFixed(2) || '0.00'} {product.currency || 'EUR'}
          </span>
        </div>

        <p className="mt-3 text-eco-text/80 text-sm line-clamp-2">{productDescription}</p>

        {product.zonesDisponibles && product.zonesDisponibles.length > 0 && (
          <div className="mt-2 flex items-center text-xs text-eco-text/60">
            <MapPin size={12} className="mr-1" />
            Disponible en: {product.zonesDisponibles.join(', ')}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {translatedTags.slice(0, 3).map((tag, index) => (
            <span key={index} className="inline-flex items-center bg-eco-glow/10 text-eco-olive text-xs px-3 py-1.5 rounded-full">
              <Tag size={12} className="mr-1.5" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6 pt-0 mt-auto">
        {trackingUrl ? (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-eco-leaf hover:text-eco-text font-medium flex items-center transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label={t('common.seeProduct')}
            title={t('affiliate.disclaimer')}
          >
            {t('common.seeProduct')}
            <ExternalLink size={14} className="ml-1.5" />
          </a>
        ) : (
          <span className="text-sm text-eco-text/40 flex items-center">
            Lien non disponible
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductCard;




