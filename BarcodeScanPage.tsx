// PATH: frontend/src/pages/BarcodeScanPage.tsx
import React, { useState } from 'react';
import { Card, Button, Field, Input } from '@/components/UiKit';
import { productService } from '@/services/productService';
import { analysisService } from '@/services/analysisService';

export default function BarcodeScanPage() {
  const [code, setCode] = useState('3017620422003');
  const [product, setProduct] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingP, setLoadingP] = useState(false);
  const [loadingA, setLoadingA] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const getProduct = async () => {
    setErr(null); setAnalysis(null); setLoadingP(true);
    try {
      const p = await productService.getByBarcode(code);
      setProduct(p);
    } catch (e) {
      setErr(String((e as Error).message));
      setProduct(null);
    } finally {
      setLoadingP(false);
    }
  };

  const analyze = async () => {
    setErr(null); setLoadingA(true);
    try {
      const a = await analysisService.analyzeByBarcode(code);
      setAnalysis(a);
    } catch (e) {
      setErr(String((e as Error).message));
      setAnalysis(null);
    } finally {
      setLoadingA(false);
    }
  };

  return (
    <div className="container">
      <div className="h1">Scan (code‑barres)</div>
      <Card>
        <Field label="Code EAN">
          <Input value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          <Button onClick={getProduct} disabled={loadingP}>{loadingP ? 'Chargement…' : 'Obtenir le produit'}</Button>
          <Button onClick={analyze} disabled={loadingA} className="secondary">{loadingA ? 'Analyse…' : 'Analyser'}</Button>
        </div>
      </Card>

      {err && <div className="card" style={{ marginTop:12, border:'1px solid #ffd0d0', background:'#fff5f5', padding:12 }}>{err}</div>}

      <div className="h2">Produit</div>
      <pre className="card" style={{ whiteSpace:'pre-wrap' }}>{JSON.stringify(product, null, 2)}</pre>

      <div className="h2">Analyse</div>
      <pre className="card" style={{ whiteSpace:'pre-wrap' }}>{JSON.stringify(analysis, null, 2)}</pre>
    </div>
  );
}
