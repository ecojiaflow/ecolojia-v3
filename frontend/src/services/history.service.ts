export interface ScanHistoryItem {
  barcode: string;
  productName: string;
  timestamp: Date;
  score?: number;
}

const STORAGE_KEY = 'ecolojia_scan_history';

export const addScan = (barcode: string, productData: any): void => {
  const history = getHistory();
  const newItem: ScanHistoryItem = {
    barcode,
    productName: productData.name || 'Produit inconnu',
    timestamp: new Date(),
    score: productData.scores?.overallScore
  };
  
  // �viter doublons r�cents (< 1h)
  const isDuplicate = history.some(
    item => item.barcode === barcode && 
    (Date.now() - new Date(item.timestamp).getTime()) < 3600000
  );
  
  if (!isDuplicate) {
    history.unshift(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  }
};

export const getHistory = (): ScanHistoryItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
