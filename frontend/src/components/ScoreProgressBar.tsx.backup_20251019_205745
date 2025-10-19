import React from 'react';

interface ScoreProgressBarProps {
  score: number;
}

export const ScoreProgressBar: React.FC<ScoreProgressBarProps> = ({ score }) => {
  const getScoreLabel = (score: number): string => {
    if (score >= 76) return 'Excellent';
    if (score >= 56) return 'Bon';
    if (score >= 36) return 'Passable';
    return 'Mauvais';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 76) return 'bg-green-600';
    if (score >= 56) return 'bg-green-500';
    if (score >= 36) return 'bg-orange-500';
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
        <span className='text-orange-500 font-medium'>36 Passable</span>
        <span className='text-green-500 font-medium'>56 Bon</span>
        <span className='text-green-700 font-medium'>76 Excellent</span>
      </div>
    </div>
  );
};