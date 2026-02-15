import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MethodStepCard from "../../components/learn/MethodStepCard";
import ProgressTracker from "../../components/learn/ProgressTracker";
import { METHODE_PRINCIPLES } from "../../data/methodeData";

export default function MethodePage() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const markComplete = (id: number) => {
    setCompleted(prev => new Set(prev).add(id));
  };

  const allDone = completed.size === METHODE_PRINCIPLES.length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/explore")}>
            <ChevronLeft className="h-5 w-5 text-slate-400" />
          </button>
          <span className="text-[15px] font-semibold text-slate-800">La methode Ecolojia</span>
          <div className="w-5" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-10 pt-4">
        {/* Intro */}
        <div className="text-center mb-6">
          <div className="text-2xl mb-2">🧠</div>
          <h1 className="text-xl font-bold text-slate-800">5 principes pour tout comprendre</h1>
          <p className="text-[13px] text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Avant de regarder un produit, apprends a raisonner. Ces 5 regles s'appliquent a tout : alimentation, cosmetique, menager.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <ProgressTracker
            current={completed.size}
            total={METHODE_PRINCIPLES.length}
            label="Principes compris"
          />
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-4">
          {METHODE_PRINCIPLES.map(p => (
            <MethodStepCard
              key={p.id}
              principle={p}
              completed={completed.has(p.id)}
              onComplete={() => markComplete(p.id)}
            />
          ))}
        </div>

        {/* CTA apres completion */}
        {allDone && (
          <div className="mt-8 text-center">
            <div className="p-5 rounded-[18px] bg-gradient-to-r from-emerald-50 via-sky-50 to-emerald-50 border border-emerald-100">
              <div className="text-lg mb-1">🎓</div>
              <div className="text-[15px] font-semibold text-slate-800">Methode maitrisee !</div>
              <div className="text-[13px] text-slate-500 mt-1 mb-4">
                Tu sais comment raisonner. Choisis un univers pour aller plus loin.
              </div>
              <button onClick={() => navigate("/explore")}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-semibold">
                Choisir un univers
              </button>
            </div>
          </div>
        )}

        {/* Signature */}
        <div className="mt-6 py-4 px-5 rounded-[18px] bg-gradient-to-r from-emerald-50 via-sky-50 to-emerald-50 text-center">
          <div className="text-[12px] text-emerald-600 leading-relaxed font-medium">
            Ecolojia qualifie un usage, pas un produit.<br />
            C'est la frequence et le contexte qui comptent.
          </div>
        </div>
      </div>
    </div>
  );
}
