import React, { useState, useRef } from 'react';
import EmailList, { EmailListRef } from '../components/EmailList';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import API_BASE from '../apiBase';

const EmailsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const emailListRef = useRef<EmailListRef>(null);

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
        setTimeout(() => {
          emailListRef.current?.refresh();
        }, 500);
      } else {
        setError(response.data.message || 'Failed to retrieve emails.');
      }
    } catch (err: any) {
      setError('Error retrieving emails.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeEmails = async () => {
    setIsPurging(true);
    setError(null);
    try {
      await axios.post(`${API_BASE}/api/emails/purge_all/`);
      setMessage('All emails have been purged successfully.');
      setIsPurgeConfirmOpen(false);
      setTimeout(() => {
        emailListRef.current?.refresh();
      }, 500);
    } catch (err: any) {
      setError('Failed to purge emails. Please try again.');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsPurgeConfirmOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Purge All Emails
          </button>
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
        <EmailList ref={emailListRef} />
      </div>

      {/* Purge Confirmation Dialog */}
      <Transition appear show={isPurgeConfirmOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isPurging && setIsPurgeConfirmOpen(false)}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Confirm Email Purge
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete all retrieved emails? This action cannot be undone.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      onClick={() => setIsPurgeConfirmOpen(false)}
                      disabled={isPurging}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                      onClick={handlePurgeEmails}
                      disabled={isPurging}
                    >
                      {isPurging ? 'Purging...' : 'Delete All Emails'}
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
};

export default EmailsPage; 