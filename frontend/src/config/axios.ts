import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL + '/api'
  : 'http://localhost:10000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecolojia_token');
    if (token) config.headers.Authorization = 'Bearer ' + token;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ecolojia_token');
      localStorage.removeItem('ecolojia_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { API_BASE };
