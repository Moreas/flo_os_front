import { ensureCsrfCookie } from '../utils/csrf';
import API_BASE from '../apiBase';

interface FetchOptions extends RequestInit {
  skipCsrf?: boolean;
}

export async function fetchWithCreds(url: string, options: FetchOptions = {}) {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  };

  return fetch(url, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    }
  });
}

export async function fetchWithCSRF(url: string, options: FetchOptions = {}) {
  // Skip CSRF for certain requests
  if (options.skipCsrf) {
    return fetchWithCreds(url, options);
  }

  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      // Get fresh CSRF token
      const csrfToken = await ensureCsrfCookie();
      
      const response = await fetchWithCreds(url, {
        ...options,
        headers: {
          ...options.headers,
          'X-CSRFToken': csrfToken,
        }
      });

      // If we get a 403 and haven't exceeded retries, try refreshing the token
      if (response.status === 403 && retryCount < maxRetries) {
        console.warn('[CSRF] Got 403, refreshing token and retrying...');
        retryCount++;
        // Force a new token fetch
        await fetch(`${API_BASE}/api/csrf/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        // Small delay to allow cookie to be set
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      return response;
    } catch (error) {
      console.error('[CSRF] Error in fetchWithCSRF:', error);
      if (retryCount >= maxRetries) throw error;
      retryCount++;
    }
  }

  throw new Error('Failed to complete request after retries');
}