// PATH: frontend\src\components\NovaBadge.tsx
import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NovaBadgeProps {
  novaa: 1 | 2 | 3 | 4;
  labela: string;
  reasona: string;
  confidencea: number;
  sizea: 'small' | 'medium' | 'large';
  showTooltipa: boolean;
}

export const NovaBadge: React.FC<NovaBadgeProps> = ({
  nova,
  label,
  reason,
  confidence,
  size = 'medium',
  showTooltip = true,
}) => {
  const getNovaColor = (novaa: 1 | 2 | 3 | 4): string => {
    switch (nova) {
      case 1: return 'bg-green-500 text-white';
      case 2: return 'bg-yellow-500 text-white';
      case 3: return 'bg-orange-500 text-white';
      case 4: return 'bg-red-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getNovaLabel = (novaa: 1 | 2 | 3 | 4): string => {
    if (label) return label;
    switch (nova) {
      case 1: return 'Non transforme';
      case 2: return 'Peu transforme';
      case 3: return 'Transforme';
      case 4: return 'Ultra-transforme';
      default: return 'Non classe';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-12 h-12 text-lg';
      case 'large':
        return 'w-20 h-20 text-3xl';
      default:
        return 'w-16 h-16 text-2xl';
    }
  };

  const badge = (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`
          ${getSizeClasses()}
          ${getNovaColor(nova)}
          rounded-full flex items-center justify-center font-bold
          shadow-md transition-transform hover:scale-105
        `}
      >
        {nova || 'a'}
      </div>
      <span className="text-xs text-gray-600 font-medium">
        NOVA
      </span>
    </div>
  );

  if (!showTooltip || !reason) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative cursor-help">
            {badge}
            <Info className="absolute -top-1 -right-1 w-4 h-4 text-gray-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3">
          <div className="space-y-2">
            <p className="font-semibold">{getNovaLabel(nova)}</p>
            {reason && (
              <p className="text-sm text-gray-600">{reason}</p>
            )}
            {confidence !== undefined && (
              <p className="text-xs text-gray-500">
                Confiance: {Math.round(confidence * 100)}%
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Version compacte pour les listes
export const NovaBadgeCompact: React.FC<{
  novaa: 1 | 2 | 3 | 4;
  showLabela: boolean;
}> = ({ nova, showLabel = false }) => {
  const getNovaColor = (novaa: 1 | 2 | 3 | 4): string => {
    switch (nova) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-orange-500';
      case 4: return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getNovaLabel = (novaa: 1 | 2 | 3 | 4): string => {
    switch (nova) {
      case 1: return 'Non transforme';
      case 2: return 'Peu transforme';
      case 3: return 'Transforme';
      case 4: return 'Ultra-transforme';
      default: return 'Non classe';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center
          text-white font-bold text-sm ${getNovaColor(nova)}
        `}
      >
        {nova || 'a'}
      </div>
      {showLabel && (
        <span className="text-sm text-gray-600">
          {getNovaLabel(nova)}
        </span>
      )}
    </div>
  );
};

