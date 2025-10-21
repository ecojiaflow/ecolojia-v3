import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, X, Sparkles, Zap, Shield, Crown, Star,
  TrendingUp, Users, Award, ArrowRight, CheckCircle,
  MessageCircle, Download, Clock, Infinity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useDeviceContext } from '../hooks/useDeviceContext';
import { checkPremium } from '../utils/checkPremium';

const PremiumPage: React.FC = () => {
  const navigate = useNavigate();
  const { isMobile } = useDeviceContext();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      checkPremium(userId).then(setIsPremium);
    }
  }, []);

  const plans = {
    monthly: {
      price: '4.99',
      period: 'mois',
      total: '4.99€/mois',
      savings: null
    },
    yearly: {
      price: '49',
      period: 'an',
      total: '4.08€/mois',
      savings: 'Économisez 11€ (18%)'
    }
  };

  const features = {
    free: [
      { text: '10 scans par jour', included: true },
      { text: '5 messages IA par jour', included: true },
      { text: 'Historique 7 jours', included: true },
      { text: 'Scores de base', included: true },
      { text: 'Publicités', included: true, isNegative: true },
      { text: 'Export PDF', included: false },
      { text: 'Comparaisons illimitées', included: false },
      { text: 'Alertes produits', included: false },
      { text: 'Support prioritaire', included: false },
      { text: 'Accès API', included: false }
    ],
    premium: [
      { text: 'Scans illimités', included: true, highlight: true },
      { text: 'Messages IA illimités', included: true, highlight: true },
      { text: 'Historique illimité', included: true },
      { text: 'Analyses détaillées', included: true },
      { text: 'Sans publicité', included: true, highlight: true },
      { text: 'Export PDF', included: true },
      { text: 'Comparaisons illimitées', included: true },
      { text: 'Alertes produits', included: true },
      { text: 'Support prioritaire 24h', included: true },
      { text: 'Accès API développeur', included: true }
    ]
  };

  const premiumBenefits = [
    {
      icon: Infinity,
      title: 'Scans & IA Illimités',
      description: 'Analysez autant de produits que vous voulez. Chat IA disponible 24/7 sans limitation.',
      color: 'text-green-600 bg-green-100'
    },
    {
      icon: Download,
      title: 'Export & Partage',
      description: 'Exportez vos analyses en PDF, partagez avec votre famille ou professionnel de santé.',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: TrendingUp,
      title: 'Analyses Avancées',
      description: 'Accédez aux recommandations personnalisées IA et insights détaillés.',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: Shield,
      title: 'Support Prioritaire',
      description: 'Réponses sous 24h par notre équipe d\'experts en nutrition et cosmétiques.',
      color: 'text-orange-600 bg-orange-100'
    }
  ];

  const testimonials = [
    {
      name: 'Sophie M.',
      role: 'Maman de 2 enfants',
      avatar: '👩',
      rating: 5,
      content: 'Premium a transformé mes courses ! Je scanne tout maintenant et je fais de bien meilleurs choix pour ma famille.'
    },
    {
      name: 'Thomas L.',
      role: 'Sportif',
      avatar: '🏃',
      rating: 5,
      content: 'L\'analyse IA détaillée m\'aide à optimiser ma nutrition. Le chat IA est incroyable pour des conseils perso.'
    },
    {
      name: 'Marie P.',
      role: 'Allergies multiples',
      avatar: '👱‍♀️',
      rating: 5,
      content: 'Les alertes produits me sauvent ! Je suis notifiée si un produit contient mes allergènes. Indispensable.'
    }
  ];

  const faq = [
    {
      question: 'Puis-je annuler à tout moment ?',
      answer: 'Oui, absolument. Votre abonnement Premium peut être annulé à tout moment depuis votre profil. Aucun engagement, aucune question posée.'
    },
    {
      question: 'Y a-t-il un essai gratuit ?',
      answer: 'Oui ! Profitez de 7 jours d\'essai gratuit pour tester toutes les fonctionnalités Premium sans engagement.'
    },
    {
      question: 'Que se passe-t-il après l\'annulation ?',
      answer: 'Vous conservez l\'accès Premium jusqu\'à la fin de votre période payée, puis revenez automatiquement au plan gratuit.'
    },
    {
      question: 'Les données sont-elles sécurisées ?',
      answer: 'Vos données sont cryptées et conformes RGPD. Nous ne vendons jamais vos informations personnelles.'
    },
    {
      question: 'Premium fonctionne sur tous mes appareils ?',
      answer: 'Oui ! Un seul abonnement fonctionne sur smartphone, tablette et ordinateur. Synchronisation automatique.'
    }
  ];

  const handleUpgrade = () => {
    // TODO: Intégrer LemonSqueezy checkout
    const plan = selectedPlan === 'yearly' ? 'yearly' : 'monthly';
    window.location.href = `${import.meta.env.VITE_API_URL}/api/payments/checkout?plan=${plan}`;
  };

  if (isPremium === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de votre abonnement...</p>
        </div>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-6">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Vous êtes Premium ! ✨
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Profitez de toutes les fonctionnalités illimitées d'ECOLOJIA
            </p>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <Infinity className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">Scans illimités</p>
                <p className="text-sm text-gray-600 mt-1">Analysez sans limite</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <MessageCircle className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">Chat IA 24/7</p>
                <p className="text-sm text-gray-600 mt-1">Assistance illimitée</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md">
                <Shield className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">Support prioritaire</p>
                <p className="text-sm text-gray-600 mt-1">Réponse sous 24h</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Gérer mon abonnement
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-full mb-6">
              <Crown className="w-4 h-4 text-green-700" />
              <span className="text-sm font-medium text-green-900">Passez au niveau supérieur</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Débloquez tout le potentiel d'<span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">ECOLOJIA</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Scans illimités, analyses détaillées, chat IA 24/7 et bien plus encore
            </p>

            {/* Plan Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`px-6 py-3 rounded-xl font-medium transition-all relative ${
                  selectedPlan === 'yearly'
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Annuel
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
                  -18%
                </span>
              </button>
            </div>

            {/* Price Display */}
            <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md mx-auto mb-8">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {plans[selectedPlan].price}€
                <span className="text-2xl text-gray-600">/{plans[selectedPlan].period}</span>
              </div>
              {plans[selectedPlan].savings && (
                <p className="text-green-600 font-medium mb-4">{plans[selectedPlan].savings}</p>
              )}
              <button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2 group shadow-lg"
              >
                <Sparkles className="w-5 h-5" />
                Essayer 7 jours gratuit
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Sans engagement • Annulation en 1 clic
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Comparez les plans
          </h2>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Free Plan */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Gratuit</h3>
                  <p className="text-4xl font-bold text-gray-900">0€</p>
                  <p className="text-gray-600 mt-2">Pour découvrir ECOLOJIA</p>
                </div>
                <ul className="space-y-4">
                  {features.free.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${feature.isNegative ? 'text-orange-500' : 'text-green-600'}`} />
                      ) : (
                        <X className="w-5 h-5 mt-0.5 text-gray-300 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium Plan */}
              <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl p-8 shadow-2xl relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    ⭐ Recommandé
                  </span>
                </div>
                <div className="text-center mb-8 text-white">
                  <h3 className="text-2xl font-bold mb-2">Premium</h3>
                  <p className="text-4xl font-bold">{plans[selectedPlan].total}</p>
                  <p className="mt-2 opacity-90">Tout illimité</p>
                </div>
                <ul className="space-y-4">
                  {features.premium.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${feature.highlight ? 'text-yellow-300' : 'text-white'}`} />
                      <span className={`${feature.highlight ? 'text-white font-semibold' : 'text-white/90'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleUpgrade}
                  className="w-full mt-8 bg-white text-green-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Démarrer l'essai gratuit
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Pourquoi passer Premium ?
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Des fonctionnalités pensées pour transformer votre expérience
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {premiumBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all"
              >
                <div className={`inline-flex p-3 rounded-xl ${benefit.color} mb-4`}>
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Ils ont adopté Premium
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-400 rounded-full flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-center text-gray-600 mb-12">
            Tout ce que vous devez savoir sur Premium
          </p>

          <div className="max-w-3xl mx-auto space-y-4">
            {faq.map((item, index) => (
              <details
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all group"
              >
                <summary className="cursor-pointer font-semibold text-gray-900 flex items-center justify-between">
                  {item.question}
                  <ArrowRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à passer Premium ?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            7 jours d'essai gratuit • Sans engagement • Annulation en 1 clic
          </p>
          <button
            onClick={handleUpgrade}
            className="bg-white text-green-600 px-10 py-5 rounded-xl font-semibold hover:bg-gray-100 transition-all inline-flex items-center gap-2 text-lg shadow-2xl"
          >
            <Crown className="w-6 h-6" />
            Commencer l'essai gratuit
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default PremiumPage;
