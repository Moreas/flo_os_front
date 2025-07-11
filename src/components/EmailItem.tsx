import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { EmailMessage } from '../types/email';
import EmailProjectLinker from './ui/EmailProjectLinker';

interface EmailItemProps {
  email: EmailMessage;
  onEmailUpdated?: (email: EmailMessage) => void;
}

const EmailItem: React.FC<EmailItemProps> = ({ email, onEmailUpdated }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleProjectLinked = (updatedEmail: EmailMessage) => {
    if (onEmailUpdated) {
      onEmailUpdated(updatedEmail);
    }
  };

  const getStatusBadge = () => {
    const badges = [];
    
    if (email.needs_reply) {
      badges.push(
        <span key="needs-reply" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Needs Reply
        </span>
      );
    }
    
    if (email.needs_internal_handling) {
      badges.push(
        <span key="internal" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Internal Handling
        </span>
      );
    }
    
    if (email.waiting_external_handling) {
      badges.push(
        <span key="external" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Waiting External
        </span>
      );
    }
    
    if (email.is_handled) {
      badges.push(
        <span key="handled" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Handled
        </span>
      );
    }
    
    return badges;
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      {/* Header Row */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {email.subject}
            </h3>
            <div className="flex items-center space-x-2">
              {getStatusBadge()}
            </div>
          </div>
          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
            <span>From: {email.sender_name || email.sender}</span>
            <span>{formatDate(email.received_at)}</span>
          </div>
        </div>
        <div className="ml-4">
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="bg-gray-50 rounded-md p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Email Details</h4>
            <div className="space-y-2 text-sm">
              <div><strong>To:</strong> {email.recipients}</div>
              <div><strong>Message ID:</strong> {email.message_id}</div>
              {email.thread_id && <div><strong>Thread ID:</strong> {email.thread_id}</div>}
              {email.category && <div><strong>Category:</strong> {email.category.name}</div>}
              {email.person && <div><strong>Person:</strong> {email.person.name}</div>}
              {email.business && <div><strong>Business:</strong> {email.business.name}</div>}
            </div>
          </div>

          {/* Project Linking */}
          <div className="bg-blue-50 rounded-md p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Project Assignment</h4>
            <EmailProjectLinker 
              email={email} 
              onProjectLinked={handleProjectLinked}
            />
          </div>

          {/* Email Body Preview */}
          <div className="bg-gray-50 rounded-md p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Email Content</h4>
            <div className="text-sm text-gray-600 max-h-40 overflow-y-auto">
              {email.body.length > 500 ? (
                <>
                  {email.body.substring(0, 500)}...
                  <span className="text-primary-600 cursor-pointer"> [Show more]</span>
                </>
              ) : (
                email.body
              )}
            </div>
          </div>

          {/* Handling Notes */}
          {(email.internal_handling_notes || email.external_handling_notes) && (
            <div className="bg-yellow-50 rounded-md p-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Handling Notes</h4>
              {email.internal_handling_notes && (
                <div className="mb-2">
                  <strong className="text-sm">Internal:</strong>
                  <p className="text-sm text-gray-600">{email.internal_handling_notes}</p>
                </div>
              )}
              {email.external_handling_notes && (
                <div>
                  <strong className="text-sm">External:</strong>
                  <p className="text-sm text-gray-600">{email.external_handling_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailItem; 