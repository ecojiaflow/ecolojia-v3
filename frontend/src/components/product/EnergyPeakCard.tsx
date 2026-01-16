import React from 'react';
import { Zap, Lightbulb, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EnergyPeakTip {
  show: boolean;
  reason: string;
  confidence: 'low' | 'medium' | 'high';
}

interface Props {
  energyPeakTip: EnergyPeakTip;
}

const EnergyPeakCard: React.FC<Props> = ({ energyPeakTip }) => {
  if (!energyPeakTip?.show) return null;

  const { reason, confidence } = energyPeakTip;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4">
        <div className="flex items-center gap-2 text-white">
          <Zap className="w-5 h-5" />
          <h3 className="font-semibold">Limiter les pics d'energie</h3>
        </div>
        <p className="text-amber-100 text-sm mt-1">{reason}</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Message principal */}
        <p className="text-gray-700 text-sm leading-relaxed">
          Consomme seul ou souvent, ce produit peut entrainer des variations d'energie.
        </p>

        {/* Conseils */}
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-amber-900 text-sm">Pour lisser l'effet</span>
          </div>
          
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>L'associer a des fibres (fruit entier, cereales completes)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>Ajouter une source de proteines (yaourt, oeuf, fromage blanc)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>Eviter de cumuler plusieurs produits sucres au meme moment</span>
            </li>
          </ul>
        </div>

        {/* Message signature */}
        <p className="text-xs text-gray-500 italic text-center">
          L'ordre et l'association des aliments comptent plus que l'aliment seul.
        </p>

        {/* CTA vers Reperes */}
        <Link 
          to="/learn/reperes#glucides"
          className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <span className="text-sm font-medium text-gray-700">Comprendre : sucres & energie</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
};

export default EnergyPeakCard;
