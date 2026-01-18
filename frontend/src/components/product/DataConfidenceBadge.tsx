import React from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface DataConfidenceProps {
  dataConfidence?: {
    level: 'high' | 'medium' | 'low';
    score: number;
    missing: string[];
    present: string[];
    message: string;
  };
}

const DataConfidenceBadge: React.FC<DataConfidenceProps> = ({ dataConfidence }) => {
  if (!dataConfidence) return null;

  const { level, score, message, missing } = dataConfidence;

  const config = {
    high: {
      icon: CheckCircle,
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      iconColor: 'text-green-600',
      label: 'Donnees fiables'
    },
    medium: {
      icon: AlertCircle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      label: 'Donnees partielles'
    },
    low: {
      icon: AlertTriangle,
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      iconColor: 'text-red-600',
      label: 'Donnees limitees'
    }
  };

  const { icon: Icon, bg, border, text, iconColor, label } = config[level] || config.medium;

  const missingLabels: Record<string, string> = {
    nutrition: 'Nutrition',
    nutrition_incomplete: 'Nutrition incomplete',
    additifs: 'Additifs',
    ingredients: 'Ingredients',
    categorie: 'Categorie',
    nova: 'Score NOVA',
    nutriscore: 'Nutri-Score'
  };

  return (
    <div className={`${bg} ${border} border rounded-lg p-3 mb-4`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className={`font-medium ${text}`}>{label}</span>
        <span className={`text-sm ${text} opacity-70`}>({score}/100)</span>
      </div>
      
      {missing.length > 0 && level !== 'high' && (
        <div className="mt-2 flex items-start gap-2">
          <Info className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            Donnees manquantes : {missing.map(m => missingLabels[m] || m).join(', ')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DataConfidenceBadge;
