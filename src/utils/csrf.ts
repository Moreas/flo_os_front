import API_BASE from '../apiBase';

export function getCookie(name: string): string | null {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export function getCSRFToken(): string | null {
  return getCookie('csrftoken');
}

let csrfPromise: Promise<string> | null = null;
let lastTokenTimestamp = 0;
const TOKEN_REFRESH_INTERVAL = 1000 * 60 * 60; // 1 hour

async function waitForToken(attempt: number): Promise<string | null> {
  const delay = Math.pow(2, attempt) * 100;
  await new Promise(resolve => setTimeout(resolve, delay));
  return getCSRFToken();
}

export async function ensureCsrfCookie(): Promise<string> {
  // Return existing promise if one is in progress
  if (csrfPromise) {
    return csrfPromise;
  }

  // Check if we have a valid token that doesn't need refresh
  const existingToken = getCSRFToken();
  const now = Date.now();
  if (existingToken && (now - lastTokenTimestamp) < TOKEN_REFRESH_INTERVAL) {
    return existingToken;
  }

  csrfPromise = (async () => {
    try {
      // Make the request first
      const res = await fetch(`${API_BASE}/api/csrf/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to get CSRF token: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Wait for cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to get token from cookie first
      const cookieToken = getCSRFToken();
      if (cookieToken) {
        lastTokenTimestamp = Date.now();
        return cookieToken;
      }
      
      // If no cookie token, try with exponential backoff
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
        const token = getCSRFToken();
        if (token) {
          lastTokenTimestamp = Date.now();
          return token;
        }
      }
      
      // Fallback to response token if provided
      if (data.csrf_token) {
        lastTokenTimestamp = Date.now();
        return data.csrf_token;
      }
      
      throw new Error('CSRF token not found in cookies or response');
    } catch (error) {
      console.error('[CSRF] Error ensuring CSRF token:', error);
      throw error;
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
} 