// PATH: frontend/src/components/analysis/ScoreDisplay.tsx
type Props = {
  label: string;
  value: string | number | undefined;
  hint?: string;
};

export default function ScoreDisplay({ label, value, hint }: Props) {
  return (
    <div className="rounded-xl border p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value ?? "—"}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  );
}
