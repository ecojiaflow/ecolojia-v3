import React from "react";
import { X, ExternalLink } from "lucide-react";

const SOURCES = [
  { name: "OMS", url: "https://www.who.int" },
  { name: "ANSES", url: "https://www.anses.fr" },
  { name: "EFSA", url: "https://www.efsa.europa.eu" },
  { name: "Open Food Facts", url: "https://world.openfoodfacts.org" },
];

export function MethodDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <React.Fragment>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Methode et Sources</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Notre approche</h3>
            <p className="text-sm text-slate-600">Ecolojia classe un usage, pas un produit.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Sources</h3>
            <div className="space-y-2">
              {SOURCES.map((s) => <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100"><span className="text-sm font-medium text-slate-700">{s.name}</span><ExternalLink className="h-4 w-4 text-slate-400" /></a>)}
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <p className="text-xs text-slate-600"><strong className="text-emerald-700">Outil educatif</strong> - Ne remplace pas un avis medical.</p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}
