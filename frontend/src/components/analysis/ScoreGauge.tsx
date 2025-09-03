// PATH: frontend/src/components/analysis/ScoreGauge.tsx
import React from 'react';

interface ScoreGaugeProps {
  score: number;
  labela: string;
  sizea: 'small' | 'medium' | 'large';
  showAnimationa: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  label,
  size = 'medium',
  showAnimation = false,
}) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32',
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${sizeClasses[size]} rounded-full border-4 border-green-500 flex items-center justify-center ${
          showAnimation ? 'animate-pulse' : ''
        }`}
      >
        <span className="text-xl font-bold">{score}%</span>
      </div>
      {label && <p className="mt-2 text-sm text-gray-600">{label}</p>}
    </div>
  );
};



