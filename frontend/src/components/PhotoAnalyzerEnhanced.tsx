import React, { useState } from 'react';
import { visionService, productService } from '../services/apiEnhanced';
import { Loader2 } from 'lucide-react';

export const PhotoAnalyzer: React.FC<{ onResult: (p:any)=>void; defaultCategory?: 'food'|'cosmetics'|'detergents' }> =
({ onResult, defaultCategory='food' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject; reader.readAsDataURL(file);
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setLoading(true); setError(null);
    try {
      const base64 = await toBase64(f);
      const vision = await visionService.analyzeImage(base64);
      const payload = {
        barcode: vision?.barcode || undefined,
        category: vision?.category || defaultCategory,
        name: vision?.productName || undefined,
        ingredients: vision?.ingredients || undefined
      };
      const { data } = await productService.analyze(payload);
      onResult(data);
    } catch (err:any) {
      setError('Analyse image échouée. Réessayez avec plus de lumière / autre angle.');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl p-4 border">
      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700">
        <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        {loading ? <Loader2 className="animate-spin w-4 h-4" /> : null}
        {loading ? 'Analyse en cours...' : 'Prendre une photo'}
      </label>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
};
