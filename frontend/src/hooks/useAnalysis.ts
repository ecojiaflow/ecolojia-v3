// 📁 src/hooks/useAnalysis.ts

import { useState, useCallback } from 'react';
import { analyzeAuto, AnalyzeRequest, AnalyzeResponse } from '../api/realApi';

interface UseAnalysisReturn {
  isAnalyzing: boolean;
  error: string | null;
  analyze: (request: AnalyzeRequest) => Promise<AnalyzeResponse | null>;
}

export const useAnalysis = (onQuotaUsed?: () => void): UseAnalysisReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    async (request: AnalyzeRequest): Promise<AnalyzeResponse | null> => {
      try {
        setIsAnalyzing(true);
        setError(null);

        const result = await analyzeAuto(request);

        if (onQuotaUsed) {
          onQuotaUsed();
        }

        return result;
      } catch (err: any) {
        setError(err.message);
        console.error('❌ Erreur analyse:', err);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [onQuotaUsed]
  );

  return {
    isAnalyzing,
    error,
    analyze
  };
};
