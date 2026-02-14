import React from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolveImpactSignals, type SignalColor } from "../../data/categoryDecisionTable";
import { ui } from "../../data/designTokens";

interface ImpactCardProps {
  subcategory?: string | null;
  categoryType?: string | null;
  nova?: number | null;
  nutriScore?: string | null;
  flags?: string[];
  additives?: string[];
  labels?: string[];
}

const SIGNAL_BG: Record<SignalColor, string> = {
  green: "bg-emerald-50",
  yellow: "bg-amber-50",
  orange: "bg-orange-50",
  red: "bg-rose-50",
};

const SIGNAL_TEXT: Record<SignalColor, string> = {
  green: "text-emerald-700",
  yellow: "text-amber-700",
  orange: "text-orange-700",
  red: "text-rose-700",
};

export const ImpactCard: React.FC<ImpactCardProps> = ({
  subcategory, categoryType, nova = null, nutriScore = null,
  flags = [], additives = [], labels = [],
}) => {
  const navigate = useNavigate();
  const isOrganic = labels.some((l) => l.toLowerCase().includes("bio") || l.toLowerCase().includes("organic"));

  const result = resolveImpactSignals(subcategory, categoryType, {
    nova, nutriScore: nutriScore?.toLowerCase() ?? null,
    isOrganic, additivesCount: additives.length, flags,
  });

  // Pas de signal = pas de carte
  if (result.signals.length === 0) return null;

  const signal = result.signals[0]; // Un seul signal principal
  const bg = SIGNAL_BG[signal.color];
  const text = SIGNAL_TEXT[signal.color];

  return (
    <button
      onClick={() => navigate(`/learn/fiche/${signal.ficheSlug}`)}
      className={`w-full ${ui.card} ${ui.cardHover} ${bg} text-left overflow-hidden`}
    >
      <div className="p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className={ui.sectionTitle}>Impact reperes</p>
          <p className={`mt-1 text-[14px] font-medium ${text} leading-snug`}>
            {signal.label}
          </p>
          {result.mainIdea && (
            <p className="mt-1 text-[12px] text-slate-500">{result.mainIdea}</p>
          )}
        </div>
        <ChevronRight className={`h-5 w-5 ${text} flex-shrink-0`} />
      </div>
    </button>
  );
};

export default ImpactCard;
