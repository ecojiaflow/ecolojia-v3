import React from 'react';
import { X, ExternalLink, CheckCircle, Tag, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import EthicalScoreBadge from './EthicalScoreBadge';
import { useTranslation } from 'react-i18next';

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onClose }) => {
  const { t } = useTranslation();

  // Safely get translated values with fallbacks
  const productName = product.nameKey ? t(product.nameKey) : t('common.unavailable');
  const productBrand = product.brandKey ? t(product.brandKey) : t('common.unavailable');
  const productDescription = product.descriptionKey ? t(product.descriptionKey) : t('common.noDescription');

  // Safely handle certifications translation with fallbacks
  const translatedCertifications = Array.isArray(product.certificationsKeys) 
    ? product.certificationsKeys.map(cert => t(cert) || t('common.unknownCertification'))
    : [];

  // Safely handle tags translation with fallbacks
  const translatedTags = Array.isArray(product.tagsKeys) 
    ? product.tagsKeys.map(tagKey => t(tagKey) || t('common.unknownTag'))
    : [];

  return (
    <div 
      className="fixed inset-0 bg-eco-text/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-title"
    >
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-eco-text/10">
        <div className="sticky top-0 bg-white/95 backdrop-blur z-10 flex justify-between items-center p-6 border-b border-eco-text/10">
          <button 
            onClick={onClose}
            className="text-eco-text/70 hover:text-eco-text flex items-center transition-colors"
            aria-label={t('common.back')}
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>{t('common.back')}</span>
          </button>
          <button 
            onClick={onClose}
            className="text-eco-text/70 hover:text-eco-text transition-colors"
            aria-label={t('common.close')}
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="relative">
              <img 
                src={product.image} 
                alt={t('accessibility.productImage', { name: productName })}
                className="w-full h-auto rounded-2xl object-cover shadow-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.jpg';
                }}
              />
              {product.verified && (
                <div className="absolute top-4 right-4 bg-white rounded-full p-2.5 shadow-md flex items-center">
                  <CheckCircle size={18} className="text-eco-leaf mr-2" />
                  <span className="text-sm font-medium text-eco-text">{t('common.verified')}</span>
                </div>
              )}
            </div>
            
            <div>
              <h2 id="product-title" className="text-2xl font-bold text-eco-text">{productName}</h2>
              <p className="text-lg text-eco-text/70 mt-1">{productBrand}</p>
              
              <div className="mt-6">
                <EthicalScoreBadge score={product.ethicalScore} size="lg" />
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-eco-text">{t('common.description')}</h3>
                <p className="mt-2 text-eco-text/80 leading-relaxed">{productDescription}</p>
              </div>
              
              {translatedCertifications.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-eco-text">{t('common.certifications')}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {translatedCertifications.map((certification, index) => (
                      <span 
                        key={index} 
                        className="bg-eco-glow/20 text-eco-olive px-4 py-2 rounded-full text-sm font-medium"
                      >
                        {certification}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {translatedTags.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium text-eco-text">{t('common.tags')}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {translatedTags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="inline-flex items-center bg-eco-glow/10 text-eco-olive px-4 py-2 rounded-full text-sm"
                      >
                        <Tag size={14} className="mr-2" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-10 flex justify-between items-center">
                <span className="text-2xl font-bold text-eco-text">
                  {product.price.toFixed(2)} {product.currency}
                </span>
                <a 
                  href={product.affiliateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-eco-leaf hover:bg-eco-text text-white px-6 py-3 rounded-full font-medium flex items-center transition-colors shadow-lg shadow-eco-leaf/20 hover:shadow-eco-text/20"
                  title={t('affiliate.disclaimer')}
                  aria-label={t('accessibility.buyProduct', { name: productName })}
                >
                  {t('common.buy')}
                  <ExternalLink size={18} className="ml-2" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;