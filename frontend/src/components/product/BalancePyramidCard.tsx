import React from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Level = "base" | "regular" | "occasional" | "limit";

interface BalancePyramidProps {
  currentLevel: Level;
  productName: string;
}

const LEVELS: { id: Level; label: string; examples: string; color: string; bg: string }[] = [
  { id: "base", label: "BASE", examples: "Fruits, legumes, eau, legumineuses", color: "text-emerald-700", bg: "bg-emerald-500" },
  { id: "regular", label: "REGULIER", examples: "Feculents, proteines, produits laitiers", color: "text-sky-700", bg: "bg-sky-500" },
  { id: "occasional", label: "OCCASIONNEL", examples: "Plats prepares, snacks, patisseries", color: "text-orange-700", bg: "bg-orange-500" },
  { id: "limit", label: "A LIMITER", examples: "Produits plaisir, sodas, confiseries", color: "text-rose-700", bg: "bg-rose-500" },
];

export const BalancePyramidCard: React.FC<BalancePyramidProps> = ({ currentLevel, productName }) => {
  const navigate = useNavigate();
  const currentIndex = LEVELS.findIndex(l => l.id === currentLevel);

  return (
    <div className="rounded-[20px] bg-white shadow-[0_10px_30px_rgba(2,6,23,0.06)] overflow-hidden">
      <div className="p-4">
        <p className="text-[13px] font-semibold text-slate-800 tracking-tight">Position dans l equilibre</p>
        <p className="mt-1 text-[12px] text-slate-500">Ou se situe ce produit dans une alimentation variee</p>
        
        <div className="mt-4 space-y-2">
          {LEVELS.map((level, index) => {
            const isActive = level.id === currentLevel;
            const width = 100 - (index * 15); // Pyramide: base large, limite etroit
            
            return (
              <div key={level.id} className="relative">
                <div 
                  className={`relative rounded-xl p-3 transition-all ${
                    isActive 
                      ? `${level.bg} text-white shadow-md` 
                      : "bg-slate-50 text-slate-600"
                  }`}
                  style={{ width: `${width}%`, marginLeft: `${(100 - width) / 2}%` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-[11px] font-bold tracking-wide ${isActive ? "text-white/90" : "text-slate-400"}`}>
                        {level.label}
                      </p>
                      <p className={`text-[12px] ${isActive ? "text-white/80" : "text-slate-500"}`}>
                        {level.examples}
                      </p>
                    </div>
                    {isActive && (
                      <div className="flex-shrink-0 ml-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white">
                          ← {productName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => navigate("/learn/fiche/equilibre-semaine")}
          className="mt-4 w-full flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-left transition-all hover:bg-slate-100"
        >
          <span className="text-[13px] font-medium text-slate-700">Comprendre l equilibre semaine</span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
};

export default BalancePyramidCard;
