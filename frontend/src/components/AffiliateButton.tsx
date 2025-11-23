import React, { useState } from 'react';
import { ShoppingBag, ExternalLink, ChevronDown } from 'lucide-react';

interface AffiliateButtonProps {
  productId: string;
  productName: string;
  score?: number;
  source?: string;
  className?: string;
}

interface Partner {
  name: string;
  logo?: string;
  url: string;
  commission?: number;
}

const PARTNERS: Partner[] = [
  { name: 'La Fourche', url: 'https://lafourche.fr', commission: 5 },
  { name: 'Kazidomi', url: 'https://kazidomi.com', commission: 8 },
  { name: 'Greenweez', url: 'https://greenweez.com', commission: 3 }
];

const AffiliateButton: React.FC<AffiliateButtonProps> = ({
  productId,
  productName,
  score,
  source = 'unknown',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Règle éthique ECOLOJIA : affiliation uniquement si score ≥70
  const meetsEthicalThreshold = score !== undefined && score >= 70;

  const handlePartnerClick = (partner: Partner) => {
    const affiliateUrl = `${partner.url}/search?q=${encodeURIComponent(productName)}&ref=ecolojia&source=${source}`;
    
    // Tracking (anonyme, RGPD-compliant)
    console.log('[AFFILIATE] Click:', {
      partner: partner.name,
      productId,
      source,
      timestamp: new Date().toISOString()
    });

    // Ouvrir dans nouvel onglet
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  // CAS 1 : Score trop faible (< 70) → Message éthique
  if (!meetsEthicalThreshold && score !== undefined) {
    return (
      <div className={`bg-[#FFF8E6] border border-[#FFE8A8] rounded-[16px] p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">🌿</span>
          <div className="flex-1">
            <h4 className="font-semibold text-[#6B4D00] mb-1">
              Choix éthique ECOLOJIA
            </h4>
            <p className="text-xs text-[#8B6D00] leading-relaxed">
              Ce produit obtient <strong>{score}/100</strong>, en-dessous de notre seuil 
              éthique (≥70/100) pour l'affiliation. 
              <br />
              <a 
                href="#alternatives" 
                className="underline hover:text-[#6B4D00] transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('alternatives-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Voir les alternatives mieux notées
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // CAS 2 : Score manquant → Pas d'affiliation
  if (score === undefined) {
    return null;
  }

  // CAS 3 : Score ≥70 → Afficher bouton d'achat avec dropdown partenaires
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-[16px] font-semibold transition-all shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
      >
        <ShoppingBag className="w-5 h-5" />
        <span>Acheter ce produit</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Badge score (visible) */}
      <div className="absolute top-1 right-1 bg-white/95 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-[#22C55E] border border-[#22C55E]/20">
        {score}/100 ✓
      </div>

      {/* Dropdown partenaires */}
      {isOpen && (
        <>
          {/* Overlay pour fermer en cliquant dehors */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu dropdown */}
          <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-200 z-20 overflow-hidden">
            <div className="p-3 bg-[#F3FBF5] border-b border-[#D4F1C0]">
              <p className="text-xs text-[#1B9E4B] font-medium">
                ✨ Disponible chez nos partenaires
              </p>
            </div>
            
            {PARTNERS.map((partner) => (
              <button
                key={partner.name}
                onClick={() => handlePartnerClick(partner)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#F9FAFB] transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F3FBF5] flex items-center justify-center text-[#22C55E] font-bold text-sm">
                    {partner.name.charAt(0)}
                  </div>
                  <span className="font-medium text-gray-800 text-sm">
                    {partner.name}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </button>
            ))}

            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <p className="text-[10px] text-gray-500 text-center">
                💚 Affiliation éthique : seuls les produits ≥70/100 sont éligibles
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AffiliateButton;
