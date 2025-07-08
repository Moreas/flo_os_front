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
  timeout: 10000, // Standard timeout for most operations
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create a separate axios instance for long-running operations
const longRunningApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutes for operations like email retrieval
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Basic Auth
const addAuthInterceptor = (config: any) => {
  // Add Basic Auth header to all requests
  const basicAuth = 'Basic ' + btoa(`${AUTH_CONFIG.basic.username}:${AUTH_CONFIG.basic.password}`);
  config.headers.Authorization = basicAuth;
  
  console.log(`[API] Making ${config.method?.toUpperCase()} request to: ${config.url}`);
  return config;
};

const requestErrorInterceptor = (error: any) => {
  console.error('[API] Request error:', error);
  return Promise.reject(error);
};

// Add interceptors to both clients
apiClient.interceptors.request.use(addAuthInterceptor, requestErrorInterceptor);
longRunningApiClient.interceptors.request.use(addAuthInterceptor, requestErrorInterceptor);

// Response interceptor for error handling
const responseSuccessInterceptor = (response: AxiosResponse) => {
  console.log(`[API] ${response.status} response from: ${response.config.url}`);
  return response;
};

const responseErrorInterceptor = (error: any) => {
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
};

// Add response interceptors to both clients
apiClient.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor);
longRunningApiClient.interceptors.response.use(responseSuccessInterceptor, responseErrorInterceptor);

export { apiClient, longRunningApiClient, AUTH_CONFIG }; 