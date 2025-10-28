import React from "react";

export const StatsCard: React.FC<{label:string; value:string|number; sub?:string}> = ({ label, value, sub }) => (
  <div className="bg-white rounded-xl shadow-sm p-4 border">
    <div className="text-sm text-neutral-700">{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
    {sub && <div className="text-xs text-neutral-600 mt-1">{sub}</div>}
  </div>
);
