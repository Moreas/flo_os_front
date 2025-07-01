import { fetchWithCreds } from '../api/fetchWithCreds';

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

export async function ensureCsrfCookie() {
  try {
    const res = await fetchWithCreds('/api/csrf/', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!res.ok) {
      throw new Error(`Failed to get CSRF token: ${res.status}`);
    }
    
    const token = getCSRFToken();
    if (!token) {
      throw new Error('CSRF token not found in cookies after fetch');
    }
    
    return token;
  } catch (error) {
    console.error('[CSRF] Error ensuring CSRF token:', error);
    throw error;
  }
} 