import React from "react";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface ScoreBreakdownProps {
  score: number;
  factors: Array<{ label: string; impact: number; reason: string }>;
}

export function ScoreBreakdown({ score, factors }: ScoreBreakdownProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Info className="w-5 h-5 mr-2" />
        Pourquoi ce score ?
      </h2>
      <div className="space-y-3">
        {factors.map((factor, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            {factor.impact > 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-medium">{factor.label}</p>
              <p className="text-sm text-gray-600">{factor.reason}</p>
            </div>
            <span className={`font-bold ${factor.impact > 0 ? "text-green-600" : "text-red-600"}`}>
              {factor.impact > 0 ? "+" : ""}{factor.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
