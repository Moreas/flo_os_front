// Simple Basic Auth configuration for personal-only FloOS access
const basicAuth = 'Basic ' + btoa('flo:G?LB9?Q&y7xx7i4k9RFnGG9qC');

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function fetchWithCreds(url: string, options: FetchOptions = {}) {
  // Prepare headers
  const headers = new Headers(options.headers);
  
  // Add Basic Auth unless skipped
  if (!options.skipAuth) {
    headers.set('Authorization', basicAuth);
  }
  
  // Add required headers for CORS
  headers.set('Origin', window.location.origin);
  headers.set('Referer', window.location.href);
  
  // Add Content-Type if not set
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  const opts: RequestInit = {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers,
  };
  
  const response = await fetch(url, opts);
  return response;
}

export async function fetchWithCSRF(url: string, options: FetchOptions = {}) {
  // For Basic Auth only, no CSRF needed - just use the same function
  return fetchWithCreds(url, options);
}