// frontend/src/components/CircularScoreGaugeLight.jsx

import React, { useEffect, useState } from 'react';

const CircularScoreGaugeLight = ({ 
  score, 
  maxScore = 100, 
  label = "Score", 
  subtitle = "", 
  color = "#7DDE4A", 
  size = 200 
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [score]);

  // Calculs pour le cercle
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / maxScore) * circumference;

  // Couleur dynamique selon le score
  const getScoreColor = (score) => {
    if (score >= 70) return '#7DDE4A'; // Vert ECOLOJIA
    if (score >= 40) return '#FFA726'; // Orange
    return '#FF7043'; // Rouge corail
  };

  const scoreColor = color || getScoreColor(score);

  return (
    <div className="flex flex-col items-center">
      
      {/* Container SVG */}
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Cercle de fond */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E9F8DF"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Cercle de progression */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 2s ease-out'
            }}
          />
        </svg>

        {/* Contenu Central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div 
            className="text-4xl font-bold transition-all duration-1000"
            style={{ color: scoreColor }}
          >
            {animatedScore}
          </div>
          <div className="text-sm text-gray-500 font-medium">
            / {maxScore}
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="mt-4 text-center">
        <div className="text-lg font-bold text-gray-800">
          {label}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-500 mt-1">
            {subtitle}
          </div>
        )}
      </div>

      {/* Indicateur de performance */}
      <div className="mt-3 flex items-center space-x-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: scoreColor }}
        />
        <span className="text-xs text-gray-500">
          {score >= 70 ? 'Excellent' : score >= 40 ? 'Correct' : 'À améliorer'}
        </span>
      </div>
    </div>
  );
};

export default CircularScoreGaugeLight;