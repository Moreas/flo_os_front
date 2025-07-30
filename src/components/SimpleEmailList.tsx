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
    <div className="overflow-hidden bg-white shadow sm:rounded-md">
      <ul role="list" className="divide-y divide-gray-200">
        {emails.map((email) => (
          <li key={email.id}>
            <div className="block hover:bg-gray-50">
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="truncate">
                    <div className="flex text-sm">
                      <p className="font-medium text-primary-600 truncate">{email.subject}</p>
                      <p className="ml-1 flex-shrink-0 font-normal text-gray-500">from {email.sender}</p>
                    </div>
                    <div className="mt-2 flex">
                      <div className="flex items-center text-sm text-gray-500">
                        <p>
                          {new Date(email.received_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-2 flex flex-shrink-0">
                    {email.needs_reply && (
                      <p className="inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800 mr-2">
                        Needs Reply
                      </p>
                    )}
                    <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      email.is_handled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {email.is_handled ? 'Handled' : 'Unhandled'}
                    </p>
                  </div>
                </div>
                {email.body && (
                  <div className="mt-2 text-sm text-gray-600">
                    {email.body.length > 200 ? `${email.body.substring(0, 200)}...` : email.body}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});

SimpleEmailList.displayName = 'SimpleEmailList';

export default SimpleEmailList; 