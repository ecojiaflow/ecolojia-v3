// PATH: frontend/src/utils/scores.ts
export function nutriToTone(nutri?: string): "success" | "warn" | "danger" | "neutral" {
  const v = String(nutri || "").toUpperCase();
  if (["A"].includes(v)) return "success";
  if (["B", "C"].includes(v)) return "warn";
  if (["D", "E"].includes(v)) return "danger";
  return "neutral";
}

export function novaToTone(nova?: number): "success" | "warn" | "danger" | "neutral" {
  const n = Number(nova);
  if (!Number.isFinite(n)) return "neutral";
  if (n <= 2) return "success";
  if (n === 3) return "warn";
  if (n >= 4) return "danger";
  return "neutral";
}

export function ecoToTone(eco?: string | number): "success" | "warn" | "danger" | "neutral" {
  if (eco === undefined || eco === null) return "neutral";
  if (typeof eco === "string") {
    const v = eco.toUpperCase();
    if (v === "A") return "success";
    if (v === "B" || v === "C") return "warn";
    if (v === "D" || v === "E") return "danger";
    return "neutral";
  }
  const n = Number(eco);
  if (!Number.isFinite(n)) return "neutral";
  if (n >= 70) return "success";
  if (n >= 40) return "warn";
  return "danger";
}

export function toneToClasses(tone: "success" | "warn" | "danger" | "neutral") {
  switch (tone) {
    case "success":
      return { bg: "bg-green-soft", text: "text-green-strong", border: "border-green-strong" };
    case "warn":
      return { bg: "bg-yellow-soft", text: "text-yellow-strong", border: "border-yellow-strong" };
    case "danger":
      return { bg: "bg-red-soft", text: "text-red-strong", border: "border-red-strong" };
    default:
      return { bg: "bg-gray-200", text: "text-gray-800", border: "border" };
  }
}