export type ProductDomain = "food" | "beauty" | "detergent" | "unknown";

type AnyObj = Record<string, any>;

function textFrom(o: AnyObj): string {
  try {
    return JSON.stringify(o).toLowerCase();
  } catch {
    return "";
  }
}

export function inferDomain(analysis: AnyObj): ProductDomain {
  // Priorité à un champ explicite si présent
  const explicit = (analysis?.domain || analysis?.product?.domain || "").toLowerCase();
  if (["food","beauty","cosmetic","detergent","home","household"].includes(explicit)) {
    if (explicit === "cosmetic") return "beauty";
    if (["home","household"].includes(explicit)) return "detergent";
    return explicit as ProductDomain;
  }

  const blob = [
    analysis?.provider,
    analysis?.source,
    analysis?.sources,
    analysis?.product?.categories,
    analysis?.product?.labels,
    analysis?.product?.name || analysis?.product?.product_name,
    analysis?.summary
  ].map(textFrom).join(" ");

  // Heuristiques robustes (données publiques OFF/OBF/OPF)
  if (/\bopenbeauty\b|\bopenbeautyfacts\b|cosm[eé]tique|shampoo|lotion|cream|serum|micellar|make[- ]?up/.test(blob)) {
    return "beauty";
  }
  if (/\bopenproducts\b|\bopenproductsfacts\b|d[eé]tergent|ménager|laundry|washing|dishwash|pods|bleach|clean(er|ing)/.test(blob)) {
    return "detergent";
  }
  if (/\bopenfood\b|\bopenfoodfacts\b|alimentaire|nutrition|nutri[- ]?score|nova|ingr[eé]dients\b/.test(blob)) {
    return "food";
  }
  return "unknown";
}
