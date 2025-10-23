// PATH: frontend/src/components/analysis/RiskCard.tsx
type Risk = { title: string; level: "low" | "medium" | "high"; details?: string };

function levelToTone(level: Risk["level"]) {
  if (level === "low") return { label: "faible", classes: "chip bg-green-soft text-green-strong" };
  if (level === "medium") return { label: "mod?r?", classes: "chip bg-yellow-soft text-yellow-strong" };
  return { label: "?lev?", classes: "chip bg-red-soft text-red-strong" };
}

export default function RiskCard({ title, level, details }: Risk) {
  const tone = levelToTone(level);
  return (
    <div className="card">
      <div className="flex items-center gap-2">
        <span className={tone.classes}>{tone.label}</span>
        <span className="font-medium">{title}</span>
      </div>
      {details && <div className="text-sm text-gray-600 mt-1">{details}</div>}
    </div>
  );
}
