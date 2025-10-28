// PATH: frontend/src/components/EnvironmentScore.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, TreePine, Sprout, Factory } from 'lucide-react';

interface EnvironmentScoreProps {
  score: number;
  varianta: 'circular' | 'bar' | 'leaves';
  sizea: 'small' | 'medium' | 'large';
  showLabela: boolean;
  animateda: boolean;
}

const EnvironmentScore: React.FC<EnvironmentScoreProps> = ({
  score,
  variant = 'bar',
  size = 'medium',
  showLabel = true,
  animated = true
}) => {
  // Couleur selon le score
  const getColor = (score: number) => {
    if (score >= 70) return '#22c55e'; // green-500
    if (score >= 50) return '#84cc16'; // lime-500
    if (score >= 30) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  // Icone selon le score
  const getIcon = (score: number) => {
    if (score >= 70) return TreePine;
    if (score >= 50) return Leaf;
    if (score >= 30) return Sprout;
    return Factory;
  };

  // Label selon le score
  const getLabel = (score: number) => {
    if (score >= 70) return 'Tres ecologique';
    if (score >= 50) return 'cologique';
    if (score >= 30) return 'Impact modere';
    return 'Impact eleve';
  };

  const color = getColor(score);
  const Icon = getIcon(score);
  const label = getLabel(score);

  // Rendu selon le variant
  if (variant === 'circular') {
    const dimensions = {
      small: { width: 80, strokeWidth: 6, fontSize: 'text-lg' },
      medium: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
      large: { width: 160, strokeWidth: 10, fontSize: 'text-3xl' }
    };

    const { width, strokeWidth, fontSize } = dimensions[size];
    const radius = (width - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width, height: width }}>
          <svg className="transform -rotate-90" width={width} height={width}>
            <circle
              cx={width / 2}
              cy={width / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <motion.circle
              cx={width / 2}
              cy={width / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon className="mb-1" size={width * 0.25} style={{ color }} />
            <motion.div
              className={`font-bold ${fontSize}`}
              style={{ color }}
              initial={animated ? { scale: 0 } : { scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            >
              {score}
            </motion.div>
          </div>
        </div>
        {showLabel && (
          <motion.div
            className="mt-2 text-center"
            initial={animated ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-sm font-medium" style={{ color }}>{label}</p>
            <p className="text-xs text-neutral-700 dark:text-neutral-600">Impact environnemental</p>
          </motion.div>
        )}
      </div>
    );
  }

  if (variant === 'leaves') {
    // Variante avec feuilles
    const leafCount = Math.floor(score / 20) + 1; // 1-5 feuilles
    const leafSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={animated ? { scale: 0, rotate: -180 } : {}}
              animate={{ 
                scale: i < leafCount ? 1 : 0.5,
                rotate: 0,
                opacity: i < leafCount ? 1 : 0.3
              }}
              transition={{ delay: i * 0.1 }}
            >
              <Leaf
                size={leafSize}
                className={i < leafCount ? '' : 'text-gray-300 dark:text-gray-600'}
                style={{ color: i < leafCount ? color : undefined }}
              />
            </motion.div>
          ))}
        </div>
        {showLabel && (
          <div className="mt-2 text-center">
            <p className="text-sm font-medium" style={{ color }}>{label}</p>
            <p className="text-xs text-neutral-700 dark:text-neutral-600">Score: {score}/100</p>
          </div>
        )}
      </div>
    );
  }

  // Variant par defaut : barre de progression
  const barHeight = size === 'small' ? 'h-6' : size === 'large' ? 'h-10' : 'h-8';
  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Icon size={iconSize} style={{ color }} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Impact environnemental
          </span>
        </div>
        <span className={`text-sm font-bold`} style={{ color }}>
          {score}/100
        </span>
      </div>
      
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${barHeight}`}>
        <motion.div
          className="h-full rounded-full flex items-center justify-end px-3"
          style={{ backgroundColor: color }}
          initial={animated ? { width: 0 } : { width: `${score}%` }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {score >= 50 && (
            <motion.span
              className="text-xs font-medium text-white"
              initial={animated ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {label}
            </motion.span>
          )}
        </motion.div>
      </div>
      
      {score < 50 && showLabel && (
        <motion.p
          className="text-xs mt-1"
          style={{ color }}
          initial={animated ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
};

export default EnvironmentScore;


