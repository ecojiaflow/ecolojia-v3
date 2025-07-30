import React from 'react';
import { Leaf } from 'lucide-react';

interface Props {
  score: number;
  className?: string;
  confidenceColor?: "green" | "yellow" | "red";
}

const EcoScoreBadge: React.FC<Props> = ({ score, className = '', confidenceColor }) => {
  const getColorClass = () => {
    if (confidenceColor) {
      switch (confidenceColor) {
        case 'green':
          return 'bg-green-100 text-green-800';
        case 'yellow':
          return 'bg-yellow-100 text-yellow-800';
        case 'red':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }

    if (score >= 0.8) return 'bg-eco-leaf text-white';
    if (score >= 0.6) return 'bg-eco-glow text-white';
    if (score >= 0.4) return 'bg-yellow-400 text-white';
    if (score >= 0.2) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getColorClass()} ${className}`}
      title={`Score écologique : ${(score * 100).toFixed(0)}%`}
    >
      <Leaf size={12} className="mr-1" />
      {(score * 100).toFixed(0)}%
    </span>
  );
};

export default EcoScoreBadge;

