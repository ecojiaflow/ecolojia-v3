import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ConstitutionProps {
  constitution: any;
}

export const Constitution: React.FC<ConstitutionProps> = ({ constitution }) => {
  if (!constitution) return null;

  const { whatIsIt, healthReflex, actions, associatedHabit } = constitution;

  return (
    <div className="space-y-4">
      {/* Carte 1 : Ce que c'est vraiment */}
      {whatIsIt && (
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-lg p-4 border border-blue-100">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-2xl">{whatIsIt.icon}</span>
            <span>{whatIsIt.title}</span>
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{whatIsIt.content}</p>
        </div>
      )}

      {/* Carte 2 : Le bon réflexe santé */}
      {healthReflex && (
        <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-4 border border-green-100">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-2xl">{healthReflex.icon}</span>
            <span>{healthReflex.title}</span>
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{healthReflex.content}</p>
        </div>
      )}

      {/* Carte 3 : Actions possibles */}
      {actions && (
        <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-4 border border-purple-100">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="text-2xl">{actions.icon}</span>
            <span>{actions.title}</span>
          </h4>
          <p className="text-sm text-gray-700 mb-3">{actions.content}</p>
          {actions.items && actions.items.length > 0 && (
            <div className="space-y-2">
              {actions.items.map((action: any, idx: number) => (
                <button
                  key={idx}
                  className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all text-sm flex items-center gap-2"
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Habitude associée */}
      {associatedHabit && (
        <div className="bg-gradient-to-br from-yellow-50 to-white rounded-lg p-4 border-2 border-yellow-400">
          <div className="text-center">
            <div className="text-3xl mb-2">🏆</div>
            <p className="text-xs uppercase tracking-wide text-yellow-700 font-semibold mb-1">
              Habitude associée
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {associatedHabit.title}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
