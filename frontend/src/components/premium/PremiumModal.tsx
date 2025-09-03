// PATH: frontend/src/components/premium/PremiumModal.tsx
import React, { useState } from 'react';
import { X, Check, Zap, Infinity, Brain, Download, Users, Shield } from 'lucide-react';
import { paymentService } from '../../services/api';
import { useAuthContext } from '../../Contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, reason }) => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour souscrire');
      return;
    }

    setLoading(true);
    try {
      const { checkoutUrl } = await paymentService.createCheckout(selectedPlan);
      window.location.href = checkoutUrl;
    } catch (error) {
      toast.error('Erreur lors de la cr?ation de la session de paiement');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Infinity, text: 'Scans illimit?s', free: '30/mois', premium: 'Illimit?' },
    { icon: Brain, text: 'Chat IA expert', free: '5/mois', premium: '500/mois' },
    { icon: Download, text: 'Export des donn?es', free: false, premium: true },
    { icon: Users, text: 'Profils famille', free: '1', premium: 'Illimit?' },
    { icon: Shield, text: 'Sans publicit?', free: false, premium: true },
    { icon: Zap, text: 'Analyse instantan?e', free: true, premium: true },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Passez Ã  ECOLOJIA Premium
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Reason */}
        {reason && (
          <div className="p-4 bg-amber-50 border-b border-amber-200">
            <p className="text-amber-800 text-center">{reason}</p>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Plans de tarification */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Plan mensuel */}
            <div
              onClick={() => setSelectedPlan('monthly')}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-2">Mensuel</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">2,49â‚¬</span>
                <span className="text-gray-600">/mois</span>
              </div>
              <p className="text-gray-600">Id?al pour essayer Premium</p>
              {selectedPlan === 'monthly' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Plan annuel */}
            <div
              onClick={() => setSelectedPlan('annual')}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedPlan === 'annual'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                  2 mois offerts
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Annuel</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">24,99â‚¬</span>
                <span className="text-gray-600">/an</span>
              </div>
              <p className="text-gray-600">Ã‰conomisez 17%</p>
              {selectedPlan === 'annual' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparaison des fonctionnalit?s */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Comparaison des fonctionnalit?s
            </h3>
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <feature.icon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">{feature.text}</span>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Gratuit</p>
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-600">{feature.free}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Premium</p>
                      {typeof feature.premium === 'boolean' ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-sm font-medium text-green-600">{feature.premium}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Avantages suppl?mentaires */}
          <div className="bg-blue-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-blue-800 mb-3">
              Pourquoi choisir Premium ?
            </h3>
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5" />
                <span>Analysez tous vos produits sans limite</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5" />
                <span>Conseils personnalis?s illimit?s de notre IA nutritionnelle</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5" />
                <span>Suivez la sant? de toute votre famille</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 mt-0.5" />
                <span>Annulation Ã  tout moment, sans engagement</span>
              </li>
            </ul>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Continuer en gratuit
            </button>
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Chargement...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>
                    S'abonner - {selectedPlan === 'monthly' ? '2,49â‚¬/mois' : '24,99â‚¬/an'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Informations de paiement */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Paiement s?curis? via LemonSqueezy</p>
            <p>Annulation possible Ã  tout moment depuis votre compte</p>
          </div>
        </div>
      </div>
    </div>
  );
};
