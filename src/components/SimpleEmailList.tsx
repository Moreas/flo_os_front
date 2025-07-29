import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { apiClient } from '../api/apiConfig';

export interface SimpleEmailListRef {
  refreshEmails: () => Promise<void>;
}

interface SimpleEmailListProps {}

const SimpleEmailList = forwardRef<SimpleEmailListRef, SimpleEmailListProps>((props, ref) => {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/emails/');
      setEmails(response.data);
    } catch (error: any) {
      console.error('Error fetching emails:', error);
      setError(
        error.response?.data?.detail || 
        error.response?.data?.error || 
        error.message || 
        'Failed to fetch emails'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  useImperativeHandle(ref, () => ({
    refreshEmails: fetchEmails
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        No emails found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <div key={email.id} className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{email.subject}</h3>
              <p className="text-sm text-gray-500">{email.sender}</p>
            </div>
            <span className="text-sm text-gray-500">
              {new Date(email.received_at).toLocaleString()}
            </span>
          </div>
          {email.body && (
            <div className="mt-2 text-sm text-gray-700">
              {email.body.length > 200 ? `${email.body.substring(0, 200)}...` : email.body}
            </div>
          )}
          <div className="mt-4 flex items-center space-x-4">
            {email.needs_reply && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Needs Reply
              </span>
            )}
            {email.is_handled ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Handled
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Unhandled
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

SimpleEmailList.displayName = 'SimpleEmailList';

export default SimpleEmailList; 