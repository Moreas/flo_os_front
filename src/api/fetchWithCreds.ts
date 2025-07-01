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

// Fetch wrapper for operations that need CSRF protection (POST/PUT/DELETE)
export function fetchWithCSRF(input: RequestInfo, init: RequestInit = {}) {
  const method = init.method?.toUpperCase() || 'GET';
  const needsCSRF = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  
  // For GET requests, just use fetchWithCreds
  if (!needsCSRF) {
    return fetchWithCreds(input, init);
  }

  // For operations that need CSRF, add the token
  const csrfToken = localStorage.getItem('csrfToken');
  if (!csrfToken && needsCSRF) {
    console.warn(`[API] No CSRF token available for ${method} request`);
    return Promise.reject(new Error('No CSRF token available. Please log in again.'));
  }

  return fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      ...init.headers,
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {})
    }
  });
}