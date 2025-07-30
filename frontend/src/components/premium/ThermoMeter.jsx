// frontend/src/components/premium/ThermoMeter.jsx

import React, { useEffect, useState } from 'react';

const ThermoMeter = ({ 
  value, 
  max = 100, 
  label = "", 
  gradient = ['#3b82f6', '#f59e0b', '#ef4444'], 
  height = 200,
  width = 40,
  animationDuration = 2000 
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  // Calculer la hauteur du liquide
  const fillHeight = (animatedValue / max) * (height - 40);
  const fillPercentage = (animatedValue / max) * 100;

  // Déterminer la couleur selon la valeur
  const getColorByValue = (val) => {
    const percentage = val / max;
    if (percentage <= 0.33) return gradient[0]; // Bleu (bon)
    if (percentage <= 0.66) return gradient[1]; // Orange (moyen)
    return gradient[2]; // Rouge (mauvais)
  };

  const currentColor = getColorByValue(animatedValue);

  // Créer un gradient ID unique
  const gradientId = `thermo-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col items-center">
      <svg 
        width={width + 40} 
        height={height + 60}
        className="overflow-visible"
      >
        <defs>
          {/* Gradient vertical pour le thermomètre */}
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="50%" stopColor={gradient[1]} />
            <stop offset="100%" stopColor={gradient[2]} />
          </linearGradient>
          
          {/* Filtre glow */}
          <filter id="thermoglow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Container du thermomètre */}
        <g transform="translate(20, 20)">
          
          {/* Bordure extérieure */}
          <rect
            x="0"
            y="0"
            width={width}
            height={height}
            rx="20"
            ry="20"
            fill="rgba(255, 255, 255, 0.05)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="2"
          />

          {/* Fond interne */}
          <rect
            x="4"
            y="4"
            width={width - 8}
            height={height - 8}
            rx="16"
            ry="16"
            fill="rgba(0, 0, 0, 0.3)"
          />

          {/* Remplissage animé */}
          <rect
            x="4"
            y={height - 4 - fillHeight}
            width={width - 8}
            height={fillHeight}
            rx="16"
            ry="16"
            fill={currentColor}
            filter="url(#thermoglow)"
            className="transition-all duration-2000 ease-out"
            style={{
              transition: `height ${animationDuration}ms ease-out, y ${animationDuration}ms ease-out`
            }}
          />

          {/* Graduations */}
          {Array.from({ length: 5 }, (_, i) => {
            const y = (height * i) / 4;
            const tickValue = max - (max * i) / 4;
            return (
              <g key={i}>
                {/* Ligne de graduation */}
                <line
                  x1={width}
                  y1={y}
                  x2={width + 8}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.4)"
                  strokeWidth="1"
                />
                {/* Valeur */}
                <text
                  x={width + 12}
                  y={y}
                  textAnchor="start"
                  dominantBaseline="middle"
                  className="text-xs fill-gray-400"
                >
                  {Math.round(tickValue)}
                </text>
              </g>
            );
          })}

          {/* Bulle thermomètre en bas */}
          <circle
            cx={width / 2}
            cy={height - 12}
            r="12"
            fill={currentColor}
            filter="url(#thermoglow)"
            className="animate-pulse"
          />

          {/* Indicateur de valeur actuelle */}
          <g transform={`translate(${width + 15}, ${height - 4 - fillHeight})`}>
            {/* Flèche indicatrice */}
            <polygon
              points="0,0 8,4 8,-4"
              fill={currentColor}
              filter="url(#thermoglow)"
            />
            {/* Fond valeur */}
            <rect
              x="10"
              y="-10"
              width="30"
              height="20"
              rx="10"
              fill="rgba(0, 0, 0, 0.8)"
              stroke={currentColor}
              strokeWidth="1"
            />
            {/* Valeur actuelle */}
            <text
              x="25"
              y="0"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-bold fill-white"
            >
              {Math.round(animatedValue)}
            </text>
          </g>
        </g>
      </svg>

      {/* Label */}
      {label && (
        <div className="mt-2 text-center">
          <div className="text-sm font-medium text-gray-300">
            {label}
          </div>
        </div>
      )}

      {/* Indicateur de statut */}
      <div className="mt-2 flex items-center space-x-2">
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: currentColor }}
        />
        <span className="text-xs text-gray-400">
          {fillPercentage <= 33 ? 'Optimal' : fillPercentage <= 66 ? 'Modéré' : 'Élevé'}
        </span>
      </div>
    </div>
  );
};

export default ThermoMeter;