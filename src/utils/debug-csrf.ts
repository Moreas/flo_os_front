import API_BASE from '../apiBase';
import { fetchWithCreds } from '../api/fetchWithCreds';

/**
 * Debug function to test CSRF token retrieval
 * Add this to your page temporarily to debug CSRF issues
 */
export async function debugCSRF() {
  console.log('=== CSRF Debug Start ===');
  console.log('Current cookies:', document.cookie);
  console.log('Page ready state:', document.readyState);
  console.log('API Base:', API_BASE);
  
  try {
    // Test 1: Basic fetch without headers
    console.log('\n--- Test 1: Basic fetch ---');
    const response1 = await fetchWithCreds(`${API_BASE}/api/csrf/`, {
      method: 'GET',
    });
    console.log('Status:', response1.status);
    console.log('Headers:', Array.from(response1.headers.entries()));
    console.log('Cookies after test 1:', document.cookie);
    
    // Test 2: Fetch with explicit headers
    console.log('\n--- Test 2: Fetch with headers ---');
    const response2 = await fetchWithCreds(`${API_BASE}/api/csrf/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    console.log('Status:', response2.status);
    console.log('Headers:', Array.from(response2.headers.entries()));
    console.log('Cookies after test 2:', document.cookie);
    
    // Test 3: Try to parse response
    console.log('\n--- Test 3: Parse response ---');
    const data = await response2.json();
    console.log('Response data:', data);
    
    // Test 4: Check for CSRF token in cookies
    console.log('\n--- Test 4: Check cookies ---');
    const csrfMatch = document.cookie.match(/csrftoken=([^;]+)/);
    console.log('CSRF token in cookies:', csrfMatch ? '***' + csrfMatch[1].slice(-4) : 'NOT FOUND');
    
  } catch (error) {
    console.error('CSRF debug error:', error);
  }
  
  console.log('=== CSRF Debug End ===');
}

/**
 * Add this to your page to test CSRF
 * Usage: Add a button with onclick="window.debugCSRF()"
 */
if (typeof window !== 'undefined') {
  (window as any).debugCSRF = debugCSRF;
} 