import React, { useState, useRef } from 'react';
import SimpleEmailList, { SimpleEmailListRef } from '../components/SimpleEmailList';
import API_BASE from '../apiBase';
import { longRunningApiClient } from '../api/apiConfig';

const EmailsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const emailListRef = useRef<SimpleEmailListRef>(null);

  const handleRetrieveEmails = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      // Use longRunningApiClient for email retrieval due to longer processing times
      const response = await longRunningApiClient.post(`${API_BASE}/api/retrieve_emails/`, {
        fetch_all: true,
        include_sent: true
      });
      
      if (response.status < 200 || response.status >= 300) {
        const errorData = response.data || {};
        throw new Error(errorData.detail || `Failed to retrieve emails (${response.status})`);
      }
      
      const responseData = response.data;
      if (responseData.success) {
        const saved = responseData.retrieved ?? 0;
        
        // Only show message if emails were retrieved
        if (saved > 0) {
          setMessage(`${saved} email${saved === 1 ? '' : 's'} retrieved`);
        } else {
          setMessage('No new emails found');
        }
        
        await emailListRef.current?.refresh();
      } else {
        setError(responseData.message || 'Failed to retrieve emails.');
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Unknown error';
      setError(`Error retrieving emails: ${errorMsg}`);
      console.error('Error retrieving emails:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <div className="flex items-center">
          <button
            onClick={handleRetrieveEmails}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : null}
            Retrieve Emails
          </button>
        </div>
      </div>

      {/* Status Message */}
      {message && <div className="p-3 text-green-700 bg-green-50 rounded-md border border-green-200">{message}</div>}
      {error && <div className="p-3 text-red-700 bg-red-50 rounded-md border border-red-200">{error}</div>}

      {/* Email List */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <SimpleEmailList ref={emailListRef} />
      </div>
    </div>
  );
};

export default EmailsPage; 