import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { apiClient } from '../api/apiConfig';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';

export interface SimpleEmailListRef {
  refreshEmails: () => Promise<void>;
}

interface SimpleEmailListProps {}

interface EmailMessage {
  id: number;
  subject: string;
  sender: string;
  body?: string;
  received_at: string;
  is_handled: boolean;
  needs_reply: boolean;
  needs_internal_handling: boolean;
  waiting_external_handling: boolean;
}

const SimpleEmailList = forwardRef<SimpleEmailListRef, SimpleEmailListProps>((props, ref) => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNeedsHandlingOnly, setShowNeedsHandlingOnly] = useState(true);
  const [showInternalHandlingOnly, setShowInternalHandlingOnly] = useState(false);
  const [showExternalHandlingOnly, setShowExternalHandlingOnly] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<number | null>(null);

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

  const filteredEmails = emails.filter(email => {
    // Needs Handling Filter - exclude emails that are marked as handled
    if (showNeedsHandlingOnly && email.is_handled === true) {
      return false;
    }
    
    // Internal Handling Filter - show only emails that need internal handling
    if (showInternalHandlingOnly && email.needs_internal_handling !== true) {
      return false;
    }
    
    // External Handling Filter - show only emails that are waiting for external handling
    if (showExternalHandlingOnly && email.waiting_external_handling !== true) {
      return false;
    }
    
    return true; // Show if all filters pass
  });

  const toggleEmailExpansion = (emailId: number) => {
    setExpandedEmailId(expandedEmailId === emailId ? null : emailId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
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
    <div>
      {/* Filter Controls */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showNeedsHandlingOnly}
              onChange={(e) => setShowNeedsHandlingOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Needs Handling</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showInternalHandlingOnly}
              onChange={(e) => setShowInternalHandlingOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Internal Handling</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showExternalHandlingOnly}
              onChange={(e) => setShowExternalHandlingOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">External Handling</span>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {filteredEmails.map((email) => {
          const isUncategorized = !email.needs_internal_handling && !email.waiting_external_handling;
          return (
            <div 
              key={email.id} 
              className={`bg-white shadow rounded-lg p-4 ${isUncategorized ? 'bg-red-50' : ''}`}
            >
              <button 
                onClick={() => toggleEmailExpansion(email.id)}
                className="w-full text-left"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">{email.subject}</h3>
                      {email.body && (
                        <div className="ml-2">
                          {expandedEmailId === email.id ? (
                            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{email.sender}</p>
                  </div>
                  <span className="text-sm text-gray-500 ml-4 flex-shrink-0">
                    {new Date(email.received_at).toLocaleString()}
                  </span>
                </div>
                {email.body && (
                  <div className={`mt-2 text-sm text-gray-700 ${expandedEmailId === email.id ? '' : 'line-clamp-2'}`}>
                    {email.body}
                  </div>
                )}
              </button>
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
                {email.needs_internal_handling && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Internal
                  </span>
                )}
                {email.waiting_external_handling && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    External
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

SimpleEmailList.displayName = 'SimpleEmailList';

export default SimpleEmailList; 