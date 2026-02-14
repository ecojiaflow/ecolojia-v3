import React from "react";
import { statusColors, ui, type ProductStatus } from "../../data/designTokens";

interface HeroProps {
  name: string;
  brand?: string;
  imageUrl?: string;
  score?: number;
  status: ProductStatus;
  statusLabel: string;
}

export const ProductHeroHeader: React.FC<HeroProps> = ({
  name, brand, imageUrl, score, status, statusLabel
}) => {
  const s = statusColors[status] || statusColors.unknown;
  
  return (
    <div className={`${ui.card} p-5 bg-gradient-to-b ${s.gradient}`}>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-white shadow-sm overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="h-full w-full object-contain p-1" />
          ) : (
            <div className="h-full w-full grid place-items-center text-2xl">📦</div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-900 truncate">{name}</h1>
          {brand && <p className="text-sm text-slate-500 truncate">{brand}</p>}
          <span className={`${ui.pill} mt-2 ${s.bg} ${s.text}`}>
            {statusLabel}
          </span>
        </div>
        
        {typeof score === "number" && (
          <div className={`h-12 w-12 rounded-full grid place-items-center text-lg font-bold text-white flex-shrink-0 ${
            score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"
          }`}>
            {score}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductHeroHeader;
