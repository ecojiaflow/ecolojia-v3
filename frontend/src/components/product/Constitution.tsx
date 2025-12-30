import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ConstitutionCard {
  title: string;
  content: string;
  emoji?: string;
}

interface Constitution {
  cards: ConstitutionCard[];
  level?: number;
  sublevel?: string;
  habit?: { id: string; title: string };
}

export const Constitution: React.FC<{ constitution: Constitution }> = ({ constitution }) => {
  const { cards, level = 2, sublevel, habit } = constitution;

  const getLevelConfig = () => {
    if (level === 1) {
      return {
        badge: 'Acceptable',
        subtitle: 'Intégrer dans une alimentation variée',
        Icon: CheckCircle2,
        colors: 'text-green-600 bg-green-50 border-l-green-500'
      };
    }
    if (level === 3) {
      const isOccasions = sublevel === 'occasions';
      return {
        badge: isOccasions ? 'À réserver aux occasions' : 'À limiter fortement',
        subtitle: isOccasions ? 'Transformation et additifs' : 'Usage régulier non recommandé',
        Icon: isOccasions ? AlertTriangle : XCircle,
        colors: isOccasions ? 'text-orange-600 bg-orange-50 border-l-orange-500' : 'text-red-600 bg-red-50 border-l-red-500'
      };
    }
    return {
      badge: 'À limiter au quotidien',
      subtitle: 'En cas de consommation régulière',
      Icon: AlertCircle,
      colors: 'text-yellow-600 bg-yellow-50 border-l-yellow-500'
    };
  };

  const config = getLevelConfig();
  const { Icon } = config;

  return (
    <div className="space-y-4">
      <div className={`border-l-4 ${config.colors} p-4 rounded-r-lg`}>
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">{config.badge}</p>
            <p className="text-sm text-gray-600 mt-1">{config.subtitle}</p>
            {habit && (
              <p className="text-xs text-gray-500 mt-2">💡 Habitude : {habit.title}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-white border rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              {card.emoji && <span className="text-lg">{card.emoji}</span>}
              <span>{card.title}</span>
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {card.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
