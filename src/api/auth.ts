import { apiClient } from './apiConfig';

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
 * Uses Basic Auth for both development and production
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log('[Auth] Login attempt for:', username);
    
    // Use Basic Auth for both development and production
    console.log('[Auth] Using Basic Auth mode');
    
    if (username && password) {
      console.log('[Auth] Login successful (Basic Auth)');
      return {
        success: true,
        user: {
          id: 1,
          username: username,
          email: `${username}@floos.com`,
          first_name: 'FloOS',
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
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<CurrentUserResponse> {
  try {
    console.log('[Auth] Getting current user...');
    
    // Use Basic Auth for both development and production
    const mockUser = {
      id: 1,
      username: 'flo',
      email: 'flo@floos.com',
      first_name: 'FloOS',
      last_name: 'User',
      is_staff: true
    };
    
    console.log('[Auth] Returning user for Basic Auth mode');
    return {
      success: true,
      user: mockUser
    };
    
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
    // No server logout needed for Basic Auth
    console.log('[Auth] Logout successful (Basic Auth)');
  } catch (error) {
    console.error('[Auth] Logout error:', error);
  } finally {
    // Always clear local data
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
  // Always authenticated in Basic Auth mode
  return true;
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