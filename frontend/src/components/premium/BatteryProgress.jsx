// frontend/src/components/premium/BatteryProgress.jsx

import React, { useEffect, useState } from 'react';

const BatteryProgress = ({ 
  current, 
  max, 
  label = "", 
  color = "#22c55e",
  showPercentage = true,
  animationDuration = 1500 
}) => {
  const [animatedCurrent, setAnimatedCurrent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedCurrent(current);
    }, 100);
    return () => clearTimeout(timer);
  }, [current]);

  const percentage = (animatedCurrent / max) * 100;
  
  // Couleur dynamique selon le niveau
  const getBatteryColor = (percent) => {
    if (percent > 60) return '#22c55e'; // Vert
    if (percent > 30) return '#f59e0b'; // Orange
    return '#ef4444'; // Rouge
  };

  const batteryColor = color || getBatteryColor(percentage);

  return (
    <div className="w-full">
      {/* Header avec label et valeurs */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-300">
          {label}
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-white">
            {animatedCurrent} / {max}
          </span>
          {showPercentage && (
            <span className="text-xs text-gray-400">
              ({Math.round(percentage)}%)
            </span>
          )}
        </div>
      </div>

      {/* Container Batterie */}
      <div className="relative">
        {/* Corps de la batterie */}
        <div className="flex items-center">
          <div className="flex-1 bg-white/10 rounded-lg h-8 relative overflow-hidden border border-white/20">
            {/* Fond avec effet glassmorphism */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            
            {/* Remplissage animé */}
            <div 
              className="h-full rounded-lg transition-all duration-1500 ease-out relative overflow-hidden"
              style={{ 
                width: `${percentage}%`,
                backgroundColor: batteryColor,
                transition: `width ${animationDuration}ms ease-out`
              }}
            >
              {/* Effet de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/10 to-transparent"></div>
              
              {/* Animation de flux */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full animate-pulse"></div>
            </div>

            {/* Graduations internes */}
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-white/20"
                style={{ left: `${(i + 1) * 20}%` }}
              />
            ))}
          </div>

          {/* Borne positive de la batterie */}
          <div 
            className="w-2 h-4 rounded-r-sm ml-1"
            style={{ backgroundColor: batteryColor + '80' }}
          />
        </div>

        {/* Indicateur de niveau critique */}
        {percentage <= 20 && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Barre de statut détaillée */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="text-gray-400">Utilisé</div>
          <div className="font-bold text-white">{max - current}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Restant</div>
          <div className="font-bold" style={{ color: batteryColor }}>
            {current}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-400">Total</div>
          <div className="font-bold text-white">{max}</div>
        </div>
      </div>

      {/* Messages contextuels */}
      <div className="mt-2 text-center">
        {percentage <= 10 && (
          <div className="text-xs text-red-400 animate-pulse">
            ⚠️ Quota presque épuisé
          </div>
        )}
        {percentage > 10 && percentage <= 30 && (
          <div className="text-xs text-orange-400">
            📊 Niveau bas
          </div>
        )}
        {percentage > 80 && (
          <div className="text-xs text-green-400">
            ✅ Excellent niveau
          </div>
        )}
      </div>
    </div>
  );
};

export default BatteryProgress;