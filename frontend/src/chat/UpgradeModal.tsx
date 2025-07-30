// PATH: frontend/ecolojiaFrontV3/src/components/chat/UpgradeModal.tsx

import React from 'react';
import { Crown, Zap, TrendingUp, Calculator, X, Sparkles, Lock, Unlock } from 'lucide-react';

interface UpgradeModalProps {
  onClose: () => void;
  onUpgrade: () => void;
  currentUsage: {
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    totalCost: number;
  };
  blockedFeature?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  onClose,
  onUpgrade,
  currentUsage,
  blockedFeature
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <Crown className="w-16 h-16 text-yellow-300 mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-2">Upgrade vers Premium</h2>
            <p className="text-purple-100">
              Débloquez toute la puissance de DeepSeek
            </p>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Feature bloquée */}
          {blockedFeature && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700">
                <Lock className="w-4 h-4" />
                <span className="font-medium">Fonctionnalité Premium</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                "{blockedFeature}" nécessite un compte Premium
              </p>
            </div>
          )}

          {/* Comparaison Gratuit vs Premium */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Gratuit */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-500" />
                Gratuit
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  5 questions/jour
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  Alimentaire uniquement
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  DeepSeek Chat
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  Analyses basiques
                </li>
              </ul>
            </div>

            {/* Premium */}
            <div className="border-2 border-purple-300 bg-purple-50 rounded-lg p-4">
              <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-600" />
                Premium
              </h3>
              <ul className="space-y-2 text-sm text-purple-700">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  Questions illimitées
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  Toutes catégories
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  DeepSeek Reasoner
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                  Analyses expertes
                </li>
              </ul>
            </div>
          </div>

          {/* Avantages Premium détaillés */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Unlock className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Questions illimitées</div>
                <div className="text-sm text-green-600">Analysez autant de produits que souhaité</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">DeepSeek Reasoner</div>
                <div className="text-sm text-blue-600">IA de raisonnement avancé pour analyses expertes</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium text-purple-800">Multi-catégories</div>
                <div className="text-sm text-purple-600">Alimentaire + Cosmétiques + Détergents</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Calculator className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-800">Coût maîtrisé</div>
                <div className="text-sm text-orange-600">~0,02€ par question • {currentUsage.totalCost.toFixed(4)}€ ce mois</div>
              </div>
            </div>
          </div>

          {/* Statistiques actuelles */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-800 mb-2">Votre usage actuel :</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Aujourd'hui</div>
                <div className="font-bold text-gray-800">{currentUsage.dailyUsed}/{currentUsage.dailyLimit}</div>
              </div>
              <div>
                <div className="text-gray-600">Ce mois</div>
                <div className="font-bold text-gray-800">{currentUsage.monthlyUsed} questions</div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-6 text-center">
            <div className="text-sm text-gray-600 mb-1">Tarification transparente</div>
            <div className="text-2xl font-bold text-purple-800">Pay-as-you-use</div>
            <div className="text-sm text-purple-600">Seulement ce que vous consommez • Pas d'abonnement</div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Plus tard
            </button>
            <button
              onClick={onUpgrade}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all font-medium flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// PATH: frontend/ecolojiaFrontV3/src/components/chat/UsageTracker.tsx

import React from 'react';
import { TrendingUp, Clock, Calculator, Crown, AlertTriangle } from 'lucide-react';
import { type UserTier } from '../../services/ai/DeepSeekECOLOJIAService';

interface UsageTrackerProps {
  userTier: UserTier;
  stats: {
    dailyUsed: number;
    dailyLimit: number;
    monthlyUsed: number;
    totalCost: number;
    categories: string[];
  };
  onUpgrade?: () => void;
  compact?: boolean;
}

export const UsageTracker: React.FC<UsageTrackerProps> = ({
  userTier,
  stats,
  onUpgrade,
  compact = false
}) => {
  const usagePercentage = userTier === 'free' ? (stats.dailyUsed / stats.dailyLimit) * 100 : 0;
  const isNearLimit = userTier === 'free' && stats.dailyUsed >= stats.dailyLimit - 1;
  const isAtLimit = userTier === 'free' && stats.dailyUsed >= stats.dailyLimit;

  if (compact) {
    return (
      <div className="text-right">
        {userTier === 'free' ? (
          <div>
            <div className={`text-lg font-bold ${isAtLimit ? 'text-red-300' : 'text-white'}`}>
              {stats.dailyLimit - stats.dailyUsed}/{stats.dailyLimit}
            </div>
            <div className="text-xs opacity-75">questions restantes</div>
            {isNearLimit && (
              <button
                onClick={onUpgrade}
                className="text-xs text-yellow-300 hover:text-yellow-100 mt-1"
              >
                🔓 Upgrade
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="text-lg font-bold">{stats.monthlyUsed}</div>
            <div className="text-xs opacity-75">questions ce mois</div>
            <div className="text-xs mt-1">💰 {stats.totalCost.toFixed(4)}€</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          {userTier === 'premium' ? (
            <Crown className="w-4 h-4 text-purple-500" />
          ) : (
            <Clock className="w-4 h-4 text-gray-500" />
          )}
          Usage {userTier === 'premium' ? 'Premium' : 'Gratuit'}
        </h3>
        
        {userTier === 'free' && onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors"
          >
            Upgrade
          </button>
        )}
      </div>

      {userTier === 'free' ? (
        <div>
          {/* Utilisation quotidienne */}
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Aujourd'hui</span>
              <span className={`font-medium ${isAtLimit ? 'text-red-600' : 'text-gray-800'}`}>
                {stats.dailyUsed}/{stats.dailyLimit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              ></div>
            </div>
            {isAtLimit && (
              <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                <AlertTriangle className="w-3 h-3" />
                Limite atteinte
              </div>
            )}
          </div>

          {/* Statistiques mensuelles */}
          <div className="text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Ce mois</span>
              <span>{stats.monthlyUsed} questions</span>
            </div>
            <div className="flex justify-between">
              <span>Catégories</span>
              <span>Alimentaire uniquement</span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Usage Premium */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Questions</div>
              <div className="font-bold text-gray-800 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stats.monthlyUsed}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Coût</div>
              <div className="font-bold text-green-600 flex items-center gap-1">
                <Calculator className="w-3 h-3" />
                {stats.totalCost.toFixed(4)}€
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Catégories actives</span>
              <span>{stats.categories.length || 1}/3</span>
            </div>
            <div className="flex justify-between">
              <span>DeepSeek Model</span>
              <span>Reasoner (Expert)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};