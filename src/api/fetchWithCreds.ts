import { ensureCsrfCookie, getCSRFToken } from '../utils/csrf';

// Basic fetch wrapper that includes credentials
export function fetchWithCreds(input: RequestInfo, init: RequestInit = {}) {
  // Always include the CSRF token for all requests
  const token = getCSRFToken();
  return fetch(input, { 
    ...init, 
    credentials: 'include',
    headers: {
      ...init.headers,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'X-CSRFToken': token } : {}),
    }
  });
}

// Fetch wrapper for operations that need CSRF protection
export async function fetchWithCSRF(input: RequestInfo, init: RequestInit = {}) {
  const method = init.method?.toUpperCase() || 'GET';
  const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  
  // For GET requests, just use fetchWithCreds
  if (!needsCSRF) {
    return fetchWithCreds(input, init);
  }

  // For operations that need CSRF, ensure we have a token
  const token = await ensureCsrfCookie();
  
  if (!token) {
    throw new Error('No CSRF token available after ensuring cookie');
  }

  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      ...init.headers,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRFToken': token
    }
  });

  // If we get a 403 with CSRF error, try to refresh the token and retry once
  if (response.status === 403) {
    try {
      const responseText = await response.text();
      if (responseText.includes('CSRF')) {
        // Force a new token fetch by clearing the cookie
        document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Get a new token
        const newToken = await ensureCsrfCookie();
        
        if (!newToken) {
          throw new Error('No CSRF token available after refresh');
        }
        
        // Retry the request with the new token
        return fetch(input, {
          ...init,
          credentials: 'include',
          headers: {
            ...init.headers,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRFToken': newToken
          }
        });
      }
    } catch (error) {
      console.error('[CSRF] Error refreshing token:', error);
    }
  }

  return response;
}