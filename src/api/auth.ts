import API_BASE from '../apiBase';

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
  
  const response = await fetch(`${API_BASE}/api/csrf/`, {
    method: 'GET',
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get CSRF token: ${response.status}`);
  }
  
  // Parse the csrftoken cookie
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (!match) {
    console.warn('[Auth] CSRF token not found in cookies. Backend may not be setting the cookie properly.');
    console.log('[Auth] Available cookies:', document.cookie);
    console.log('[Auth] Response headers:', Array.from(response.headers.entries()));
    
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
    
    // First, get CSRF token
    const csrfToken = await getCSRFToken();
    
    // Then login
    const response = await fetch(`${API_BASE}/api/auth/login/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
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
    
    const response = await fetch(`${API_BASE}/api/auth/current-user/`, {
      method: 'GET',
      credentials: 'include'
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
    
    const csrfToken = await getCSRFToken();
    
    const response = await fetch(`${API_BASE}/api/auth/logout/`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken,
      }
    });
    
    console.log('[Auth] Logout response status:', response.status);
    
    if (!response.ok) {
      console.warn('[Auth] Logout request failed:', response.status);
    }
    
  } catch (error) {
    console.error('[Auth] Logout error:', error);
  }
} 