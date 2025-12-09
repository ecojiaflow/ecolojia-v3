import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ScoreBadgeProps {
  score: number | null;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

/**
 * Badge visuel affichant le niveau de qualité selon le score
 * Excellent (80-100) / Bon (60-79) / Moyen (40-59) / À éviter (0-39)
 */
export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ 
  score, 
  size = 'medium',
  showLabel = true 
}) => {
  if (score === null || score === undefined) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
        <span className="text-sm text-gray-600">Score non disponible</span>
      </div>
    );
  }

  // Déterminer le niveau selon le score
  const getScoreLevel = (score: number) => {
    if (score >= 80) return {
      label: 'Excellent',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    };
    if (score >= 60) return {
      label: 'Bon',
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      borderColor: 'border-emerald-300',
      icon: CheckCircle,
      iconColor: 'text-emerald-600'
    };
    if (score >= 40) return {
      label: 'Moyen',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-300',
      icon: AlertTriangle,
      iconColor: 'text-yellow-600'
    };
    return {
      label: 'À éviter',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      icon: XCircle,
      iconColor: 'text-red-600'
    };
  };

  const level = getScoreLevel(score);
  const Icon = level.icon;

  // Tailles
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  return (
    <div 
      className={`inline-flex items-center gap-2 ${level.bgColor} ${level.borderColor} border rounded-full ${sizeClasses[size]} font-medium ${level.color}`}
      title={`Score: ${score}/100 - ${level.label}`}
    >
      <Icon className={`${iconSizes[size]} ${level.iconColor}`} />
      {showLabel && <span>{level.label}</span>}
      <span className="font-bold">{score}/100</span>
    </div>
  );
};
