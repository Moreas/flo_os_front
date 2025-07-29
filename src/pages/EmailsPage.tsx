import React, { useState, useRef } from 'react';
import SimpleEmailList, { SimpleEmailListRef } from '../components/SimpleEmailList';
import { apiClient } from '../api/apiConfig';

const EmailsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailListRef = useRef<SimpleEmailListRef>(null);

  const handleRetrieveEmails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use apiClient with a longer timeout for email retrieval
      const response = await apiClient.post('/api/retrieve_emails/', {}, {
        timeout: 300000 // 5 minutes timeout for email retrieval
      });

      console.log('Emails retrieved:', response.data);
      
      // Refresh the email list
      emailListRef.current?.refreshEmails();
    } catch (error: any) {
      console.error('Error retrieving emails:', error);
      setError(
        error.response?.data?.detail || 
        error.response?.data?.error || 
        error.message || 
        'Failed to retrieve emails'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Emails</h1>
        <button
          onClick={handleRetrieveEmails}
          disabled={loading}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-500'
          }`}
        >
          {loading ? 'Retrieving...' : 'Retrieve Emails'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <SimpleEmailList ref={emailListRef} />
    </div>
  );
};

export default EmailsPage; 