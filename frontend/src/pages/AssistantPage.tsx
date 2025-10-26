import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  UtensilsCrossed, 
  ShoppingCart, 
  Camera,
  Sparkles,
  Crown,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp
} from 'lucide-react';

const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPremium] = useState(false);
  const [loading] = useState(false);

  const quotas = {
    aiQuestionsUsed: 0,
    aiQuestionsLimit: 3,
    mealPlansUsed: 0,
    mealPlansLimit: 0,
    ocrAnalysisUsed: 0,
    ocrAnalysisLimit: 0
  };

  const aiActions = [
    {
      id: 'chat',
      title: 'Chat Nutritionniste',
      description: 'Discutez avec notre IA experte en nutrition pour des conseils personnalises',
      icon: MessageCircle,
      gradient: 'from-[#236D3E] to-[#489E26]',
      route: '/chat',
      isPremium: false,
      quotaUsed: quotas.aiQuestionsUsed,
      quotaLimit: quotas.aiQuestionsLimit
    },
    {
      id: 'meal-plan',
      title: 'Plans Repas IA',
      description: 'Generez des plans repas hebdomadaires adaptes a votre budget et regime',
      icon: UtensilsCrossed,
      gradient: 'from-[#7DDE4A] to-[#5FC72F]',
      route: '/meal-plan',
      isPremium: true,
      quotaUsed: quotas.mealPlansUsed,
      quotaLimit: quotas.mealPlansLimit
    },
    {
      id: 'shopping-list',
      title: 'Listes Courses IA',
      description: 'Creez des listes de courses intelligentes basees sur vos scans',
      icon: ShoppingCart,
      gradient: 'from-[#2E7DD7] to-[#1D4ED8]',
      route: '/shopping-list',
      isPremium: true,
      quotaUsed: 0,
      quotaLimit: 0
    },
    {
      id: 'ocr-analysis',
      title: 'Analyse Photo',
      description: 'Analysez les ingredients directement depuis une photo d\'etiquette',
      icon: Camera,
      gradient: 'from-[#E9A100] to-[#D97706]',
      route: '/ocr-wizard',
      isPremium: true,
      quotaUsed: quotas.ocrAnalysisUsed,
      quotaLimit: quotas.ocrAnalysisLimit
    }
  ];

  const handleActionClick = (action: any) => {
    if (!isPremium && action.isPremium) {
      navigate('/premium');
      return;
    }
    navigate(action.route);
  };

  const getQuotaColor = (used: number, limit: number): string => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-[#D04343]';
    if (percentage >= 70) return 'text-[#E9A100]';
    return 'text-[#1B9E4B]';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F3FBEA] to-[#E9F8DF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#D4F1C0] border-t-[#7DDE4A] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B6B6B]">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3FBEA] via-[#E9F8DF] to-[#D4F1C0] pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-[#E9F8DF] text-[#489E26] px-4 py-2 rounded-full mb-4 border border-[#D4F1C0]">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Assistant IA Expert</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-[#232323] mb-4">
            Votre coach nutrition{' '}
            <span className="text-[#236D3E]">
              intelligent
            </span>
          </h1>
          
          <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
            Utilisez l'intelligence artificielle pour optimiser votre alimentation, 
            generer des plans repas et analyser vos produits en profondeur.
          </p>
        </div>

        {!isPremium && (
          <div className="bg-gradient-to-r from-[#236D3E] to-[#489E26] rounded-[16px] p-6 text-white shadow-[0_6px_14px_rgba(0,0,0,0.10)]">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold mb-1">Passez Premium</h3>
                  <p className="text-sm opacity-90">
                    Debloquez toutes les fonctionnalites IA pour 2.99 EUR/mois
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/premium')}
                className="px-6 py-3 bg-white text-[#236D3E] rounded-[16px] font-semibold hover:shadow-[0_6px_14px_rgba(0,0,0,0.10)] transition-all"
              >
                Decouvrir Premium
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {aiActions.map((action) => {
            const Icon = action.icon;
            const isLocked = !isPremium && action.isPremium;
            const isQuotaExceeded = action.quotaUsed >= action.quotaLimit && !isPremium && action.quotaLimit > 0;

            return (
              <div
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={`bg-white rounded-[16px] p-6 shadow-[0_2px_6px_rgba(0,0,0,0.08)] border-2 transition-all cursor-pointer ${
                  isLocked || isQuotaExceeded 
                    ? 'border-[#DDE9DA] opacity-75 hover:opacity-100' 
                    : 'border-[#DDE9DA] hover:border-[#D4F1C0] hover:shadow-[0_6px_14px_rgba(0,0,0,0.10)] hover:-translate-y-1'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-[16px] bg-gradient-to-br ${action.gradient} flex items-center justify-center`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  {(isLocked || isQuotaExceeded) && (
                    <div className="px-3 py-1 bg-[#E9F8DF] text-[#236D3E] rounded-full text-xs font-semibold flex items-center gap-1 border border-[#D4F1C0]">
                      <Crown className="w-3 h-3" />
                      Premium
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-[#232323] mb-2">
                  {action.title}
                </h3>
                <p className="text-[#6B6B6B] text-sm mb-4">
                  {action.description}
                </p>

                {action.quotaLimit > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-[#6B6B6B]">Utilisation</span>
                      <span className={`text-xs font-semibold ${getQuotaColor(action.quotaUsed, action.quotaLimit)}`}>
                        {action.quotaUsed}/{action.quotaLimit}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#EDF2EA] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isQuotaExceeded
                            ? 'bg-[#D04343]'
                            : 'bg-gradient-to-r ' + action.gradient
                        }`}
                        style={{ 
                          width: `${Math.min((action.quotaUsed / action.quotaLimit) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}

                <button className={`w-full py-3 rounded-[16px] font-semibold flex items-center justify-center gap-2 transition-all ${
                  isLocked || isQuotaExceeded
                    ? 'bg-[#F7F9F4] text-[#6B6B6B]'
                    : 'bg-gradient-to-r ' + action.gradient + ' text-white hover:shadow-[0_2px_6px_rgba(0,0,0,0.08)]'
                }`}>
                  {isLocked || isQuotaExceeded ? 'Debloquer avec Premium' : 'Lancer'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-[#DDE9DA]">
          <h3 className="text-xl font-bold text-[#232323] mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#E9A100]" />
            Pourquoi utiliser l'Assistant IA ?
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <TrendingUp className="w-8 h-8 text-[#1B9E4B] mb-3" />
              <h4 className="font-semibold text-[#232323] mb-2">Personnalise</h4>
              <p className="text-sm text-[#6B6B6B]">
                Conseils adaptes a votre profil, regime et objectifs sante
              </p>
            </div>
            <div>
              <Shield className="w-8 h-8 text-[#2E7DD7] mb-3" />
              <h4 className="font-semibold text-[#232323] mb-2">Scientifique</h4>
              <p className="text-sm text-[#6B6B6B]">
                Base sur donnees OMS, ANSES et etudes nutritionnelles recentes
              </p>
            </div>
            <div>
              <Sparkles className="w-8 h-8 text-[#236D3E] mb-3" />
              <h4 className="font-semibold text-[#232323] mb-2">Intelligent</h4>
              <p className="text-sm text-[#6B6B6B]">
                Apprentissage continu pour des recommandations toujours plus precises
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[16px] p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#2E7DD7] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#1E3A8A]">
                <strong>Transparence IA:</strong> Je suis un assistant IA, pas un professionnel de sante. 
                Mes reponses sont generees par intelligence artificielle et ne remplacent pas 
                un avis medical personnalise. Pour toute question medicale, consultez un medecin ou 
                nutritionniste diplome.
              </div>
            </div>
          </div>

          <div className="bg-[#FFF8E6] border border-[#FFE8A8] rounded-[16px] p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#E9A100] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#6B4D00]">
                <strong>Information sante:</strong> ECOLOJIA n'est pas un dispositif medical. 
                Les recommandations sont informatives et educatives. En cas de probleme de sante, 
                d'allergie ou de regime special, consultez imperativement un professionnel qualifie.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssistantPage;