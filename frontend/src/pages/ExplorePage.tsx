/**
 * ExplorePage.tsx - Hub educatif Ecolojia
 * Refondu : hub statique vers les 3 couches educatives
 * Plus d'appel API /education/universes
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Compass, FlaskConical, Scan } from "lucide-react";

const UNIVERSES = [
  { id: "alimentation", name: "Alimentation", icon: "\uD83C\uDF4E", color: "#10b981", tagline: "Comprendre ce que tu manges", steps: 7 },
  { id: "cosmetique", name: "Cosmetique", icon: "\uD83E\uDDF4", color: "#8b5cf6", tagline: "Comprendre ce que tu appliques", steps: 5 },
  { id: "menager", name: "Produits menagers", icon: "\uD83C\uDFE0", color: "#f59e0b", tagline: "Comprendre ce que tu utilises", steps: 5 },
];

export default function ExplorePage() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => nav(-1)} className="p-2 rounded-xl hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <span className="font-semibold text-slate-900">Apprendre</span>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Comprendre avant d'acheter</h1>
          <p className="text-slate-500 text-sm">3 facons d'apprendre, a ton rythme</p>
        </div>

        {/* COUCHE 1 : La methode */}
        <button onClick={() => nav("/learn/methode")}
          className="w-full p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all text-left group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">La methode Ecolojia</h3>
              <p className="text-sm text-slate-500">5 principes universels pour tout comprendre</p>
            </div>
            <span className="text-slate-300 group-hover:text-emerald-500 text-xl">\u2192</span>
          </div>
        </button>

        {/* COUCHE 2 : Univers */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Parcours guides</h2>
          <div className="space-y-3">
            {UNIVERSES.map((u) => (
              <button key={u.id} onClick={() => nav("/learn/univers/" + u.id)}
                className="w-full p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-left group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: u.color + "15" }}>
                    {u.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-slate-700">{u.name}</h3>
                    <p className="text-xs text-slate-500">{u.tagline} \u2022 {u.steps} etapes</p>
                  </div>
                  <span className="text-slate-300 group-hover:text-slate-500">\u2192</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* COUCHE 3 : Simulateur */}
        <button onClick={() => nav("/learn/simulateur")}
          className="w-full p-5 rounded-2xl bg-white border-2 border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all text-left group">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <FlaskConical className="h-7 w-7 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-lg group-hover:text-amber-600 transition-colors">Simulateur</h3>
              <p className="text-sm text-slate-500">Teste sur 8 produits types sans scanner</p>
            </div>
            <span className="text-slate-300 group-hover:text-amber-500 text-xl">\u2192</span>
          </div>
        </button>

        {/* CTA scan */}
        <div className="bg-emerald-50 rounded-2xl p-5 text-center border border-emerald-100">
          <p className="text-slate-700 text-sm mb-3">Pret a tester sur un vrai produit ?</p>
          <button onClick={() => nav("/scan")}
            className="w-full py-3.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
            <Scan className="h-5 w-5" />
            Scanner un produit
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Contenu base sur les recommandations OMS, ANSES, EFSA, ADEME
        </p>
      </div>
    </div>
  );
}