// PATH: frontend/src/components/scanner/ManualInput.tsx
import { useState } from "react";

type Props = {
  onSubmit: (payload: { name: string; category: string; ingredients: string[] }) => void;
  onClose?: () => void;
  defaults?: { name?: string; category?: string; ingredients?: string[] };
};

const CATEGORIES = [
  { value: "food", label: "Alimentation" },
  { value: "cosmetics", label: "Cosm?tiques" },
  { value: "detergents", label: "D?tergents" },
];

export default function ManualInput({ onSubmit, onClose, defaults }: Props) {
  const [name, setName] = useState(defaults?.name || "");
  const [category, setCategory] = useState(defaults?.category || "food");
  const [ingredientsText, setIngredientsText] = useState((defaults?.ingredients || []).join(", "));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ingredients = ingredientsText
      .split(/,|\n|;/g)
      .map((s) => s.trim())
      .filter(Boolean);
    onSubmit({ name: name.trim(), category, ingredients });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium">Nom du produit</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="Ex: Yaourt nature"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Cat?gorie</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Ingr?dients (s?par?s par virgules)</label>
        <textarea
          value={ingredientsText}
          onChange={(e) => setIngredientsText(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border px-3 py-2"
          placeholder="lait, ferments lactiques, sucre'¦"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white">
          Analyser
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200">
          Fermer
        </button>
      </div>
    </form>
  );
}

