import React from 'react';
import { Info, Clock, Utensils } from 'lucide-react';

interface KeyInsight {
  icon: string;
  label: string;
  value: string;
  percent: number;
  reference: string;
  level: 'high' | 'medium' | 'low' | 'positive';
}

interface DailyBalance {
  portion: {
    standard: number;
    unit: string;
    context: string;
  };
  frequency: {
    daily: { max: number; label: string };
    weekly: { max: number; label: string; isOccasional: boolean };
  };
  platePosition: {
    category: string;
    label: string;
    percent: number;
    color: string;
    emoji: string;
    isEssential: boolean;
    message: string;
  };
  keyInsights: KeyInsight[];
  sources: string[];
  disclaimer: string;
}

interface Props {
  dailyBalance: DailyBalance | null;
}

const DailyBalanceCard: React.FC<Props> = ({ dailyBalance }) => {
  if (!dailyBalance) return null;

  const { portion, frequency, platePosition, keyInsights } = dailyBalance;

  const levelStyles = {
    high: { bg: 'bg-red-50', bar: 'bg-red-500', text: 'text-red-700', border: 'border-red-200' },
    medium: { bg: 'bg-amber-50', bar: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200' },
    low: { bg: 'bg-green-50', bar: 'bg-green-500', text: 'text-green-700', border: 'border-green-200' },
    positive: { bg: 'bg-emerald-50', bar: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200' }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-4">
        <div className="flex items-center gap-2 text-white">
          <Utensils className="w-5 h-5" />
          <h3 className="font-semibold">Place dans l'équilibre</h3>
        </div>
        <p className="text-violet-100 text-sm mt-1">
          Pour 1 portion de {portion.standard}{portion.unit} ({portion.context})
        </p>
      </div>

      <div className="p-5 space-y-5">
        
        {/* Position Assiette PNNS */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: platePosition.color + '20' }}
            >
              {platePosition.emoji}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{platePosition.label}</div>
              <div className="text-sm text-gray-500">
                {platePosition.isEssential 
                  ? `${platePosition.percent}% de l'assiette équilibrée`
                  : 'Plaisir occasionnel'
                }
              </div>
            </div>
          </div>
          
          {/* Mini assiette visuelle */}
          <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-200 mb-2">
            <div className="bg-green-500" style={{ width: '50%' }} title="Légumes 50%" />
            <div className="bg-amber-400" style={{ width: '25%' }} title="Féculents 25%" />
            <div className="bg-pink-500" style={{ width: '25%' }} title="Protéines 25%" />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>Légumes 50%</span>
            <span>Féculents 25%</span>
            <span>Protéines 25%</span>
          </div>
          
          {!platePosition.isEssential && (
            <div className="mt-3 text-sm text-violet-700 bg-violet-50 rounded-lg p-3 flex items-start gap-2">
              <span>💡</span>
              <span>{platePosition.message}</span>
            </div>
          )}
        </div>

        {/* Insights - Barres de progression */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-3">Impact d'une portion sur les repères journaliers</div>
          <div className="space-y-2.5">
            {keyInsights.map((insight, idx) => {
              const styles = levelStyles[insight.level];
              const barWidth = Math.min(insight.percent, 100);
              
              return (
                <div key={idx} className={`${styles.bg} rounded-lg p-3 border ${styles.border}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{insight.icon}</span>
                      <span className="text-sm font-medium text-gray-800">{insight.label}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold ${styles.text}`}>{insight.value}</span>
                      <span className="text-gray-500 text-xs ml-1">({insight.percent}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${styles.bar} rounded-full transition-all duration-700`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{insight.reference}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fréquence */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">Fréquence adaptée</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {frequency.daily.max === 0 ? '—' : frequency.daily.max}
              </div>
              <div className="text-xs text-gray-600">portion/jour max</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-indigo-600">{frequency.weekly.max}</div>
              <div className="text-xs text-gray-600">fois/semaine max</div>
            </div>
          </div>
          
          {frequency.weekly.isOccasional && (
            <div className="mt-3 text-sm text-blue-700 flex items-center gap-2">
              <span>💡</span>
              <span>Produit plaisir à réserver aux occasions.</span>
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="flex items-start gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Sources : </span>
            {dailyBalance.sources.join(' • ')}
            <div className="mt-0.5 italic">{dailyBalance.disclaimer}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyBalanceCard;
