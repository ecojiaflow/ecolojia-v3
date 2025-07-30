// PATH: frontend/src/components/PremiumUpgradeModal.tsx
import React, { useState } from 'react';
import { X, Zap, Check, Shield, Infinity, Brain, FileText, HeadphonesIcon } from 'lucide-react';
import { paymentService } from '../services/paymentService';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'quota' | 'feature' | 'general';
  onSuccess?: () => void;
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  trigger = 'general',
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const benefits = [
    {
      icon: Infinity,
      title: 'Analyses illimitées',
      description: 'Scannez autant de produits que vous voulez'
    },
    {
      icon: Brain,
      title: 'IA avancée',
      description: 'Questions personnalisées avec DeepSeek'
    },
    {
      icon: FileText,
      title: 'Export PDF',
      description: 'Téléchargez vos analyses complètes'
    },
    {
      icon: Shield,
      title: 'Données protégées',
      description: 'Historique illimité et sécurisé'
    },
    {
      icon: HeadphonesIcon,
      title: 'Support prioritaire',
      description: 'Assistance dédiée 7j/7'
    },
    {
      icon: Zap,
      title: 'Nouvelles fonctionnalités',
      description: 'Accès en avant-première'
    }
  ];

  const getTriggerMessage = () => {
    switch (trigger) {
      case 'quota':
        return 'Vous avez atteint votre limite d\'analyses gratuites ce mois-ci.';
      case 'feature':
        return 'Cette fonctionnalité est réservée aux membres Premium.';
      default:
        return 'Débloquez tout le potentiel d\'ECOLOJIA avec Premium.';
    }
  };

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const checkoutUrl = await paymentService.createCheckout();
      
      // Rediriger vers Lemon Squeezy
      window.location.href = checkoutUrl;
      
      // Le onSuccess sera appelé après retour de paiement
      if (onSuccess) {
        // Stocker le callback pour après le retour
        sessionStorage.setItem('premiumUpgradeCallback', 'true');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du paiement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Passez à Premium</h2>
                <p className="text-sm text-gray-600">{getTriggerMessage()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Pricing */}
        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900">
              12,99€
              <span className="text-xl font-normal text-gray-600">/mois</span>
            </div>
            <p className="mt-2 text-gray-600">
              Annulable à tout moment • Sans engagement
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">
            Tout ce qui est inclus :
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{benefit.title}</h4>
                    <p className="text-sm text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comparison */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Comparaison des plans :</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Analyses par mois</span>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">Gratuit: 30</span>
                  <span className="font-medium text-primary">Premium: ∞</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Questions IA</span>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">Gratuit: 0</span>
                  <span className="font-medium text-primary">Premium: ∞</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Export PDF</span>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500">Gratuit: ❌</span>
                  <span className="font-medium text-primary">Premium: ✅</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 space-y-3">
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Chargement...
              </span>
            ) : (
              <>
                Passer à Premium maintenant
                <Zap className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Continuer avec le plan gratuit
          </button>
        </div>

        {/* Trust badges */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Paiement sécurisé
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 mr-1" />
              Satisfait ou remboursé
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumUpgradeModal;