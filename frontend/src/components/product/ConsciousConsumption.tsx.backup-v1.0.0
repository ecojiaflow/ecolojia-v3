/**
 * ConsciousConsumption.tsx — Bloc "Consommer Consciemment"
 * Version: 1.0.0 | Date: 11 janvier 2026
 * Basé sur productContextProfile backend
 */

import React from "react";
import { Flame, Factory, Leaf, Droplets, Package, Lightbulb } from "lucide-react";

interface ProductContextProfile {
  processingLevel: string;
  sugarLevel: string;
  saltLevel: string;
  satFatLevel: string;
  additivesLevel: string;
  packagingType: string;
  isOrganic: boolean;
  isRawAgricultural: boolean;
  surfaceConsumed: string | boolean;
  usageFrequency: string;
  riskProfiles: string[];
  contextConfidence: string;
}

interface Props {
  context: ProductContextProfile;
  subcategory?: string;
}

const TEMPLATES = {
  glycemic: {
    title: "Impact glycémique",
    icon: Flame,
    color: "amber",
    content: "Ce produit est riche en sucres. En cas de consommation fréquente, privilégier une association avec des fibres ou protéines pour limiter la variation glycémique."
  },
  ultraProcessed: {
    title: "Ultra-transformation",
    icon: Factory,
    color: "orange",
    content: "Produit ultra-transformé (NOVA 4). La répétition de ce type de produit peut contribuer à un déséquilibre alimentaire. Varier avec des alternatives moins transformées."
  },
  pesticides: {
    title: "Exposition pesticides",
    icon: Leaf,
    color: "emerald",
    content: "Produit agricole non bio. Un rinçage soigneux ou le choix d'une version bio peut réduire l'exposition aux résidus de pesticides."
  },
  rinse: {
    title: "Rinçage recommandé",
    icon: Droplets,
    color: "blue",
    content: "La surface de ce produit est consommée. Un rinçage à l'eau claire avant consommation est recommandé."
  },
  packaging: {
    title: "Contenant plastique",
    icon: Package,
    color: "slate",
    content: "Emballage plastique pour un usage fréquent. Privilégier le transfert dans un contenant en verre pour le stockage prolongé."
  },
  goodReflex: {
    title: "Le bon réflexe",
    icon: Lightbulb,
    color: "green",
    content: "Ce n'est pas un produit isolé qui compte, mais la répétition et l'ensemble. Variez vos choix et restez attentif à la fréquence."
  }
};

function Block({ templateKey }: { templateKey: keyof typeof TEMPLATES }) {
  const t = TEMPLATES[templateKey];
  const Icon = t.icon;
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    slate: "bg-slate-50 border-slate-200 text-slate-800",
    green: "bg-green-50 border-green-200 text-green-800"
  };
  
  return (
    <div className={`p-4 rounded-xl border ${colorClasses[t.color]} mb-3`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-sm mb-1">{t.title}</h4>
          <p className="text-sm opacity-90">{t.content}</p>
        </div>
      </div>
    </div>
  );
}

export function ConsciousConsumption({ context, subcategory = "" }: Props) {
  const blocks: (keyof typeof TEMPLATES)[] = [];
  
  // Règle 1: Impact glycémique
  if (context.sugarLevel === "high") {
    blocks.push("glycemic");
  } else if (context.sugarLevel === "medium" && (subcategory.includes("boisson") || subcategory.includes("dessert"))) {
    blocks.push("glycemic");
  }
  
  // Règle 2: Ultra-transformation
  if (context.processingLevel === "ultra_processed") {
    blocks.push("ultraProcessed");
  }
  
  // Règle 3: Pesticides
  if (context.isRawAgricultural && !context.isOrganic) {
    blocks.push("pesticides");
  }
  
  // Règle 4: Rinçage
  if (context.isRawAgricultural && context.surfaceConsumed === true) {
    blocks.push("rinse");
  }
  
  // Règle 5: Contenant plastique
  if (context.packagingType === "plastic" && context.usageFrequency === "frequent") {
    blocks.push("packaging");
  }
  
  // Règle 6: Bon réflexe — TOUJOURS
  blocks.push("goodReflex");
  
  if (blocks.length === 1) {
    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🧠 Consommer consciemment
        </h3>
        <Block templateKey="goodReflex" />
      </div>
    );
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🧠 Consommer consciemment
      </h3>
      {blocks.map((key) => (
        <Block key={key} templateKey={key} />
      ))}
    </div>
  );
}

export default ConsciousConsumption;
