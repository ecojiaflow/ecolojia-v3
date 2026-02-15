import React from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { resolveImpactSignals, type SignalColor, type ProductStatus } from "../../data/categoryDecisionTable";
import { ui } from "../../data/designTokens";

interface Props {
  subcategory?: string | null;
  categoryType?: string | null;
  nova?: number | null;
  nutriScore?: string | null;
  flags?: string[];
  additives?: string[];
  labels?: string[];
  apiLevel?: number | null;
}

const SIGNAL_BG: Record<SignalColor, string> = {
  green: "bg-emerald-50", yellow: "bg-amber-50",
  orange: "bg-orange-50", red: "bg-rose-50",
};
const SIGNAL_TEXT: Record<SignalColor, string> = {
  green: "text-emerald-700", yellow: "text-amber-700",
  orange: "text-orange-700", red: "text-rose-700",
};
const STATUS_META: Record<ProductStatus, { label: string; color: string; textColor: string; position: number }> = {
  base:       { label: "Base",        color: "bg-emerald-500", textColor: "text-emerald-700", position: 0 },
  regular:    { label: "Regulier",    color: "bg-sky-500",     textColor: "text-sky-700",     position: 1 },
  occasional: { label: "Occasionnel", color: "bg-amber-500",   textColor: "text-amber-700",   position: 2 },
  limit:      { label: "A limiter",   color: "bg-rose-500",    textColor: "text-rose-700",    position: 3 },
  unknown:    { label: "\u2014",      color: "bg-slate-400",   textColor: "text-slate-500",   position: -1 },
};

function apiLevelToStatus(level: number | null | undefined, nova: number | null): ProductStatus {
  if (level === 1) return "base";
  if (level === 2) return "regular";
  if (level === 3) return nova === 4 ? "limit" : "occasional";
  return "unknown";
}

export default function ImpactBalanceCard({
  subcategory, categoryType, nova = null, nutriScore = null,
  flags = [], additives = [], labels = [], apiLevel = null,
}: Props) {
  const navigate = useNavigate();
  const isOrganic = labels.some((l) =>
    l.toLowerCase().includes("bio") || l.toLowerCase().includes("organic")
  );

  const result = resolveImpactSignals(subcategory, categoryType, {
    nova, nutriScore: nutriScore?.toLowerCase() ?? null,
    isOrganic, additivesCount: additives.length, flags,
  });

  const resolvedStatus = apiLevel != null
    ? apiLevelToStatus(apiLevel, nova)
    : result.status;

  const tableIsUnknown = result.category === "unknown";
  const apiStatus = apiLevel != null ? apiLevelToStatus(apiLevel, nova) : null;
  const tableStatus = result.status;
  const statusConflict = apiStatus != null && apiStatus !== tableStatus
    && Math.abs(STATUS_META[apiStatus].position - STATUS_META[tableStatus].position) >= 2;
  const signal = (tableIsUnknown || statusConflict) ? null : (result.signals[0] ?? null);

  const meta = STATUS_META[resolvedStatus];
  const bg = signal ? SIGNAL_BG[signal.color] : "bg-slate-50";
  const mainIdea = tableIsUnknown ? null : result.mainIdea;

  return (
    <section className={`${ui.card} overflow-hidden`}>
      {signal && (
        <button
          onClick={() => navigate(`/learn/fiche/${signal.ficheSlug}`)}
          className={`w-full ${bg} text-left p-4 flex items-center gap-3 transition hover:brightness-[0.97]`}
        >
          <div className="flex-1 min-w-0">
            <p className={ui.sectionTitle}>Impact reperes</p>
            <p className={`mt-1 text-[14px] font-medium ${SIGNAL_TEXT[signal.color]} leading-snug`}>
              {signal.label}
            </p>
            {mainIdea && (
              <p className="mt-1 text-[12px] text-slate-500">{mainIdea}</p>
            )}
          </div>
          <ChevronRight className={`h-5 w-5 ${SIGNAL_TEXT[signal.color]} flex-shrink-0`} />
        </button>
      )}

      <div className={`px-4 py-3 ${signal ? "border-t border-slate-100" : ""}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[12px] font-medium text-slate-600">Position semaine</p>
          <span className={`text-[11px] font-semibold ${meta.textColor}`}>
            {meta.label}
          </span>
        </div>
        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={[
                "flex-1 rounded-full transition-all",
                i === meta.position ? meta.color
                  : i < meta.position ? "bg-slate-200" : "bg-slate-100",
              ].join(" ")}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-slate-400">Base</span>
          <span className="text-[10px] text-slate-400">A limiter</span>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Repere educatif simplifie — pas une prescription medicale.
        </p>
      </div>
    </section>
  );
}

