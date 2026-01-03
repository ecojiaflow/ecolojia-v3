/**
 * ExplorePage.tsx — Module Premium "Explorer une situation"
 * VERSION 1.0.0 — 2026-01-03
 * 
 * ⛔ VERROUILLAGE VISION ECOLOJIA :
 * - Flow guidé en 3 étapes
 * - PAS de chat libre
 * - PAS de champ question
 * - PAS d'historique
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle, RefreshCw, Scan } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Option {
  id: string;
  label: string;
  icon?: string;
}

interface ExploreResult {
  valid: boolean;
  level: number;
  rule: { id: string; principle: string; simple_reflex: string } | null;
  action: string;
  nuance: string;
  habit: { id: string; title: string; description: string } | null;
  nextStep: { type: string; label: string };
}

// ============================================================================
// API
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:10000";

async function fetchOptions(): Promise<{
  intentions: Option[];
  frequencies: Option[];
  categories: Option[];
}> {
  const res = await fetch(`${API_BASE}/api/explore/options`);
  const data = await res.json();
  if (!data.success) throw new Error("Erreur chargement options");
  return data.data;
}

async function explore(params: {
  intention: string;
  frequency: string;
  category: string;
}): Promise<ExploreResult> {
  const res = await fetch(`${API_BASE}/api/explore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Erreur exploration");
  return data.data;
}

// ============================================================================
// COMPOSANTS
// ============================================================================

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i < current
              ? "w-8 bg-emerald-500"
              : i === current
              ? "w-8 bg-emerald-400"
              : "w-2 bg-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

function OptionButton({
  option,
  selected,
  onClick,
}: {
  option: Option;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
        selected
          ? "border-emerald-500 bg-emerald-50"
          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
      }`}
    >
      <div className="flex items-center gap-3">
        {option.icon && <span className="text-2xl">{option.icon}</span>}
        <span className="font-medium text-slate-900">{option.label}</span>
      </div>
    </button>
  );
}

function ResultCard({
  icon,
  title,
  children,
  variant = "default",
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary";
}) {
  const variants = {
    default: "bg-white border-slate-200",
    primary: "bg-emerald-50 border-emerald-200",
    secondary: "bg-slate-50 border-slate-200",
  };
  return (
    <div className={`rounded-2xl border-2 p-5 ${variants[variant]}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
      </div>
      <div className="text-base text-slate-800 leading-relaxed">{children}</div>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export default function ExplorePage() {
  const navigate = useNavigate();
  
  // État
  const [step, setStep] = useState(0); // 0=intention, 1=contexte, 2=résultat
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Options
  const [intentions, setIntentions] = useState<Option[]>([]);
  const [frequencies, setFrequencies] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  
  // Sélections
  const [selectedIntention, setSelectedIntention] = useState<string | null>(null);
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Résultat
  const [result, setResult] = useState<ExploreResult | null>(null);

  // Charger options au montage
  useEffect(() => {
    fetchOptions()
      .then((data) => {
        setIntentions(data.intentions);
        setFrequencies(data.frequencies);
        setCategories(data.categories);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Explorer quand on passe à l'étape 2
  const handleExplore = async () => {
    if (!selectedIntention || !selectedFrequency || !selectedCategory) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await explore({
        intention: selectedIntention,
        frequency: selectedFrequency,
        category: selectedCategory,
      });
      setResult(res);
      setStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset
  const handleReset = () => {
    setStep(0);
    setSelectedIntention(null);
    setSelectedFrequency(null);
    setSelectedCategory(null);
    setResult(null);
    setError(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && step === 0) {
    return (
      <div className="min-h-screen bg-[#F3FBF6] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3FBF6]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : navigate(-1))}
            className="p-2 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <span className="font-semibold text-slate-900">Explorer une situation</span>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <StepIndicator current={step} total={3} />

        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* ================================================================ */}
        {/* ÉTAPE 0 : INTENTION */}
        {/* ================================================================ */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-slate-900 mb-2">
                Que veux-tu clarifier ?
              </h1>
              <p className="text-sm text-slate-500">
                Choisis ce qui correspond le mieux à ta situation
              </p>
            </div>

            <div className="space-y-3">
              {intentions.map((opt) => (
                <OptionButton
                  key={opt.id}
                  option={opt}
                  selected={selectedIntention === opt.id}
                  onClick={() => setSelectedIntention(opt.id)}
                />
              ))}
            </div>

            <button
              onClick={() => selectedIntention && setStep(1)}
              disabled={!selectedIntention}
              className={`w-full mt-6 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedIntention
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              Continuer <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* ÉTAPE 1 : CONTEXTE (2 questions max) */}
        {/* ================================================================ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-slate-900 mb-2">
                Précise ta situation
              </h1>
            </div>

            {/* Question 1 : Fréquence */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                À quelle fréquence ?
              </label>
              <div className="space-y-2">
                {frequencies.map((opt) => (
                  <OptionButton
                    key={opt.id}
                    option={opt}
                    selected={selectedFrequency === opt.id}
                    onClick={() => setSelectedFrequency(opt.id)}
                  />
                ))}
              </div>
            </div>

            {/* Question 2 : Catégorie */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                C'est plutôt :
              </label>
              <div className="space-y-2">
                {categories.map((opt) => (
                  <OptionButton
                    key={opt.id}
                    option={opt}
                    selected={selectedCategory === opt.id}
                    onClick={() => setSelectedCategory(opt.id)}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleExplore}
              disabled={!selectedFrequency || !selectedCategory || loading}
              className={`w-full mt-6 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
                selectedFrequency && selectedCategory && !loading
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Analyse..." : "Voir le résultat"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* ÉTAPE 2 : RÉSULTAT */}
        {/* ================================================================ */}
        {step === 2 && result && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 mb-4">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-semibold">Ce qui compte vraiment</span>
              </div>
            </div>

            {/* Règle */}
            {result.rule && (
              <ResultCard icon="🎯" title="Règle applicable" variant="primary">
                <div className="font-semibold text-slate-900 mb-1">
                  {result.rule.principle}
                </div>
                <div className="text-slate-600">{result.rule.simple_reflex}</div>
              </ResultCard>
            )}

            {/* Action */}
            <ResultCard icon="🔁" title="Action recommandée">
              {result.action}
            </ResultCard>

            {/* Nuance */}
            <ResultCard icon="💡" title="Nuance" variant="secondary">
              {result.nuance}
            </ResultCard>

            {/* Habitude */}
            {result.habit && (
              <ResultCard icon="🛡️" title="Habitude associée">
                <div className="font-semibold text-slate-900 mb-1">
                  {result.habit.title}
                </div>
                <div className="text-slate-600 text-sm">{result.habit.description}</div>
              </ResultCard>
            )}

            {/* Next Step */}
            <button
              onClick={() => navigate("/scan")}
              className="w-full mt-4 py-4 rounded-2xl font-semibold bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center gap-2"
            >
              <Scan className="h-4 w-4" />
              {result.nextStep.label}
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-2xl font-medium text-slate-500 hover:text-slate-700 flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Nouvelle exploration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
