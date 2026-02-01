import React from "react";
import { ArrowRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolveImpactSignals, type SignalColor } from "../../data/categoryDecisionTable";

interface ImpactCardProps {
  subcategory?: string | null;
  categoryType?: string | null;
  nova?: number | null;
  nutriScore?: string | null;
  flags?: string[];
  additives?: string[];
  labels?: string[];
}

const STYLES: Record<SignalColor, { bg: string; border: string; text: string; dot: string }> = {
  green:  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
  yellow: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   dot: "bg-amber-500" },
  orange: { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-800",  dot: "bg-orange-500" },
  red:    { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-800",     dot: "bg-red-500" },
};

function SignalRow({ color, label, ficheSlug, onNav }: {
  color: SignalColor; label: string; ficheSlug: string; onNav: (s: string) => void;
}) {
  const s = STYLES[color];
  return (
    <button
      onClick={() => onNav(ficheSlug)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${s.bg} ${s.border} border transition-all hover:shadow-sm active:scale-[0.99]`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${s.dot} flex-shrink-0`} />
      <span className={`flex-1 text-sm font-medium ${s.text} text-left leading-snug`}>{label}</span>
      <ArrowRight className={`h-4 w-4 ${s.text} opacity-60 flex-shrink-0`} />
    </button>
  );
}

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

  if (result.signals.length === 0) return null;

  const handleNav = (slug: string) => navigate(`/learn/fiche/${slug}`);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100">
          <Info className="h-4 w-4 text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Impact reperes</p>
          {result.mainIdea && <p className="text-xs text-slate-500">{result.mainIdea}</p>}
        </div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {result.signals.map((sig) => (
          <SignalRow key={sig.id} color={sig.color} label={sig.label} ficheSlug={sig.ficheSlug} onNav={handleNav} />
        ))}
      </div>
    </div>
  );
};

export default ImpactCard;
