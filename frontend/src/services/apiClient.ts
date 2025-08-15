// PATH: src/services/apiClient.ts

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    // TOUJOURS utiliser le backend Render, en DEV comme en PROD
    this.baseURL = 'https://ecolojia-backendvf.onrender.com';
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    // Construction de l'URL avec query params
    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    // Configuration par défaut
    const config: RequestInit = {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      // CORS nécessaire pour les appels cross-origin
      mode: 'cors',
    };

    // Ajout du token JWT si présent
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      console.log(`[API] ${config.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      
      // Log du statut
      console.log(`[API] Response status: ${response.status}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.error(`[API] Error response:`, text);
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log(`[API] Response data:`, data);
      return data;
    } catch (error) {
      console.error(`[API] Error:`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      mode: 'cors',
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[API] Upload error:`, text);
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }
}

// Export d'une instance unique
const api = new ApiClient();
export default api;

// Export de la classe pour les tests
export { ApiClient };