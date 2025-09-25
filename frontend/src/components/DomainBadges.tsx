import React from "react";

// Adaptation aux catégories existantes dans votre projet
export type DomainKey = "food" | "cosmetics" | "detergents";

const LABELS: Record<DomainKey, string> = {
  food: "Alimentaire",
  cosmetics: "Cosmétique", 
  detergents: "Détergent"
};

// Mapping pour la compatibilité avec vos types existants
const CATEGORY_MAPPING: Record<string, DomainKey> = {
  'food': 'food',
  'cosmetics': 'cosmetics',
  'cosmetic': 'cosmetics',
  'beauty': 'cosmetics',
  'detergents': 'detergents',
  'detergent': 'detergents'
};

type Props = {
  active: DomainKey[];             // domaines pertinents pour le produit
  className?: string;
  "aria-label"?: string;
  size?: 'sm' | 'md';             // taille adaptable
};

const Badge: React.FC<{ domain: DomainKey; active: boolean; size: 'sm' | 'md' }> = ({ 
  domain, 
  active, 
  size 
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const base = `inline-flex items-center rounded-full border font-medium mr-1 mb-1 transition-colors duration-200 ${sizeClasses}`;
  
  const stylesActive = "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100";
  const stylesMuted = "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100";

  return (
    <span
      className={`${base} ${active ? stylesActive : stylesMuted}`}
      aria-pressed={active}
      aria-label={`${LABELS[domain]} ${active ? "actif" : "inactif"}`}
      title={`Domaine: ${LABELS[domain]}`}
    >
      {LABELS[domain]}
    </span>
  );
};

export const DomainBadges: React.FC<Props> = ({ 
  active, 
  className = "", 
  size = 'md',
  ...rest 
}) => {
  const activeSet = new Set(active);
  const allDomains: DomainKey[] = ["food", "cosmetics", "detergents"];
  
  return (
    <div
      className={`flex flex-wrap items-center ${className}`}
      role="group"
      {...rest}
    >
      {allDomains.map((domain) => (
        <Badge 
          key={domain} 
          domain={domain} 
          active={activeSet.has(domain)}
          size={size}
        />
      ))}
    </div>
  );
};

// Helper pour convertir les catégories existantes
export function mapCategoryToDomain(category?: string): DomainKey {
  if (!category) return 'food';
  const normalized = category.toLowerCase();
  return CATEGORY_MAPPING[normalized] || 'food';
}

export default DomainBadges;
