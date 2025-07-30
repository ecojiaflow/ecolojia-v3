// PATH: frontend/src/hooks/useProductAnalysis.ts
import { useState } from 'react';
import { aiService } from '../services/aiService';

export function useProductAnalysis() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (
    productName: string,
    category: string,
    ingredients?: string[],
    prompt?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiService.analyze({ productName, category, ingredients, prompt });
      setData(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { loading, data, error, analyze };
}
// EOF
