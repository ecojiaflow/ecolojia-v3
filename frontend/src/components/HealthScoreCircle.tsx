// PATH: frontend/src/components/HealthScoreCircle.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface HealthScoreCircleProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  animated?: boolean;
}

const HealthScoreCircle: React.FC<HealthScoreCircleProps> = ({
  score,
  size = 'medium',
  showLabel = true,
  animated = true
}) => {
  // Dimensions selon la taille
  const dimensions = {
    small: { width: 80, strokeWidth: 6, fontSize: 'text-lg' },
    medium: { width: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    large: { width: 160, strokeWidth: 10, fontSize: 'text-3xl' }
  };

  const { width, strokeWidth, fontSize } = dimensions[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Couleur selon le score
  const getColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // green-500
    if (score >= 60) return '#eab308'; // yellow-500
    if (score >= 40) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  // Icône selon le score
  const getIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 60) return Heart;
    if (score >= 40) return AlertCircle;
    return XCircle;
  };

  // Label selon le score
  const getLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'Faible';
  };

  const color = getColor(score);
  const Icon = getIcon(score);
  const label = getLabel(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width }}>
        {/* Cercle de fond */}
        <svg
          className="transform -rotate-90"
          width={width}
          height={width}
        >
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Cercle de progression */}
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

        {/* Contenu central */}
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

      {/* Label */}
      {showLabel && (
        <motion.div
          className="mt-2 text-center"
          initial={animated ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm font-medium" style={{ color }}>
            {label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Score santé
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default HealthScoreCircle;