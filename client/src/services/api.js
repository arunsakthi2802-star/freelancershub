import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
const baseURL = rawBase ? `${rawBase}/api` : '/api';

const API = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor – attach token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fh_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 & network errors
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fh_token');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/login';
      }
    }
    
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return Promise.reject(new Error(`Network Error: Cannot connect to API at ${baseURL}. Ensure backend is running.`));
    }

    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default API;
