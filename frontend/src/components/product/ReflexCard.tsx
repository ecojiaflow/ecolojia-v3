import React from "react";
import { Lightbulb, Check, X } from "lucide-react";

interface ReflexCardProps {
  portionLabel?: string;
  doList: string[];
  avoidList?: string[];
  frequencyLabel: string;
}

export const ReflexCard: React.FC<ReflexCardProps> = ({ 
  portionLabel, 
  doList, 
  avoidList, 
  frequencyLabel 
}) => {
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-violet-600" />
        <span className="font-semibold text-violet-800">Reflexe concret</span>
      </div>

      {portionLabel && (
        <p className="text-sm text-gray-700 mb-3">
          <span className="font-medium">Portion repere :</span> {portionLabel}
        </p>
      )}

      {doList.length > 0 && (
        <div className="mb-3">
          {doList.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 mb-1">
              <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      )}

      {avoidList && avoidList.length > 0 && (
        <div className="mb-3">
          {avoidList.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 mb-1">
              <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-violet-200">
        <p className="text-sm text-violet-700">
          <span className="font-medium">Frequence :</span> {frequencyLabel}
        </p>
      </div>
    </div>
  );
};

export default ReflexCard;
