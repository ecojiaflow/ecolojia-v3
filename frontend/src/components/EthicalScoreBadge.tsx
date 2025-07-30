import React from 'react';

interface EthicalScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const EthicalScoreBadge: React.FC<EthicalScoreBadgeProps> = ({ 
  score, 
  size = 'md', 
  showLabel = true 
}) => {
  const getBadgeColor = () => {
    if (score >= 4.5) return 'bg-eco-leaf text-white';
    if (score >= 4) return 'bg-eco-glow text-eco-text';
    if (score >= 3.5) return 'bg-yellow-400 text-eco-text';
    if (score >= 3) return 'bg-yellow-500 text-eco-text';
    return 'bg-red-500 text-white';
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'sm': return 'text-xs px-2 py-0.5';
      case 'lg': return 'text-base px-4 py-2';
      default: return 'text-sm px-3 py-1.5';
    }
  };

  return (
    <div className="flex items-center">
      {showLabel && (
        <span className="mr-2 text-eco-text/80 text-sm">Score éthique:</span>
      )}
      <div className={`${getBadgeColor()} ${getBadgeSize()} rounded-full font-medium flex items-center justify-center shadow-sm`}>
        {score.toFixed(1)}
      </div>
    </div>
  );
};

export default EthicalScoreBadge;