// PATH: frontend/src/components/analysis/AlternativesList.tsx
import type { ProductInfo } from "../../types/api";

export default function AlternativesList({ items }: { items: ProductInfo[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-2">
      {items.map((a, idx) => (
        <div key={a.id || a.ean || idx} className="card">
          <div className="font-medium">{a.name}</div>
          <div className="text-sm text-gray-600">
            {a.brand ? `${a.brand} '¢ ` : ""} {a.category || "'”"} {a.ean ? `'¢ EAN ${a.ean}` : ""}
          </div>
          {a.ingredients && a.ingredients.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">Ingr?dients: {a.ingredients.slice(0, 7).join(", ")}{a.ingredients.length > 7 ? "'¦" : ""}</div>
          )}
        </div>
      ))}
    </div>
  );
}

