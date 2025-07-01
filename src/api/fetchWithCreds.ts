import { getCSRFToken } from '../utils/csrf';

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

  // Get CSRF token from cookie
  const csrfToken = getCSRFToken();
  if (!csrfToken && needsCSRF) {
    throw new Error('No CSRF token available. Please refresh the page.');
  }

  return fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      ...init.headers,
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken || '',
    }
  });
}