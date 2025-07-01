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
let retryCount = 0;
const MAX_RETRIES = 3;

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

      // If no token, fetch a new one with retries
      while (retryCount < MAX_RETRIES) {
        try {
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
          
          // Wait a bit for the cookie to be set
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const token = getCSRFToken();
          if (!token) {
            throw new Error('CSRF token not found in cookies after fetch');
          }
          
          // Reset retry count on success
          retryCount = 0;
          return token;
          
        } catch (error) {
          retryCount++;
          if (retryCount >= MAX_RETRIES) {
            throw error;
          }
          // Wait before retrying, with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
        }
      }
      
      throw new Error('Failed to get CSRF token after max retries');
      
    } catch (error) {
      console.error('[CSRF] Error ensuring CSRF token:', error);
      throw error;
    } finally {
      csrfPromise = null;
    }
  })();

  return csrfPromise;
} 