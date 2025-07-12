import React, { useState, useCallback, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { EmailMessage } from '../types/email';
import EmailProjectLinker from './ui/EmailProjectLinker';
import { apiClient } from '../api/apiConfig';

interface EmailItemProps {
  email: EmailMessage;
  people: any[];
  onEmailUpdated?: (email: EmailMessage) => void;
}

const EmailItem: React.FC<EmailItemProps> = React.memo(({ email, people, onEmailUpdated }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFullBody, setShowFullBody] = useState(false);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString();
  }, []);

  const handleProjectLinked = useCallback((updatedEmail: EmailMessage) => {
    onEmailUpdated?.(updatedEmail);
  }, [onEmailUpdated]);

  const handleMarkHandled = useCallback(async () => {
    setIsUpdating(true);
    try {
      await apiClient.post(`/api/emails/${email.id}/mark_handled/`);
      const updatedEmail = { ...email, is_handled: true };
      onEmailUpdated?.(updatedEmail);
    } catch (error) {
      console.error('Error marking email as handled:', error);
      alert('Failed to mark email as handled');
    } finally {
      setIsUpdating(false);
    }
  }, [email, onEmailUpdated]);

  const handleMarkInternalHandling = useCallback(async () => {
    setIsUpdating(true);
    try {
      await apiClient.post(`/api/emails/${email.id}/mark_internal_handling/`);
      const updatedEmail = { ...email, needs_internal_handling: true };
      onEmailUpdated?.(updatedEmail);
    } catch (error) {
      console.error('Error marking for internal handling:', error);
      alert('Failed to mark for internal handling');
    } finally {
      setIsUpdating(false);
    }
  }, [email, onEmailUpdated]);

  const handleMarkExternalHandling = useCallback(async () => {
    setIsUpdating(true);
    try {
      await apiClient.post(`/api/emails/${email.id}/mark_external_handling/`);
      const updatedEmail = { ...email, waiting_external_handling: true };
      onEmailUpdated?.(updatedEmail);
    } catch (error) {
      console.error('Error marking for external handling:', error);
      alert('Failed to mark for external handling');
    } finally {
      setIsUpdating(false);
    }
  }, [email, onEmailUpdated]);

  const handleAssignToPerson = useCallback(async (personId: number) => {
    setIsUpdating(true);
    try {
      await apiClient.post(`/api/emails/${email.id}/link_to_person/`, {
        person_id: personId
      });
      const selectedPerson = people.find(p => p.id === personId);
      const updatedEmail = { 
        ...email, 
        person: selectedPerson ? {
          id: selectedPerson.id,
          name: selectedPerson.name,
          relationship: selectedPerson.relationship
        } : null
      };
      onEmailUpdated?.(updatedEmail);
    } catch (error) {
      console.error('Error assigning email to person:', error);
      alert('Failed to assign email to person');
    } finally {
      setIsUpdating(false);
    }
  }, [email, people, onEmailUpdated]);

  const getStatusBadge = useMemo(() => {
    const badges = [];
    
    if (email.needs_reply) {
      badges.push(
        <span key="needs-reply" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Reply
        </span>
      );
    }
    
    if (email.needs_internal_handling) {
      badges.push(
        <span key="internal" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Internal
        </span>
      );
    }
    
    if (email.waiting_external_handling) {
      badges.push(
        <span key="external" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          External
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
  }, [email.needs_reply, email.needs_internal_handling, email.waiting_external_handling, email.is_handled]);

  const truncatedBody = useMemo(() => {
    if (!email.body) return '';
    return email.body.length > 200 ? email.body.substring(0, 200) + '...' : email.body;
  }, [email.body]);

  const formattedDate = useMemo(() => formatDate(email.received_at), [email.received_at, formatDate]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const toggleShowFullBody = useCallback(() => {
    setShowFullBody(!showFullBody);
  }, [showFullBody]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      {/* Header Row */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={toggleExpanded}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {email.subject}
            </h3>
            <div className="flex items-center space-x-2">
              {getStatusBadge}
            </div>
          </div>
          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
            <span>From: {email.sender_name || email.sender}</span>
            <span>{formattedDate}</span>
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

      {/* Expanded Content - Only render when expanded */}
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

          {/* Action Buttons */}
          <div className="bg-blue-50 rounded-md p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Email Actions</h4>
            <div className="flex flex-wrap gap-2">
              {!email.is_handled && (
                <button
                  onClick={handleMarkHandled}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <CheckIcon className="h-3 w-3 mr-1" />
                  Mark Handled
                </button>
              )}
              
              {!email.needs_internal_handling && (
                <button
                  onClick={handleMarkInternalHandling}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  Internal Handling
                </button>
              )}
              
              {!email.waiting_external_handling && (
                <button
                  onClick={handleMarkExternalHandling}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <ClockIcon className="h-3 w-3 mr-1" />
                  External Handling
                </button>
              )}
              
              <div className="relative">
                <select
                  onChange={(e) => e.target.value && handleAssignToPerson(parseInt(e.target.value))}
                  disabled={isUpdating}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  defaultValue=""
                >
                  <option value="">
                    {email.person ? `Assigned: ${email.person.name}` : 'Assign to Person'}
                  </option>
                  {people.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Project Linking */}
          <div className="bg-purple-50 rounded-md p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Project Assignment</h4>
            <EmailProjectLinker 
              email={email} 
              onProjectLinked={handleProjectLinked}
            />
          </div>

          {/* Email Body Preview - Lazy loaded */}
          <div className="bg-gray-50 rounded-md p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Email Content</h4>
            <div className="text-sm text-gray-600 max-h-40 overflow-y-auto">
              {showFullBody || email.body.length <= 200 ? (
                <div className="whitespace-pre-wrap">{email.body}</div>
              ) : (
                <div>
                  <div className="whitespace-pre-wrap">{truncatedBody}</div>
                  <button
                    onClick={toggleShowFullBody}
                    className="mt-2 text-primary-600 hover:text-primary-800 text-xs font-medium"
                  >
                    Show full content
                  </button>
                </div>
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
});

EmailItem.displayName = 'EmailItem';

export default EmailItem; 