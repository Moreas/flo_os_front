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

export async function ensureCsrfCookie(): Promise<string> {
  // Return existing promise if we're already fetching
  if (csrfPromise) {
    return csrfPromise;
  }

  csrfPromise = (async () => {
    try {
      // First check if we already have a valid token
      const existingToken = getCSRFToken();
      if (existingToken) {
        return existingToken;
      }

      // If no token, fetch a new one
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
      
      // Wait a bit for the cookie to be set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to get token from response first, then cookie
      const token = data.csrf_token || getCSRFToken();
      if (!token) {
        throw new Error('CSRF token not found in response or cookies');
      }
      
      return token;
    } catch (error) {
      console.error('[CSRF] Error ensuring CSRF token:', error);
      throw error;
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
} 