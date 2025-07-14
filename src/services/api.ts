import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_URL } from '../constants/config';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.warn('Unauthorized access - redirecting to login');
      // You can add navigation logic here
    }
    return Promise.reject(error);
  }
);

// Helper function to get auth token
const getAuthToken = (): string | null => {
  // This will be implemented with Clerk authentication
  return null;
};

export default api; 