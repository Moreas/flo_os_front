import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';
import { ArrowPathIcon, ExclamationTriangleIcon, UserCircleIcon, PencilIcon, ArrowLeftIcon, InboxIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import PersonForm from '../components/forms/PersonForm';
import RelatedItemsList from '../components/ui/RelatedItemsList';

interface Person {
  id: number;
  name: string;
  relationship?: string;
  notes?: string;
  appreciation?: string;
  triggers?: string;
  last_interaction?: string;
  tasks?: Array<{
    id: number;
    title: string;
    status: string;
    due_date?: string;
  }>;
  projects?: Array<{
    id: number;
    name: string;
    status: string;
  }>;
  goals?: Array<{
    id: number;
    title: string;
    status: string;
    target_date?: string;
  }>;
  journal_entries?: Array<{
    id: number;
    content: string;
    created_at: string;
    emotion?: string;
  }>;
  email_addresses?: Array<{ id: number; email: string; label?: string }>;
}

const PersonDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);
  const [unassigning, setUnassigning] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [showNeedsHandlingOnly, setShowNeedsHandlingOnly] = useState(false);
  const [showInternalHandlingOnly, setShowInternalHandlingOnly] = useState(false);
  const [showExternalHandlingOnly, setShowExternalHandlingOnly] = useState(false);

  const fetchPerson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/api/people/${id}/`);
      setPerson(response.data);
    } catch (err) {
      console.error("Error fetching person:", err);
      setError("Failed to load person details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchEmails = useCallback(async () => {
    try {
      const response = await apiClient.get(`/api/emails/`, {
        params: { person: id }
      });
      setEmails(response.data || []);
    } catch (err) {
      console.error('Error fetching emails:', err);
    }
  }, [id]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchPerson(), fetchEmails()]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id, fetchPerson, fetchEmails]);

  const handlePersonUpdated = (updatedPerson: Person) => {
    setPerson(updatedPerson);
    setIsEditModalOpen(false);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch { 
      return "Invalid Date"; 
    }
  };

  const handleEmailStatusChange = async (emailId: number, newStatus: boolean) => {
    try {
      console.log(`[PersonDetailPage] Marking email ${emailId} as handled: ${newStatus}`);
      
      if (newStatus) {
        // Use the specific endpoint for marking as handled
        const response = await apiClient.post(`/api/emails/${emailId}/mark_handled/`);
        console.log('[PersonDetailPage] Mark handled endpoint response:', response.data);
      } else {
        // For unhandling, use PATCH to set is_handled to false
        const payload = {
          is_handled: false
        };
        
        const response = await apiClient.patch(`/api/emails/${emailId}/`, payload);
        console.log('[PersonDetailPage] Unhandled PATCH response:', response.data);
      }
      
      // Refresh emails after update
      console.log('[PersonDetailPage] Refreshing emails after status change...');
      await fetchEmails();
      console.log(`[PersonDetailPage] Emails refreshed, current count: ${emails.length}`);
    } catch (err) {
      console.error('[PersonDetailPage] Failed to update email status:', err);
      const errorAny = err as any;
      if (errorAny.response) {
        console.error('[PersonDetailPage] API Error details:', {
          status: errorAny.response?.status,
          data: errorAny.response?.data,
          url: errorAny.config?.url,
          method: errorAny.config?.method
        });
      }
    }
  };

  const handleHandlingTypeChange = async (emailId: number, handlingType: 'external' | 'internal') => {
    try {
      console.log(`[PersonDetailPage] Marking email ${emailId} as ${handlingType} handling`);
      
      const endpoint = handlingType === 'external' 
        ? `/api/emails/${emailId}/mark_external_handling/`
        : `/api/emails/${emailId}/mark_internal_handling/`;
      
      await apiClient.post(endpoint);
      console.log(`[PersonDetailPage] Email ${emailId} marked as ${handlingType} handling`);
      
      // Refresh emails after update
      console.log('[PersonDetailPage] Refreshing emails after handling type change...');
      await fetchEmails();
      console.log(`[PersonDetailPage] Emails refreshed, current count: ${emails.length}`);
    } catch (err) {
      console.error(`[PersonDetailPage] Failed to mark email as ${handlingType} handling:`, err);
    }
  };

  const handleTaskToggle = async (taskId: number, currentStatus: boolean) => {
    setUpdatingTaskId(taskId);
    try {
      await apiClient.patch(`/api/tasks/${taskId}/`, { is_done: !currentStatus });
      // Refresh person data to get updated tasks
      await fetchPerson();
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Filter emails based on state
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
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
  }, [emails, showNeedsHandlingOnly, showInternalHandlingOnly, showExternalHandlingOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500">{error || "Person not found"}</p>
          <button
            onClick={() => navigate('/people')}
            className="mt-4 text-primary-600 hover:text-primary-700"
          >
            Return to People
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/people')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to People
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-50 rounded-full">
              <UserCircleIcon className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{person.name}</h1>
              {person.relationship && (
                <p className="mt-1 text-sm text-gray-600">{person.relationship}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PencilIcon className="w-4 h-4 mr-2" />
            Edit
          </button>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {person.appreciation && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Appreciation</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{person.appreciation}</dd>
              </div>
            )}

            {person.triggers && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Triggers</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{person.triggers}</dd>
              </div>
            )}

            {person.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{person.notes}</dd>
              </div>
            )}

            {person.last_interaction && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Interaction</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(person.last_interaction)}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-8 space-y-8">
        {person.tasks && person.tasks.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Related Tasks</h2>
            <RelatedItemsList
              items={person.tasks.map(task => ({
                id: task.id,
                title: task.title,
                status: task.status,
                date: task.due_date,
                type: 'tasks'
              }))}
              type="tasks"
              onItemClick={(task) => navigate(`/tasks/${task.id}`)}
              onTaskToggle={handleTaskToggle}
              isUpdatingTask={updatingTaskId}
            />
          </div>
        )}

        {person.projects && person.projects.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Related Projects</h2>
            <RelatedItemsList
              items={person.projects.map(project => ({
                id: project.id,
                title: project.name,
                status: project.status,
                type: 'projects'
              }))}
              type="projects"
              onItemClick={(project) => navigate(`/projects/${project.id}`)}
            />
          </div>
        )}

        {person.goals && person.goals.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Related Goals</h2>
            <RelatedItemsList
              items={person.goals.map(goal => ({
                id: goal.id,
                title: goal.title,
                status: goal.status,
                date: goal.target_date,
                type: 'goals'
              }))}
              type="goals"
              onItemClick={(goal) => navigate(`/goals/${goal.id}`)}
            />
          </div>
        )}

        {person.journal_entries && person.journal_entries.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Related Journal Entries</h2>
            <div className="space-y-4">
              {person.journal_entries.map(entry => (
                <div
                  key={entry.id}
                  className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow duration-150 cursor-pointer"
                  onClick={() => navigate(`/journal/${entry.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 line-clamp-3">{entry.content}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {formatDate(entry.created_at)}
                        {entry.emotion && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {entry.emotion}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {emails.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <InboxIcon className="w-5 h-5 mr-2 text-primary-600" />
                Emails 
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {filteredEmails.length} of {emails.length}
                </span>
              </h2>
              
              {/* Handling Filters */}
              <div className="flex flex-col space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Handling Status:
                </label>
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center">
                    <input
                      id="needs-handling-filter"
                      name="needs-handling-filter"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={showNeedsHandlingOnly}
                      onChange={(e) => setShowNeedsHandlingOnly(e.target.checked)}
                    />
                    <label htmlFor="needs-handling-filter" className="ml-2 block text-sm text-gray-900">
                      Exclude handled emails
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="internal-handling-filter"
                      name="internal-handling-filter"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={showInternalHandlingOnly}
                      onChange={(e) => setShowInternalHandlingOnly(e.target.checked)}
                    />
                    <label htmlFor="internal-handling-filter" className="ml-2 block text-sm text-gray-900">
                      Internal handling only
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="external-handling-filter"
                      name="external-handling-filter"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={showExternalHandlingOnly}
                      onChange={(e) => setShowExternalHandlingOnly(e.target.checked)}
                    />
                    <label htmlFor="external-handling-filter" className="ml-2 block text-sm text-gray-900">
                      External handling only
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {filteredEmails.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {showNeedsHandlingOnly || showInternalHandlingOnly || showExternalHandlingOnly ? 'No emails match the current filters.' : 'No emails found.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sender</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredEmails.map(email => (
                      <tr key={email.id}>
                        <td className="px-3 py-2 text-sm text-primary-700 font-medium">
                          {email.subject}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">{email.sender_name || email.sender}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{email.received_at ? new Date(email.received_at).toLocaleString() : ''}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">
                          <select
                            value={(() => {
                              let value = "";
                              if (email.is_handled) {
                                value = "handled";
                              } else if (email.needs_internal_handling) {
                                value = "internal";
                              } else if (email.waiting_external_handling) {
                                value = "external";
                              }
                              return value;
                            })()}
                            onChange={e => {
                              const value = e.target.value;
                              if (value === "handled") {
                                handleEmailStatusChange(email.id, true);
                              } else if (value === "external" || value === "internal") {
                                handleHandlingTypeChange(email.id, value as 'external' | 'internal');
                              }
                            }}
                            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          >
                            <option value="">Select Handling Type</option>
                            <option value="handled">Handled</option>
                            <option value="external">External Handling</option>
                            <option value="internal">Internal Handling</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {person.email_addresses && person.email_addresses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Assigned Email Addresses</h2>
            <ul className="divide-y divide-gray-200 bg-gray-50 rounded-md border border-gray-200">
              {person.email_addresses.map((emailObj: { id: number; email: string; label?: string }) => (
                <li key={emailObj.id} className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-gray-800">
                    {emailObj.email}
                    {emailObj.label && (
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">{emailObj.label}</span>
                    )}
                  </span>
                  <button
                    className="ml-4 px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                    onClick={async () => {
                      setUnassigning(emailObj.email);
                      try {
                        await apiClient.delete(`/people/${id}/unassign_email_address/`, {
                          data: { email_address: emailObj.email },
                          headers: { 'Content-Type': 'application/json' },
                        });
                        setPerson(prev => prev && {
                          ...prev,
                          email_addresses: prev.email_addresses
                            ? prev.email_addresses.filter((e: any) => e.email !== emailObj.email)
                            : []
                        });
                      } catch (err) {
                        console.error('Failed to unassign email address:', err);
                      } finally {
                        setUnassigning(null);
                      }
                    }}
                    disabled={unassigning === emailObj.email}
                  >
                    {unassigning === emailObj.email ? 'Unassigning...' : 'Unassign'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <PersonForm
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onPersonCreated={handlePersonUpdated}
          initialPerson={person}
          isEditMode={true}
        />
      )}
    </div>
  );
};

export default PersonDetailPage; 