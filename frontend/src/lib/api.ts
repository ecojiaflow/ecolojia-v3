// PATH: frontend/src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'https://ecolojia-backendvf.onrender.com';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  async getHistory(page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy: 'date',
      sortOrder: 'desc'
    });
    
    return fetchWithAuth(`${API_URL}/api/history?${params.toString()}`);
  },

  async searchProducts(query: string, filters: any = {}) {
    const params = new URLSearchParams({
      q: query,
      page: String(filters.page || 1),
      limit: String(filters.limit || 20)
    });
    
    return fetchWithAuth(`${API_URL}/api/products/search?${params.toString()}`);
  },

  async analyzeProduct(data: any) {
    return fetchWithAuth(`${API_URL}/api/analysis`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export default api;
