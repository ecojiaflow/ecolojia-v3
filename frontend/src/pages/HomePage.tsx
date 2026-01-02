/**
 * HomePage.tsx — ECOLOJIA Assistant-First 2026
 * 
 * RÈGLE : Un seul point d'entrée cognitif
 * "Qu'est-ce que tu veux comprendre maintenant ?"
 * 
 * PAS DE : recherche, stats, cartes éducatives, encyclopédie
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scan, Camera, MessageCircle, ArrowRight } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");

  const handleAsk = () => {
    if (question.trim()) {
      navigate(`/assistant?q=${encodeURIComponent(question.trim())}`);
    } else {
      navigate("/assistant");
    }
  };

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

        {/* 3 Actions */}
        <div className="w-full max-w-sm space-y-4">
          
          {/* Scanner */}
          <button
            onClick={() => navigate("/scan")}
            className="w-full flex items-center justify-between p-5 rounded-2xl bg-[#16A34A] text-white font-semibold hover:bg-[#0F7A34] transition-colors shadow-lg"
          >
            <div className="flex items-center gap-3">
              <Scan className="h-6 w-6" />
              <span>Scanner un produit</span>
            </div>
            <ArrowRight className="h-5 w-5" />
          </button>

          {/* Photo */}
          <button
            onClick={() => navigate("/scan?mode=photo")}
            className="w-full flex items-center justify-between p-5 rounded-2xl bg-white text-slate-900 font-semibold border-2 border-[#E6F2EA] hover:border-[#16A34A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Camera className="h-6 w-6 text-[#16A34A]" />
              <span>Prendre une photo</span>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400" />
          </button>

          {/* Assistant */}
          <button
            onClick={handleAsk}
            className="w-full flex items-center justify-between p-5 rounded-2xl bg-white text-slate-900 font-semibold border-2 border-[#E6F2EA] hover:border-[#16A34A] transition-colors"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-[#16A34A]" />
              <span>Poser une question</span>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Trust - Minimal */}
        <p className="mt-12 text-xs text-slate-400 text-center max-w-xs">
          Ecolojia qualifie un usage, pas un produit. 
          Sources : OMS, ANSES, EFSA.
        </p>
      </div>

      {/* Bottom Nav (Mobile) */}
      <div className="lg:hidden border-t border-[#E6F2EA] bg-white safe-area-pb">
        <div className="grid grid-cols-4 gap-1 px-2 py-2">
          <button onClick={() => navigate("/")} className="flex flex-col items-center py-2 text-[#16A34A]">
            <span className="text-lg">🏠</span>
            <span className="text-[10px] font-medium mt-1">Accueil</span>
          </button>
          <button onClick={() => navigate("/scan")} className="flex flex-col items-center py-2 text-slate-400">
            <span className="text-lg">📷</span>
            <span className="text-[10px] font-medium mt-1">Scanner</span>
          </button>
          <button onClick={() => navigate("/assistant")} className="flex flex-col items-center py-2 text-slate-400">
            <span className="text-lg">💬</span>
            <span className="text-[10px] font-medium mt-1">Assistant</span>
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
