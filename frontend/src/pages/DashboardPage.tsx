import { Link } from 'react-router-dom';
import React, { useEffect, useMemo, useState } from "react";
import { StatsCard } from "../components/dashboard/StatsCard";
import { TrendSparkline } from "../components/dashboard/TrendSparkline";
import { dashboardService } from "../services/api";

type DayPoint = { date: string; value: number };

type DashboardStats = {
  totalScans?: number;
  uniqueUsers?: number;
  avgGlobalScore?: number;
  scansByDay?: { date: string; count: number }[];
  topProducts?: { name:string; barcode?:string; score?:number; hits?:number; imageUrl?:string }[];
  topCategories?: { name:string; count:number }[];
};

const fmtPct = (n?: number) => Number.isFinite(n) ? `${Math.round(n!)}%` : "-";
const fmtInt = (n?: number) => Number.isFinite(n) ? n!.toLocaleString("fr-FR") : "-";

const normalizeSpark = (arr?: { date:string; count:number }[]): DayPoint[] =>
  (arr || []).map(p => ({ date: p.date, value: p.count }));

const DashboardPage: React.FC = () => {
  const [stats, setStats]   = useState<DashboardStats|null>(null);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState<string|null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoad(true); setError(null);
      try {
        console.log("Dashboard: fetching /dashboard/stats?period=month");
        const data = await dashboardService.getStats("month");
        if (!mounted) return;
        console.log("Dashboard stats:", data);
        setStats(data);
      } catch (e:any) {
        console.error("Dashboard stats failed:", e?.message || e);
        if (!mounted) return;
        setError("Impossible de charger les statistiques.");
      } finally {
        if (mounted) setLoad(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const sparkData = useMemo(()=> normalizeSpark(stats?.scansByDay), [stats]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-neutral-600">Chargement des statistiques...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="text-center bg-neutral-0 rounded-xl shadow-3 p-8 max-w-md mx-4 border border-neutral-300">
          <p className="text-danger mb-4 font-medium">{error}</p>
          <button 
            onClick={()=> location.reload()} 
            className="h-10 px-6 rounded-lg bg-primary-500 text-forest font-medium hover:bg-primary-600 transition-all shadow-2"
          >
            Reessayer
          </button>
        </div>
      </div>
    );
  }

  const totalScans   = fmtInt(stats?.totalScans);
  const uniqueUsers  = fmtInt(stats?.uniqueUsers);
  const avgGlobal    = fmtPct(stats?.avgGlobalScore);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Tableau de bord</h1>
            <p className="text-neutral-600 mt-1">Vue d'ensemble de vos analyses</p>
          </div>
          <Link 
            to="/scan" 
            className="h-11 px-6 rounded-lg bg-primary-500 text-forest font-medium hover:bg-primary-600 transition-all shadow-2 flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18"/>
            </svg>
            Scanner
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard label="Scans (30 jours)" value={totalScans} />
          <StatsCard label="Utilisateurs uniques" value={uniqueUsers} />
          <StatsCard label="Score global moyen" value={avgGlobal} />
        </div>

        {/* Card Premium - Plans Repas */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-3 p-6 border-2 border-primary-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                <path d="M7 2v20"/>
                <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
              </svg>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-neutral-900">Plans Repas Personnalises</h3>
                <span className="px-2 py-1 bg-primary text-white text-xs font-semibold rounded-full">Premium</span>
              </div>
              <p className="text-neutral-600 text-sm mb-4">
                Generez des menus hebdomadaires adaptes a votre budget, regime et allergenes avec notre IA nutritionniste
              </p>
              <Link
                to="/meal-plan"
                className="inline-flex items-center gap-2 h-10 px-6 bg-primary-hover text-white rounded-lg font-medium hover:bg-primary-active transition-all shadow-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span>Creer mon plan repas</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-neutral-0 rounded-xl shadow-3 p-6 border border-neutral-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-neutral-600">Activite</div>
              <div className="text-xl font-semibold text-neutral-900">Scans / jour</div>
            </div>
            <div className="text-sm text-neutral-500">Periode: 30 jours</div>
          </div>
          <div className="mt-4">
            <TrendSparkline data={sparkData} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-0 rounded-xl shadow-3 p-6 border border-neutral-300">
            <div className="text-xl font-semibold text-neutral-900 mb-4">Produits les plus scannes</div>
            <ul className="divide-y divide-neutral-200">
              {(stats?.topProducts || []).slice(0,8).map((p, i) => (
                <li key={i} className="py-3 flex items-center gap-3">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-neutral-300" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-300" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-neutral-900">{p.name || "Produit"}</div>
                    <div className="text-xs text-neutral-600">EAN {p.barcode || "-"} • Score {Math.round(p.score || 0)}%</div>
                  </div>
                  <div className="text-sm text-neutral-600">{p.hits?.toLocaleString("fr-FR") || "-"}</div>
                </li>
              ))}
              {(!stats?.topProducts || stats.topProducts.length === 0) && (
                <li className="py-4 text-sm text-neutral-600">Aucune donnee pour la periode.</li>
              )}
            </ul>
          </div>

          <div className="bg-neutral-0 rounded-xl shadow-3 p-6 border border-neutral-300">
            <div className="text-xl font-semibold text-neutral-900 mb-4">Categories les plus actives</div>
            <ul className="space-y-3">
              {(stats?.topCategories || []).slice(0,8).map((c, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0">
                  <span className="text-neutral-800 font-medium">{c.name}</span>
                  <span className="text-neutral-600 font-semibold">{c.count?.toLocaleString("fr-FR") || "-"}</span>
                </li>
              ))}
              {(!stats?.topCategories || stats.topCategories.length === 0) && (
                <li className="py-2 text-sm text-neutral-600">Aucune donnee pour la periode.</li>
              )}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;