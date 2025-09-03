// PATH: frontend/src/pages/PricingPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import { paymentService } from '../services/api';
import { useAuthContext } from '../Contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface PricingFeature {
  text: string;
  free: boolean;
  premium: boolean;
}

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthContext();
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null);

  const features: PricingFeature[] = [
    { text: 'Scans de produits', free: true, premium: true },
    { text: 'Analyses IA multi-critères', free: true, premium: true },
    { text: 'Alternatives recommandées', free: true, premium: true },
    { text: 'Nombre de scans par mois', free: false, premium: true },
    { text: 'Chat IA nutritionnel', free: false, premium: true },
    { text: 'Export PDF des rapports', free: false, premium: true },
    { text: 'Historique complet', free: false, premium: true },
    { text: 'Support prioritaire', free: false, premium: true },
    { text: 'Sans publicité', free: false, premium: true },
    { text: 'Profils famille', free: false, premium: true },
  ];

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour souscrire');
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    try {
      setLoading(plan);
      const response = await paymentService.createCheckoutSession(plan);
      
      if (response.checkoutUrl) {
        // Redirection vers LemonSqueezy
        window.location.href = response.checkoutUrl;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (error: any) {
      console.error('Erreur création checkout:', error);
      toast.error('Erreur lors de la création de la session de paiement');
    } finally {
      setLoading(null);
    }
  };

  const isPremium = user?.subscription?.tier === 'premium';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Choisissez votre plan ECOLOJIA
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Débloquez tout le potentiel de l'analyse IA pour une consommation plus saine et responsable
          </p>
        </div>

        {isPremium && (
          <div className="bg-green-100 border border-green-300 rounded-xl p-4 mb-8 text-center">
            <p className="text-green-800 font-medium">
              ✅ Vous êtes déjà abonné Premium ! Profitez de toutes les fonctionnalités.
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow-lg p-8 relative">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Gratuit</h2>
              <p className="text-gray-600">Pour découvrir ECOLOJIA</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">0€</span>
                <span className="text-gray-600">/mois</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                30 scans par mois
              </li>
              <li className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                Analyses de base
              </li>
              <li className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                3 alternatives par produit
              </li>
              <li className="flex items-center text-gray-400">
                <X className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                Chat IA limité (5/mois)
              </li>
              <li className="flex items-center text-gray-400">
                <X className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                Export PDF
              </li>
            </ul>

            <button
              onClick={() => navigate('/register')}
              className="w-full py-3 px-6 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              disabled={isAuthenticated}
            >
              {isAuthenticated ? 'Plan actuel' : 'Commencer gratuitement'}
            </button>
          </div>

          {/* Premium Monthly */}
          <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl shadow-xl p-8 relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold">
                POPULAIRE
              </span>
            </div>

            <div className="mb-8 text-white">
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                Premium <Sparkles className="w-6 h-6 ml-2" />
              </h2>
              <p className="opacity-90">L'expérience complète</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">2,49€</span>
                <span className="opacity-90">/mois</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8 text-white">
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-3 flex-shrink-0" />
                <strong>Scans illimités</strong>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-3 flex-shrink-0" />
                <strong>Chat IA illimité</strong>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-3 flex-shrink-0" />
                Analyses approfondies
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-3 flex-shrink-0" />
                Export PDF illimité
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-3 flex-shrink-0" />
                Historique complet
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 mr-3 flex-shrink-0" />
                Support prioritaire 24/7
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={loading !== null || isPremium}
              className="w-full py-3 px-6 bg-white text-green-600 rounded-lg font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'monthly' ? 'Chargement...' : 
               isPremium ? 'Déjà abonné' : 'Choisir Premium'}
            </button>
          </div>

          {/* Premium Annual */}
          <div className="bg-white rounded-2xl shadow-lg p-8 relative border-2 border-green-500">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                2 MOIS OFFERTS
              </span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                Premium Annuel <Zap className="w-6 h-6 ml-2 text-yellow-500" />
              </h2>
              <p className="text-gray-600">Économisez 17%</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-gray-800">24,90€</span>
                <span className="text-gray-600">/an</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Soit 2,08€/mois
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <strong>Tout Premium +</strong>
              </li>
              <li className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <strong>2 mois gratuits</strong>
              </li>
              <li className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                Accès anticipé nouvelles features
              </li>
              <li className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                Badge supporter
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe('annual')}
              disabled={loading !== null || isPremium}
              className="w-full py-3 px-6 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'annual' ? 'Chargement...' : 
               isPremium ? 'Déjà abonné' : 'Économiser 17%'}
            </button>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
            Comparaison détaillée des fonctionnalités
          </h2>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-700 font-medium">Fonctionnalité</th>
                  <th className="px-6 py-4 text-center text-gray-700 font-medium">Gratuit</th>
                  <th className="px-6 py-4 text-center text-gray-700 font-medium">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {features.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-700">{feature.text}</td>
                    <td className="px-6 py-4 text-center">
                      {feature.free ? (
                        feature.text === 'Nombre de scans par mois' ? (
                          <span className="text-gray-600">30/mois</span>
                        ) : feature.text === 'Chat IA nutritionnel' ? (
                          <span className="text-gray-600">5/mois</span>
                        ) : (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        )
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {feature.premium ? (
                        feature.text === 'Nombre de scans par mois' ? (
                          <span className="text-green-600 font-medium">Illimité</span>
                        ) : feature.text === 'Chat IA nutritionnel' ? (
                          <span className="text-green-600 font-medium">Illimité</span>
                        ) : (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        )
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="w-5 h-5" />
              <span>Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <TrendingUp className="w-5 h-5" />
              <span>Annulation à tout moment</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Sparkles className="w-5 h-5" />
              <span>Satisfait ou remboursé 30j</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Les paiements sont sécurisés par LemonSqueezy. Vous pouvez annuler votre abonnement
            à tout moment depuis votre espace personnel. Les prix sont en EUR et incluent la TVA.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
