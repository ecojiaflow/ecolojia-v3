export const getScoreColor = (score: number): string => {
  if (score >= 70) return 'text-green-700';   // Excellent 70-100
  if (score >= 50) return 'text-green-500';   // Bon 50-69
  if (score >= 30) return 'text-orange-500';  // Moyen 30-49
  return 'text-red-600';                      // Mauvais 0-29
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 70) return 'bg-green-100';
  if (score >= 50) return 'bg-green-50';
  if (score >= 30) return 'bg-orange-100';
  return 'bg-red-100';
};

export const getScoreBorderColor = (score: number): string => {
  if (score >= 70) return 'border-green-700';
  if (score >= 50) return 'border-green-500';
  if (score >= 30) return 'border-orange-500';
  return 'border-red-600';
};
