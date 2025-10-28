// PATH: frontend/src/components/analysis/ScoreDisplay.tsx
type Props = {
  label: string;
  value: string | number | undefined;
  tone?: "success" | "warn" | "danger" | "neutral";
  hint?: string;
};

export default function ScoreDisplay({ label, value, tone = "neutral", hint }: Props) {
  const classes =
    tone === "success"
      ? { wrap: "card bg-green-soft", value: "text-green-strong" }
      : tone === "warn"
      ? { wrap: "card bg-yellow-soft", value: "text-yellow-strong" }
      : tone === "danger"
      ? { wrap: "card bg-red-soft", value: "text-red-strong" }
      : { wrap: "card", value: "text-gray-800" };

  return (
    <div className={classes.wrap}>
      <div className="text-sm text-neutral-700">{label}</div>
      <div className={`text-2xl font-bold ${classes.value}`}>{value ?? "'”"}</div>
      {hint && <div className="text-xs text-neutral-700 mt-1">{hint}</div>}
    </div>
  );
}

