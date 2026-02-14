import React from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Level = "base" | "regular" | "occasional" | "limit";

interface Props {
  currentLevel: Level;
}

const LEVELS: {
  id: Level;
  label: string;
  examples: string;
  chip: string;
  accent: { ring: string; dot: string; bg: string; border: string; text: string };
}[] = [
  {
    id: "base",
    label: "Base",
    examples: "Fruits, legumes, eau",
    chip: "Base quotidienne",
    accent: { ring: "ring-emerald-200", dot: "bg-emerald-500", bg: "bg-emerald-50/70", border: "border-emerald-200/60", text: "text-emerald-800" },
  },
  {
    id: "regular",
    label: "Regulier",
    examples: "Feculents, proteines variees, oeufs",
    chip: "Regulier",
    accent: { ring: "ring-sky-200", dot: "bg-sky-500", bg: "bg-sky-50/70", border: "border-sky-200/60", text: "text-sky-800" },
  },
  {
    id: "occasional",
    label: "Occasionnel",
    examples: "Snacks, plats prepares",
    chip: "Occasionnel",
    accent: { ring: "ring-amber-200", dot: "bg-amber-500", bg: "bg-amber-50/70", border: "border-amber-200/60", text: "text-amber-800" },
  },
  {
    id: "limit",
    label: "A limiter",
    examples: "Sodas, confiseries",
    chip: "A limiter",
    accent: { ring: "ring-rose-200", dot: "bg-rose-500", bg: "bg-rose-50/70", border: "border-rose-200/60", text: "text-rose-800" },
  },
];

function getChip(level: Level) {
  return LEVELS.find((l) => l.id === level)?.chip ?? "-";
}

export default function WeeklyBalanceCard({ currentLevel }: Props) {
  const nav = useNavigate();

  return (
    <section className="rounded-2xl bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)]">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold text-slate-900 tracking-tight">
              Position dans l equilibre
            </p>
            <p className="mt-1 text-[12px] text-slate-500">
              Vision semaine · la repetition compte plus que le produit isole
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700">
            {getChip(currentLevel)}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {LEVELS.map((lvl) => {
            const active = lvl.id === currentLevel;
            return (
              <div
                key={lvl.id}
                className={[
                  "flex items-start gap-3 rounded-xl border p-3 transition",
                  active
                    ? `${lvl.accent.bg} ${lvl.accent.border} border-l-4`
                    : "bg-slate-50/40 border-slate-200/60",
                ].join(" ")}
              >
                <div
                  className={[
                    "mt-0.5 h-3 w-3 rounded-full ring-4 flex-shrink-0",
                    active ? `${lvl.accent.dot} ${lvl.accent.ring}` : "bg-slate-300 ring-slate-200",
                  ].join(" ")}
                />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <p className={["text-[13px] font-semibold", active ? lvl.accent.text : "text-slate-600"].join(" ")}>
                      {lvl.label}
                    </p>
                    <p className="text-[12px] text-slate-400 truncate">{lvl.examples}</p>
                  </div>
                  {active && (
                    <p className="mt-1 text-[12px] text-slate-600">
                      Ce qui compte surtout, c est la frequence sur la semaine.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => nav("/learn/fiche/equilibre-semaine")}
          className="mt-4 w-full rounded-xl bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-slate-800">Comprendre l equilibre semaine</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        </button>
      </div>
    </section>
  );
}
