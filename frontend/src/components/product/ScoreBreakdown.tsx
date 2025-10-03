import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ScoreFactor {
  factor: string;
  impact: number;
  reason: string;
}

interface ScoreBreakdownProps {
  score: number;
  factors: ScoreFactor[];
}

export const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ score, factors }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
        <Info className="w-6 h-6 mr-2 text-blue-600" />
        Pourquoi ce score de {score}/100 ?
      </h2>
      
      <div className="space-y-3">
        {factors.map((factor, index) => (
          <div 
            key={index}
            className={`flex items-start gap-3 p-4 rounded-lg ${
              factor.impact > 0 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {factor.impact > 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{factor.factor}</p>
              <p className="text-sm text-gray-600 mt-1">{factor.reason}</p>
            </div>
            
            <span className={`font-bold text-lg ${
              factor.impact > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {factor.impact > 0 ? '+' : ''}{factor.impact}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-600">
          Score calculé = 100 + somme des impacts
        </p>
      </div>
    </div>
  );
};
