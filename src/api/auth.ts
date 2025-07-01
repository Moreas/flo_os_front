import { apiClient, AUTH_CONFIG } from './apiConfig';

export interface LoginResponse {
  success: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
  };
  token?: string;
  error?: string;
}

export interface CurrentUserResponse {
  success: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
  };
}

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Login with username and password
 * Supports both development (Basic Auth) and production (Token Auth) modes
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log('[Auth] Login attempt for:', username);
    
    if (isDevelopment) {
      // Development mode: Use Basic Auth
      console.log('[Auth] Using development mode (Basic Auth)');
      
      if (username && password) {
        console.log('[Auth] Login successful (development mode)');
        return {
          success: true,
          user: {
            id: 1,
            username: username,
            email: `${username}@floos.com`,
            first_name: 'Development',
            last_name: 'User',
            is_staff: true
          }
        };
      } else {
        return {
          success: false,
          error: 'Username and password are required'
        };
      }
    } else {
      // Production mode: Use Token Authentication
      console.log('[Auth] Using production mode (Token Auth)');
      
      const response = await apiClient.post<LoginResponse>('/api/auth/login/', {
        username,
        password
      });
      
      if (response.success && response.token) {
        // Store the token
        setAuthToken(response.token);
      }
      
      return response;
    }
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Get the current authentication token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_CONFIG.production.tokenKey);
}

/**
 * Set the authentication token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_CONFIG.production.tokenKey, token);
}

/**
 * Remove the authentication token
 */
export function removeAuthToken(): void {
  localStorage.removeItem(AUTH_CONFIG.production.tokenKey);
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<CurrentUserResponse> {
  try {
    console.log('[Auth] Getting current user...');
    
    if (isDevelopment) {
      // Development: Return mock user
      const mockUser = {
        id: 1,
        username: 'devuser',
        email: 'dev@floos.com',
        first_name: 'Development',
        last_name: 'User',
        is_staff: true
      };
      
      console.log('[Auth] Returning mock user for development');
      return {
        success: true,
        user: mockUser
      };
    } else {
      // Production: Get real user from API
      return await apiClient.get<CurrentUserResponse>('/api/auth/current-user/');
    }
    
  } catch (error) {
    console.error('[Auth] Get current user error:', error);
    return { success: false };
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  try {
    if (!isDevelopment) {
      // Only call logout endpoint in production
      await apiClient.post('/api/auth/logout/');
    }
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Continue with cleanup even if server logout fails
  } finally {
    // Always clear local data
    removeAuthToken();
    clearAllStorageAndCache();
  }
}

/**
 * Clear all storage and cache
 */
export function clearAllStorageAndCache(): void {
  try {
    // Clear storages
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
    }
    
    console.log('[Auth] Storage and cache cleared');
  } catch (error) {
    console.error('[Auth] Error clearing data:', error);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (isDevelopment) {
    return true; // Always authenticated in development
  }
  return getAuthToken() !== null;
}

/**
 * Simple fetch test to debug connection issues
 */
export async function simpleFetchTest(): Promise<void> {
  console.log('[Debug] Starting simple fetch test...');
  
  try {
    const response = await apiClient.get('/api/health/');
    console.log('[Debug] Health check result:', response);
  } catch (error) {
    console.error('[Debug] Health check failed:', error);
  }
}

/**
 * Test backend connectivity
 */
export async function testBackendConnectivity(): Promise<boolean> {
  try {
    console.log('[Auth] Testing backend connectivity...');
    const response = await apiClient.get('/api/health/');
    console.log('[Auth] Backend is reachable:', response);
    return true;
  } catch (error) {
    console.error('[Auth] Backend connectivity test failed:', error);
    return false;
  }
}

// Debug functions for development
export function debugClearAllData(): void {
  clearAllStorageAndCache();
  console.log('[Debug] All data cleared');
}

// Make debug functions available globally in development
if (isDevelopment) {
  (window as any).clearAuthCache = debugClearAllData;
} 