import React, { useState, useEffect, Fragment, useMemo, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';
import { ArrowPathIcon, ExclamationTriangleIcon, InboxIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { format, parseISO } from 'date-fns';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import API_BASE from '../apiBase';
import { Link } from 'react-router-dom';

// Interface for EmailMessage data based on the backend model
interface EmailMessage {
  id: number;
  subject: string;
  sender: string;
  recipients: string; // Assuming comma-separated string or similar
  sender_name?: string | null;
  body: string;
  thread_id?: string | null;
  received_at: string; // ISO date string
  person?: { id: number; name: string; is_self: boolean } | null;
  business?: { id: number; name: string } | null;
  is_handled: boolean;
  needs_internal_handling: boolean;
  waiting_external_handling: boolean;
  draft_reply?: string | null;
  needs_reply?: boolean;
  categories?: string[]; // Renamed and type changed to string array
}

interface Person {
  id: number;
  name: string;
}

// Helper function to preprocess body text
const preprocessEmailBody = (body: string): string => {
  // Convert "Text [URL]" to standard Markdown "[Text](URL)"
  // Regex Explanation:
  // (\S.*?): Capture Group 1: Starts with non-space, captures non-greedily up to the bracket part.
  // \s*: Matches optional spaces before the bracket.
  // \[ : Matches literal '['.
  // (https?:\\/\\/\\S+): Capture Group 2: Captures the http(s) URL.
  // \] : Matches literal ']'
  const linkRegex = new RegExp("(\\S.*?)\\s*\\[(https?:\\\\/\\\\/\\S+)\\]", "g");
  let processedBody = body.replace(linkRegex, '[$1]($2)');

  // Optional: Handle other custom formats if needed, e.g., View image: (URL)
  // const imageRegex = /View image: \\((https?:\\/\\/\\S+)\\)/g;
  // processedBody = processedBody.replace(imageRegex, '![]($1)'); // Convert to Markdown image

  return processedBody;
};

// Fallback data (optional, for development/testing) - Using `categories: string[]`
const fallbackEmails: EmailMessage[] = [
  { id: 1, subject: "Meeting Follow-up", sender: "client@example.com", sender_name: "Alice Wonderland", recipients: "me@example.com", body: "...", received_at: "2024-04-17T10:30:00Z", is_handled: false, needs_internal_handling: false, waiting_external_handling: false, person: {id: 1, name: "Alice", is_self: false}, needs_reply: true, categories: ["Client Communication"] },
  { id: 2, subject: "Project Update", sender: "colleague@example.com", sender_name: "Bob The Colleague", recipients: "me@example.com, manager@example.com", body: "...", received_at: "2024-04-17T09:15:00Z", is_handled: true, needs_internal_handling: false, waiting_external_handling: false, needs_reply: false, categories: ["Internal", "Project Alpha"] },
  { id: 3, subject: "Invoice #123", sender: "accounting@example.com", sender_name: null, recipients: "me@example.com", body: "...", received_at: "2024-04-18T11:00:00Z", is_handled: false, needs_internal_handling: false, waiting_external_handling: false, needs_reply: false, categories: ["Finance"] },
];

export interface EmailListRef {
  refresh: () => void;
}

const EmailList = forwardRef<EmailListRef>((props, ref) => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNeedsHandlingOnly, setShowNeedsHandlingOnly] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningEmailId, setAssigningEmailId] = useState<number | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/api/emails/`);
      setEmails(response.data || []);
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(email => {
          if (email.person) {
            console.log('Email ID:', email.id, 'Person:', email.person);
          }
        });
      }
      console.log('Fetched emails:', response.data); // Debug log
    } catch (err) {
      console.error("Error fetching emails:", err);
      setError("Failed to load emails. Displaying sample data.");
      setEmails(fallbackEmails); // Use fallback on error
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      console.log('Starting email list refresh...');
      try {
        // Add a small delay to ensure backend has processed changes
        await new Promise(resolve => setTimeout(resolve, 100));
        setRefreshKey(prev => prev + 1);
        console.log('Refresh key updated, triggering new fetch...');
      } catch (error) {
        console.error('Error during refresh:', error);
        setError('Failed to refresh email list');
      }
    }
  }));

  useEffect(() => {
    console.log('Fetching emails, refreshKey:', refreshKey);
    fetchEmails();
  }, [refreshKey]);

  // Derive unique categories from emails (now strings) for the filter dropdown
  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();
    emails.forEach(email => {
      email.categories?.forEach(cat => {
        if (cat) { // Ensure category string is not empty/null
           categorySet.add(cat);
        }
      });
    });
    // Convert set to array and sort alphabetically
    return Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  }, [emails]);

  const handleRowClick = (email: EmailMessage) => {
    setSelectedEmail(email);
  };

  const handleCloseModal = () => {
    setSelectedEmail(null);
  };

  // Handler for category checkbox changes
  const handleCategoryCheckboxChange = (categoryName: string, isChecked: boolean) => {
    setSelectedCategories(prevSelected => {
      if (isChecked) {
        // Add category if checked and not already present
        return [...prevSelected, categoryName];
      } else {
        // Remove category if unchecked
        return prevSelected.filter(cat => cat !== categoryName);
      }
    });
  };

  // Filter emails based on state
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      // Needs Handling Filter - show emails that need internal/external handling OR haven't been assigned any handling type yet
      if (showNeedsHandlingOnly && 
          email.needs_internal_handling === false && 
          email.waiting_external_handling === false && 
          email.is_handled === true) {
        return false;
      }
      // Category Filter: Check if email has ANY of the selected categories
      if (selectedCategories.length > 0 && 
          !selectedCategories.some(selCat => email.categories?.includes(selCat))) {
        return false;
      }
      return true; // Show if all filters pass
    });
  }, [emails, showNeedsHandlingOnly, selectedCategories]);

  const openAssignModal = async (emailId: number) => {
    setAssigningEmailId(emailId);
    setAssignModalOpen(true);
    setAssignError(null);
    setAssignSuccess(null);
    setSelectedPersonId(null);
    try {
      const res = await axios.get(`${API_BASE}/api/people/`);
      setPeople(res.data || []);
    } catch (err) {
      setAssignError('Failed to load people.');
    }
  };

  const handleAssign = async () => {
    if (!assigningEmailId || !selectedPersonId) return;
    setAssignLoading(true);
    setAssignError(null);
    setAssignSuccess(null);
    try {
      // Find the email object to get the sender address
      const email = emails.find(e => e.id === assigningEmailId);
      if (!email) throw new Error('Email not found');
      await axios.post(`${API_BASE}/api/people/${selectedPersonId}/assign_email_address/`, { email_address: email.sender });
      setAssignSuccess('Sender assigned successfully!');
      setTimeout(() => {
        setAssignModalOpen(false);
        setAssigningEmailId(null);
        setAssignSuccess(null);
        setSelectedPersonId(null);
        setRefreshKey(prev => prev + 1); // Refresh email list
      }, 1000);
    } catch (err) {
      setAssignError('Failed to assign sender.');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleEmailStatusChange = async (emailId: number, isHandled: boolean) => {
    try {
      console.log(`=== EMAIL STATUS CHANGE DEBUG ===`);
      console.log(`Email ID: ${emailId}, Setting handled: ${isHandled}`);
      
      // Log current email state before update
      const currentEmail = emails.find(e => e.id === emailId);
      console.log('Current email state:', currentEmail);
      
      if (isHandled) {
        console.log(`Making POST request to: ${API_BASE}/api/emails/${emailId}/mark_handled/`);
        
        // Use the specific endpoint for marking as handled
        const response = await axios.post(`${API_BASE}/api/emails/${emailId}/mark_handled/`);
        console.log('Mark handled endpoint response:', response.data);
        console.log('Response status:', response.status);
        
        // Add a small delay to ensure backend has processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update local state to reflect the change immediately
        setEmails(prevEmails => prevEmails.map(email =>
          email.id === emailId ? { 
            ...email, 
            is_handled: true,
            needs_internal_handling: false,
            waiting_external_handling: false
          } : email
        ));
        
        console.log('Local state updated');
        
        // Manually refresh to verify backend update
        console.log('Refreshing email list to verify backend update...');
        await fetchEmails();
        console.log('Email list refreshed');
      } else {
        console.log(`Making PATCH request to: ${API_BASE}/api/emails/${emailId}/`);
        
        // For unhandling, we might need a different approach
        // For now, let's use PATCH to set is_handled to false
        const payload = {
          is_handled: false
        };
        
        const response = await axios.patch(`${API_BASE}/api/emails/${emailId}/`, payload);
        console.log('Unhandled PATCH response:', response.data);
        console.log('Response status:', response.status);
        
        // Update local state
        setEmails(prevEmails => prevEmails.map(email =>
          email.id === emailId ? { 
            ...email, 
            is_handled: false
          } : email
        ));
      }
      
      // Log updated email state
      const updatedEmails = emails.map(e => e.id === emailId ? { ...e, is_handled: isHandled } : e);
      const updatedEmail = updatedEmails.find(e => e.id === emailId);
      console.log('Updated email state:', updatedEmail);
      console.log(`=== END DEBUG ===`);
      
    } catch (err) {
      console.error('Failed to update email status:', err);
      if (axios.isAxiosError(err)) {
        console.error('API Error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        });
      }
    }
  };

  const handleHandlingTypeChange = async (emailId: number, handlingType: 'external' | 'internal') => {
    try {
      const endpoint = handlingType === 'external' 
        ? `${API_BASE}/api/emails/${emailId}/mark_external_handling/`
        : `${API_BASE}/api/emails/${emailId}/mark_internal_handling/`;
      
      await axios.post(endpoint);
      console.log(`Email ${emailId} marked as ${handlingType} handling`);
      
      // Update local state to reflect the change immediately
      setEmails(prevEmails => prevEmails.map(email =>
        email.id === emailId ? { 
          ...email, 
          needs_internal_handling: handlingType === 'internal',
          waiting_external_handling: handlingType === 'external',
          is_handled: true 
        } : email
      ));
    } catch (err) {
      console.error(`Failed to mark email as ${handlingType} handling:`, err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Filter Controls */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Category Checkbox Group */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category:
            </label>
            {availableCategories.length > 0 ? (
              <div className="flex flex-wrap gap-x-4 gap-y-2 max-h-24 overflow-y-auto pr-2">
                {availableCategories.map(cat => (
                  <div key={cat} className="flex items-center">
                    <input
                      id={`cat-${cat}`}
                      name="category"
                      type="checkbox"
                      value={cat}
                      checked={selectedCategories.includes(cat)}
                      onChange={(e) => handleCategoryCheckboxChange(cat, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor={`cat-${cat}`} className="ml-2 block text-sm text-gray-900">
                      {cat}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No categories found to filter by.</p>
            )}
          </div>

          {/* Needs Handling Checkbox (moved for better grouping) */}
          <div className="flex items-center flex-shrink-0 pt-2 md:pt-0 md:self-end">
            <input
              id="needs-handling-filter"
              name="needs-handling-filter"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={showNeedsHandlingOnly}
              onChange={(e) => setShowNeedsHandlingOnly(e.target.checked)}
            />
            <label htmlFor="needs-handling-filter" className="ml-2 block text-sm text-gray-900">
              Show only needs handling
            </label>
          </div>
        </div>
      </div>

      {filteredEmails.length === 0 && !error && !loading && (
         <div className="text-center py-8 bg-gray-50 rounded-lg">
            <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">
                {showNeedsHandlingOnly || selectedCategories.length > 0 ? 'No emails match the current filters.' : 'No emails found.'}
            </p>
         </div>
      )}

      {/* TODO: Add Table or List rendering logic here */}
      {filteredEmails.length > 0 && (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full bg-white table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="w-[40%] px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Subject</th>
                <th scope="col" className="w-[25%] px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Sender</th>
                <th scope="col" className="w-[20%] px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Received</th>
                <th scope="col" className="w-[15%] px-3 py-3.5 text-right text-sm font-semibold text-gray-900 sm:pr-6">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Person</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredEmails.map((email) => (
                <tr key={email.id} onClick={() => handleRowClick(email)} className="hover:bg-primary-50 transition-colors duration-100">
                  <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-900 truncate max-w-xs" title={email.subject}>{email.subject}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 truncate" title={email.sender_name ?? email.sender}>
                    {email.sender_name ?? email.sender}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 text-right">
                    {format(parseISO(email.received_at), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500">
                    <select
                      value={(() => {
                        const value = email.needs_internal_handling ? "internal" : email.waiting_external_handling ? "external" : email.is_handled ? "handled" : "";
                        console.log(`Email ${email.id} dropdown value calculation:`, {
                          needs_internal_handling: email.needs_internal_handling,
                          waiting_external_handling: email.waiting_external_handling,
                          is_handled: email.is_handled,
                          calculated_value: value
                        });
                        return value;
                      })()}
                      onClick={e => e.stopPropagation()}
                      onChange={e => {
                        e.stopPropagation();
                        const value = e.target.value;
                        console.log(`Dropdown changed for email ${email.id}:`, value);
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
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                    {email.person ? (
                      <Link
                        to={`/people/${email.person.id}`}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium hover:underline ${email.person.is_self ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-green-100 text-green-800'}`}
                        title={`View ${email.person.name}`}
                      >
                        <UserCircleIcon className={`w-4 h-4 mr-1 ${email.person.is_self ? 'text-blue-600' : 'text-green-600'}`} />
                        {email.person.name}
                        {email.person.is_self && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-blue-200 text-blue-800 font-semibold">Myself</span>
                        )}
                      </Link>
                    ) : (
                      <>
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-xs font-medium">
                          Unassigned
                        </span>
                        <button
                          className="ml-2 px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200"
                          onClick={e => { e.stopPropagation(); openAssignModal(email.id); }}
                          title="Assign sender to person"
                        >
                          Assign to Person
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Email Detail Modal */}
      <Transition appear show={selectedEmail !== null} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={handleCloseModal}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          {/* Modal Panel */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-gray-200 pb-4 mb-4">
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        {selectedEmail?.subject}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-gray-500">
                        From: {selectedEmail?.sender_name ?? selectedEmail?.sender}
                      </p>
                      <p className="text-sm text-gray-500">
                        To: {selectedEmail?.recipients} 
                      </p>
                       <p className="mt-1 text-xs text-gray-400">
                        {selectedEmail?.received_at ? format(parseISO(selectedEmail.received_at), "MMM d, yyyy 'at' h:mm a") : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ml-4 text-gray-400 hover:text-gray-500"
                      onClick={handleCloseModal}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="mt-4 max-h-[60vh] overflow-y-auto">
                    {selectedEmail?.body && (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {preprocessEmailBody(DOMPurify.sanitize(selectedEmail.body))}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Optional Footer (e.g., for reply actions) */}
                  {/* <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4">
                    <button type="button" className="btn-secondary" onClick={handleCloseModal}>Close</button>
                  </div> */}

                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={assignModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setAssignModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
                    <UserCircleIcon className="w-6 h-6 text-primary-600 mr-2" />
                    Assign Sender to Person
                  </Dialog.Title>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select a person:</label>
                    <select
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      value={selectedPersonId ?? ''}
                      onChange={e => setSelectedPersonId(Number(e.target.value))}
                    >
                      <option value="">-- Select --</option>
                      {people.map(person => (
                        <option key={person.id} value={person.id}>{person.name}</option>
                      ))}
                    </select>
                  </div>
                  {assignError && <div className="mt-2 text-sm text-red-600">{assignError}</div>}
                  {assignSuccess && <div className="mt-2 text-sm text-green-600">{assignSuccess}</div>}
                  <div className="mt-6 flex justify-end space-x-2">
                    <button
                      className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                      onClick={() => setAssignModalOpen(false)}
                      disabled={assignLoading}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                      onClick={handleAssign}
                      disabled={!selectedPersonId || assignLoading}
                    >
                      {assignLoading ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
});

export default EmailList; 