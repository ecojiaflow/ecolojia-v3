// PATH: frontend/src/components/NovaBadge.tsx
import React from 'react';

interface NovaBadgeProps {
  novaLevel: 1 | 2 | 3 | 4;
  className?: string;
}

const NovaBadge: React.FC<NovaBadgeProps> = ({ novaLevel, className = '' }) => {
  const getNovaConfig = (level: 1 | 2 | 3 | 4) => {
    switch (level) {
      case 1:
        return {
          color: 'bg-green-500',
          textColor: 'text-white',
          icon: '🍎',
          label: 'Naturel'
        };
      case 2:
        return {
          color: 'bg-yellow-500',
          textColor: 'text-white',
          icon: '🥄',
          label: 'Culinaire'
        };
      case 3:
        return {
          color: 'bg-orange-500',
          textColor: 'text-white',
          icon: '⚠️',
          label: 'Transformé'
        };
      case 4:
      default:
        return {
          color: 'bg-red-500',
          textColor: 'text-white',
          icon: '🚫',
          label: 'Ultra-transformé'
        };
    }
  };

  const config = getNovaConfig(novaLevel);

  return (
    <div className={`inline-flex items-center space-x-2 ${config.color} rounded-xl px-4 py-2 ${className}`}>
      <span className="text-lg">{config.icon}</span>
      <div className={`${config.textColor}`}>
        <div className="text-sm font-bold">NOVA {novaLevel}</div>
        <div className="text-xs opacity-90">{config.label}</div>
      </div>
    </div>
  );
};

export default NovaBadge;
// EOF
