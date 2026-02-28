import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { SIM_PRODUCTS } from "../../data/simulateurData";

function SimulateurListPage() {
  const navigate = useNavigate();
  const universes = [
    { id: "alimentation", label: "Alimentation", icon: "🍎", color: "#10b981" },
    { id: "cosmetique", label: "Cosmetique", icon: "🧴", color: "#8b5cf6" },
    { id: "menager", label: "Menager", icon: "🏠", color: "#f59e0b" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-slate-200/60">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/explore")}><ChevronLeft className="h-5 w-5 text-slate-400" /></button>
          <span className="text-[15px] font-semibold text-slate-800">Simulateur</span>
          <div className="w-5" />
        </div>
      </div>
      <div className="mx-auto max-w-md px-4 pb-10 pt-4">
        <div className="text-center mb-6">
          <div className="text-2xl mb-2">🔍</div>
          <h1 className="text-xl font-bold text-slate-800">Comprendre sans scanner</h1>
          <p className="text-[13px] text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            Choisis un type de produit. Ecolojia t explique ce qui compte, comme si tu l avais scanne.
          </p>
        </div>
        {universes.map(u => (
          <div key={u.id} className="mb-5">
            <div className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
              <span>{u.icon}</span> {u.label}
            </div>
            <div className="flex flex-col gap-2">
              {SIM_PRODUCTS.filter(p => p.universe === u.id).map(p => (
                <button key={p.id} onClick={() => navigate(`/learn/simulateur/${p.id}`)}
                  className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200 text-left hover:border-emerald-300 hover:shadow-sm transition-all">
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-[14px] font-medium text-slate-700">{p.name}</span>
                  <ChevronLeft className="h-4 w-4 text-slate-300 ml-auto rotate-180" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimulateurDetailPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const product = SIM_PRODUCTS.find(p => p.id === type);
  if (!product) return <div className="p-8 text-center text-slate-400">Produit non trouve</div>;

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-slate-200/60">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/learn/simulateur")}><ChevronLeft className="h-5 w-5 text-slate-400" /></button>
          <span className="text-[15px] font-semibold text-slate-800">{product.name}</span>
          <div className="w-5" />
        </div>
      </div>
      <div className="mx-auto max-w-md px-4 pb-10 pt-4">
        <div className="text-center mb-6">
          <span className="text-4xl">{product.icon}</span>
        </div>

        {/* Takeaway */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 mb-3">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2.5">A retenir</div>
          <p className="text-[14px] text-slate-700 leading-relaxed font-medium">{product.takeaway}</p>
        </div>

        {/* Reflexes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 mb-3">
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider mb-3">Reflexes concrets</div>
          <div className="flex flex-col gap-2.5">
            {product.reflexes.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center text-[11px] font-bold mt-0.5">{i+1}</div>
                <span className="text-[13px] text-slate-600 leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Signal */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-5 mb-3">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2.5">Signal a surveiller</div>
          <div className="text-[13px] text-slate-700 font-medium">{product.signal.label}</div>
          <button onClick={() => navigate(`/learn/fiche/${product.signal.ficheSlug}`)}
            className="mt-2 text-[12px] font-medium text-emerald-600 underline">
            Comprendre en detail →
          </button>
        </div>

        {/* CTA */}
        <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50/80 border border-emerald-100 text-center">
          <div className="text-[13px] text-slate-600 mb-3">Tu veux voir ca sur un vrai produit ?</div>
          <button onClick={() => navigate("/scan")}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 transition-all text-[13px] font-semibold">
            Scanner un produit
          </button>
        </div>

        <div className="mt-4 text-center text-[10px] text-slate-300">
          Repere educatif simplifie. Sources : OMS, ANSES, EFSA.
        </div>
      </div>
    </div>
  );
}

export { SimulateurListPage, SimulateurDetailPage };
