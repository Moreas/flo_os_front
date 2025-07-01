// Utility fetch wrapper that always sends cookies (credentials: 'include')
export function fetchWithCreds(input: RequestInfo, init: RequestInit = {}) {
  return fetch(input, { ...init, credentials: 'include' });
}

/**
 * Utility fetch wrapper for authenticated API requests that need CSRF tokens
 * Automatically includes the stored fresh CSRF token for POST/PUT/DELETE requests
 */
export function fetchWithCSRF(input: RequestInfo, init: RequestInit = {}) {
  const method = init.method?.toUpperCase() || 'GET';
  const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  
  // Start with the provided headers
  const headers = new Headers(init.headers);
  
  // Add required headers for CORS and CSRF protection
  headers.set('Origin', 'https://flo.com.co');
  headers.set('Referer', 'https://flo.com.co/');
  
  // Add Content-Type if not set
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Add CSRF token for methods that need it
  if (needsCSRF && !headers.has('X-CSRFToken')) {
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken) {
      headers.set('X-CSRFToken', csrfToken);
      console.log(`[API] Added CSRF token to ${method} request:`, '***' + csrfToken.slice(-4));
    } else {
      console.warn(`[API] No CSRF token available for ${method} request. Login may be required.`);
    }
  }
  
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers
  });
} 