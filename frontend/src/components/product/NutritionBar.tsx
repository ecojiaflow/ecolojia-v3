import React from "react";

interface NutritionBarProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  level: "low" | "moderate" | "high";
}

export function NutritionBar({ label, value, max, unit, level }: NutritionBarProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const colors = {
    low: "bg-green-500",
    moderate: "bg-orange-500", 
    high: "bg-red-500"
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="font-bold">{value} {unit}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colors[level]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">
        {level === "low" ? "Faible" : level === "moderate" ? "Modéré" : "Élevé"}
        {" • Recommandé: <"}{max}{unit}
      </p>
    </div>
  );
}
