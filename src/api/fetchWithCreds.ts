// Utility fetch wrapper that always sends cookies (credentials: 'include')
export function fetchWithCreds(input: RequestInfo, init: RequestInit = {}) {
  return fetch(input, { ...init, credentials: 'include' });
}

// Utility fetch wrapper for authenticated API requests that need CSRF tokens
export function fetchWithCSRF(input: RequestInfo, init: RequestInit = {}) {
  const method = init.method?.toUpperCase() || 'GET';
  const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  
  // Start with the provided headers
  const headers = new Headers(init.headers);
  
  // Add required headers for CORS and CSRF protection
  // Use window.location.origin instead of hardcoded value
  headers.set('Origin', window.location.origin);
  headers.set('Referer', window.location.href);
  
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
      // Consider throwing an error or handling this case more explicitly
      throw new Error('No CSRF token available. Please log in again.');
    }
  }
  
  // Log the actual headers being sent for debugging
  console.log(`[API] Request headers for ${method} ${input}:`, Object.fromEntries(headers.entries()));
  
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers
  }).then(response => {
    if (response.status === 403) {
      // Log more details about the 403 error
      console.error(`[API] CSRF validation failed for ${method} ${input}`);
      console.error('[API] Response headers:', Object.fromEntries(response.headers.entries()));
      // You might want to refresh the CSRF token here
    }
    return response;
  });
}