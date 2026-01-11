/**
 * StickyActionBar.tsx — Barre d'action fixe mobile (Polish V1)
 * 
 * Visible uniquement sur mobile (< 640px)
 * Actions rapides : Alternative + Ajouter à liste
 * 
 * @version 1.0.0
 */

import React from "react";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";

interface StickyActionBarProps {
  onAlternatives: () => void;
  onAddToList: () => void;
}

export function StickyActionBar({ 
  onAlternatives, 
  onAddToList 
}: StickyActionBarProps) {
  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed bottom-0 left-0 right-0 z-40 sm:hidden"
    >
      {/* Gradient fade */}
      <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      
      {/* Bar */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 pb-safe">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <button
            onClick={onAlternatives}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            <ArrowRight className="h-4 w-4" />
            Alternative
          </button>
          <button
            onClick={onAddToList}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-white text-slate-800 font-semibold text-sm border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            <ShoppingCart className="h-4 w-4" />
            Ma liste
          </button>
        </div>
      </div>
    </motion.div>
  );
}
