import React from 'react';

interface ScoreProgressBarProps {
  score: number;
}

export const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({ score }) => {
  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Bon';
    if (score >= 45) return 'Moyen';
    if (score >= 25) return 'Médiocre';
    return 'Mauvais';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 65) return 'bg-green-400';
    if (score >= 45) return 'bg-yellow-500';
    if (score >= 25) return 'bg-orange-500';
    return 'bg-red-600';
  };

  return (
    <div className='mt-4 w-full'>
      <div className='relative w-full h-8 bg-gray-200 rounded-full overflow-hidden'>
        <div
          className={'h-full transition-all duration-500 ease-out ' + getScoreColor(score)}
          style={{ width: score + '%' }}
        />
        <div className='absolute inset-0 flex items-center justify-center'>
          <span className='font-bold text-white text-sm drop-shadow-md'>
            {score}/100 - {getScoreLabel(score)}
          </span>
        </div>
      </div>
      <div className='flex justify-between mt-2 text-xs text-gray-600'>
        <span className='text-red-600 font-medium'>0 Mauvais</span>
        <span className='text-orange-500 font-medium'>25</span>
        <span className='text-yellow-500 font-medium'>45 Moyen</span>
        <span className='text-green-400 font-medium'>65 Bon</span>
        <span className='text-green-600 font-medium'>80 Excellent</span>
      </div>
    </div>
  );
};
