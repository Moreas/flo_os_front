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

async function waitForToken(attempt: number): Promise<string | null> {
  const delay = Math.pow(2, attempt) * 100;
  await new Promise(resolve => setTimeout(resolve, delay));
  return getCSRFToken();
}

export async function ensureCsrfCookie(): Promise<string> {
  if (csrfPromise) {
    return csrfPromise;
  }

  csrfPromise = (async () => {
    try {
      const existingToken = getCSRFToken();
      if (existingToken) {
        return existingToken;
      }

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
      
      // Try to get token with exponential backoff
      for (let i = 0; i < 3; i++) {
        const token = await waitForToken(i);
        if (token) return token;
      }
      
      // Fallback to response token
      if (data.csrf_token) {
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