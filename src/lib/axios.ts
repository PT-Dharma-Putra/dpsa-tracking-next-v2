import axios from 'axios';

// Default to a placeholder, will be updated with real env var later
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
// const BASE_URL =
//   process.env.NEXT_PUBLIC_API_URL ||
//   'https://service-tracking.dharmaputrainterior.co.id/api';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  // No default Content-Type — Axios transformRequest auto-sets application/json for
  // plain objects, and the browser auto-sets multipart/form-data (with boundary) for FormData.
});

// Request Interceptor (Add Token)
axiosInstance.interceptors.request.use(
  (config) => {
    const authData =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth-storage')
        : null;
    if (authData) {
      const { state } = JSON.parse(authData);
      const token = state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (Handle 401)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/auth/internal/login';
      }
    }
    return Promise.reject(error);
  }
);
