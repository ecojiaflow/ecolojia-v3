// frontend/src/components/premium/RadarChart.jsx

import React from 'react';

const RadarChart = ({ data, maxValue = 100, size = 300 }) => {
  const center = size / 2;
  const radius = size * 0.35;
  const levels = 5; // Nombre de cercles concentriques
  
  // Calculer les positions des points
  const calculatePoint = (value, index, total) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Calculer positions des labels
  const calculateLabelPoint = (index, total) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = radius + 30;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Générer les points du polygone
  const points = data.map((item, index) => 
    calculatePoint(item.value, index, data.length)
  );

  // Créer le path pour le polygone
  const polygonPath = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  // Couleurs par niveau
  const getColorByValue = (value) => {
    if (value >= 70) return '#22c55e';
    if (value >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          {/* Gradient pour le remplissage */}
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </radialGradient>
          
          {/* Filtre glow */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Cercles concentriques de fond */}
        {Array.from({ length: levels }, (_, i) => {
          const levelRadius = (radius * (i + 1)) / levels;
          return (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={levelRadius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Lignes radiales */}
        {data.map((_, index) => {
          const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
          const endX = center + radius * Math.cos(angle);
          const endY = center + radius * Math.sin(angle);
          
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Polygone principal des données */}
        <path
          d={polygonPath}
          fill="url(#radarGradient)"
          stroke="#22c55e"
          strokeWidth="2"
          filter="url(#glow)"
          className="transition-all duration-1000 ease-out"
        />

        {/* Points de données */}
        {points.map((point, index) => (
          <g key={index}>
            {/* Cercle de fond */}
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="rgba(255, 255, 255, 0.1)"
              stroke={getColorByValue(data[index].value)}
              strokeWidth="2"
            />
            {/* Point central */}
            <circle
              cx={point.x}
              cy={point.y}
              r="3"
              fill={getColorByValue(data[index].value)}
              className="animate-pulse"
            />
          </g>
        ))}

        {/* Labels des axes */}
        {data.map((item, index) => {
          const labelPoint = calculateLabelPoint(index, data.length);
          return (
            <g key={index}>
              {/* Fond semi-transparent pour les labels */}
              <rect
                x={labelPoint.x - 35}
                y={labelPoint.y - 12}
                width="70"
                height="24"
                rx="12"
                fill="rgba(0, 0, 0, 0.6)"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
              />
              {/* Texte du label */}
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium fill-white"
              >
                {item.axis}
              </text>
            </g>
          );
        })}

        {/* Valeurs des points */}
        {points.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={point.y - 15}
            textAnchor="middle"
            className="text-xs font-bold fill-white"
          >
            {data[index].value}
          </text>
        ))}
      </svg>

      {/* Légende */}
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-300">70+ Excellent</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span className="text-gray-300">40-69 Correct</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-300">&lt;40 À améliorer</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span className="text-gray-300">Non évalué</span>
        </div>
      </div>
    </div>
  );
};

export default RadarChart;