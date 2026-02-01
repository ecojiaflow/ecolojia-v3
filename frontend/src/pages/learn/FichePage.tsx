import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ExternalLink } from "lucide-react";
import { FICHES } from "../../data/educationData";

export default function FichePage() {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  const fiche = slug ? FICHES[slug] : null;

  if (!fiche) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-xl font-semibold text-slate-900">Fiche en construction</h1>
          <p className="mt-2 text-sm text-slate-500">Cette fiche educative sera bientot disponible.</p>
          <button onClick={() => nav(-1)}
            className="mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <button onClick={() => nav(-1)} className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-all">
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-medium text-slate-600">Fiche educative</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900 leading-tight">{fiche.title}</h1>
          <div className="mt-4 px-4 py-3 rounded-xl bg-violet-50 border border-violet-200">
            <p className="text-sm font-medium text-violet-800">En 10 secondes</p>
            <p className="mt-1 text-sm text-violet-700">{fiche.quickTake}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900 mb-3">Les bons reflexes</p>
          <div className="space-y-2">
            {fiche.reflexes.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <p className="text-sm text-slate-700">{r}</p>
              </div>
            ))}
          </div>
        </div>

        {fiche.sources.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 mb-3">Sources</p>
            <div className="space-y-1">
              {fiche.sources.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3 text-slate-400 flex-shrink-0" />
                  <p className="text-xs text-slate-500">{s}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pt-2 pb-8">
          <p className="text-xs text-slate-400">
            L ensemble du repas compte plus qu un aliment isole.
          </p>
        </div>
      </div>
    </div>
  );
}
