// Utility fetch wrapper that always sends cookies (credentials: 'include')
export function fetchWithCreds(input: RequestInfo, init: RequestInit = {}) {
  return fetch(input, { ...init, credentials: 'include' });
} 