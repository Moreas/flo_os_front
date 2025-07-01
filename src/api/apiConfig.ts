import axios, { AxiosInstance, AxiosResponse } from 'axios';
import API_BASE from '../apiBase';

// Basic Auth configuration
const AUTH_CONFIG = {
  basic: {
    username: 'flo',
    password: 'G?LB9?Q&y7xx7i4k9RFnGG9qC'
  }
};

// Create axios instance with Basic Auth
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Basic Auth
apiClient.interceptors.request.use(
  (config) => {
    // Add Basic Auth header to all requests
    const basicAuth = 'Basic ' + btoa(`${AUTH_CONFIG.basic.username}:${AUTH_CONFIG.basic.password}`);
    config.headers.Authorization = basicAuth;
    
    console.log(`[API] Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API] ${response.status} response from: ${response.config.url}`);
    return response;
  },
  (error) => {
    // Provide more explicit error messages
    if (error.response?.status === 401) {
      console.error('[API] Authentication failed: Invalid username or password');
      error.message = 'Authentication failed: Please check your username and password';
    } else if (error.response?.status === 403) {
      console.error('[API] Access forbidden: Insufficient permissions');
      error.message = 'Access forbidden: You do not have permission to access this resource';
    } else if (error.response?.status >= 500) {
      console.error('[API] Server error:', error.response?.status, error.response?.data);
      error.message = 'Server error: Please try again later';
    } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Failed to fetch')) {
      console.error('[API] Network error: Unable to connect to server');
      error.message = 'Network error: Unable to connect to server. Please check your internet connection.';
    } else {
      console.error('[API] Response error:', error.response?.status, error.response?.data);
      error.message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    }
    
    return Promise.reject(error);
  }
);

export { apiClient, AUTH_CONFIG }; 