// frontend/src/components/premium/DualBadgeCard.jsx

import React from 'react';

const DualBadgeCard = ({ primary, secondary }) => {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-xl">
      {/* Badge Principal (Nutri-Score) */}
      <div className="flex items-center justify-center mb-2">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
          style={{ backgroundColor: primary.color }}
        >
          {primary.label}
        </div>
      </div>
      <div className="text-xs text-center text-gray-300 mb-3">
        {primary.type}
      </div>

      {/* Séparateur */}
      <div className="w-full h-px bg-white/20 mb-3"></div>

      {/* Badge Secondaire (NOVA) */}
      <div className="flex items-center justify-center mb-2">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg border-2"
          style={{ 
            backgroundColor: secondary.color,
            borderColor: secondary.color + '80'
          }}
        >
          {secondary.label}
        </div>
      </div>
      <div className="text-xs text-center text-gray-300">
        {secondary.type}
      </div>
    </div>
  );
};

export default DualBadgeCard;