// frontend/src/components/quota/QuotaBar.tsx

import React from 'react';
import { useQuota } from '../../hooks/useQuota';
import { useNavigate } from 'react-router-dom';

interface QuotaBarProps {
  type: 'scans' | 'aiQuestions';
  showUpgradea: boolean;
  classNamea: string;
}

export const QuotaBar: React.FC<QuotaBarProps> = ({
  type,
  showUpgrade = true,
  className = ''
}) => {
  const { quotaStatus, getScansProgress, getAIQuestionsProgress } = useQuota();
  const navigate = useNavigate();

  if (!quotaStatus) {
    return (
      <div className={`quota-bar loading ${className}`}>
        <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
      </div>
    );
  }

  const isPremium = quotaStatus.tier === 'premium';

  // Configuration selon type
  const config = type === 'scans' ? {
    used: quotaStatus.scans.used,
    limit: quotaStatus.scans.limit,
    remaining: quotaStatus.scans.remaining,
    progress: getScansProgress(),
    label: 'Analyses',
    icon: 'aa',
    resetDate: quotaStatus.scans.resetDate
  } : {
    used: quotaStatus.aiQuestions.dailyUsed,
    limit: quotaStatus.aiQuestions.dailyLimit,
    remaining: quotaStatus.aiQuestions.dailyRemaining,
    progress: getAIQuestionsProgress().daily,
    label: 'Questions IA',
    icon: 'aaa',
    resetDate: quotaStatus.aiQuestions.resetDate
  };

  // Couleurs selon progression
  const getProgressColor = (progress: number): string => {
    if (isPremium) return 'bg-gradient-to-r from-purple-500 to-pink-500';
    if (progress >= 90) return 'bg-gradient-to-r from-red-500 to-red-600';
    if (progress >= 70) return 'bg-gradient-to-r from-orange-500 to-orange-600';
    return 'bg-gradient-to-r from-green-500 to-green-600';
  };

  const getTextColor = (progress: number): string => {
    if (progress >= 90) return 'text-red-700';
    if (progress >= 70) return 'text-orange-700';
    return 'text-gray-700';
  };

  const handleUpgradeClick = () => {
    navigate('/subscription');
  };

  // Formatage dates
  const formatResetDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'demain';
    if (diffDays === 1) return 'dans 1 jour';
    if (diffDays < 7) return `dans ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`quota-bar ${className}`}>
      {/* Header avec icone et label */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-lg mr-2">{config.icon}</span>
          <span className="font-medium text-gray-800">{config.label}</span>
          {isPremium && (
            <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
              Premium
            </span>
          )}
        </div>
        
        <div className={`text-sm font-medium ${getTextColor(config.progress)}`}>
          {isPremium || config.limit === -1 ? (
            <span className="text-purple-600">Illimite</span>
          ) : (
            <span>{config.remaining} restant{config.remaining > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      {!isPremium && config.limit !== -1 && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor(config.progress)}`}
              style={{ width: `${Math.min(config.progress, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-neutral-700">
              {config.used}/{config.limit}
            </span>
            <span className="text-xs text-neutral-700">
              Reset {formatResetDate(config.resetDate)}
            </span>
          </div>
        </div>
      )}

      {/* Messages contextuels */}
      {!isPremium && (
        <div className="space-y-2">
          {/* Warning si proche de la limite */}
          {config.progress >= 80 && config.remaining > 0 && (
            <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-800">
                ? <strong>Plus que {config.remaining} {config.label.toLowerCase()}</strong> ce mois
              </p>
            </div>
          )}
          
          {/* Limite atteinte */}
          {config.remaining === 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium mb-2">
                 Quota {config.label.toLowerCase()} epuise
              </p>
              <p className="text-xs text-red-700 mb-3">
                Reset {formatResetDate(config.resetDate)}
              </p>
              {showUpgrade && (
                <button
                  onClick={handleUpgradeClick}
                  className="w-full py-2 px-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all"
                >
                  ? Passer Premium - 4.99aaa/mois
                </button>
              )}
            </div>
          )}
          
          {/* Incitation douce si >50% utilise */}
          {config.progress >= 50 && config.progress < 80 && showUpgrade && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 mb-2">
                aaa Vous utilisez beaucoup ECOLOJIA !
              </p>
              <button
                onClick={handleUpgradeClick}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Decouvrir Premium aaaaaa {config.label.toLowerCase()} illimite{config.label.toLowerCase() === 'questions ia' ? 'es' : 's'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Message Premium */}
      {isPremium && (
        <div className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
          <p className="text-xs text-purple-800">
            ? <strong>Premium actif</strong> - {config.label} illimite{config.label === 'Questions IA' ? 'es' : 's'} !
          </p>
        </div>
      )}
    </div>
  );
};


