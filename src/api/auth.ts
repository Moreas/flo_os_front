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

// Store authentication state
let currentUser: LoginResponse['user'] | null = null;
let lastAuthCheck = 0;
const AUTH_CHECK_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Login with username and password
 * Uses Basic Auth for both development and production
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log('[Auth] Login attempt for:', username);
    
    // Test authentication with backend
    const response = await apiClient.get('/api/health/');
    
    if (response.status === 200) {
      const user = {
        id: 1,
        username: username,
        email: `${username}@floos.com`,
        first_name: 'FloOS',
        last_name: 'User',
        is_staff: true
      };
      
      // Store authentication state
      currentUser = user;
      lastAuthCheck = Date.now();
      
      console.log('[Auth] Login successful (Basic Auth)');
      return {
        success: true,
        user: user
      };
    } else {
      return {
        success: false,
        error: 'Authentication failed'
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
    
    // Check if we have a cached user and if the auth check is still valid
    const now = Date.now();
    if (currentUser && (now - lastAuthCheck) < AUTH_CHECK_INTERVAL) {
      console.log('[Auth] Returning cached user');
      return {
        success: true,
        user: currentUser
      };
    }
    
    // Test authentication with backend
    const response = await apiClient.get('/api/health/');
    
    if (response.status === 200) {
      // Update auth check timestamp
      lastAuthCheck = now;
      
      // If we don't have a cached user, create a default one
      if (!currentUser) {
        currentUser = {
          id: 1,
          username: 'flo',
          email: 'flo@floos.com',
          first_name: 'FloOS',
          last_name: 'User',
          is_staff: true
        };
      }
      
      console.log('[Auth] User authenticated via API check');
      return {
        success: true,
        user: currentUser
      };
    } else {
      // Clear cached user if authentication failed
      currentUser = null;
      lastAuthCheck = 0;
      return { success: false };
    }
    
  } catch (error) {
    console.error('[Auth] Get current user error:', error);
    
    // If it's an authentication error, clear the cached user
    if (error instanceof Error && (
      error.message.includes('Authentication failed') ||
      error.message.includes('401') ||
      error.message.includes('403')
    )) {
      currentUser = null;
      lastAuthCheck = 0;
    }
    
    return { success: false };
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  try {
    // Clear cached authentication state
    currentUser = null;
    lastAuthCheck = 0;
    
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
  // Check if we have a cached user and if the auth check is still valid
  const now = Date.now();
  return !!(currentUser && (now - lastAuthCheck) < AUTH_CHECK_INTERVAL);
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
  currentUser = null;
  lastAuthCheck = 0;
  console.log('[Debug] All data cleared');
}

// Make debug functions available globally in development
if (isDevelopment) {
  (window as any).clearAuthCache = debugClearAllData;
} 