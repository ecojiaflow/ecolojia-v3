// PATH: frontend/src/hooks/useHistory.ts
import { useCallback, useMemo, useState } from 'react';
import type { AnalysisResult } from '../types/api';

const KEY = 'ecolojia.history';
const MAX = 50;

function read(): AnalysisResult[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function write(list: AnalysisResult[]) { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); }

export function useHistory() {
  const [items, setItems] = useState<AnalysisResult[]>(read());

  const save = useCallback((res: AnalysisResult) => {
    const list = [res, ...read()].slice(0, MAX);
    write(list); setItems(list);
  }, []);

  const clear = useCallback(() => { write([]); setItems([]); }, []);
  const stats = useMemo(() => {
    const total = items.length;
    const avg = total ? Math.round(items.reduce((a,b)=>a+(b.scores.global ?? 0),0)/total) : 0;
    return { total, avg };
  }, [items]);

  return { items, save, clear, stats };
}
