/**
 * ExplorePage.tsx — "Comprendre ce que je consomme"
 * VERSION 2.0.0 — 2026-01-06
 *
 * NOUVEAU FLOW (Vision validee) :
 * 1. Choix univers (Alimentation / Cosmetique / Menager)
 * 2. Principes de base + Meilleures pratiques
 * 3. CTA vers scan produit
 *
 * PAS de questions floues, PAS d IA libre
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Scan, Camera, ChevronDown, ChevronUp } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface Principle {
  id: string;
  title: string;
  explanation: string;
  priority: number;
}

interface Practice {
  id: string;
  text: string;
  priority: number;
}

interface Universe {
  id: string;
  name: string;
  icon: string;
  color: string;
  tagline: string;
  principles: Principle[];
  practices: Practice[];
  sources: string[];
  displayConfig?: {
    principlesVisibleByDefault: number;
    practicesVisibleByDefault: number;
    showSourcesBadge: boolean;
    ctaAfterPractices: {
      enabled: boolean;
      text: string;
      buttons: { label: string; route: string; primary: boolean }[];
    };
  };
}

interface UniverseSummary {
  id: string;
  name: string;
  icon: string;
  color: string;
  tagline: string;
  principlesCount: number;
  practicesCount: number;
  sources: string[];
}

// ============================================================================
// API
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:10000";

async function fetchUniverses(): Promise<UniverseSummary[]> {
  const res = await fetch(`${API_BASE}/api/education/universes`);
  const data = await res.json();
  if (!data.success) throw new Error("Erreur chargement univers");
  return data.universes;
}

async function fetchUniverseDetail(id: string): Promise<Universe> {
  const res = await fetch(`${API_BASE}/api/education/universes/${id}`);
  const data = await res.json();
  if (!data.success) throw new Error("Erreur chargement univers");
  return data.universe;
}

// ============================================================================
// COMPOSANTS
// ============================================================================

function UniverseCard({
  universe,
  onClick,
}: {
  universe: UniverseSummary;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all text-left group"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: `${universe.color}15` }}
        >
          {universe.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">
            {universe.name}
          </h3>
          <p className="text-sm text-slate-500">{universe.tagline}</p>
        </div>
        <div className="text-slate-300 group-hover:text-emerald-500 transition-colors">
          →
        </div>
      </div>
    </button>
  );
}

function PrincipleCard({
  principle,
  index,
}: {
  principle: Principle;
  index: number;
}) {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {index + 1}
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 mb-1">{principle.title}</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {principle.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}

function PracticeItem({ practice }: { practice: Practice }) {
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
      <p className="text-slate-700">{practice.text}</p>
    </div>
  );
}

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export default function ExplorePage() {
  const navigate = useNavigate();

  // Etats
  const [step, setStep] = useState<"list" | "detail">("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Donnees
  const [universes, setUniverses] = useState<UniverseSummary[]>([]);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);

  // Affichage principes/pratiques
  const [showAllPrinciples, setShowAllPrinciples] = useState(false);
  const [showAllPractices, setShowAllPractices] = useState(false);

  // Charger liste univers
  useEffect(() => {
    fetchUniverses()
      .then((data) => {
        setUniverses(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Selectionner un univers
  const handleSelectUniverse = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await fetchUniverseDetail(id);
      setSelectedUniverse(detail);
      setStep("detail");
      setShowAllPrinciples(false);
      setShowAllPractices(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Retour liste
  const handleBack = () => {
    if (step === "detail") {
      setStep("list");
      setSelectedUniverse(null);
    } else {
      navigate(-1);
    }
  };

  // Config affichage
  const principlesVisible = showAllPrinciples
    ? selectedUniverse?.principles.length || 0
    : selectedUniverse?.displayConfig?.principlesVisibleByDefault || 3;

  const practicesVisible = showAllPractices
    ? selectedUniverse?.practices.length || 0
    : selectedUniverse?.displayConfig?.practicesVisibleByDefault || 3;

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && step === "list") {
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
            onClick={handleBack}
            className="p-2 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <span className="font-semibold text-slate-900">
            {step === "list" ? "Apprendre un reflexe" : selectedUniverse?.name}
          </span>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* ================================================================ */}
        {/* ETAPE 1 : LISTE DES UNIVERS */}
        {/* ================================================================ */}
        {step === "list" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-3">
                Comprendre ce que je consomme
              </h1>
              <p className="text-slate-500">
                Choisis un univers pour decouvrir les principes essentiels
              </p>
            </div>

            <div className="space-y-4">
              {universes.map((u) => (
                <UniverseCard
                  key={u.id}
                  universe={u}
                  onClick={() => handleSelectUniverse(u.id)}
                />
              ))}
            </div>

            {/* Trust */}
            <p className="mt-8 text-xs text-slate-400 text-center">
              Contenu base sur les recommandations OMS, ANSES, ADEME
            </p>
          </div>
        )}

        {/* ================================================================ */}
        {/* ETAPE 2 : DETAIL UNIVERS */}
        {/* ================================================================ */}
        {step === "detail" && selectedUniverse && (
          <div className="space-y-8">
            {/* Header univers */}
            <div className="text-center">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-4"
                style={{ backgroundColor: `${selectedUniverse.color}15` }}
              >
                {selectedUniverse.icon}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {selectedUniverse.name}
              </h1>
              <p className="text-slate-500">{selectedUniverse.tagline}</p>
            </div>

            {/* PRINCIPES */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-xl">🧠</span>
                Comment raisonner
              </h2>
              <div className="space-y-3">
                {selectedUniverse.principles
                  .slice(0, principlesVisible)
                  .map((p, i) => (
                    <PrincipleCard key={p.id} principle={p} index={i} />
                  ))}
              </div>
              {selectedUniverse.principles.length > 3 && (
                <button
                  onClick={() => setShowAllPrinciples(!showAllPrinciples)}
                  className="mt-3 w-full py-2 text-sm text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1"
                >
                  {showAllPrinciples ? (
                    <>
                      Voir moins <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Voir les {selectedUniverse.principles.length - 3} autres{" "}
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* PRATIQUES */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-xl">✅</span>
                Concretement, au quotidien
              </h2>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
                {selectedUniverse.practices
                  .slice(0, practicesVisible)
                  .map((p) => (
                    <PracticeItem key={p.id} practice={p} />
                  ))}
              </div>
              {selectedUniverse.practices.length > 3 && (
                <button
                  onClick={() => setShowAllPractices(!showAllPractices)}
                  className="mt-3 w-full py-2 text-sm text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1"
                >
                  {showAllPractices ? (
                    <>
                      Voir moins <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Voir les {selectedUniverse.practices.length - 3} autres{" "}
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* SOURCES */}
            {selectedUniverse.displayConfig?.showSourcesBadge && (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <span>Sources :</span>
                {selectedUniverse.sources.map((s, i) => (
                  <span
                    key={s}
                    className="px-2 py-1 rounded-full bg-slate-100 text-slate-500"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            {selectedUniverse.displayConfig?.ctaAfterPractices?.enabled && (
              <div className="bg-emerald-50 rounded-2xl p-6 text-center">
                <p className="text-slate-700 mb-4">
                  {selectedUniverse.displayConfig.ctaAfterPractices.text}
                </p>
                <div className="flex flex-col gap-3">
                  {selectedUniverse.displayConfig.ctaAfterPractices.buttons.map(
                    (btn) => (
                      <button
                        key={btn.route}
                        onClick={() => navigate(btn.route)}
                        className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all ${
                          btn.primary
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                        }`}
                      >
                        {btn.primary ? (
                          <Scan className="h-5 w-5" />
                        ) : (
                          <Camera className="h-5 w-5" />
                        )}
                        {btn.label}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
