function calculateNovaScore(novaGroup) {
  const scores = { 1: 100, 2: 75, 3: 50, 4: 25 };
  return scores[novaGroup] || 50;
}

function calculateAdditivesScore(additives = []) {
  if (additives.length === 0) return 100;
  if (additives.length <= 2) return 75;
  if (additives.length <= 5) return 50;
  return 25;
}

function calculateEthicsScore(product) {
  let score = 50;
  const isBio = product.foodData?.labels?.some(l => l.includes('bio') || l.includes('organic'));
  if (isBio) score += 25;
  const isFairTrade = product.foodData?.labels?.some(l => l.includes('fair-trade') || l.includes('equitable'));
  if (isFairTrade) score += 15;
  const hasPalmOil = product.foodData?.ingredients?.toLowerCase().includes('palm');
  if (hasPalmOil) score -= 30;
  return Math.max(0, Math.min(100, score));
}

function calculateEnvironmentScore(ecoScore) {
  const scores = { a: 90, b: 75, c: 50, d: 25, e: 10 };
  return scores[ecoScore?.toLowerCase()] || 50;
}

function calculateProductScores(product) {
  const novaScore = calculateNovaScore(product.foodData?.novaGroup);
  const additivesScore = calculateAdditivesScore(product.foodData?.additives);
  const ethicsScore = calculateEthicsScore(product);
  const environmentScore = calculateEnvironmentScore(product.foodData?.ecoScore);
  const healthScore = Math.round((novaScore + additivesScore + ethicsScore) / 3);
  const overallScore = Math.round(healthScore * 0.7 + environmentScore * 0.3);
  
  return {
    overallScore,
    healthScore,
    environmentScore,
    ethicsScore,
    breakdown: {
      nova: { score: novaScore, maxScore: 100, impact: novaScore - 50 },
      additives: { score: additivesScore, maxScore: 100, impact: additivesScore - 50 },
      ethics: { score: ethicsScore, maxScore: 100, impact: ethicsScore - 50 },
      environment: { score: environmentScore, maxScore: 100, impact: environmentScore - 50 }
    },
    metadata: {
      methodology: 'ANSES/OMS/EFSA 2025',
      version: '3.0.0',
      lastUpdate: new Date().toISOString()
    }
  };
}

module.exports = { calculateProductScores };
