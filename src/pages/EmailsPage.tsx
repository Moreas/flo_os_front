import React, { useState } from 'react';
import EmailList from '../components/EmailList';
import axios from 'axios';
import API_BASE from '../apiBase';

const EmailsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRetrieveEmails = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await axios.post(
        `${API_BASE}/api/retrieve_emails/`,
        {},
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.success) {
        const saved = response.data.saved_count ?? 0;
        const skipped = response.data.skipped_count ?? 0;
        const errors = response.data.error_count ?? 0;
        const statusMessages = response.data.status_messages ?? [];
        setMessage(
          `${saved} saved, ${skipped} skipped, ${errors} error${errors === 1 ? '' : 's'}.` +
          (statusMessages.length ? ' ' + statusMessages.join(' ') : '')
        );
      } else {
        setError(response.data.message || 'Failed to retrieve emails.');
      }
    } catch (err: any) {
      setError('Error retrieving emails.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
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

      {/* Status Message */}
      {message && <div className="p-3 text-green-700 bg-green-50 rounded-md border border-green-200">{message}</div>}
      {error && <div className="p-3 text-red-700 bg-red-50 rounded-md border border-red-200">{error}</div>}

      {/* Email List */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <EmailList />
      </div>
    </div>
  );
};

export default EmailsPage; 