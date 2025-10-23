// Échelle scientifique optimale (Yuka-inspired + Standards académiques)
// Basée sur notation française (/20) et psychologie comportementale
// 
// 🔴 0-35   : MAUVAIS      - À éviter (<7/20)
// 🟠 36-55  : PASSABLE     - Limiter (7-11/20)
// 🟢 56-75  : BON          - Recommandé quotidien (11-15/20)
// 🟢 76-100 : EXCELLENT    - Choix optimal (15-20/20)

export const getScoreColor = (score: number): string => {
  if (score >= 76) return 'text-green-700';   // Excellent 76-100
  if (score >= 56) return 'text-green-500';   // Bon 56-75
  if (score >= 36) return 'text-orange-500';  // Passable 36-55
  return 'text-red-600';                      // Mauvais 0-35
};

export const getScoreBgColor = (score: number): string => {
  if (score >= 76) return 'bg-green-100';
  if (score >= 56) return 'bg-green-50';
  if (score >= 36) return 'bg-orange-100';
  return 'bg-red-100';
};

export const getScoreBorderColor = (score: number): string => {
  if (score >= 76) return 'border-green-700';
  if (score >= 56) return 'border-green-500';
  if (score >= 36) return 'border-orange-500';
  return 'border-red-600';
};