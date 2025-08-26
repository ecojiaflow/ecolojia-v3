// PATH: frontend/src/pages/PremiumPage.tsx
import React from 'react';
import { Check, X, Zap, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../Contexts/AuthContext';
import { paymentService } from '../services/api';
import toast from 'react-hot-toast';

const PremiumPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const isPremium = user?.subscription?.tier === 'premium';

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await paymentService.createCheckout(plan);
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Erreur lors de la crÃ©ation de la session de paiement');
    }
  };

  const features = [
    { free: true, premium: true, text: '30 analyses par mois', premiumText: 'Analyses illimitÃ©es' },
    { free: true, premium: true, text: '5 chats IA par mois', premiumText: '500 chats IA par mois' },
    { free: true, premium: true, text: 'Historique 7 jours', premiumText: 'Historique complet' },
    { free: false, premium: true, text: 'Export PDF des rapports' },
    { free: false, premium: true, text: 'Comparateur avancÃ©' },
    { free: false, premium: true, text: 'Sans publicitÃ©' },
    { free: false, premium: true, text: 'Support prioritaire' },
    { free: false, premium: true, text: 'Profils famille' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 rounded-full text-purple-700 font-medium mb-4">
            <Zap className="w-4 h-4 mr-2" />
            Passez Ã  la vitesse supÃ©rieure
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Choisissez votre plan ECOLOJIA
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            DÃ©bloquez tout le potentiel d'ECOLOJIA pour une vie plus saine
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Gratuit</h3>
            <p className="text-gray-600 mb-6">Pour dÃ©couvrir ECOLOJIA</p>
            <div className="text-4xl font-bold text-gray-800 mb-6">0â‚¬</div>
            
            <ul className="space-y-3 mb-8">
              {features.filter(f => f.free).map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature.text}</span>
                </li>
              ))}
              {features.filter(f => !f.free).map((feature, index) => (
                <li key={index} className="flex items-start text-gray-400">
                  <X className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            {!user && (
              <button
                onClick={() => navigate('/register')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                CrÃ©er un compte
              </button>
            )}
          </div>

          {/* Premium Monthly */}
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-xl p-8 text-white transform scale-105">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold">Premium</h3>
              <Crown className="w-6 h-6" />
            </div>
            <p className="mb-6 opacity-90">Le choix populaire</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">2,49â‚¬</span>
              <span className="text-lg opacity-75">/mois</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              {features.filter(f => f.premium).map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{feature.premiumText || feature.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={isPremium}
              className="w-full py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPremium ? 'Plan actuel' : 'Commencer maintenant'}
              {!isPremium && <ArrowRight className="w-5 h-5 inline ml-2" />}
            </button>
          </div>

          {/* Premium Annual */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-500 relative">
            <div className="absolute -top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              -17% ðŸŽ‰
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Premium Annuel</h3>
            <p className="text-gray-600 mb-6">2 mois offerts</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-800">24,99â‚¬</span>
              <span className="text-lg text-gray-600">/an</span>
            </div>
            
            <ul className="space-y-3 mb-8">
              {features.filter(f => f.premium).map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature.premiumText || feature.text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe('annual')}
              disabled={isPremium}
              className="w-full py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPremium ? 'Plan actuel' : 'Ã‰conomiser 17%'}
              {!isPremium && <ArrowRight className="w-5 h-5 inline ml-2" />}
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Questions frÃ©quentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Puis-je annuler Ã  tout moment ?
              </h3>
              <p className="text-gray-600">
                Oui, vous pouvez annuler votre abonnement Ã  tout moment depuis votre profil.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Comment fonctionne la pÃ©riode d'essai ?
              </h3>
              <p className="text-gray-600">
                Profitez de 30 analyses gratuites pour tester ECOLOJIA sans engagement.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Les paiements sont-ils sÃ©curisÃ©s ?
              </h3>
              <p className="text-gray-600">
                Oui, nous utilisons LemonSqueezy, une plateforme de paiement certifiÃ©e et sÃ©curisÃ©e.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">
                Puis-je partager mon compte ?
              </h3>
              <p className="text-gray-600">
                Le plan Premium permet de crÃ©er des profils famille pour partager votre compte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
