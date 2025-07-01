import API_BASE from '../apiBase';
import { fetchWithCreds } from './fetchWithCreds';

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
 * Get the stored fresh CSRF token for API calls
 * This token is obtained after successful login and should be used for all POST/PUT/DELETE requests
 */
export function getStoredCSRFToken(): string | null {
  const token = localStorage.getItem('csrfToken');
  console.log('[Auth] Retrieved stored CSRF token:', token ? '***' + token.slice(-4) : 'null');
  return token;
}

/**
 * Get CSRF token from the backend
 */
export async function getCSRFToken(): Promise<string> {
  console.log('[Auth] Getting CSRF token from /api/csrf/');
  
  // Ensure the page is fully loaded before making the request
  if (document.readyState !== 'complete') {
    console.log('[Auth] Page not fully loaded, waiting...');
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve(undefined);
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }
  
  // Call /api/csrf/ to get a fresh CSRF token
  const response = await fetchWithCreds(`${API_BASE}/api/csrf/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get CSRF token: ${response.status}`);
  }
  
  console.log('[Auth] CSRF response status:', response.status);
  
  // First, try to get the token from the response body (most reliable for cross-origin)
  try {
    const responseData = await response.json();
    console.log('[Auth] CSRF response data:', responseData);
    
    if (responseData.csrf_token) {
      console.log('[Auth] CSRF token found in response body:', '***' + responseData.csrf_token.slice(-4));
      return responseData.csrf_token;
    }
    
    if (responseData.csrfToken) {
      console.log('[Auth] csrfToken found in response body:', '***' + responseData.csrfToken.slice(-4));
      return responseData.csrfToken;
    }
    
    if (responseData.token) {
      console.log('[Auth] token found in response body:', '***' + responseData.token.slice(-4));
      return responseData.token;
    }
    
    console.log('[Auth] No CSRF token found in response body, trying cookies...');
    
  } catch (e) {
    console.log('[Auth] Could not parse response body as JSON, trying cookies...', e);
  }
  
  // Fallback: try to get from cookies (may not work for cross-origin)
  console.log('[Auth] Current cookies:', document.cookie);
  
  // Wait a moment for the cookie to be set by the browser
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log('[Auth] Cookies after waiting:', document.cookie);
  
  // Extract the CSRF token from the csrftoken cookie
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) {
    const csrfToken = match[1];
    console.log('[Auth] CSRF token extracted from cookie:', csrfToken ? '***' + csrfToken.slice(-4) : 'null');
    return csrfToken;
  }
  
  // If we get here, neither response body nor cookies worked
  console.error('[Auth] CSRF token not found in response body or cookies');
  console.log('[Auth] Response body should contain csrf_token field');
  console.log('[Auth] This may indicate a backend configuration issue');
  
  throw new Error('CSRF token not found in response body or cookies. Please check backend configuration.');
}

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log('[Auth] Starting login process for user:', username);
    
    // Step 1: Get initial CSRF token for login
    let initialCsrfToken: string | null = null;
    try {
      console.log('[Auth] Getting initial CSRF token for login...');
      initialCsrfToken = await getCSRFToken();
      console.log('[Auth] Initial CSRF token obtained for login:', initialCsrfToken ? '***' + initialCsrfToken.slice(-4) : 'null');
    } catch (error) {
      console.error('[Auth] Failed to get initial CSRF token for login:', error);
      return {
        success: false,
        error: 'Failed to get CSRF token for login. Please try again.'
      };
    }
    
    // Step 2: Login with initial CSRF token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Origin': window.location.origin,
    };
    
    if (initialCsrfToken) {
      headers['X-CSRFToken'] = initialCsrfToken;
      console.log('[Auth] Added initial CSRF token to login headers:', '***' + initialCsrfToken.slice(-4));
    } else {
      console.error('[Auth] No initial CSRF token available for login request');
      return {
        success: false,
        error: 'CSRF token is required for login.'
      };
    }
    
    console.log('[Auth] Making login request to:', `${API_BASE}/api/auth/login/`);
    const response = await fetchWithCreds(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password }),
    });
    
    console.log('[Auth] Login response status:', response.status);
    console.log('[Auth] Login response headers:', Array.from(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Auth] Login failed with status:', response.status);
      console.error('[Auth] Login error data:', errorData);
      return {
        success: false,
        error: errorData.detail || errorData.error || `Login failed (${response.status})`
      };
    }
    
    const data = await response.json();
    console.log('[Auth] Login successful:', data);
    
    // Step 3: Get fresh CSRF token after successful login (CRITICAL!)
    // Django invalidates CSRF tokens after login for security
    try {
      console.log('[Auth] Getting fresh CSRF token after successful login...');
      const freshCsrfToken = await getCSRFToken();
      console.log('[Auth] Fresh CSRF token obtained after login:', freshCsrfToken ? '***' + freshCsrfToken.slice(-4) : 'null');
      
      // Store fresh token for subsequent API calls
      localStorage.setItem('csrfToken', freshCsrfToken);
      console.log('[Auth] Fresh CSRF token stored in localStorage for API calls');
      
    } catch (error) {
      console.warn('[Auth] Failed to get fresh CSRF token after login:', error);
      console.warn('[Auth] API calls may fail due to stale CSRF token');
      // Don't fail login just because we couldn't get fresh token
    }
    
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
    console.log('[Auth] Getting current user');
    
    const response = await fetchWithCreds(`${API_BASE}/api/auth/current-user/`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    console.log('[Auth] Current user response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 401) {
        console.log('[Auth] User not authenticated');
        return { success: false };
      }
      throw new Error(`Failed to get current user: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[Auth] Current user data:', data);
    
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
    console.log('[Auth] Logging out');
    
    // Logout is CSRF-exempt, so no CSRF token needed
    const response = await fetchWithCreds(`${API_BASE}/api/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin,
      }
    });
    
    console.log('[Auth] Logout response status:', response.status);
    console.log('[Auth] Logout response headers:', Array.from(response.headers.entries()));
    
    if (!response.ok) {
      console.warn('[Auth] Logout request failed:', response.status);
      const errorData = await response.text().catch(() => 'No error details');
      console.warn('[Auth] Logout error details:', errorData);
    } else {
      console.log('[Auth] Logout request successful');
    }
    
    // Clear stored CSRF token
    localStorage.removeItem('csrfToken');
    console.log('[Auth] Cleared stored CSRF token from localStorage');
    
    // Clear all cookies for the backend domain
    console.log('[Auth] Clearing cookies...');
    const backendDomain = new URL(API_BASE).hostname;
    
    // Clear sessionid cookie
    document.cookie = `sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${backendDomain};`;
    document.cookie = `sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    // Clear csrftoken cookie
    document.cookie = `csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${backendDomain};`;
    document.cookie = `csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    
    console.log('[Auth] Cookies cleared. Current cookies:', document.cookie);
    console.log('[Auth] Logout completed successfully');
    
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    
    // Even if logout fails, clear stored token and cookies
    console.log('[Auth] Logout failed, but clearing stored data anyway...');
    localStorage.removeItem('csrfToken');
    
    const backendDomain = new URL(API_BASE).hostname;
    document.cookie = `sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${backendDomain};`;
    document.cookie = `sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${backendDomain};`;
    document.cookie = `csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.log('[Auth] Logout completed (with errors)');
  }
} 