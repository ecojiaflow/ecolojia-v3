// PATH: frontend/src/pages/PricingPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check, X, Sparkles, Shield, Users, Zap,
  CreditCard, Star, TrendingUp, Lock, Gift,
  ArrowRight, Info, HelpCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/apiClient';
import { API_CONFIG } from '../config/api.config';

interface Plan {
  id: 'free' | 'premium' | 'family';
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  color: string;
  icon: React.ReactNode;
  popular?: boolean;
  features: {
    name: string;
    included: boolean;
    tooltip?: string;
  }[];
  cta: string;
}

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showFAQ, setShowFAQ] = useState(false);

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Gratuit',
      description: 'Pour découvrir ECOLOJIA',
      price: 0,
      priceLabel: 'Gratuit',
      color: 'gray',
      icon: <Sparkles className="w-6 h-6" />,
      features: [
        { name: '30 analyses par mois', included: true },
        { name: 'Score santé basique', included: true },
        { name: 'Classification NOVA', included: true },
        { name: '3 alternatives par produit', included: true },
        { name: 'Historique 30 jours', included: true },
        { name: 'Chat IA (5 questions/mois)', included: true },
        { name: 'Export données', included: false },
        { name: 'Analyses illimitées', included: false },
        { name: 'Support prioritaire', included: false },
      ],
      cta: user ? 'Plan actuel' : 'Commencer gratuitement'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Pour les consommateurs avertis',
      price: billingPeriod === 'monthly' ? 2.49 : 24.90,
      priceLabel: billingPeriod === 'monthly' ? '2,49€/mois' : '24,90€/an',
      color: 'green',
      icon: <Star className="w-6 h-6" />,
      popular: true,
      features: [
        { name: 'Analyses illimitées', included: true },
        { name: 'Tous les scores détaillés', included: true },
        { name: 'Classification NOVA avancée', included: true },
        { name: '10 alternatives par produit', included: true },
        { name: 'Historique illimité', included: true },
        { name: 'Chat IA illimité', included: true, tooltip: '500 questions/mois' },
        { name: 'Export CSV/PDF', included: true },
        { name: 'Sans publicité', included: true },
        { name: 'Support prioritaire', included: true },
      ],
      cta: 'Passer à Premium'
    },
    {
      id: 'family',
      name: 'Famille',
      description: 'Pour toute la famille',
      price: billingPeriod === 'monthly' ? 4.99 : 49.90,
      priceLabel: billingPeriod === 'monthly' ? '4,99€/mois' : '49,90€/an',
      color: 'purple',
      icon: <Users className="w-6 h-6" />,
      features: [
        { name: 'Tout Premium inclus', included: true },
        { name: '5 comptes utilisateurs', included: true },
        { name: 'Tableau de bord famille', included: true },
        { name: 'Partage de favoris', included: true },
        { name: 'Statistiques familiales', included: true },
        { name: 'Gestion des allergies', included: true },
        { name: 'Listes de courses partagées', included: true },
        { name: 'Défis famille', included: true },
        { name: 'Support VIP', included: true },
      ],
      cta: 'Choisir Famille'
    }
  ];

  const handleSelectPlan = async (planId: string) => {
    if (planId === 'free') {
      if (!user) {
        navigate('/register');
      }
      return;
    }

    try {
      setLoadingPlan(planId);
      
      // Créer la session de paiement
      const response = await api.post(API_CONFIG.ENDPOINTS.PAYMENT.CREATE_CHECKOUT, {
        planId,
        billingPeriod
      });

      // Rediriger vers LemonSqueezy
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const faqs = [
    {
      question: 'Puis-je changer de plan à tout moment ?',
      answer: 'Oui ! Vous pouvez passer à un plan supérieur à tout moment. Le changement sera effectif immédiatement et vous serez facturé au prorata.'
    },
    {
      question: 'Comment fonctionne la période d\'essai ?',
      answer: 'Tous les nouveaux utilisateurs Premium bénéficient de 7 jours d\'essai gratuit. Aucun paiement n\'est prélevé pendant cette période.'
    },
    {
      question: 'Puis-je annuler mon abonnement ?',
      answer: 'Oui, vous pouvez annuler votre abonnement à tout moment depuis votre profil. Vous continuerez à bénéficier du service jusqu\'à la fin de la période payée.'
    },
    {
      question: 'Les données sont-elles sécurisées ?',
      answer: 'Absolument ! Nous utilisons un chiffrement de niveau bancaire et respectons strictement le RGPD. Vos données ne sont jamais vendues à des tiers.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Header */}
      <div className="bg-white border-b border-[#DDE9DA]">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-[#3B3B3B] mb-4">
              Choisissez votre plan ECOLOJIA
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Accédez à toutes les fonctionnalités pour une consommation plus consciente
            </p>
          </motion.div>

          {/* Toggle facturation */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={`font-medium ${billingPeriod === 'monthly' ? 'text-[#3B3B3B]' : 'text-gray-400'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-8 bg-gray-200 rounded-full transition-colors duration-200"
            >
              <motion.div
                className="absolute top-1 w-6 h-6 bg-[#7DDE4A] rounded-full shadow-md"
                animate={{ left: billingPeriod === 'monthly' ? 4 : 24 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`font-medium ${billingPeriod === 'yearly' ? 'text-[#3B3B3B]' : 'text-gray-400'}`}>
              Annuel
              <span className="ml-2 px-2 py-1 bg-[#7DDE4A] text-white text-xs rounded-full">
                -17%
              </span>
            </span>
          </div>

          {/* Garanties */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#7DDE4A]" />
              <span>Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#7DDE4A]" />
              <span>7 jours d'essai gratuit</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#7DDE4A]" />
              <span>Données protégées RGPD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                plan.popular ? 'ring-2 ring-[#7DDE4A]' : ''
              }`}
            >
              {/* Badge populaire */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-[#7DDE4A] text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
                  Le plus populaire
                </div>
              )}

              <div className="p-8">
                {/* En-tête du plan */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    plan.color === 'green' ? 'bg-[#E9F8DF] text-[#7DDE4A]' :
                    plan.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {plan.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-[#3B3B3B] mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  
                  <div className="text-4xl font-bold text-[#3B3B3B]">
                    {plan.priceLabel}
                  </div>
                  {plan.price > 0 && billingPeriod === 'yearly' && (
                    <p className="text-sm text-gray-500 mt-1">
                      soit {(plan.price / 12).toFixed(2)}€/mois
                    </p>
                  )}
                </div>

                {/* Fonctionnalités */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-[#7DDE4A] mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        feature.included ? 'text-[#3B3B3B]' : 'text-gray-400'
                      }`}>
                        {feature.name}
                        {feature.tooltip && (
                          <Info className="w-4 h-4 inline-block ml-1 text-gray-400" />
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loadingPlan === plan.id || (user?.tier === plan.id)}
                  className={`w-full py-3 px-6 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-[#7DDE4A] text-white hover:bg-[#6bc93a]'
                      : plan.color === 'purple'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-100 text-[#3B3B3B] hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingPlan === plan.id ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {plan.cta}
                      {plan.id !== 'free' && user?.tier !== plan.id && (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Comparaison détaillée */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#3B3B3B] mb-8 text-center">
            Comparaison détaillée des fonctionnalités
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#DDE9DA]">
                  <th className="text-left py-4 px-4 font-semibold text-[#3B3B3B]">Fonctionnalité</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-600">Gratuit</th>
                  <th className="text-center py-4 px-4 font-semibold text-[#7DDE4A]">Premium</th>
                  <th className="text-center py-4 px-4 font-semibold text-purple-600">Famille</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Analyses mensuelles', free: '30', premium: 'Illimitées', family: 'Illimitées' },
                  { name: 'Score santé', free: 'Basique', premium: 'Complet', family: 'Complet' },
                  { name: 'Chat IA', free: '5/mois', premium: '500/mois', family: '500/mois/compte' },
                  { name: 'Alternatives suggérées', free: '3', premium: '10', family: '10' },
                  { name: 'Export données', free: '❌', premium: 'CSV, PDF', family: 'CSV, PDF' },
                  { name: 'Historique', free: '30 jours', premium: 'Illimité', family: 'Illimité' },
                  { name: 'Comptes utilisateurs', free: '1', premium: '1', family: '5' },
                  { name: 'Support', free: 'Standard', premium: 'Prioritaire', family: 'VIP' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-4 px-4 text-[#3B3B3B]">{row.name}</td>
                    <td className="py-4 px-4 text-center text-gray-600">{row.free}</td>
                    <td className="py-4 px-4 text-center text-[#3B3B3B] font-medium">{row.premium}</td>
                    <td className="py-4 px-4 text-center text-[#3B3B3B] font-medium">{row.family}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-[#3B3B3B] mb-8 text-center">
          Questions fréquentes
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-[#DDE9DA] overflow-hidden"
            >
              <button
                onClick={() => setShowFAQ(showFAQ === index ? false : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-[#3B3B3B]">{faq.question}</span>
                <HelpCircle className={`w-5 h-5 text-gray-400 transition-transform ${
                  showFAQ === index ? 'rotate-180' : ''
                }`} />
              </button>
              
              {showFAQ === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA final */}
      <div className="bg-gradient-to-r from-[#7DDE4A] to-[#6bc93a] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à améliorer votre consommation ?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Rejoignez des milliers d'utilisateurs qui font des choix plus éclairés
          </p>
          <button
            onClick={() => handleSelectPlan('premium')}
            className="px-8 py-4 bg-white text-[#7DDE4A] rounded-full font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Commencer l'essai gratuit
          </button>
          <p className="mt-4 text-sm text-white/80">
            Aucune carte bancaire requise • Annulation à tout moment
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;