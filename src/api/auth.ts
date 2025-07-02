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
 * For Basic Auth, we need to force the browser to clear its credential cache
 */
export async function logout(): Promise<void> {
  try {
    console.log('[Auth] Starting logout process...');
    
    // Step 1: Clear our frontend cache first
    currentUser = null;
    lastAuthCheck = 0;
    
    // Step 2: Call backend logout endpoint if it exists
    try {
      await apiClient.post('/api/logout/');
      console.log('[Auth] Backend logout successful');
    } catch (error) {
      // Backend logout might fail, but we continue with client-side cleanup
      console.log('[Auth] Backend logout not available, continuing with client-side logout');
    }
    
    // Step 3: Force browser to clear Basic Auth cache
    // This is the key step - we make a request with invalid credentials
    // to force the browser to forget the cached Basic Auth credentials
    try {
      const invalidAuthHeader = 'Basic ' + btoa('invalid:invalid');
      await fetch(apiClient.defaults.baseURL + '/api/health/', {
        method: 'GET',
        headers: {
          'Authorization': invalidAuthHeader,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      });
    } catch (error) {
      // This is expected to fail - we're intentionally sending invalid credentials
      console.log('[Auth] Browser Basic Auth cache invalidated');
    }
    
    // Step 4: Clear all browser storage and caches
    clearAllStorageAndCache();
    
    // Step 5: Force a page reload to ensure clean state
    // This ensures the browser doesn't use any cached credentials
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
    
    console.log('[Auth] Logout process completed');
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Even if logout fails, clear local data and redirect
    clearAllStorageAndCache();
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  }
}

/**
 * Clear all storage and cache - Enhanced for Basic Auth logout
 */
export function clearAllStorageAndCache(): void {
  try {
    console.log('[Auth] Clearing all browser storage and caches...');
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear IndexedDB if available
    if ('indexedDB' in window) {
      try {
        indexedDB.databases?.()?.then(databases => {
          databases.forEach(db => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        });
      } catch (error) {
        console.log('[Auth] IndexedDB cleanup skipped:', error);
      }
    }
    
    // Clear service worker caches
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(key => caches.delete(key));
      });
    }
    
    // Clear cookies (if we have any)
    if (document.cookie) {
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      });
    }
    
    // Clear any potential credential managers
    if ('credentials' in navigator) {
      try {
        // This might not work in all browsers, but it's worth trying
        (navigator as any).credentials?.preventSilentAccess?.();
      } catch (error) {
        console.log('[Auth] Credential manager cleanup skipped:', error);
      }
    }
    
    console.log('[Auth] Storage and cache clearing completed');
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

/**
 * Force logout - Nuclear option to clear everything and reload
 * Use this if normal logout doesn't work properly
 */
export async function forceLogout(): Promise<void> {
  try {
    console.log('[Auth] FORCE LOGOUT - Clearing everything...');
    
    // Clear frontend state
    currentUser = null;
    lastAuthCheck = 0;
    
    // Clear all storage immediately
    clearAllStorageAndCache();
    
    // Try multiple methods to invalidate Basic Auth
    const invalidHeaders = [
      'Basic ' + btoa('invalid:invalid'),
      'Basic ' + btoa('logout:logout'),
      'Basic ' + btoa('clear:clear'),
    ];
    
    for (const header of invalidHeaders) {
      try {
        await fetch(window.location.origin + '/api/health/', {
          method: 'GET',
          headers: {
            'Authorization': header,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          credentials: 'include'
        });
      } catch (error) {
        // Expected to fail
      }
    }
    
    // Force reload the entire page
    window.location.replace('/login');
  } catch (error) {
    console.error('[Auth] Force logout error:', error);
    // Last resort - just reload
    window.location.replace('/login');
  }
}

// Debug functions for development
export function debugClearAllData(): void {
  clearAllStorageAndCache();
  currentUser = null;
  lastAuthCheck = 0;
  console.log('[Debug] All data cleared');
}

/**
 * Debug function to test logout behavior
 */
export function debugForceLogout(): void {
  console.log('[Debug] Testing force logout...');
  forceLogout();
}

// Make debug functions available globally in development
if (isDevelopment) {
  (window as any).clearAuthCache = debugClearAllData;
  (window as any).forceLogout = debugForceLogout;
  (window as any).testLogout = logout;
} 