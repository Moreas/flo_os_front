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

async function fetchCSRFToken(attempt: number): Promise<string> {
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
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const token = getCSRFToken();
  if (!token) {
    throw new Error('CSRF token not found in cookies after fetch');
  }
  
  return token;
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

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await fetchCSRFToken(attempt);
        } catch (error) {
          if (attempt === 2) throw error;
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt + 1) * 100));
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