import React, { useState, useEffect } from "react";
import { Info, TrendingDown, TrendingUp, AlertCircle, BookOpen, ChevronRight, Clock } from "lucide-react";
import { getLearnSuggestions, LearnCardSummary } from "../../services/learnService";
import { LearnDrawer } from "./LearnDrawer";

/**
 * NutritionContext.tsx
 * Affiche les repères nutritionnels généraux (OMS/ANSES/EFSA)
 * + CTAs vers micro-fiches éducatives
 * Version: 2.0.0
 *
 * PRINCIPE ECOLOJIA:
 * - Repères GÉNÉRAUX (pas personnels)
 * - Ton PÉDAGOGIQUE (pas médical)
 * - Lien vers apprentissage (micro-fiches)
 */

interface NutritionReference {
  per100g: number;
  perPortion: number;
  dailyReference: number;
  idealReference?: number;
  percentOfDaily: number;
  percentOfIdeal?: number;
  level: "low" | "medium" | "high";
  source: string;
  unit: string;
  isPositive?: boolean;
}

interface NutritionInsight {
  type: string;
  severity: "high" | "positive";
  message: string;
}

interface NutritionContextData {
  version: string;
  references: {
    sugars?: NutritionReference;
    saturatedFat?: NutritionReference;
    salt?: NutritionReference;
    fiber?: NutritionReference;
    proteins?: NutritionReference;
    energy?: NutritionReference;
    fat?: NutritionReference;
  };
  portion: {
    size: number;
    unit: string;
    context: string;
  };
  insights: NutritionInsight[];
  disclaimer: string;
  confidence: "low" | "medium" | "high";
}

interface NutritionContextProps {
  nutritionContext: NutritionContextData | null;
  barcode?: string;
  className?: string;
}

// Couleurs selon niveau et type (positif ou à limiter)
const getLevelColor = (level: string, isPositive?: boolean) => {
  if (isPositive) {
    switch (level) {
      case "high": return "bg-green-500";
      case "medium": return "bg-amber-500";
      case "low": return "bg-orange-400";
      default: return "bg-gray-400";
    }
  } else {
    switch (level) {
      case "low": return "bg-green-500";
      case "medium": return "bg-amber-500";
      case "high": return "bg-red-500";
      default: return "bg-gray-400";
    }
  }
};

const getLevelText = (level: string, isPositive?: boolean) => {
  if (isPositive) {
    switch (level) {
      case "high": return "Bonne source";
      case "medium": return "Modere";
      case "low": return "Faible";
      default: return "";
    }
  } else {
    switch (level) {
      case "low": return "Faible";
      case "medium": return "Modere";
      case "high": return "Eleve";
      default: return "";
    }
  }
};

// Labels en français
const nutrientLabels: Record<string, string> = {
  sugars: "Sucres",
  saturatedFat: "Graisses saturees",
  salt: "Sel",
  fiber: "Fibres",
  proteins: "Proteines",
  energy: "Energie",
  fat: "Matieres grasses"
};

// Ordre d'affichage prioritaire
const displayOrder = ["sugars", "saturatedFat", "salt", "fiber", "proteins"];

// Icon mapping pour les fiches
const iconColorMap: Record<string, { bg: string; text: string }> = {
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
  amber: { bg: "bg-amber-100", text: "text-amber-600" },
  rose: { bg: "bg-rose-100", text: "text-rose-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
};

const NutritionBar: React.FC<{
  label: string;
  reference: NutritionReference;
  portionContext: string;
}> = ({ label, reference, portionContext }) => {
  const percentage = Math.min(reference.percentOfDaily, 100);
  const color = getLevelColor(reference.level, reference.isPositive);
  const levelText = getLevelText(reference.level, reference.isPositive);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {reference.per100g}{reference.unit}
          <span className="text-gray-500 font-normal text-xs ml-1">
            / 100g
          </span>
        </span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span className="flex items-center gap-1">
          {reference.isPositive ? (
            <TrendingUp className="w-3 h-3 text-green-600" />
          ) : (
            <TrendingDown className="w-3 h-3 text-amber-600" />
          )}
          {levelText}
        </span>
        <span>
          Repere {reference.source}: {reference.isPositive ? ">" : "<"}{reference.dailyReference}{reference.unit}/jour
        </span>
      </div>
    </div>
  );
};

