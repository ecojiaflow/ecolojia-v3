import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';

interface ScoreBarProps {
  label: string;
  score: number;
  description?: string;
  detailedInfo?: React.ReactNode; // Composant React, pas string HTML
}

export const ScoreBar: React.FC<ScoreBarProps> = ({ 
  label, 
  score, 
  description,
  detailedInfo
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const percentage = Math.max(0, Math.min(100, score));
  
  const getColorClasses = (s: number) => {
    if (s >= 70) return { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-200', bgLight: 'bg-green-50' };
    if (s >= 50) return { bg: 'bg-green-300', text: 'text-green-600', border: 'border-green-100', bgLight: 'bg-green-50' };
    if (s >= 30) return { bg: 'bg-orange-400', text: 'text-orange-700', border: 'border-orange-200', bgLight: 'bg-orange-50' };
    if (s > 0) return { bg: 'bg-red-500', text: 'text-red-700', border: 'border-red-200', bgLight: 'bg-red-50' };
    return { bg: 'bg-gray-300', text: 'text-gray-500', border: 'border-gray-200', bgLight: 'bg-gray-50' };
  };

  const getIcon = (s: number) => {
    if (s >= 70) return <CheckCircle className="w-5 h-5" />;
    if (s >= 50) return <CheckCircle className="w-5 h-5" />;
    if (s >= 30) return <AlertTriangle className="w-5 h-5" />;
    if (s > 0) return <XCircle className="w-5 h-5" />;
    return null;
  };

  const colors = getColorClasses(score);

  if (score === 0) {
    return (
      <div className="py-3 opacity-50">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-500">{label}</span>
          <span className="text-sm text-gray-400">Non disponible</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full" />
      </div>
    );
  }

  return (
    <div className={`mb-2 border ${colors.border} rounded-lg overflow-hidden transition-all`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left py-3 px-4 ${colors.bgLight} hover:bg-opacity-80 transition-all`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={colors.text}>{getIcon(score)}</span>
            <span className="font-semibold text-gray-800 text-sm">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-base font-bold ${colors.text}`}>
              {score}/100
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className={`${colors.bg} h-full rounded-full transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {description && !isOpen && (
          <p className="text-xs text-gray-600 mt-2">{description}</p>
        )}
      </button>

      {isOpen && detailedInfo && (
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          {detailedInfo}
        </div>
      )}
    </div>
  );
};
