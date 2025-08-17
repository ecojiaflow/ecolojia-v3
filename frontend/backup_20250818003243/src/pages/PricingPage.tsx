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
import { paymentService } from '../services/paymentService';

interface Plan {
  id: 'free' | 'premium' | 'family';
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  color: 'gray' | 'green' | 'purple';
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
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Gratuit',
      description: 'Pour decouvrir ECOLOJIA',
      price: 0,
      priceLabel: 'Gratuit',
      color: 'gray',
      icon: <Sparkles className="w-6 h-6" />,
      features: [
        { name: '30 analyses par mois', included: true },
        { name: 'Score sante basique', included: true },
        { name: 'Classification NOVA', included: true },
        { name: '3 alternatives par produit', included: true },
        { name: 'Historique 30 jours', included: true },
        { name: 'Chat IA (5 questions/mois)', included: true },
        { name: 'Export donnees', included: false },
        { name: 'Analyses illimitees', included: false },
        { name: 'Support prioritaire', included: false },
      ],
      cta: user ? 'Plan actuel' : 'Commencer gratuitement'
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Pour les consommateurs avertis',
      price: billingPeriod === 'monthly' ? 2.49 : 24.90,
      priceLabel: billingPeriod === 'monthly' ? '2,49 aÃ¢â‚¬Å¡Ã‚Â¬/mois' : '24,90 aÃ¢â‚¬Å¡Ã‚Â¬/an',
      color: 'green',
      icon: <Star className="w-6 h-6" />,
      popular: true,
      features: [
        { name: 'Analyses illimitees', included: true },
        { name: 'Tous les scores detailles', included: true },
        { name: 'Classification NOVA avancee', included: true },
        { name: '10 alternatives par produit', included: true },
        { name: 'Historique illimite', included: true },
        { name: 'Chat IA illimite', included: true, tooltip: '500 questions/mois' },
        { name: 'Export CSV/PDF', included: true },
        { name: 'Sans publicite', included: true },
        { name: 'Support prioritaire', included: true },
      ],
      cta: 'Passer Æ’Ã‚Â  Premium'
    },
    {
      id: 'family',
      name: 'Famille',
      description: 'Pour toute la famille',
      price: billingPeriod === 'monthly' ? 4.99 : 49.90,
      priceLabel: billingPeriod === 'monthly' ? '4,99 aÃ¢â‚¬Å¡Ã‚Â¬/mois' : '49,90 aÃ¢â‚¬Å¡Ã‚Â¬/an',
      color: 'purple',
      icon: <Users className="w-6 h-6" />,
      features: [
        { name: 'Tout Premium inclus', included: true },
        { name: '5 comptes utilisateurs', included: true },
        { name: 'Tableau de bord famille', included: true },
        { name: 'Partage de favoris', included: true },
        { name: 'Statistiques familiales', included: true },
        { name: 'Gestion des allergies', included: true },
        { name: 'Listes de courses partagees', included: true },
        { name: 'Defis famille', included: true },
        { name: 'Support VIP', included: true },
      ],
      cta: 'Choisir Famille'
    }
  ];

  const handleSelectPlan = async (plan: 'premium' | 'family') => {
    try {
      setLoadingPlan(plan);
      // Cree une session de paiement (via backend Render)
      const { url } = await paymentService.createCheckout(plan);
      if (url) window.location.href = url;
    } catch (err) {
      console.error('[checkout] error:', err);
      alert("Impossible de creer la session de paiement. Reessaie plus tard.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const faqs = [
    {
      question: 'Puis-je changer de plan Æ’Ã‚Â  tout moment ?',
      answer: 'Oui ! Vous pouvez passer Æ’Ã‚Â  un plan superieur Æ’Ã‚Â  tout moment. Le changement est effectif immediatement et la facturation est au prorat?.'
    },
    {
      question: "Comment fonctionne la periode d'essai ?",
      answer: "Les nouveaux utilisateurs Premium ont 7 jours d'essai gratuit. Aucun paiement n'est preleve pendant cette periode."
    },
    {
      question: 'Puis-je annuler mon abonnement ?',
      answer: "Oui, vous pouvez annuler Æ’Ã‚Â  tout moment depuis votre profil. Vous conservez l'acces jusqu'Æ’Ã‚Â  la fin de la periode en cours."
    },
    {
      question: 'Mes donnees sont-elles securisees ?',
      answer: 'Absolument ! Chiffrement de niveau bancaire et respect strict du RGPD. Vos donnees ne sont jamais revendues.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F9F4]">
      {/* Header */}
      <div className="bg-white border-b border-[#DDE9DA]">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold text-[#3B3B3B] mb-4">
              Choisissez votre plan ECOLOJIA
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Accedez Æ’Ã‚Â  toutes les fonctionnalites pour une consommation plus consciente
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
              <span className="ml-2 px-2 py-1 bg-[#7DDE4A] text-white text-xs rounded-full">-17%</span>
            </span>
          </div>

          {/* Garanties */}
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#7DDE4A]" />
              <span>Paiement securise</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#7DDE4A]" />
              <span>7 jours d'essai gratuit</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#7DDE4A]" />
              <span>Donnees protegees RGPD</span>
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
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${plan.popular ? 'ring-2 ring-[#7DDE4A]' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-[#7DDE4A] text-white px-4 py-1 rounded-bl-lg text-sm font-medium">
                  Le plus populaire
                </div>
              )}

              <div className="p-8">
                {/* En-tete */}
                <div className="text-center mb-8">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                      plan.color === 'green'
                        ? 'bg-[#E9F8DF] text-[#7DDE4A]'
                        : plan.color === 'purple'
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {plan.icon}
                  </div>

                  <h3 className="text-2xl font-bold text-[#3B3B3B] mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>

                  <div className="text-4xl font-bold text-[#3B3B3B]">{plan.priceLabel}</div>
                  {plan.price > 0 && billingPeriod === 'yearly' && (
                    <p className="text-sm text-gray-500 mt-1">soit {(plan.price / 12).toFixed(2)} aÃ¢â‚¬Å¡Ã‚Â¬/mois</p>
                  )}
                </div>

                {/* Fonctionnalites */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-[#7DDE4A] mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-[#3B3B3B]' : 'text-gray-400'}`}>
                        {feature.name}
                        {feature.tooltip && <Info className="w-4 h-4 inline-block ml-1 text-gray-400" />}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => (plan.id === 'free' ? (user ? null : navigate('/register')) : handleSelectPlan(plan.id))}
                  disabled={loadingPlan === plan.id}
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
                      {plan.id !== 'free' && <ArrowRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-[#3B3B3B] mb-8 text-center">Questions frequentes</h2>

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
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-[#3B3B3B]">{faq.question}</span>
                <HelpCircle
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    openFaqIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openFaqIndex === index && (
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
          <h2 className="text-3xl font-bold mb-4">Pret Æ’Ã‚Â  ameliorer votre consommation ?</h2>
          <p className="text-xl mb-8 text-white/90">
            Rejoignez des milliers d'utilisateurs qui font des choix plus eclaires
          </p>
          <button
            onClick={() => handleSelectPlan('premium')}
            className="px-8 py-4 bg-white text-[#7DDE4A] rounded-full font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Commencer l'essai gratuit
          </button>
          <p className="mt-4 text-sm text-white/80">Aucune carte bancaire requise aÃ¢â€šÂ¬Ã‚Â¢ Annulation Æ’Ã‚Â  tout moment</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;


