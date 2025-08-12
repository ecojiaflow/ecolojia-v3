import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://ecolojia-backendvf.onrender.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor pour le token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecolojia_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor pour les réponses
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default apiClient;
