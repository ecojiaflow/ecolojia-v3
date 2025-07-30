// frontend/src/components/premium/CircularScoreGauge.jsx

import React, { useEffect, useState } from 'react';

const CircularScoreGauge = ({ 
  score, 
  maxScore = 100, 
  label = "Score", 
  subtitle = "", 
  color = "#22c55e", 
  size = 200,
  strokeWidth = 8,
  animationDuration = 2000 
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [score]);

  // Calculs pour le cercle
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / maxScore) * circumference;

  // Couleur dynamique selon le score
  const getScoreColor = (score) => {
    if (score >= 70) return '#22c55e'; // Vert
    if (score >= 40) return '#f59e0b'; // Orange
    return '#ef4444'; // Rouge
  };

  const scoreColor = color || getScoreColor(score);

  // Animation CSS pour l'effet "pulsation"
  const glowKeyframes = `
    @keyframes scoreGlow {
      0%, 100% { filter: drop-shadow(0 0 10px ${scoreColor}30); }
      50% { filter: drop-shadow(0 0 20px ${scoreColor}60); }
    }
  `;

  return (
    <div className="relative flex flex-col items-center">
      <style>{glowKeyframes}</style>
      
      {/* Container SVG */}
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{ animation: 'scoreGlow 3s ease-in-out infinite' }}
        >
          {/* Cercle de fond */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="backdrop-blur-sm"
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
            className="transition-all duration-2000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${scoreColor}40)`,
              transition: `stroke-dashoffset ${animationDuration}ms ease-out`
            }}
          />
          
          {/* Gradient pour effet premium */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={scoreColor} stopOpacity="1" />
              <stop offset="100%" stopColor={scoreColor} stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Contenu Central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div 
            className="text-4xl font-bold transition-all duration-1000"
            style={{ color: scoreColor }}
          >
            {animatedScore}
          </div>
          <div className="text-sm text-gray-400 font-medium">
            / {maxScore}
          </div>
        </div>

        {/* Effet de brillance (optionnel) */}
        <div 
          className="absolute inset-0 rounded-full opacity-20 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${scoreColor}20 0%, transparent 70%)`
          }}
        />
      </div>

      {/* Labels */}
      <div className="mt-4 text-center">
        <div className="text-lg font-bold text-white">
          {label}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-400 mt-1">
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
        <span className="text-xs text-gray-400">
          {score >= 70 ? 'Excellent' : score >= 40 ? 'Correct' : 'À améliorer'}
        </span>
      </div>
    </div>
  );
};

export default CircularScoreGauge;