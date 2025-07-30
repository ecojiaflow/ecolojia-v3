import React from 'react';
import { ExternalLink, Star, Shield } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  website?: string;
  commission_rate: number;
  ethical_score: number;
}

interface PartnerLink {
  id: string;
  url: string;
  tracking_id?: string;
  commission_rate: number;
  clicks: number;
  partner: Partner;
}

interface PartnerLinksProps {
  partnerLinks: PartnerLink[];
  productTitle: string;
}

const PartnerLinks: React.FC<PartnerLinksProps> = ({ partnerLinks, productTitle }) => {
  if (!partnerLinks || partnerLinks.length === 0) {
    return null;
  }

 const apiUrl =
  import.meta.env.VITE_API_URL?.toString() || 'http://localhost:57840';


  const handlePartnerClick = (link: PartnerLink) => {
    const trackingUrl = `${apiUrl}/api/track/${link.id}`;
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');
  };

  const getEthicalBadgeColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getEthicalBadgeText = (score: number) => {
    if (score >= 0.8) return 'Très éthique';
    if (score >= 0.6) return 'Correct';
    return 'À améliorer';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-eco-leaf" />
        <h3 className="text-lg font-semibold text-gray-900">
          Où acheter ce produit
        </h3>
      </div>

      <div className="space-y-3">
        {partnerLinks.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-medium text-gray-900">
                  {link.partner.name}
                </h4>

                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEthicalBadgeColor(link.partner.ethical_score)}`}>
                  <Star className="w-3 h-3 mr-1" />
                  {getEthicalBadgeText(link.partner.ethical_score)}
                </span>
              </div>

              {link.partner.website && (
                <p className="text-sm text-gray-500">
                  {link.partner.website
                    .replace(/^https?:\/\//, '')
                    .replace(/^www\./, '')}
                </p>
              )}
            </div>

            <button
              onClick={() => handlePartnerClick(link)}
              className="flex items-center gap-2 px-4 py-2 bg-eco-leaf text-white rounded-lg hover:bg-eco-leaf/90 transition-colors"
            >
              Voir l'offre
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          ℹ️ Ecolojia peut percevoir une commission sur les achats effectués via ces liens, 
          ce qui nous aide à maintenir le service gratuitement.
        </p>
      </div>
    </div>
  );
};

export default PartnerLinks;
