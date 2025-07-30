import React from "react";
import { ShieldCheck } from "lucide-react";

interface Props {
  pct: number; // entre 0 et 100
  color: "green" | "yellow" | "red";
  className?: string;
}

const ConfidenceBadge: React.FC<Props> = ({ pct, color, className = "" }) => {
  const colors = {
    green: "bg-green-100 text-green-800 border-green-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    red: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 border rounded-full text-xs font-medium shadow-sm ${colors[color]} ${className}`}
      title={`Confiance IA : ${pct}%`}
      aria-label={`Badge confiance IA ${pct}%`}
    >
      <ShieldCheck size={12} className="shrink-0" />
      {pct}% IA
    </span>
  );
};

export default ConfidenceBadge;

