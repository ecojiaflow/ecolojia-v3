// PATH: frontend/src/utils/textParsing.ts
export type CategoryGuess = "food" | "cosmetics" | "detergents";

function normalizeText(t: string): string {
  return (t || "")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractIngredients(raw: string): string[] {
  const text = normalizeText(raw).toUpperCase();
  // Cherche le bloc "INGRÉDIENTS" / "INGREDIENTS" / "COMPOSITION"
  const anchors = ["INGRÉDIENTS", "INGREDIENTS", "COMPOSITION"];
  let idx = -1;
  let anchor = "";
  for (const a of anchors) {
    idx = text.indexOf(a);
    if (idx >= 0) { anchor = a; break; }
  }
  if (idx < 0) return [];

  const after = text.slice(idx + anchor.length);
  // Coupe à la prochaine section fréquente
  const stopIdx = (() => {
    const stops = ["NUTRITION", "UTILISATION", "MODE D'EMPLOI", "PRÉCAUTIONS", "PRECAUTIONS", "INGREDIENTS:", "INGRÉDIENTS:"];
    const positions = stops
      .map((s) => after.indexOf(s))
      .filter((p) => p > 0)
      .sort((a, b) => a - b);
    return positions.length ? positions[0] : after.length;
  })();

  const block = after.slice(0, stopIdx);
  // Nettoyage et split
  const list = block
    .replace(/[:\-–—]/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s{2,}/g, " ")
    .split(/[;,•·]/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 80);

  // Majuscule/minuscule douce
  return list.map((w) => {
    const low = w.toLowerCase();
    return low.replace(/(^|[ \-])(.)/g, (m) => m.toUpperCase());
  });
}

export function extractLikelyProductName(raw: string): string | null {
  const lines = normalizeText(raw)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Heuristique : première ligne assez courte sans mot-clé "ingrédients", "composition"
  const bad = /ingr[ée]dients|composition|nutri|utilisation|mode d|précautions|precautions/i;
  for (const l of lines) {
    if (bad.test(l)) continue;
    // Évite trop court / trop long
    if (l.length >= 6 && l.length <= 64) return l;
  }
  // Sinon, la plus "titre"
  const candidate = lines.find((l) => /^[A-Z0-9 \-_'()]+$/.test(l) && l.length >= 6 && l.length <= 64);
  return candidate || null;
}

export function guessCategory(raw: string): CategoryGuess {
  const t = normalizeText(raw).toLowerCase();

  // Cosmétiques (mots-clés INCI typiques)
  const cosmeticHits = [
    "aqua", "parfum", "glycerin", "glycerine", "sodium laureth sulfate", "dimethicone",
    "phenoxyethanol", "linalool", "limonene", "citronellol", "benzyl alcohol"
  ].filter((k) => t.includes(k)).length;

  // Détergents (agents lavage/détergence)
  const detergentHits = [
    "anioniques", "non-ioniques", "agents de surface", "tensioactifs", "lessive",
    "blanchissant", "enzymes", "sulfate", "laundry", "detergent"
  ].filter((k) => t.includes(k)).length;

  // Alimentation (indices)
  const foodHits = [
    "sucre", "huile", "sel", "blé", "lait", "œuf", "oeuf", "farine", "cacao",
    "glucides", "protéines", "lipides", "nutri-score"
  ].filter((k) => t.includes(k)).length;

  if (cosmeticHits >= Math.max(detergentHits, foodHits)) return "cosmetics";
  if (detergentHits >= Math.max(cosmeticHits, foodHits)) return "detergents";
  return "food";
}
