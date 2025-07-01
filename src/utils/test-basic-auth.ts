import API_BASE from '../apiBase';
import { fetchWithCreds } from '../api/fetchWithCreds';

/**
 * Test utility to verify Basic Auth only setup
 * Run this in the browser console to test the setup
 */
export async function testBasicAuthSetup() {
  console.log('=== Basic Auth Only Test ===');
  console.log('API Base:', API_BASE);
  console.log('Current origin:', window.location.origin);
  
  const results = {
    healthCheck: false,
    basicAuth: false,
    postRequest: false,
    errors: [] as string[]
  };
  
  try {
    // Test 1: Health check
    console.log('\n1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE}/api/health/`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
      results.healthCheck = true;
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
      results.errors.push(`Health check failed: ${healthResponse.status}`);
    }
    
    // Test 2: Basic Auth with GET request
    console.log('\n2. Testing Basic Auth with GET request...');
    try {
      const authResponse = await fetchWithCreds(`${API_BASE}/api/`);
      if (authResponse.ok) {
        console.log('✅ Basic Auth GET request successful');
        results.basicAuth = true;
      } else {
        console.log('❌ Basic Auth GET request failed:', authResponse.status);
        results.errors.push(`Basic Auth GET failed: ${authResponse.status}`);
      }
    } catch (error) {
      console.log('❌ Basic Auth GET error:', error);
      results.errors.push(`Basic Auth GET error: ${error}`);
    }
    
    // Test 3: POST request with Basic Auth
    console.log('\n3. Testing POST request with Basic Auth...');
    try {
      const postResponse = await fetchWithCreds(`${API_BASE}/api/retrieve_emails/`, {
        method: 'POST',
        body: JSON.stringify({
          label: '000_flo_os',
          fetch_all: false,
          days_ago: 1
        })
      });
      
      if (postResponse.ok) {
        const postData = await postResponse.json();
        console.log('✅ POST request successful:', postData);
        results.postRequest = true;
      } else {
        console.log('❌ POST request failed:', postResponse.status);
        const errorText = await postResponse.text();
        console.log('Error details:', errorText);
        results.errors.push(`POST request failed: ${postResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.log('❌ POST request error:', error);
      results.errors.push(`POST request error: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Test suite error:', error);
    results.errors.push(`Test suite error: ${error}`);
  }
  
  // Summary
  console.log('\n=== Test Results Summary ===');
  console.log(`Health Check: ${results.healthCheck ? '✅' : '❌'}`);
  console.log(`Basic Auth: ${results.basicAuth ? '✅' : '❌'}`);
  console.log(`POST Request: ${results.postRequest ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  } else {
    console.log('\n🎉 All tests passed! Basic Auth setup is working correctly.');
  }
  
  return results;
}

/**
 * Quick test function that can be called from console
 */
(window as any).testBasicAuth = testBasicAuthSetup; 