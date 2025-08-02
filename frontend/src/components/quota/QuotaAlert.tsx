// frontend/src/components/quotas/QuotaAlert.tsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Zap, TrendingUp, Calendar } from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface QuotaAlertProps {
  quotaType: 'scans' | 'aiQuestions' | 'exports';
  currentUsage: number;
  limit: number;
  onClose?: () => void;
  onUpgrade?: () => void;
}

export const QuotaAlert: React.FC<QuotaAlertProps> = ({
  quotaType,
  currentUsage,
  limit,
  onClose,
  onUpgrade
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const percentage = limit > 0 ? (currentUsage / limit) * 100 : 0;
  const remaining = Math.max(0, limit - currentUsage);
  const isExhausted = currentUsage >= limit;
  const isWarning = percentage >= 80 && !isExhausted;

  useEffect(() => {
    // Auto-hide après 10 secondes si c'est juste un warning
    if (isWarning && !showDetails) {
      const timer = setTimeout(() => setIsVisible(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [isWarning, showDetails]);

  if (!isVisible || user?.tier === 'premium') return null;

  const quotaInfo = {
    scans: {
      title: 'Analyses de produits',
      icon: '🔍',
      resetPeriod: 'ce mois-ci',
      benefit: 'Analyses illimitées avec Premium',
      color: 'blue'
    },
    aiQuestions: {
      title: 'Questions IA',
      icon: '🤖',
      resetPeriod: "aujourd'hui",
      benefit: 'Chat IA illimité avec Premium',
      color: 'purple'
    },
    exports: {
      title: 'Exports de données',
      icon: '📊',
      resetPeriod: 'ce mois-ci',
      benefit: 'Exports illimités avec Premium',
      color: 'green'
    }
  };

  const info = quotaInfo[quotaType];
  const bgColor = isExhausted ? 'bg-red-50' : 'bg-yellow-50';
  const borderColor = isExhausted ? 'border-red-200' : 'border-yellow-200';
  const textColor = isExhausted ? 'text-red-800' : 'text-yellow-800';
  const progressColor = isExhausted ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500';

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/premium');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div className={`relative ${bgColor} ${borderColor} border rounded-lg p-4 mb-4 shadow-sm transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`flex-shrink-0 ${isExhausted ? 'animate-pulse' : ''}`}>
            <AlertTriangle className={`h-5 w-5 ${textColor}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-medium ${textColor}`}>
              {isExhausted 
                ? `Quota ${info.title.toLowerCase()} épuisé`
                : `${remaining} ${info.title.toLowerCase()} restant(es)`
              }
            </h3>
            <p className={`text-sm ${textColor} opacity-90 mt-1`}>
              Vous avez utilisé {currentUsage} sur {limit} {info.resetPeriod}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleClose}
          className={`ml-4 ${textColor} hover:opacity-70 transition-opacity`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="bg-white bg-opacity-50 rounded-full h-2 overflow-hidden">
          <div 
            className={`${progressColor} h-full transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className={textColor}>{currentUsage} utilisé(s)</span>
          <span className={textColor}>{remaining} restant(s)</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        {isExhausted ? (
          <>
            <button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center"
            >
              <Zap className="w-4 h-4 mr-2" />
              Passer à Premium
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-white bg-opacity-50 text-gray-700 rounded-lg hover:bg-opacity-70 transition-all"
            >
              {showDetails ? 'Masquer' : 'En savoir plus'}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 px-4 py-2 bg-white bg-opacity-50 text-gray-700 rounded-lg hover:bg-opacity-70 transition-all"
            >
              {showDetails ? 'Masquer détails' : 'Voir les avantages Premium'}
            </button>
            {percentage >= 90 && (
              <button
                onClick={handleUpgrade}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                Upgrade
              </button>
            )}
          </>
        )}
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-white bg-opacity-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <span className="text-2xl mr-2">{info.icon}</span>
              Avantages Premium pour {info.title.toLowerCase()}
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <TrendingUp className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{info.benefit}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Aucune limite, utilisez autant que vous voulez
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Pas de reset mensuel</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Accès continu sans interruption
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Zap className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Toutes les fonctionnalités Premium</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Dashboard avancé, export PDF, priorité support
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-700 mb-3">
                Seulement <span className="font-bold text-lg">2,49€</span>/mois
              </p>
              <button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🚀 Débloquer Premium maintenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook pour gérer les alertes de quota
export const useQuotaAlert = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Array<{
    type: 'scans' | 'aiQuestions' | 'exports';
    usage: number;
    limit: number;
  }>>([]);

  useEffect(() => {
    if (!user || user.tier === 'premium') {
      setAlerts([]);
      return;
    }

    const newAlerts = [];

    // Check scans
    const scansUsed = user.currentUsage?.scansThisMonth || 0;
    const scansLimit = user.quotas?.scansPerMonth || 30;
    if (scansUsed >= scansLimit * 0.8) {
      newAlerts.push({ type: 'scans' as const, usage: scansUsed, limit: scansLimit });
    }

    // Check AI questions
    const aiUsed = user.currentUsage?.aiQuestionsToday || 0;
    const aiLimit = user.quotas?.aiQuestionsPerDay || 0;
    if (aiLimit > 0 && aiUsed >= aiLimit * 0.8) {
      newAlerts.push({ type: 'aiQuestions' as const, usage: aiUsed, limit: aiLimit });
    }

    // Check exports
    const exportsUsed = user.currentUsage?.exportsThisMonth || 0;
    const exportsLimit = user.quotas?.exportsPerMonth || 0;
    if (exportsLimit > 0 && exportsUsed >= exportsLimit * 0.8) {
      newAlerts.push({ type: 'exports' as const, usage: exportsUsed, limit: exportsLimit });
    }

    setAlerts(newAlerts);
  }, [user]);

  return alerts;
};

export default QuotaAlert;