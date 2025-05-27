import React, { useState, useEffect, Fragment, useCallback } from 'react';
import axios from 'axios';
import { ArrowPathIcon, ExclamationTriangleIcon, TrashIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { format, parseISO } from 'date-fns';
import API_BASE from '../apiBase';

// Define emotions and their corresponding emojis
const emotionsMap: { [key: string]: string } = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  surprised: '😮',
  calm: '😌',
  anxious: '😟',
  excited: '🤩',
  tired: '😴',
  confused: '😕',
};

// Interface for Journal Entry data
interface JournalEntry {
  id: number;
  title?: string;
  content: string;
  date: string;
  emotion?: string;
  tags?: string;
}

// Fallback data
const fallbackEntries: JournalEntry[] = [
    { id: 1, title: "Reflections on the Week", content: "It was a productive week overall...", date: "2024-08-14T10:00:00Z" },
    { id: 2, content: "Quick thoughts on the new project kickoff meeting.", date: "2024-08-13T15:30:00Z" },
];

const JournalList: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [entryToDeleteId, setEntryToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE}/api/journal_entries/`);
        setEntries(response.data || []);
      } catch (err) {
        console.error("Error fetching journal entries:", err);
        setError("Failed to load journal entries. Displaying sample data.");
        setEntries(fallbackEntries);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);
  
  // Delete Modal Handlers
  const openConfirmModal = (id: number) => {
      setEntryToDeleteId(id);
      setDeleteError(null); // Clear previous errors
      setIsConfirmOpen(true);
  };

  const closeConfirmModal = useCallback(() => {
      if (isDeleting) return; // Prevent closing while delete is in progress
      setIsConfirmOpen(false);
      setTimeout(() => {
          setEntryToDeleteId(null);
          setDeleteError(null);
      }, 300); // Delay reset to allow modal fade out
  }, [isDeleting]);

  const handleDeleteEntry = async () => {
      if (entryToDeleteId === null) return;
      setIsDeleting(true);
      setDeleteError(null);
      try {
          await axios.delete(`${API_BASE}/api/journal_entries/${entryToDeleteId}/`);
          // Remove entry from local state on success
          setEntries(currentEntries => currentEntries.filter(entry => entry.id !== entryToDeleteId));
          closeConfirmModal();
          console.log(`Journal entry ${entryToDeleteId} deleted.`);
      } catch (err: any) {
          console.error("Error deleting journal entry:", err);
          const errorMsg = err.response?.data?.detail || 'Failed to delete entry.';
          setDeleteError(errorMsg);
          // Keep modal open to show error
      } finally {
          setIsDeleting(false);
      }
  };

  const formatDate = (dateString: string) => {
     if (!dateString) return "No Date";
     try {
        // Format date and time
        // Format just the date part (YYYY-MM-DD from Django DateField)
        return format(parseISO(dateString), 'MMM d, yyyy');
     } catch (e) { 
         console.error("Error formatting date:", dateString, e);
         return "Invalid Date"; 
     }
  }

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

      {entries.length === 0 && !error && !loading && (
         <p className="text-center text-gray-500 py-4">No journal entries found.</p>
      )}
      
      <div className="space-y-3">
        {entries.map((entry) => (
          <div 
            key={entry.id} 
            className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow transition-shadow duration-150"
          >
            <div className="flex justify-between items-start mb-1">
                {/* Title and Emotion */}
                <div className="flex items-center">
                  {/* Display emoji if emotion exists */}
                  {entry.emotion && emotionsMap[entry.emotion] && (
                    <span className="text-xl mr-2" title={entry.emotion}>{emotionsMap[entry.emotion]}</span>
                  )}
                  {/* Updated Title Logic - Remove "Entry - " */}
                  <h3 className="text-base font-semibold text-gray-900">{entry.title || `${formatDate(entry.date)}`}</h3>
                </div>
                {/* Right side: Date and Delete Button */}
                <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(entry.date)}</p>
                    {/* Delete Button */}
                    <button 
                        onClick={() => openConfirmModal(entry.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-0.5 rounded"
                        title="Delete Entry"
                        aria-label="Delete journal entry"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
             <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">{entry.content}</p> 
             {/* Optional: Expand/View more button? Edit/Delete? */}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isConfirmOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeConfirmModal}>
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
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-2" />
                    Confirm Deletion
                  </Dialog.Title>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete this journal entry? This action cannot be undone.
                    </p>
                  </div>

                  {deleteError && (
                    <div className="mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 flex items-center">
                        <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                        {deleteError}
                    </div>
                  )}

                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleDeleteEntry}
                      disabled={isDeleting}
                    >
                       {isDeleting && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
                       {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:col-start-1 sm:text-sm disabled:opacity-50"
                      onClick={closeConfirmModal}
                      disabled={isDeleting}
                    >
                      Cancel
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

export default JournalList; 