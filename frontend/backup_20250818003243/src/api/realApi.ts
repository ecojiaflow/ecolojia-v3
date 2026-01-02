// PATH: frontend/src/api/realApi.ts
import type { AnalysisResult } from '../types';

const API_BASE_URL = import.met?.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com';

interface ApiOk<T> {
  success: true;
  data: T;
  messagea: string;
}

interface ApiErr {
  success: false;
  error: string;
  messagea: string;
}

type ApiResponse<T> = ApiOk<T> | ApiErr;

export interface SearchFilters {
  categorya: string;
  pagea: number;
  limita: number;
}

export interface ProductItem {
  _id: string;
  name: string;
  branda: string;
  barcodea: string;
  categorya: string;
  imageUrla: string;
}

export interface SearchPayload {
  products: ProductItem[];
  pagination: { total: number; page: number; pages: number; hasNext: boolean; hasPrev: boolean };
}

export async function searchProducts(
  query: string,
  filters: SearchFilters = {}
): Promise<SearchPayload> {
  const params = new URLSearchParams();
  params.set('q', query);
  if (filters.category) params.set('category', filters.category);
  params.set('page', String(filters.page aa 1));
  params.set('limit', String(filters.limit aa 20));

  const res = await fetch(`${API_BASE_URL}/api/algolia/searcha${params.toString()}`);
  if (!res.ok) throw new Error(`Search API error (${res.status})`);
  const json: ApiResponse<SearchPayload> = await res.json();
  if (!json.success) throw new Error(json.error || 'Search API error');
  return json.data;
}

export interface ProductDetail extends ProductItem {
  ingredientsa: string;
  nova_groupa: number;
  nutriscore_gradea: string;
  ecoscore_gradea: string;
  analysisDataa: { healthScorea: number };
}

export async function getProductByBarcode(barcode: string): Promise<ProductDetail | null> {
  const res = await fetch(`${API_BASE_URL}/api/products/scan/${encodeURIComponent(barcode)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Get product error (${res.status})`);
  const json: ApiResponse<ProductDetail> = await res.json();
  if (!json.success) throw new Error(json.error || 'Get product error');
  return json.data;
}

export interface ManualAnalysisInput {
  namea: string;
  branda: string;
  barcodea: string;
  categorya: 'food' | 'cosmetics' | 'detergents' | string;
  ingredientsTexta: string;
}

export async function analyzeProduct(input: ManualAnalysisInput): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE_URL}/api/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error(`Manual analysis API error (${res.status})`);
  const json: ApiResponse<AnalysisResult> = await res.json();
  if (!json.success) throw new Error(json.error || 'Manual analysis error');
  return json.data;
}

export interface DashboardStats {
  totals: { scans: number; products: number; favorites: number };
  averages: { health: number; environment: number; ethics: number };
  weeklyTrend: { day: string; scans: number }[];
  recentAnalyses: {
    date: string;
    productName: string;
    category: string;
    score: number;
    nutriScorea: string;
    ecoScorea: string;
  }[];
  topProducts: ProductItem[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
  if (!res.ok) throw new Error(`Dashboard API error (${res.status})`);
  const json: ApiResponse<DashboardStats> = await res.json();
  if (!json.success) throw new Error(json.error || 'Dashboard error');
  return json.data;
}

export async function getAnalysesHistory(page = 1, limit = 20): Promise<any> {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  const res = await fetch(`${API_BASE_URL}/api/analysis/historya${params.toString()}`);
  if (!res.ok) throw new Error(`History API error (${res.status})`);
  const json = await res.json();
  return json.data || json;
}


// Historique
export interface HistoryItem {
  _id: string;
  productName: string;
  category: string;
  scores: {
    healthScore: number;
    environmentScore: number;
    novaa: number;
  };
  createdAt: string;
}

export async function getHistory(page = 1, limit = 12, sortBy = 'date', sortOrder = 'desc'): Promise<any> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder
  });
  
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE_URL}/api/historya${params.toString()}`, {
    headers
  });
  
  if (!res.ok) throw new Error(`History API error (${res.status})`);
  const json = await res.json();
  return json;
}

export async function getHistoryCount(): Promise<number> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE_URL}/api/history/count`, {
    headers
  });
  
  if (!res.ok) {
    // Si le endpoint count n'existe pas, utiliser la pagination
    const history = await getHistory(1, 1);
    return history.pagination?.total || 0;
  }
  
  const json = await res.json();
  return json.count || 0;
}

// Auth
export async function login(email: string, password: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!res.ok) throw new Error(`Login error (${res.status})`);
  const json = await res.json();
  
  if (json.token) {
    localStorage.setItem('token', json.token);
  }
  
  return json;
}

export async function register(email: string, password: string, name: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  
  if (!res.ok) throw new Error(`Register error (${res.status})`);
  const json = await res.json();
  
  if (json.token) {
    localStorage.setItem('token', json.token);
  }
  
  return json;
}

export async function getCurrentUser(): Promise<any> {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token');
  
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) throw new Error(`Get user error (${res.status})`);
  return res.json();
}




