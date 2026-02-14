import React from "react";
import { Check, X } from "lucide-react";
import { ui } from "../../data/designTokens";

interface ReflexProps {
  portionLabel?: string;
  doList: string[];
  avoidList: string[];
  frequencyLabel?: string;
}

export const ReflexCard: React.FC<ReflexProps> = ({
  portionLabel, doList, avoidList, frequencyLabel
}) => {
  return (
    <div className={`${ui.card} overflow-hidden bg-[#F4F5FF]`}>
      <div className="p-4">
        <p className={ui.sectionTitle}>Reflexe concret</p>
        
        {portionLabel && (
          <p className="mt-3 text-[13px] text-slate-600">
            Portion repere : <span className="font-medium text-slate-800">{portionLabel}</span>
          </p>
        )}
        
        <div className="mt-3 space-y-2">
          {doList.map((item, i) => (
            <div key={`do-${i}`} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-slate-700">{item}</span>
            </div>
          ))}
          {avoidList.map((item, i) => (
            <div key={`avoid-${i}`} className="flex items-start gap-2">
              <X className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <span className="text-[13px] text-slate-700">{item}</span>
            </div>
          ))}
        </div>
        
        {frequencyLabel && (
          <p className="mt-3 text-[13px] text-indigo-600 font-medium">
            Frequence : {frequencyLabel}
          </p>
        )}
      </div>
    </div>
  );
};

export default ReflexCard;
