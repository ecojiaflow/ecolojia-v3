import React from "react";
import { Sparkles, AlertCircle, CheckCircle, Clock } from "lucide-react";

type WeeklyPlace = "base" | "regular" | "occasional" | "limit" | "context";

interface TakeawayCardProps {
  weeklyPlace: WeeklyPlace;
  oneLiner: string;
  keyPoint?: string;
}

const PLACE_CONFIG: Record<WeeklyPlace, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  base: { 
    label: "Base quotidienne", 
    color: "text-emerald-700", 
    bg: "bg-emerald-50 border-emerald-200",
    icon: <CheckCircle className="w-5 h-5 text-emerald-600" />
  },
  regular: { 
    label: "Regulier", 
    color: "text-blue-700", 
    bg: "bg-blue-50 border-blue-200",
    icon: <Clock className="w-5 h-5 text-blue-600" />
  },
  occasional: { 
    label: "Plaisir occasionnel", 
    color: "text-amber-700", 
    bg: "bg-amber-50 border-amber-200",
    icon: <Sparkles className="w-5 h-5 text-amber-600" />
  },
  limit: { 
    label: "A limiter", 
    color: "text-red-700", 
    bg: "bg-red-50 border-red-200",
    icon: <AlertCircle className="w-5 h-5 text-red-600" />
  },
  context: { 
    label: "Depend du contexte", 
    color: "text-slate-700", 
    bg: "bg-slate-50 border-slate-200",
    icon: <Clock className="w-5 h-5 text-slate-600" />
  }
};

export const TakeawayCard: React.FC<TakeawayCardProps> = ({ weeklyPlace, oneLiner, keyPoint }) => {
  const config = PLACE_CONFIG[weeklyPlace];

  return (
    <div className={`rounded-2xl border p-4 ${config.bg}`}>
      <div className="flex items-center gap-2 mb-3">
        {config.icon}
        <span className={`font-semibold ${config.color}`}>{config.label}</span>
      </div>
      <p className="text-gray-800 font-medium mb-2">{oneLiner}</p>
      {keyPoint && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">Point cle :</span> {keyPoint}
        </p>
      )}
    </div>
  );
};

export default TakeawayCard;
