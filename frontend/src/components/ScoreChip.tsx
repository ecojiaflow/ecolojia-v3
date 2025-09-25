import React from "react";

type Props = {
  score?: number | null;  // 0..100 ou score éthique 0..1
  ariaLabel?: string;
  className?: string;
  type?: 'percentage' | 'ethical'; // pour s'adapter aux 2 types de scores
};

function normalizeScore(score: number, type: 'percentage' | 'ethical' = 'percentage') {
  if (Number.isNaN(score)) return 0;
  
  // Si c'est un score éthique (0-1), convertir en pourcentage
  if (type === 'ethical' && score <= 1) {
    return Math.round(score * 100);
  }
  
  // Sinon, clamp entre 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const ScoreChip: React.FC<Props> = ({ 
  score, 
  ariaLabel, 
  className = "",
  type = 'percentage'
}) => {
  const hasScore = typeof score === "number" && Number.isFinite(score);
  const normalizedScore = hasScore ? normalizeScore(score as number, type) : 0;

  // Couleur douce en fonction du score (rouge -> jaune -> vert)
  const hue = Math.round((normalizedScore / 100) * 120); // 0=rouge, 120=vert
  const bg = `hsl(${hue} 70% 35% / 0.12)`;
  const border = `hsl(${hue} 70% 35% / 0.24)`;
  const text = `hsl(${hue} 70% 25%)`;

  return (
    <span
      role="status"
      aria-label={ariaLabel ?? (hasScore ? `Score ${normalizedScore} sur 100` : "Score indisponible")}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm font-medium select-none shadow-sm backdrop-blur-sm ${className}`}
      style={{ backgroundColor: bg, borderColor: border, color: text }}
      title={hasScore ? `Score : ${normalizedScore}/100` : "Score non disponible"}
    >
      <span aria-hidden="true">●</span>
      {hasScore ? `${normalizedScore}/100` : "N/A"}
    </span>
  );
};

export default ScoreChip;
