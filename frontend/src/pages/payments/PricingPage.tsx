import React, { useState, useEffect } from 'react';
import { Check, X, Crown, Zap, Shield, Sparkles } from 'lucide-react';
import paymentsAPI from '../../services/payments/paymentsAPI';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
}

const PricingPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const [user, setUser] = useState(null);

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Gratuit',
      price: 0,
      currency: 'EUR',
      interval: 'mois',
      description: 'Pour découvrir ECOLOJIA',
      features: [
        '10 scans par mois',
        'Analyse basique NOVA',
        'Scores Eco & Ultra-transformé',
        'Base de données OFF/OBF',
        'Recherche simple'
      ],
      buttonText: 'Utilisation actuelle',
      buttonVariant: 'secondary'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 4.99,
      currency: 'EUR',
      interval: 'mois',
      description: 'Pour les utilisateurs réguliers',
      features: [
        'Scans illimités',
        'Chat IA nutritionnel',
        'Analyses avancées personnalisées',
        'Export de données (PDF, Excel)',
        'Recherche instantanée Algolia',
        'Vision OCR pour ingredients',
        'Support prioritaire',
        'Accès anticipé nouvelles features'
      ],
      popular: true,
      buttonText: 'Choisir Premium',
      buttonVariant: 'primary'
    }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Récupérer les données utilisateur (assumé depuis context/localStorage)
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);

      if (userData.id) {
        const subscription = await paymentsAPI.getSubscriptionStatus(userData.id);
        setUserSubscription(subscription.data);
      }
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error);
    }
  };

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan.id === 'free') return;
    
    if (!user || !user.email) {
      alert('Veuillez vous connecter pour souscrire à un abonnement');
      return;
    }

    if (userSubscription?.isPremium) {
      alert('Vous avez déjà un abonnement Premium actif');
      return;
    }

    setLoading(true);
    try {
      const checkoutData = await paymentsAPI.createCheckoutSession(
        user.email,
        user.id,
        { 
          planSelected: plan.id,
          source: 'pricing_page'
        }
      );

      // Rediriger vers LemonSqueezy
      window.location.href = checkoutData.data.checkoutUrl;

    } catch (error) {
      console.error('Erreur création checkout:', error);
      alert('Erreur lors de la création de la session de paiement. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const PlanCard: React.FC<{ plan: PricingPlan }> = ({ plan }) => {
    const isCurrentPlan = plan.id === 'free' && !userSubscription?.isPremium;
    const isPremiumActive = plan.id === 'premium' && userSubscription?.isPremium;

    return (
      <div className={`relative rounded-xl border-2 p-6 transition-all duration-200 ${
        plan.popular 
          ? 'border-blue-500 bg-blue-50 transform scale-105' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}>
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Crown size={16} />
              Populaire
            </span>
          </div>
        )}

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          <div className="mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
            </span>
            {plan.price > 0 && (
              <span className="text-gray-600 ml-1">/{plan.interval}</span>
            )}
          </div>
          <p className="text-gray-600">{plan.description}</p>
        </div>

        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => handleSelectPlan(plan)}
          disabled={loading || isCurrentPlan || isPremiumActive}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isPremiumActive
              ? 'bg-green-100 text-green-700 cursor-default'
              : plan.buttonVariant === 'primary'
              ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
          } ${isCurrentPlan ? 'cursor-default' : 'hover:scale-105'}`}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              Redirection...
            </div>
          ) : isPremiumActive ? (
            'Abonnement actif'
          ) : (
            plan.buttonText
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre plan ECOLOJIA
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Débloquez tout le potentiel d'ECOLOJIA avec notre analyse nutritionnelle avancée et notre IA
          </p>
        </div>

        {/* Subscription Status */}
        {userSubscription && (
          <div className="bg-white rounded-lg p-4 mb-8 border-l-4 border-blue-500">
            <div className="flex items-center gap-3">
              <Shield className="text-blue-500" size={20} />
              <div>
                <p className="font-medium text-gray-900">
                  Statut: {userSubscription.isPremium ? 'Premium Actif' : 'Gratuit'}
                </p>
                {userSubscription.subscription && (
                  <p className="text-sm text-gray-600">
                    Expire le: {new Date(userSubscription.subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16 bg-white rounded-xl p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Comparaison détaillée
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Fonctionnalité</th>
                  <th className="text-center py-3 px-4">Gratuit</th>
                  <th className="text-center py-3 px-4">Premium</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { feature: 'Scans mensuels', free: '10', premium: 'Illimités' },
                  { feature: 'Base de données', free: 'OFF/OBF', premium: 'OFF/OBF + Enrichie' },
                  { feature: 'Chat IA nutritionnel', free: false, premium: true },
                  { feature: 'Vision OCR ingredients', free: false, premium: true },
                  { feature: 'Export données', free: false, premium: true },
                  { feature: 'Recherche instantanée', free: false, premium: true },
                  { feature: 'Support prioritaire', free: false, premium: true }
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">{row.feature}</td>
                    <td className="text-center py-3 px-4">
                      {typeof row.free === 'boolean' ? (
                        row.free ? <Check className="text-green-500 mx-auto" size={16} /> : <X className="text-red-500 mx-auto" size={16} />
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className="text-center py-3 px-4">
                      {typeof row.premium === 'boolean' ? (
                        row.premium ? <Check className="text-green-500 mx-auto" size={16} /> : <X className="text-red-500 mx-auto" size={16} />
                      ) : (
                        row.premium
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Questions fréquentes
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Puis-je annuler à tout moment ?</h3>
              <p className="text-gray-600 text-sm">Oui, vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord.</p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Le paiement est-il sécurisé ?</h3>
              <p className="text-gray-600 text-sm">Tous les paiements sont traités de manière sécurisée par LemonSqueezy avec chiffrement SSL.</p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Que se passe-t-il si j'annule ?</h3>
              <p className="text-gray-600 text-sm">Vous gardez l'accès Premium jusqu'à la fin de votre période payée, puis revenez au plan gratuit.</p>
            </div>
            <div className="bg-white rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Support client inclus ?</h3>
              <p className="text-gray-600 text-sm">Support par email pour tous, support prioritaire pour les abonnés Premium.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;