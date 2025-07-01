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
  
  // Clear any existing CSRF token first
  console.log('[Auth] Cookies before CSRF request:', document.cookie);
  
  // Call /api/csrf/ to get a fresh CSRF token
  const response = await fetchWithCreds(`${API_BASE}/api/csrf/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get CSRF token: ${response.status}`);
  }
  
  console.log('[Auth] CSRF response status:', response.status);
  console.log('[Auth] CSRF response headers:', Array.from(response.headers.entries()));
  console.log('[Auth] Cookies after CSRF request:', document.cookie);
  
  // Wait a moment for the cookie to be set by the browser
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Extract the CSRF token from the csrftoken cookie
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (!match) {
    console.warn('[Auth] CSRF token not found in cookies after /api/csrf/ call');
    console.log('[Auth] Available cookies:', document.cookie);
    console.log('[Auth] Response headers:', Array.from(response.headers.entries()));
    
    // Check if the backend sent Set-Cookie header
    const setCookieHeaders = Array.from(response.headers.entries())
      .filter(([key]) => key.toLowerCase() === 'set-cookie');
    console.log('[Auth] Set-Cookie headers:', setCookieHeaders);
    
    throw new Error('CSRF token not found in cookies after calling /api/csrf/. Backend may not be setting the csrftoken cookie properly.');
  }
  
  const csrfToken = match[1];
  console.log('[Auth] CSRF token extracted from cookie:', csrfToken ? '***' + csrfToken.slice(-4) : 'null');
  return csrfToken;
}

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log('[Auth] Starting login process for user:', username);
    
    // Always get a fresh CSRF token for login
    let csrfToken: string | null = null;
    try {
      console.log('[Auth] Getting fresh CSRF token for login...');
      csrfToken = await getCSRFToken();
      console.log('[Auth] Fresh CSRF token obtained for login:', csrfToken ? '***' + csrfToken.slice(-4) : 'null');
    } catch (error) {
      console.error('[Auth] Failed to get CSRF token for login:', error);
      return {
        success: false,
        error: 'Failed to get CSRF token. Please try again.'
      };
    }
    
    // Prepare headers with CSRF token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // CSRF token is required for login
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
      console.log('[Auth] Added CSRF token to login headers:', '***' + csrfToken.slice(-4));
    } else {
      console.error('[Auth] No CSRF token available for login request');
      return {
        success: false,
        error: 'CSRF token is required for login.'
      };
    }
    
    console.log('[Auth] Login request headers (without token):', {
      'Content-Type': headers['Content-Type'],
      'X-CSRFToken': headers['X-CSRFToken'] ? '***' + headers['X-CSRFToken'].slice(-4) : 'none'
    });
    
    // Make login request with fresh CSRF token
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
    
    // Temporarily skip CSRF for logout due to trusted origins issue
    // TODO: Fix backend CSRF_TRUSTED_ORIGINS to include https://flo.com.co
    
    const response = await fetchWithCreds(`${API_BASE}/api/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    
    // Don't reload the page - let AuthContext handle the state
    console.log('[Auth] Logout completed successfully');
    
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    
    // Even if logout fails, clear cookies
    console.log('[Auth] Logout failed, but clearing cookies anyway...');
    const backendDomain = new URL(API_BASE).hostname;
    document.cookie = `sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${backendDomain};`;
    document.cookie = `sessionid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${backendDomain};`;
    document.cookie = `csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.log('[Auth] Logout completed (with errors)');
  }
} 