import axios from 'axios';
import API_BASE from '../apiBase';

// Basic Auth configuration
const AUTH_CONFIG = {
  basic: {
    username: 'flo',
    password: 'G?LB9?Q&y7xx7i4k9RFnGG9qC'
  }
};

// Create Axios instance with custom config
export const apiClient = axios.create({
    baseURL: API_BASE,
    timeout: 300000, // 5 minutes timeout for large file uploads
    headers: {
        'Content-Type': 'application/json',
    },
    maxContentLength: Infinity, // Allow unlimited upload size
    maxBodyLength: Infinity, // Allow unlimited request body size
});

// Add request interceptor for authentication and debugging
apiClient.interceptors.request.use(
    (config) => {
        // Add Basic Auth header to all requests
        const basicAuth = 'Basic ' + btoa(`${AUTH_CONFIG.basic.username}:${AUTH_CONFIG.basic.password}`);
        config.headers.Authorization = basicAuth;

        // Log the request
        console.log('[API] Making ' + config.method?.toUpperCase() + ' request to:', config.url);
        if (config.data instanceof FormData) {
            console.log('[API] Sending form data with files:', 
                Array.from(config.data.keys()).map(key => ({
                    key,
                    type: config.data.get(key) instanceof File ? 'File' : 'Field',
                    fileName: config.data.get(key) instanceof File ? (config.data.get(key) as File).name : undefined
                }))
            );
        }
        return config;
    },
    (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
    (response) => {
        // Log the successful response
        console.log('[API] ' + response.status + ' response from:', response.config.url);
        return response;
    },
    (error) => {
        // Log the error response
        if (error.response) {
            // Server responded with error status
            console.error(
                '[API] Error response:',
                error.response.status,
                error.response.data,
                'from:',
                error.config.url
            );
            if (error.response.status === 401) {
                console.error('[API] Authentication failed: Invalid username or password');
                error.message = 'Authentication failed: Please check your username and password';
            } else if (error.response.status === 403) {
                console.error('[API] Access forbidden: Insufficient permissions');
                error.message = 'Access forbidden: You do not have permission to access this resource';
            } else if (error.response.status >= 500) {
                console.error('[API] Server error:', error.response.status, error.response.data);
                error.message = 'Server error: Please try again later';
            }
        } else if (error.request) {
            // Request made but no response
            if (error.code === 'ECONNABORTED') {
                console.error(
                    '[API] Request timeout:',
                    error.config.url,
                    'Timeout:',
                    error.config.timeout,
                    'ms'
                );
            } else {
                console.error('[API] No response received:', error.request);
                error.message = 'Network error: Unable to connect to server. Please check your internet connection.';
            }
        } else {
            // Error in request configuration
            console.error('[API] Request configuration error:', error.message);
        }
        return Promise.reject(error);
    }
); 