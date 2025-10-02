import React, { useEffect, useMemo, useState } from "react";
import { StatsCard } from "../components/dashboard/StatsCard";
import { TrendSparkline } from "../components/dashboard/TrendSparkline";
import { dashboardService } from "../services/api";
import { Link } from "react-router-dom";

type DayPoint = { date: string; value: number };

type DashboardStats = {
  totalScans?: number;
  uniqueUsers?: number;
  avgGlobalScore?: number;
  scansByDay?: { date: string; count: number }[];
  topProducts?: { name:string; barcode?:string; score?:number; hits?:number; imageUrl?:string }[];
  topCategories?: { name:string; count:number }[];
};

const fmtPct = (n?: number) => Number.isFinite(n) ? `${Math.round(n!)}%` : "—";
const fmtInt = (n?: number) => Number.isFinite(n) ? n!.toLocaleString("fr-FR") : "—";

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
        // period: 'week' | 'month' | 'year' (défaut 'month')
        console.log("📊 Dashboard: fetching /dashboard/stats?period=month");
        const data = await dashboardService.getStats("month");
        if (!mounted) return;
        console.log("✅ Dashboard stats:", data);
        setStats(data);
      } catch (e:any) {
        console.error("❌ Dashboard stats failed:", e?.message || e);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Chargement des statistiques…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-3">{error}</p>
          <button onClick={()=> location.reload()} className="px-4 py-2 rounded-lg bg-emerald-600 text-white">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const totalScans   = fmtInt(stats?.totalScans);
  const uniqueUsers  = fmtInt(stats?.uniqueUsers);
  const avgGlobal    = fmtPct(stats?.avgGlobalScore);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <Link to="/scan" className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
            Scanner un produit
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard label="Scans (30 jours)" value={totalScans} sub="Total analyses effectuées" />
          <StatsCard label="Utilisateurs uniques" value={uniqueUsers} sub="Sur la période" />
          <StatsCard label="Score global moyen" value={avgGlobal} sub="Plus haut = meilleur" />
        </div>

        {/* Courbe d'activité */}
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Activité</div>
              <div className="text-lg font-semibold">Scans / jour</div>
            </div>
            <div className="text-sm text-gray-400">Période: 30 jours</div>
          </div>
          <div className="mt-2">
            <TrendSparkline data={sparkData} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top produits */}
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="text-lg font-semibold mb-3">Produits les plus scannés</div>
            <ul className="divide-y">
              {(stats?.topProducts || []).slice(0,8).map((p, i) => (
                <li key={i} className="py-2 flex items-center gap-3">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-gray-100" />}
                  <div className="flex-1">
                    <div className="font-medium">{p.name || "Produit"}</div>
                    <div className="text-xs text-gray-500">EAN {p.barcode || "—"} • Score {Math.round(p.score ?? 0)}%</div>
                  </div>
                  <div className="text-sm text-gray-500">{p.hits?.toLocaleString("fr-FR") ?? "—"}</div>
                </li>
              ))}
              {(!stats?.topProducts || stats.topProducts.length === 0) && (
                <li className="py-4 text-sm text-gray-500">Aucune donnée pour la période.</li>
              )}
            </ul>
          </div>

          {/* Top catégories */}
          <div className="bg-white rounded-xl shadow-sm p-4 border">
            <div className="text-lg font-semibold mb-3">Catégories les plus actives</div>
            <ul className="space-y-2">
              {(stats?.topCategories || []).slice(0,8).map((c, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-gray-700">{c.name}</span>
                  <span className="text-gray-500">{c.count?.toLocaleString("fr-FR") ?? "—"}</span>
                </li>
              ))}
              {(!stats?.topCategories || stats.topCategories.length === 0) && (
                <li className="py-1 text-sm text-gray-500">Aucune donnée pour la période.</li>
              )}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export { DashboardPage };
