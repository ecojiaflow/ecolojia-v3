import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  ShoppingCart,
  Camera,
  Sparkles,
  Crown,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
  BookOpen
} from 'lucide-react';

const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [isPremium] = useState(false);
  const [loading] = useState(false);

  const quotas = {
    mealPlansUsed: 0,
    mealPlansLimit: 0,
    ocrAnalysisUsed: 0,
    ocrAnalysisLimit: 0
  };

  // V1 : Chat libre désactivé - sera remplacé par "Explorer une situation" (guidé)
  const aiActions = [
    {
      id: 'ocr-analysis',
      title: 'Analyse Photo',
      description: 'Analysez les ingredients directement depuis une photo d\'etiquette',
      icon: Camera,
      gradient: 'from-[#16A34A] to-[#0F7A34]',
      route: '/scan?mode=photo',
      isPremium: false,
      quotaUsed: quotas.ocrAnalysisUsed,
      quotaLimit: 5
    },
    {
      id: 'meal-plan',
      title: 'Plans Repas',
      description: 'Generez des plans repas hebdomadaires adaptes a vos habitudes',
      icon: UtensilsCrossed,
      gradient: 'from-[#7DDE4A] to-[#5FC72F]',
      route: '/meal-plan',
      isPremium: true,
      quotaUsed: quotas.mealPlansUsed,
      quotaLimit: quotas.mealPlansLimit
    },
    {
      id: 'shopping-list',
      title: 'Listes Courses',
      description: 'Creez des listes de courses basees sur vos scans',
      icon: ShoppingCart,
      gradient: 'from-[#2E7DD7] to-[#1D4ED8]',
      route: '/shopping-list',
      isPremium: true,
      quotaUsed: 0,
      quotaLimit: 0
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
    if (limit === 0) return 'text-[#1B9E4B]';
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'text-[#D04343]';
    if (percentage >= 70) return 'text-[#E9A100]';
    return 'text-[#1B9E4B]';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3FBF6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#E6F2EA] border-t-[#16A34A] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3FBF6] pb-20">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-[#E8F7EE] text-[#16A34A] px-4 py-2 rounded-full mb-4 border border-[#C6F6D5]">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">Outils Ecolojia</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Comprendre et{' '}
            <span className="text-[#16A34A]">agir</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            Des outils simples pour analyser vos produits et organiser vos courses.
            Pas de chatbot. Des faits.
          </p>
        </div>

        {!isPremium && (
          <div className="bg-gradient-to-r from-[#16A34A] to-[#0F7A34] rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold mb-1">Passez Premium</h3>
                  <p className="text-sm opacity-90">
                    Debloquez toutes les fonctionnalites pour 1.99 EUR/mois
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/premium')}
                className="px-6 py-3 bg-white text-[#16A34A] rounded-2xl font-semibold hover:shadow-lg transition-all"
              >
                Decouvrir Premium
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {aiActions.map((action) => {
            const Icon = action.icon;
            const isLocked = !isPremium && action.isPremium;
            const isQuotaExceeded = action.quotaLimit > 0 && action.quotaUsed >= action.quotaLimit && !isPremium;

            return (
              <div
                key={action.id}
                onClick={() => handleActionClick(action)}
                className={g-white rounded-2xl p-6 shadow-sm border-2 transition-all cursor-pointer }
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={w-14 h-14 rounded-2xl bg-gradient-to-br +action.gradient+ flex items-center justify-center}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  {(isLocked || isQuotaExceeded) && (
                    <div className="px-3 py-1 bg-[#E8F7EE] text-[#16A34A] rounded-full text-xs font-semibold flex items-center gap-1 border border-[#C6F6D5]">
                      <Crown className="w-3 h-3" />
                      Premium
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  {action.description}
                </p>

                {action.quotaLimit > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-500">Utilisation</span>
                      <span className={	ext-xs font-semibold +getQuotaColor(action.quotaUsed, action.quotaLimit)}>
                        {action.quotaUsed}/{action.quotaLimit}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={h-full transition-all +(isQuotaExceeded ? 'bg-red-500' : 'bg-gradient-to-r '+action.gradient)}
                        style={{
                          width: +""+\%+""+
                        }}
                      />
                    </div>
                  </div>
                )}

                <button className={w-full py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all +(
                  isLocked || isQuotaExceeded
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-gradient-to-r '+action.gradient+' text-white hover:shadow-md'
                )}>
                  {isLocked || isQuotaExceeded ? 'Debloquer' : 'Lancer'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E6F2EA]">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#E9A100]" />
            Pourquoi ces outils ?
          </h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <TrendingUp className="w-8 h-8 text-[#16A34A] mb-3" />
              <h4 className="font-semibold text-slate-900 mb-2">Concret</h4>
              <p className="text-sm text-slate-600">
                Des actions claires, pas des conseils vagues
              </p>
            </div>
            <div>
              <Shield className="w-8 h-8 text-[#2E7DD7] mb-3" />
              <h4 className="font-semibold text-slate-900 mb-2">Scientifique</h4>
              <p className="text-sm text-slate-600">
                Base sur les donnees OMS, ANSES et EFSA
              </p>
            </div>
            <div>
              <Sparkles className="w-8 h-8 text-[#16A34A] mb-3" />
              <h4 className="font-semibold text-slate-900 mb-2">Sans jugement</h4>
              <p className="text-sm text-slate-600">
                Pas de culpabilisation, juste des faits
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#FFF8E6] border border-[#FFE8A8] rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#E9A100] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#6B4D00]">
              <strong>Information :</strong> Ecolojia est un outil educatif, pas medical.
              Pour toute question de sante, consultez un professionnel qualifie.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssistantPage;
