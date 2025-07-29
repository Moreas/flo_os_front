import axios from 'axios';

// Create Axios instance with custom config
export const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    timeout: 300000, // 5 minutes timeout for large file uploads
    headers: {
        'Content-Type': 'application/json',
    },
    maxContentLength: Infinity, // Allow unlimited upload size
    maxBodyLength: Infinity, // Allow unlimited request body size
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
    (config) => {
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
            }
        } else {
            // Error in request configuration
            console.error('[API] Request configuration error:', error.message);
        }
        return Promise.reject(error);
    }
); 