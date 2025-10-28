import React from 'react';

export const ScoreGauge: React.FC<{label:string; value:number}> = ({label, value}) => {
  const v = Math.max(0, Math.min(100, value||0));
  const stroke = 8, r = 36, c = 2*Math.PI*r, dash = (v/100)*c;
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} stroke="#eee" strokeWidth={stroke} fill="none" />
        <circle cx="48" cy="48" r={r} stroke="#10b981" strokeWidth={stroke}
          fill="none" strokeLinecap="round" strokeDasharray={`${dash} ${c-dash}`} transform="rotate(-90 48 48)" />
        <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fill="#111">{v}%</text>
      </svg>
      <div><div className="text-sm text-gray-600">{label}</div><div className="text-xs text-neutral-700">Plus élevé = meilleur</div></div>
    </div>
  );
};
