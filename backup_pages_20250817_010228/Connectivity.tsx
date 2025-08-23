// PATH: frontend/src/pages/Connectivity.tsx
import React, { useMemo, useRef, useState } from 'react';
import { Button, Card, Field, Input, TextArea } from '@/components/UiKit';
import searchService, { extractProducts } from '@/services/searchService';
import { productService } from '@/services/productService';
import { analysisService } from '@/services/analysisService';
import { ocrService } from '@/services/ocrService';
import { historyService } from '@/services/historyService';
import { dashboardService } from '@/services/dashboardService';
import { paymentService } from '@/services/paymentService';

type LogItem = { ts: string; label: string; ok: boolean; data?: any; error?: string };

const pretty = (v: any) => JSON.stringify(v, null, 2);
const now = () => new Date().toLocaleTimeString();

export default function Connectivity() {
  const [query, setQuery] = useState('yaourt bio');
  const [barcode, setBarcode] = useState('3017620422003');
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ingr, setIngr] = useState('Farine de blé, sucre, huile de tournesol, sel.');
  const [plan, setPlan] = useState<'basic'|'pro'>('pro');

  const [logs, setLogs] = useState<LogItem[]>([]);
  const log = (label: string, ok: boolean, data?: any, error?: string) =>
    setLogs((l) => [{ ts: now(), label, ok, data, error }, ...l].slice(0, 200));

  const API_BASE = useMemo(() => (import.meta as any)?.env?.VITE_API_URL || '(proxy /api)', []);
  const refFile = useRef<HTMLInputElement>(null);

  const runSearch = async () => {
    try {
      const res = await searchService.searchProducts(query);
      const products = extractProducts(res);
      log('SEARCH /api/algolia/search', true, { count: products?.length ?? 0, sample: products?.[0] });
    } catch (e) {
      log('SEARCH /api/algolia/search', false, undefined, String((e as Error).message));
    }
  };

  const runBarcode = async () => {
    try {
      const res = await productService.getByBarcode(barcode);
      log('PRODUCT /api/products/barcode/:code', true, res);
    } catch (e) {
      log('PRODUCT /api/products/barcode/:code', false, undefined, String((e as Error).message));
    }
  };

  const runManualAnalysis = async () => {
    try {
      const res = await analysisService.analyzeManual({ name: 'Produit Test', category: 'food', ingredients: ingr });
      log('ANALYZE /api/analysis', true, res);
    } catch (e) {
      log('ANALYZE /api/analysis', false, undefined, String((e as Error).message));
    }
  };

  const runBarcodeAnalysis = async () => {
    try {
      const res = await analysisService.analyzeByBarcode(barcode);
      log('ANALYZE by BARCODE', true, res);
    } catch (e) {
      log('ANALYZE by BARCODE', false, undefined, String((e as Error).message));
    }
  };

  const runOCR = async () => {
    if (!ocrFile) { log('OCR /api/vision/analyze-image', false, undefined, 'Aucun fichier sélectionné'); return; }
    try {
      const res = await ocrService.ocrPhoto(ocrFile);
      log('OCR /api/vision/analyze-image', true, res);
    } catch (e) {
      log('OCR /api/vision/analyze-image', false, undefined, String((e as Error).message));
    }
  };

  const runHistory = async () => {
    try {
      const res = await historyService.listHistory();
      log('HISTORY /api/history', true, { count: Array.isArray(res) ? res.length : 0, sample: (res as any)?.[0] });
    } catch (e) {
      log('HISTORY /api/history', false, undefined, String((e as Error).message));
    }
  };

  const runDashboard = async () => {
    try {
      const res = await dashboardService.getStats();
      log('DASHBOARD /api/dashboard/stats', true, res);
    } catch (e) {
      log('DASHBOARD /api/dashboard/stats', false, undefined, String((e as Error).message));
    }
  };

  const runCheckout = async () => {
    try {
      const res = await paymentService.createCheckout(plan);
      log('PAYMENT /api/payment/create-checkout', true, res);
      if (res?.url) window.open(res.url, '_blank');
    } catch (e) {
      log('PAYMENT /api/payment/create-checkout', false, undefined, String((e as Error).message));
    }
  };

  const runSub = async () => {
    try {
      const res = await paymentService.getSubscription();
      log('PAYMENT /api/payment/subscription|status', true, res);
    } catch (e) {
      log('PAYMENT /api/payment/subscription|status', false, undefined, String((e as Error).message));
    }
  };

  return (
    <div>
      <div className="nav">
        <div className="nav-inner container">
          <div style={{ fontWeight: 800 }}>ECOLOJIA â€” Debug</div>
          <div className="small">API base: <b>{API_BASE}</b></div>
        </div>
      </div>

      <div className="container" style={{ marginTop: 16 }}>
        <div className="h1">Connectivity / Debug Harness</div>
        <p>Test e2e contre <code>/api/*</code> (DEV via proxy Vite, PROD via Netlify â†’ Render).</p>

        <div className="row">
          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="h2">Recherche</div>
            <Field label="Query">
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="yaourt, savon..." />
            </Field>
            <div style={{ marginTop: 10 }}>
              <Button onClick={runSearch}>Tester /api/algolia/search</Button>
            </div>
          </div>

          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="h2">Produit (code-barres)</div>
            <Field label="Code EAN">
              <Input value={barcode} onChange={e => setBarcode(e.target.value)} />
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Button onClick={runBarcode}>GET /api/products/barcode/:code</Button>
              <Button variant="secondary" onClick={runBarcodeAnalysis}>Analyse via code-barres</Button>
            </div>
          </div>

          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="h2">Analyse manuelle (IA)</div>
            <Field label="Ingrédients">
              <TextArea rows={4} value={ingr} onChange={e => setIngr(e.target.value)} />
            </Field>
            <div style={{ marginTop: 10 }}>
              <Button onClick={runManualAnalysis}>POST /api/analysis</Button>
            </div>
          </div>

          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="h2">OCR (photo â†’ texte)</div>
            <Field label="Fichier image">
              <input ref={refFile} type="file" accept="image/*" className="file" onChange={e => setOcrFile(e.target.files?.[0] || null)} />
            </Field>
            <div style={{ marginTop: 10 }}>
              <Button onClick={runOCR}>POST /api/vision/analyze-image</Button>
            </div>
          </div>

          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="h2">Historique + Dashboard</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={runHistory}>GET /api/history</Button>
              <Button onClick={runDashboard}>GET /api/dashboard/stats</Button>
            </div>
          </div>

          <div className="card" style={{ gridColumn: 'span 6' }}>
            <div className="h2">Paiement</div>
            <Field label="Plan">
              <select className="input" value={plan} onChange={e => setPlan(e.target.value as any)}>
                <option value="basic">basic</option>
                <option value="pro">pro</option>
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Button onClick={runCheckout}>Créer checkout</Button>
              <Button variant="secondary" onClick={runSub}>Etat abonnement</Button>
            </div>
          </div>

          <Card className="" title="Logs (dernier en haut)" right={<span className="badge">{logs.length}</span>}>
            <div style={{ display: 'grid', gap: 10 }}>
              {logs.map((l, idx) => (
                <div key={idx} className="card" style={{ background: l.ok ? '#f3fff1' : '#fff5f5', border: `1px solid ${l.ok ? '#bfeec0' : '#ffd0d0'}`, padding: 14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
                    <strong>{l.label}</strong>
                    <span className="small">{l.ts}</span>
                  </div>
                  {l.ok ? (
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{pretty(l.data)}</pre>
                  ) : (
                    <div style={{ color: '#b10000' }}>{l.error}</div>
                  )}
                </div>
              ))}
              {logs.length === 0 && <div className="small">Clique sur les boutons ciâ€‘dessus pour lancer les tests.</div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

