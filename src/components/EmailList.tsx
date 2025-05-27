import React, { useState, useEffect, Fragment, useMemo } from 'react';
import axios from 'axios';
import { ArrowPathIcon, ExclamationTriangleIcon, InboxIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { format, parseISO } from 'date-fns';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  person?: { id: number; name: string } | null;
  business?: { id: number; name: string } | null;
  is_handled: boolean;
  draft_reply?: string | null;
  needs_reply?: boolean;
  categories?: string[]; // Renamed and type changed to string array
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
  { id: 1, subject: "Meeting Follow-up", sender: "client@example.com", sender_name: "Alice Wonderland", recipients: "me@example.com", body: "...", received_at: "2024-04-17T10:30:00Z", is_handled: false, person: {id: 1, name: "Alice"}, needs_reply: true, categories: ["Client Communication"] },
  { id: 2, subject: "Project Update", sender: "colleague@example.com", sender_name: "Bob The Colleague", recipients: "me@example.com, manager@example.com", body: "...", received_at: "2024-04-17T09:15:00Z", is_handled: true, needs_reply: false, categories: ["Internal", "Project Alpha"] },
  { id: 3, subject: "Invoice #123", sender: "accounting@example.com", sender_name: null, recipients: "me@example.com", body: "...", received_at: "2024-04-18T11:00:00Z", is_handled: false, needs_reply: false, categories: ["Finance"] },
];

const EmailList: React.FC = () => {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNeedsReplyOnly, setShowNeedsReplyOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('http://localhost:8000/api/emails/'); // Adjust endpoint if needed
        setEmails(response.data || []);
      } catch (err) {
        console.error("Error fetching emails:", err);
        setError("Failed to load emails. Displaying sample data.");
        setEmails(fallbackEmails); // Use fallback on error
      } finally {
        setLoading(false);
      }
    };
    fetchEmails();
  }, []);

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
      // Needs Reply Filter
      if (showNeedsReplyOnly && !email.needs_reply) {
        return false;
      }
      // Category Filter: Check if email has ANY of the selected categories
      // If no categories are selected, this filter passes (shows all categories)
      if (selectedCategories.length > 0 && 
          !selectedCategories.some(selCat => email.categories?.includes(selCat))) {
        return false;
      }
      return true; // Show if all filters pass
    });
  }, [emails, showNeedsReplyOnly, selectedCategories]); // Depend on selectedCategories

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

          {/* Needs Reply Checkbox (moved for better grouping) */}
          <div className="flex items-center flex-shrink-0 pt-2 md:pt-0 md:self-end">
            <input
              id="needs-reply-filter"
              name="needs-reply-filter"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={showNeedsReplyOnly}
              onChange={(e) => setShowNeedsReplyOnly(e.target.checked)}
            />
            <label htmlFor="needs-reply-filter" className="ml-2 block text-sm text-gray-900">
              Show only needs reply
            </label>
          </div>
        </div>
      </div>

      {filteredEmails.length === 0 && !error && !loading && (
         <div className="text-center py-8 bg-gray-50 rounded-lg">
            <InboxIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">
                {showNeedsReplyOnly || selectedCategories.length > 0 ? 'No emails match the current filters.' : 'No emails found.'}
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
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredEmails.map((email) => (
                <tr key={email.id} onClick={() => handleRowClick(email)} className="border-t border-gray-200 hover:bg-primary-50 cursor-pointer">
                  <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-gray-900 truncate max-w-xs" title={email.subject}>{email.subject}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 truncate" title={email.sender_name ?? email.sender}>
                    {email.sender_name ?? email.sender}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 text-right">
                    {format(parseISO(email.received_at), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-500 text-right sm:pr-6">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      email.is_handled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {email.is_handled ? 'Handled' : 'Needs Handling'}
                    </span>
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
    </div>
  );
};

export default EmailList; 