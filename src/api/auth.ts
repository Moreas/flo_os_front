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
  
  // Ensure we're making a proper cross-origin request with explicit headers
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
  
  // Parse the csrftoken cookie
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (!match) {
    console.warn('[Auth] CSRF token not found in cookies. Backend may not be setting the cookie properly.');
    console.log('[Auth] Available cookies:', document.cookie);
    
    // Temporary workaround: try to get token from response body if available
    try {
      const data = await response.json();
      if (data.csrf_token) {
        console.log('[Auth] Using CSRF token from response body');
        return data.csrf_token;
      }
    } catch (e) {
      // Response is not JSON, continue with error
    }
    
    throw new Error('CSRF token not found in cookies. Backend needs to set the csrftoken cookie.');
  }
  
  const csrfToken = match[1];
  console.log('[Auth] CSRF token obtained:', csrfToken ? '***' + csrfToken.slice(-4) : 'null');
  return csrfToken;
}

/**
 * Login with username and password
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    console.log('[Auth] Starting login process for user:', username);
    
    // Try to get CSRF token, but don't fail if it's not available
    let csrfToken: string | null = null;
    try {
      csrfToken = await getCSRFToken();
    } catch (error) {
      console.warn('[Auth] CSRF token not available, proceeding without it:', error);
    }
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add CSRF token if available
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    // Then login
    const response = await fetchWithCreds(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password }),
    });
    
    console.log('[Auth] Login response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Auth] Login failed:', errorData);
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
    
    // Try to get CSRF token, but don't fail if it's not available
    let csrfToken: string | null = null;
    try {
      csrfToken = await getCSRFToken();
    } catch (error) {
      console.warn('[Auth] CSRF token not available for logout, proceeding without it:', error);
    }
    
    // Prepare headers
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    const response = await fetchWithCreds(`${API_BASE}/api/auth/logout/`, {
      method: 'POST',
      headers
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