export const NutritionContext: React.FC<NutritionContextProps> = ({
  nutritionContext,
  barcode,
  className = ""
}) => {
  const [learnSuggestions, setLearnSuggestions] = useState<LearnCardSummary[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Fetch learn suggestions when barcode is available
  useEffect(() => {
    if (barcode) {
      getLearnSuggestions(barcode).then(response => {
        if (response.success && response.suggestions) {
          setLearnSuggestions(response.suggestions);
        }
      });
    }
  }, [barcode]);

  const handleOpenCard = (cardId: string) => {
    setSelectedCardId(cardId);
    setDrawerOpen(true);
  };

  if (!nutritionContext || !nutritionContext.references) {
    return null;
  }

  const { references, portion, insights, disclaimer, confidence } = nutritionContext;

  // Filtrer les nutriments disponibles dans l'ordre de priorite
  const availableNutrients = displayOrder.filter(
    key => references[key as keyof typeof references]
  );

  if (availableNutrients.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-lg">📊</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">
                  Reperes nutritionnels
                </h3>
                <p className="text-xs text-gray-500">
                  Pour situer ce produit
                </p>
              </div>
            </div>
            {confidence && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                confidence === "high" ? "bg-green-100 text-green-700" :
                confidence === "medium" ? "bg-amber-100 text-amber-700" :
                "bg-gray-100 text-gray-600"
              }`}>
                {confidence === "high" ? "Donnees completes" :
                 confidence === "medium" ? "Donnees partielles" :
                 "Donnees limitees"}
              </span>
            )}
          </div>
        </div>

        {/* Portion info */}
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Portion de reference :</span>{" "}
            {portion.size}{portion.unit} ({portion.context})
          </p>
        </div>

        {/* Nutrition bars */}
        <div className="p-4 space-y-4">
          {availableNutrients.map(key => {
            const ref = references[key as keyof typeof references];
            if (!ref) return null;

            return (
              <NutritionBar
                key={key}
                label={nutrientLabels[key] || key}
                reference={ref}
                portionContext={portion.context}
              />
            );
          })}
        </div>

        {/* Insights */}
        {insights && insights.length > 0 && (
          <div className="px-4 pb-3 space-y-2">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                  insight.severity === "positive"
                    ? "bg-green-50 text-green-800"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {insight.severity === "positive" ? (
                  <TrendingUp className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span>{insight.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Learn Suggestions CTAs */}
        {learnSuggestions.length > 0 && (
          <div className="px-4 pb-4">
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Pour aller plus loin</span>
              </div>
              <div className="space-y-2">
                {learnSuggestions.map(suggestion => {
                  const colors = iconColorMap[suggestion.color] || iconColorMap.slate;
                  return (
                    <button
                      key={suggestion.id}
                      onClick={() => handleOpenCard(suggestion.id)}
                      className={`w-full p-3 rounded-xl ${colors.bg} border border-transparent flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.98]`}
                    >
                      <div className={`w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0`}>
                        <BookOpen className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-semibold text-gray-800 text-sm">{suggestion.title}</h4>
                        {suggestion.reason && (
                          <p className="text-xs text-gray-600 mt-0.5">{suggestion.reason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">{suggestion.readTime} min</span>
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 leading-relaxed">
              {disclaimer || "Reperes nutritionnels generaux (OMS/ANSES/EFSA). Ils servent a situer un produit, pas a calculer une ration personnelle."}
            </p>
          </div>
        </div>
      </div>

      {/* Learn Drawer */}
      <LearnDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cardId={selectedCardId}
      />
    </>
  );
};

export default NutritionContext;
