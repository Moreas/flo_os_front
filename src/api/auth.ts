import API_BASE from '../apiBase';
import { fetchWithCreds, fetchWithCSRF } from './fetchWithCreds';

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
    // Get CSRF token first
    const csrfToken = await getCSRFToken();
    localStorage.setItem('csrfToken', csrfToken);
    
    // Make login request
    const response = await fetchWithCSRF(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
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
    const response = await fetchWithCreds(`${API_BASE}/api/auth/current-user/`);
    
    if (!response.ok) {
      if (response.status === 401) {
        return { success: false };
      }
      throw new Error(`Failed to get current user: ${response.status}`);
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
    await fetchWithCSRF(`${API_BASE}/api/auth/logout/`, {
      method: 'POST'
    });
  } finally {
    localStorage.removeItem('csrfToken');
  }
}

/**
 * Clear all storage and cache
 */
export function clearAllStorageAndCache(): void {
  localStorage.clear();
  sessionStorage.clear();
  
  if ('caches' in window) {
    caches.keys().then(keys => {
      keys.forEach(key => caches.delete(key));
    });
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