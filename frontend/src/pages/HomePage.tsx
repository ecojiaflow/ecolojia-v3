/**
 * HomePage.tsx — ECOLOJIA 2026
 *
 * CONSTITUTION Article 7 — Les trois portes d entree :
 * 1. Comprendre un produit (scan)
 * 2. Comprendre une regle (explorer)
 * 3. Comprendre une situation (explore premium)
 *
 * "Retrouver un produit" = utilitaire secondaire discret
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { Scan, Camera, Compass, Search } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F3FBF6] flex flex-col">
      {/* Main Content - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-3xl">🌿</span>
          <span className="text-2xl font-bold text-slate-900">Ecolojia</span>
        </div>

        {/* Tagline */}
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 text-center mb-3">
          Comprendre ce que je consomme
        </h1>
        <p className="text-slate-500 text-center mb-10 max-w-md">
          Pas de jugement. Pas de peur. Juste ce qui compte.
        </p>

        {/* 3 Portes d entree (Constitution Article 7) */}
        <div className="w-full max-w-sm space-y-4">

          {/* PORTE 1 : Scanner un produit (CTA Principal) */}
          <button
            onClick={() => navigate("/scan")}
            className="w-full flex items-center justify-between p-5 rounded-2xl bg-[#16A34A] text-white font-semibold hover:bg-[#0F7A34] transition-colors shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Scan className="h-6 w-6" />
              <span>Scanner un produit</span>
            </div>
            <span className="text-white/70">→</span>
          </button>

          {/* PORTE 1 bis : Photo (variante du scan) */}
          <button
            onClick={() => navigate("/scan?mode=photo")}
            className="w-full flex items-center justify-between p-5 rounded-2xl bg-white text-slate-900 font-semibold border-2 border-slate-200 hover:border-[#16A34A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Camera className="h-6 w-6 text-[#16A34A]" />
              <span>Prendre une photo</span>
            </div>
            <span className="text-slate-400">→</span>
          </button>

          {/* PORTE 2+3 : Explorer (regles + situations) */}
          <button
            onClick={() => navigate("/explore")}
            className="w-full flex items-center justify-between p-5 rounded-2xl bg-white text-slate-900 font-semibold border-2 border-slate-200 hover:border-[#16A34A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🧠</span>
              <span>Apprendre un reflexe</span>
            </div>
            <span className="text-slate-400">→</span>
          </button>
        </div>

        {/* Utilitaire secondaire : Retrouver un produit */}
        <button
          onClick={() => navigate("/search")}
          className="mt-8 flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors text-sm"
        >
          <Search className="h-4 w-4" />
          <span>Retrouver un produit</span>
        </button>

        {/* Trust - Minimal */}
        <p className="mt-10 text-xs text-slate-400 text-center max-w-xs">
          Ecolojia qualifie un usage, pas un produit.
          Sources : OMS, ANSES, EFSA.
        </p>
      </div>

      {/* Bottom Nav (Mobile) - Alignee Constitution */}
      <div className="lg:hidden border-t border-slate-200 bg-white safe-area-pb">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <button onClick={() => navigate("/")} className="flex flex-col items-center py-2 text-[#16A34A]">
            <span className="text-lg">🏠</span>
            <span className="text-[10px] font-medium mt-1">Accueil</span>
          </button>
          <button onClick={() => navigate("/scan")} className="flex flex-col items-center py-2 text-slate-400">
            <span className="text-lg">📷</span>
            <span className="text-[10px] font-medium mt-1">Scanner</span>
          </button>
          <button onClick={() => navigate("/explore")} className="flex flex-col items-center py-2 text-slate-400">
            <span className="text-lg">🧭</span>
            <span className="text-[10px] font-medium mt-1">Explorer</span>
          </button>
          <button onClick={() => navigate("/profile")} className="flex flex-col items-center py-2 text-slate-400">
            <span className="text-lg">👤</span>
            <span className="text-[10px] font-medium mt-1">Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
}

