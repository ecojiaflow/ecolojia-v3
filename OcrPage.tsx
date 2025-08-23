// PATH: frontend/src/pages/OcrPage.tsx
import React, { useState } from 'react';
import { Card, Button, Field } from '@/components/UiKit';
import { ocrService } from '@/services/ocrService';
import { analysisService } from '@/services/analysisService';

export default function OcrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [loadingA, setLoadingA] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const doOcr = async () => {
    if (!file) { setErr('Choisis une image.'); return; }
    setErr(null); setLoadingOcr(true);
    try {
      const res = await ocrService.ocrPhoto(file);
      const t = res?.text || res?.blocks?.map((b:any)=>b.text).join('\n') || '';
      setText(t);
    } catch (e) {
      setErr(String((e as Error).message));
    } finally {
      setLoadingOcr(false);
    }
  };

  const analyze = async () => {
    if (!text.trim()) { setErr('Aucun texte OCR.'); return; }
    setErr(null); setLoadingA(true);
    try {
      const a = await analysisService.analyzeText(text, { name: 'OCR Produit', category: 'food' });
      setAnalysis(a);
    } catch (e) {
      setErr(String((e as Error).message));
    } finally {
      setLoadingA(false);
    }
  };

  return (
    <div className="container">
      <div className="h1">OCR → Analyse</div>
      <Card>
        <Field label="Image ingrédients">
          <input type="file" accept="image/*" className="file" onChange={(e)=> setFile(e.target.files?.[0]||null)} />
        </Field>
        <div style={{ marginTop:10 }}>
          <Button onClick={doOcr} disabled={loadingOcr}>{loadingOcr ? 'OCR…' : 'Lancer l’OCR'}</Button>
        </div>
      </Card>

      <div className="h2">Texte OCR</div>
      <Card><pre style={{ whiteSpace:'pre-wrap', margin:0 }}>{text || '—'}</pre></Card>

      <div className="h2">Analyse</div>
      <div style={{ display:'flex', gap:8 }}>
        <Button onClick={analyze} disabled={loadingA}>Analyser le texte</Button>
      </div>
      <pre className="card" style={{ whiteSpace:'pre-wrap' }}>{JSON.stringify(analysis, null, 2)}</pre>

      {err && <div className="card" style={{ marginTop:12, border:'1px solid #ffd0d0', background:'#fff5f5', padding:12 }}>{err}</div>}
    </div>
  );
}
