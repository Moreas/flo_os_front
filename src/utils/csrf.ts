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
  console.log(`[CSRF] getCookie('${name}') =`, cookieValue);
  return cookieValue;
}

export async function ensureCsrfCookie() {
  console.log('[CSRF] Calling ensureCsrfCookie: GET /api/csrf/');
  const res = await fetchWithCreds('/api/csrf/', {
    method: 'GET',
    credentials: 'include'
  });
  console.log('[CSRF] ensureCsrfCookie response status:', res.status);
  console.log('[CSRF] ensureCsrfCookie response headers:', Array.from(res.headers.entries()));
  return res;
} 