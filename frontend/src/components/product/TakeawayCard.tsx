import React from "react";
import { statusColors, ui, type ProductStatus } from "../../data/designTokens";

interface TakeawayProps {
  status: ProductStatus;
  oneLiner: string;
  keyPoint?: string;
}

export const TakeawayCard: React.FC<TakeawayProps> = ({ status, oneLiner, keyPoint }) => {
  const s = statusColors[status] || statusColors.unknown;
  
  return (
    <div className={`${ui.card} overflow-hidden`}>
      <div className={`border-l-4 ${s.border} p-4`}>
        <p className={ui.sectionTitle}>A retenir</p>
        <p className="mt-2 text-[15px] font-medium text-slate-800 leading-snug">{oneLiner}</p>
        {keyPoint && (
          <p className="mt-2 text-[13px] text-slate-500">Point cle : {keyPoint}</p>
        )}
      </div>
    </div>
  );
};

export default TakeawayCard;
