import { getCSRFToken, ensureCsrfCookie } from '../utils/csrf';

// Basic fetch wrapper that includes credentials
export function fetchWithCreds(input: RequestInfo, init: RequestInit = {}) {
  return fetch(input, { 
    ...init, 
    credentials: 'include',
    headers: {
      ...init.headers,
      'Content-Type': 'application/json',
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

  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      ...init.headers,
      'Content-Type': 'application/json',
      'X-CSRFToken': token
    }
  });

  // If we get a 403 with CSRF error, try to refresh the token and retry once
  if (response.status === 403) {
    const responseText = await response.text();
    if (responseText.includes('CSRF')) {
      // Force a new token fetch
      const newToken = await ensureCsrfCookie();
      
      // Retry the request with the new token
      return fetch(input, {
        ...init,
        credentials: 'include',
        headers: {
          ...init.headers,
          'Content-Type': 'application/json',
          'X-CSRFToken': newToken
        }
      });
    }
  }

  return response;
}