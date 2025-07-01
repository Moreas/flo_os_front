import React, { useEffect, useState } from 'react';

const BackendTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testBackend = async () => {
      try {
        console.log('[Test] Starting backend connection test...');
        
        // Test 1: Direct fetch to backend
        const response = await fetch('http://localhost:8000/api/health/');
        console.log('[Test] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Test] Backend response:', data);
          setTestResult('✅ Backend connection successful!');
        } else {
          setTestResult(`❌ Backend responded with status: ${response.status}`);
        }
      } catch (err) {
        console.error('[Test] Connection error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setTestResult('❌ Backend connection failed');
      }
    };

    testBackend();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Backend Connection Test</h3>
      <p><strong>Status:</strong> {testResult}</p>
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <button 
        onClick={() => window.location.reload()}
        style={{ marginTop: '10px', padding: '5px 10px' }}
      >
        Retry Test
      </button>
    </div>
  );
};

export default BackendTest; 