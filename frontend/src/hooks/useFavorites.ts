// PATH: frontend/src/hooks/useFavorites.ts
import { useCallback, useState } from 'react';
import type { ProductInfo } from '../types/api';

const KEY = 'ecolojia.favorites';

function read(): ProductInfo[] { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
function write(list: ProductInfo[]) { localStorage.setItem(KEY, JSON.stringify(list)); }

export function useFavorites() {
  const [items, setItems] = useState<ProductInfo[]>(read());
  const has = useCallback((barcode?: string) => !!items.find(p => p.barcode === barcode), [items]);
  const add = useCallback((p: ProductInfo) => {
    const list = read();
    if (p.barcode && list.some(x => x.barcode === p.barcode)) return;
    const next = [p, ...list]; write(next); setItems(next);
  }, []);
  const remove = useCallback((barcode?: string) => {
    const next = read().filter(p => p.barcode !== barcode); write(next); setItems(next);
  }, []);
  const clear = useCallback(() => { write([]); setItems([]); }, []);
  return { items, has, add, remove, clear };
}
