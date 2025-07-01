import API_BASE from '../apiBase';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Authentication configuration
export const AUTH_CONFIG = {
  // Development: Use Basic Auth for simplicity
  development: {
    type: 'basic',
    credentials: {
      username: 'devuser',
      password: 'devpassword123'
    }
  },
  // Production: Use Token Authentication for security
  production: {
    type: 'token',
    tokenKey: 'authToken'
  }
};

// API Configuration
export const API_CONFIG = {
  baseURL: API_BASE,
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

// Headers configuration
export function getDefaultHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (isDevelopment) {
    // Development: Basic Auth
    const credentials = btoa(`${AUTH_CONFIG.development.credentials.username}:${AUTH_CONFIG.development.credentials.password}`);
    headers['Authorization'] = `Basic ${credentials}`;
  } else {
    // Production: Token Auth
    const token = localStorage.getItem(AUTH_CONFIG.production.tokenKey);
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }

  return headers;
}

// Error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Retry logic
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  retries: number = API_CONFIG.retries,
  delay: number = API_CONFIG.retryDelay
): Promise<T> {
  try {
    return await requestFn();
  } catch (error) {
    if (
      retries > 0 &&
      error instanceof APIError &&
      typeof error.status === "number" &&
      error.status >= 500
    ) {
      console.warn(`API request failed, retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Main API client
export class APIClient {
  private static instance: APIClient;

  private constructor() {}

  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...getDefaultHeaders(),
        ...options.headers,
      },
    };

    return retryRequest(async () => {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          // Clear invalid token in production
          if (isProduction) {
            localStorage.removeItem(AUTH_CONFIG.production.tokenKey);
          }
          throw new APIError('Authentication failed', response.status, response);
        }
        
        // Handle other errors
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.detail || errorMessage;
        } catch {
          // Ignore JSON parsing errors
        }
        
        throw new APIError(errorMessage, response.status, response);
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      
      return response.text() as T;
    });
  }

  // Convenience methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = APIClient.getInstance(); 