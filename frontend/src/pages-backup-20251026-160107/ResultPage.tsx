// PATH: frontend/src/pages/ResultPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import analysisService, { AnalysisResult } from "../services/analysisService";
import productService from "../services/productService";

type ViewModel = {
  title: string;
  brand?: string;
  barcode?: string;
  score?: number;
  nutriScore?: string;
  ecoScore?: string;
  details?: Record<string, any>;
};

const ResultPage: React.FC = () => {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const barcode = sp.get("barcode") || "";
  const id = sp.get("id") || "";
  const [loading, setLoading] = useState(false);
  const [vm, setVm] = useState<ViewModel | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasInput = useMemo(() => !!barcode || !!id, [barcode, id]);

  useEffect(() => {
    if (!hasInput) return;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcode, id]);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      if (barcode) {
        const res: AnalysisResult = await analysisService.analyzeByBarcode(barcode);
        setVm({
          title: res.productName,
          brand: res.brand,
          barcode: res.barcode,
          score: res.score,
          nutriScore: res.nutriScore,
          ecoScore: res.ecoScore,
          details: res.details,
        });
      } else if (id) {
        const p = await productService.getById(id);
        setVm({
          title: p.productName ?? p.name ?? "Produit",
          brand: p.brand,
          barcode: p.barcode,
          score: typeof p.score === "number" ? p.score : undefined,
          nutriScore: p.nutriScore as any,
          ecoScore: p.ecoScore as any,
          details: p as any,
        });
      }
    } catch (e: any) {
      setError(e?.message || "Analyse indisponible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F9F4" }}>
      <div className="eco-container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <header className="eco-card" style={{ padding: 24 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#3B3B3B" }}>
            Résultat d'analyse
          </h1>
          <p style={{ marginTop: 8, color: "#607069" }}>
            {barcode ? `Code-barres : ${barcode}` : id ? `Produit #${id}` : "Aucun identifiant fourni"}
          </p>
        </header>

        <main style={{ marginTop: 24 }}>
          {loading && <div className="eco-card" style={{ padding: 24, textAlign: "center" }}>Analyse en cours…</div>}
          {!loading && error && <div className="eco-card" style={{ padding: 24, color: "#7a2f2f" }}>{error}</div>}
          {!loading && !error && vm && (
            <div className="eco-card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 24, fontWeight: 800, color: "#3B3B3B" }}>
                    {vm.title}
                  </h2>
                  {vm.brand && <div className="eco-badge" style={{ marginBottom: 12 }}>{vm.brand}</div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                    {typeof vm.score === "number" && (
                      <span className="eco-badge">Score {vm.score}%</span>
                    )}
                    {vm.nutriScore && <span className="eco-badge">Nutri-Score {vm.nutriScore}</span>}
                    {vm.ecoScore && <span className="eco-badge">Éco-Score {vm.ecoScore}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <button className="eco-btn" style={{ background: "#E9F8DF", color: "#2c6e2f" }} onClick={() => navigate("/history")}>
                    Voir l'historique
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <h3 className="eco-section-title">Détails</h3>
                <pre style={{
                  background: "#fff",
                  border: "1px solid #DDE9DA",
                  borderRadius: 12,
                  padding: 16,
                  overflow: "auto",
                  margin: 0
                }}>
{JSON.stringify(vm.details ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
          {!loading && !error && !vm && (
            <div className="eco-card" style={{ padding: 24, textAlign: "center" }}>
              Fournissez un <b>barcode</b> ou un <b>id</b> dans l'URL.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ResultPage;
