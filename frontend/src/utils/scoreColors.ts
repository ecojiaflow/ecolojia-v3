export const getScoreColor = (score: number): string => {
  if (score >= 51) return 'text-green-600';
  if (score >= 31) return 'text-yellow-500';
  if (score >= 15) return 'text-orange-500';
  return 'text-red-600';
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 51) return 'bg-green-100';
  if (score >= 31) return 'bg-yellow-100';
  if (score >= 15) return 'bg-orange-100';
  return 'bg-red-100';
};

export const getScoreBorderColor = (score: number): string => {
  if (score >= 51) return 'border-green-600';
  if (score >= 31) return 'border-yellow-500';
  if (score >= 15) return 'border-orange-500';
  return 'border-red-600';
};
