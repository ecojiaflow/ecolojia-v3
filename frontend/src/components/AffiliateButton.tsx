// frontend/src/components/AffiliateButton.tsx
import React, { useState } from 'react';
import { ShoppingCart, ExternalLink, Leaf, Check } from 'lucide-react';

interface AffiliateButtonProps {
  productId: string;
  productName: string;
  partners?: AffiliatePartner[];
  className?: string;
  source?: 'product_page' | 'alternatives' | 'chat_recommendation' | 'search_results';
}

interface AffiliatePartner {
  id: 'lafourche' | 'kazidomi' | 'greenweez';
  name: string;
  logo?: string;
  tagline?: string;
  discount?: string;
  available: boolean;
}

const DEFAULT_PARTNERS: AffiliatePartner[] = [
  {
    id: 'lafourche',
    name: 'La Fourche',
    tagline: 'Bio en ligne à prix juste',
    discount: '-10% première commande',
    available: true
  },
  {
    id: 'kazidomi',
    name: 'Kazidomi',
    tagline: 'Produits bio et sains',
    discount: '-20% avec abonnement',
    available: true
  },
  {
    id: 'greenweez',
    name: 'Greenweez',
    tagline: 'Le leader du bio en ligne',
    discount: 'Livraison offerte dès 49€',
    available: true
  }
];

const AffiliateButton: React.FC<AffiliateButtonProps> = ({
  productId,
  productName,
  partners = DEFAULT_PARTNERS,
  className = '',
  source = 'product_page'
}) => {
  const [showPartners, setShowPartners] = useState(false);
  const [clickedPartner, setClickedPartner] = useState<string | null>(null);

  const handlePartnerClick = async (partnerId: string) => {
    try {
      // Track le clic
      setClickedPartner(partnerId);
      
      // Construire l'URL de tracking
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const trackingUrl = new URL(`${baseUrl}/api/partner/track/${productId}`);
      trackingUrl.searchParams.set('partner', partnerId);
      trackingUrl.searchParams.set('source', source);
      trackingUrl.searchParams.set('utm_source', 'ecolojia');
      trackingUrl.searchParams.set('utm_medium', 'affiliate');
      trackingUrl.searchParams.set('utm_campaign', 'product_recommendation');

      // Ouvrir dans un nouvel onglet
      window.open(trackingUrl.toString(), '_blank', 'noopener,noreferrer');

      // Analytics (si disponible)
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', 'affiliate_click', {
          product_id: productId,
          product_name: productName,
          partner: partnerId,
          source: source
        });
      }

      // Fermer le menu après 2 secondes
      setTimeout(() => {
        setShowPartners(false);
        setClickedPartner(null);
      }, 2000);

    } catch (error) {
      console.error('Erreur tracking affiliation:', error);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bouton principal */}
      <button
        onClick={() => setShowPartners(!showPartners)}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        <ShoppingCart className="w-5 h-5" />
        <span>Acheter ce produit</span>
        <Leaf className="w-4 h-4" />
      </button>

      {/* Dropdown partenaires */}
      {showPartners && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden animate-fadeIn">
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-600" />
              Partenaires éco-responsables
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Soutenez ECOLOJIA en achetant chez nos partenaires
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {partners.filter(p => p.available).map((partner) => (
              <button
                key={partner.id}
                onClick={() => handlePartnerClick(partner.id)}
                disabled={clickedPartner === partner.id}
                className={`w-full p-4 hover:bg-gray-50 transition-colors text-left group ${
                  clickedPartner === partner.id ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 group-hover:text-green-600 transition-colors">
                      {partner.name}
                    </h4>
                    {partner.tagline && (
                      <p className="text-sm text-gray-600 mt-1">{partner.tagline}</p>
                    )}
                    {partner.discount && (
                      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        {partner.discount}
                      </span>
                    )}
                  </div>
                  <div className="ml-4 flex items-center">
                    {clickedPartner === partner.id ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              Commission reversée pour soutenir ECOLOJIA
            </p>
          </div>
        </div>
      )}

      {/* Overlay pour fermer */}
      {showPartners && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPartners(false)}
        />
      )}
    </div>
  );
};

export default AffiliateButton;

// Styles à ajouter dans index.css ou Tailwind config
/*
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}
*/