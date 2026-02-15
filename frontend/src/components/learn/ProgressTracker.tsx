import React from "react";

interface Props {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressTracker({ current, total, label }: Props) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="w-full">
      {label && <div className="text-[11px] text-slate-400 mb-1.5">{label}</div>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[11px] font-medium text-slate-400">{current}/{total}</span>
      </div>
    </div>
  );
}
