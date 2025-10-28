// frontend/src/components/upgrade/SmartUpgradeModal.tsx

import React, { useState, useEffect } from 'react';
import { useQuota } from '../../hooks/useQuota';
import { useAuthContext } from '../../Contexts/AuthContext';

interface SmartUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: 'quota_hit' | 'feature_blocked' | 'voluntary';
  featurea: string;
  classNamea: string;
}

export const SmartUpgradeModal: React.FC<SmartUpgradeModalProps> = ({
  isOpen,
  onClose,
  trigger,
  feature,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState<'benefits' | 'pricing' | 'payment'>('benefits');
  const [isLoading, setIsLoading] = useState(false);
  
  const { quotaStatus } = useQuota();
  const { user } = useAuthContext();

  if (!isOpen) return null;

  // aaaa PERSONNALISATION SELON CONTEXTE
  const getModalContent = () => {
    switch (trigger) {
      case 'quota_hit':
        return {
          title: ' Limite atteinte !',
          subtitle: 'Debloquez toutes les fonctionnalites avec Premium',
          urgency: 'high',
          primaryBenefit: 'Analyses illimitees',
          savings: `Vous avez dej utilise ${quotaStatus?.scans.used || 0} analyses ce mois`
        };
        
      case 'feature_blocked':
        return {
          title: 'a Fonctionnalite Premium',
          subtitle: `${feature} est reserve aux utilisateurs Premium`,
          urgency: 'medium',
          primaryBenefit: feature || 'Acces complet',
          savings: 'Debloquez instantanement'
        };
        
      case 'voluntary':
        return {
          title: 'a Passez Premium',
          subtitle: 'Debloquez tout le potentiel d\'ECOLOJIA',
          urgency: 'low',
          primaryBenefit: 'Experience complete',
          savings: 'aaconomisez des centaines d\'aaa en evitant les mauvais achats'
        };
        
      default:
        return {
          title: 'a Decouvrez Premium',
          subtitle: 'Pour une experience sans limite',
          urgency: 'low',
          primaryBenefit: 'Toutes fonctionnalites',
          savings: ''
        };
    }
  };

  const content = getModalContent();

  // aaaa BaaNaaFICES PERSONNALISaaS
  const getPremiumBenefits = () => {
    const baseBenefits = [
      {
        icon: 'aa',
        title: 'Analyses illimitees',
        description: 'Scannez autant que vous voulez, toutes categories',
        highlight: trigger === 'quota_hit'
      },
      {
        icon: 'aaa',
        title: 'Chat IA DeepSeek avance',
        description: 'Questions illimitees + analyses personnalisees',
        highlight: feature === 'Chat IA' || trigger === 'feature_blocked'
      },
      {
        icon: 'aa',
        title: 'Dashboard analytics complet',
        description: 'Historique illimite + insights comportementaux',
        highlight: feature === 'Analytics'
      },
      {
        icon: 'aaaa',
        title: 'Exports & API',
        description: '50 exports/mois + acces API developpeur',
        highlight: feature === 'Export'
      },
      {
        icon: '',
        title: 'Coaching IA personnalise',
        description: 'Recommandations adaptees  votre profil',
        highlight: feature === 'Coaching'
      },
      {
        icon: 'a',
        title: 'Support prioritaire',
        description: 'Reponse garantie sous 24h',
        highlight: false
      }
    ];

    return baseBenefits;
  };

  // aaaa calculéVALEUR aaCONOMIQUE
  const getEconomicValue = () => {
    const monthlyScans = quotaStatus?.scans.used || 15;
    const annualScans = monthlyScans * 12;
    const avgProductPrice = 8; // Prix moyen produit analyse
    const badChoiceRate = 0.15; // 15% mauvais choix evites
    const annualSavings = Math.round(annualScans * avgProductPrice * badChoiceRate);
    
    return {
      annualSavings,
      monthlyPrice: 4.99,
      annualPrice: 4.99 * 12,
      roi: Math.round((annualSavings / (4.99 * 12)) * 100)
    };
  };

  const economicValue = getEconomicValue();

  // aaaa HANDLE UPGRADE
  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Rediriger vers page subscription avec contexte
      const params = new URLSearchParams({
        source: trigger,
        feature: feature || '',
        plan: 'premium'
      });
      
      window.location.href = `/subscriptiona${params.toString()}`;
      
    } catch (error) {
      console.error('aa Erreur upgrade:', error);
      alert('Erreur lors de la redirection. Veuillez reessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`upgrade-modal bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${className}`}>
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {content.title}
              </h2>
              <p className="text-gray-600">
                {content.subtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-600 hover:text-gray-600 text-2xl leading-none"
            >
              aaa
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Urgence contextuelle */}
          {content.urgency === 'high' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium mb-2">
                aa <strong>Action requise :</strong> Quota epuise
              </p>
              <p className="text-red-700 text-sm">
                Passez Premium maintenant pour continuer vos analyses sans interruption.
              </p>
            </div>
          )}

          {/* Pricing Hero */}
          <div className="mb-8 text-center">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6 mb-4">
              <div className="text-4xl font-bold mb-2">4.99aaa</div>
              <div className="text-purple-100 mb-4">/mois aa Annulable  tout moment</div>
              <div className="text-lg font-semibold">
                = 0.16aaa par jour
              </div>
              <div className="text-purple-200 text-sm">
                Moins qu'un cafe aaa
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {economicValue.annualSavings}aaa
                </div>
                <div className="text-xs text-green-700">aaconomies/an estimees</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {economicValue.roi}%
                </div>
                <div className="text-xs text-blue-700">ROI annuel</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  aa
                </div>
                <div className="text-xs text-purple-700">Analyses illimitees</div>
              </div>
            </div>
          </div>

          {/* Benefices detailles */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              aa Tout ce qui est inclus :
            </h3>
            
            <div className="space-y-3">
              {getPremiumBenefits().map((benefit, index) => (
                <div 
                  key={index}
                  className={`flex items-start p-3 rounded-lg transition-all ${
                    benefit.highlight ? 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200' 
                      : 'bg-gray-50'
                  }`}
                >
                  <span className="text-2xl mr-3 mt-1">{benefit.icon}</span>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${benefit.highlight ? 'text-green-700' : 'text-gray-800'}`}>
                      {benefit.title}
                      {benefit.highlight && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                           Votre besoin
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {benefit.description}
                    </p>
                  </div>
                  <span className="text-green-500 text-xl">aaaa</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Proof */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-3">
              aa Rejoignez 2,847 utilisateurs Premium satisfaits
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded">
                <p className="text-gray-700 italic mb-2">
                  "aaconomise 200aaa en evitant produits toxiques pour ma famille"
                </p>
                <p className="text-neutral-700">aaaa Marie D., maman de 2 enfants</p>
              </div>
              <div className="bg-white p-3 rounded">
                <p className="text-gray-700 italic mb-2">
                  "IA revolutionnaire, analyses bien plus poussees que Yuka"
                </p>
                <p className="text-neutral-700">aaaa Thomas L., nutritionniste</p>
              </div>
            </div>
          </div>

          {/* Garantie */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <h4 className="font-semibold text-green-800 mb-2">
              aa Garantie Satisfait ou Rembourse 30 jours
            </h4>
            <p className="text-green-700 text-sm">
              Testez Premium sans risque. Annulation en 1 clic depuis votre compte.
            </p>
          </div>

          {/* CTA Principal */}
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className={`w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              content.urgency === 'high' ? 'animate-pulse' : ''
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Activation...
              </span>
            ) : (
              'a Passer Premium maintenant - 4.99aaa/mois'
            )}
          </button>

          {/* Infos legales */}
          <div className="mt-4 text-center">
            <p className="text-xs text-neutral-700">
              Paiement securise aa Annulation  tout moment aa Sans engagement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};




