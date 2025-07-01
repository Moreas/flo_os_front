import API_BASE from '../apiBase';
import { fetchWithCreds, fetchWithCSRF } from './fetchWithCreds';
import { ensureCsrfCookie } from '../utils/csrf';

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

/**
 * Get CSRF token from the backend
 */
export async function getCSRFToken(): Promise<string> {
  const response = await fetchWithCreds(`${API_BASE}/api/csrf/`);
  
  if (!response.ok) {
    throw new Error(`Failed to get CSRF token: ${response.status}`);
  }
  
  const data = await response.json();
  const token = data.csrf_token || data.csrfToken || data.token;
  
  if (!token) {
    throw new Error('CSRF token not found in response');
  }
  
  return token;
}

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    // Ensure we have a CSRF token
    await ensureCsrfCookie();
    
    // Make login request
    const response = await fetchWithCSRF(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid username or password'
        };
      }
      
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail || errorData.error || `Login failed (${response.status})`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      user: data.user
    };
    
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
    // Ensure we have a CSRF token before checking auth
    await ensureCsrfCookie();
    
    const response = await fetchWithCreds(`${API_BASE}/api/auth/current-user/`);
    
    if (!response.ok) {
      if (response.status === 401) {
        return { success: false };
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `Failed to get current user: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      user: data.user
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
    const response = await fetchWithCSRF(`${API_BASE}/api/auth/logout/`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || `Logout failed: ${response.status}`);
    }
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Continue with cleanup even if server logout fails
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
    
    // Clear cookies by setting expired date
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  } catch (error) {
    console.error('[Auth] Error clearing data:', error);
  }
}

/**
 * Developer utility: Manual cache and storage clearing
 * Call this from browser console if you need to manually clear everything:
 * window.clearAuthCache()
 */
export function debugClearAllData(): void {
  console.log('[Debug] Manual cache and storage clearing initiated...');
  clearAllStorageAndCache();
  console.log('[Debug] Manual cleanup completed. You may want to refresh the page.');
}

// Make it available on window object for debugging
declare global {
  interface Window {
    clearAuthCache: () => void;
  }
}

if (typeof window !== 'undefined') {
  window.clearAuthCache = debugClearAllData;
} 