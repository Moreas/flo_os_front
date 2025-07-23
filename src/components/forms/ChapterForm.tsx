import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../api/apiConfig';
import { Chapter } from '../../types/book';

interface ChapterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onChapterCreated: () => void;
  bookId: number;
  initialChapter?: Chapter;
  isEditMode?: boolean;
}

const initialFormData: Omit<Chapter, 'id' | 'book_id'> = {
  title: '',
  chapter_number: 1,
  summary: '',
  personal_notes: '',
  is_completed: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const ChapterForm: React.FC<ChapterFormProps> = ({ 
  isOpen, 
  onClose, 
  onChapterCreated,
  bookId,
  initialChapter = null,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialChapter) {
        setFormData({
          title: initialChapter.title,
          chapter_number: initialChapter.chapter_number,
          summary: initialChapter.summary || '',
          personal_notes: initialChapter.personal_notes || '',
          is_completed: initialChapter.is_completed,
          created_at: initialChapter.created_at,
          updated_at: initialChapter.updated_at,
        });
      } else {
        setFormData(initialFormData);
      }
    }
    if (!isOpen) {
      setTimeout(() => {
        setSubmitError(null);
        setSubmitSuccess(false);
      }, 300);
    }
  }, [isOpen, isEditMode, initialChapter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name === 'chapter_number' ? parseInt(value) || 1 : value 
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const chapterData = {
        ...formData,
        book_id: bookId,
      };

      if (isEditMode) {
        const response = await apiClient.put(`/api/chapters/${initialChapter?.id}/`, chapterData);
        if (response.status >= 200 && response.status < 300) {
          setSubmitSuccess(true);
          onChapterCreated();
          setTimeout(() => { onClose(); }, 1500);
        } else {
          throw new Error(`Failed to update chapter (${response.status})`);
        }
      } else {
        const response = await apiClient.post('/api/chapters/', chapterData);
        if (response.status >= 200 && response.status < 300) {
          setSubmitSuccess(true);
          onChapterCreated();
          setFormData(initialFormData);
          setTimeout(() => { onClose(); }, 1500);
        } else {
          throw new Error(`Failed to create chapter (${response.status})`);
        }
      }
    } catch (err: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} chapter:`, err);
      const errorMsg = err instanceof Error ? err.message : 
        `Failed to ${isEditMode ? 'update' : 'create'} chapter.`;
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {isEditMode ? 'Edit Chapter' : 'Add New Chapter'}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          id="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="chapter_number" className="block text-sm font-medium text-gray-700">
                          Chapter Number
                        </label>
                        <input
                          type="number"
                          name="chapter_number"
                          id="chapter_number"
                          value={formData.chapter_number}
                          onChange={handleInputChange}
                          min="1"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                          Summary
                        </label>
                        <textarea
                          name="summary"
                          id="summary"
                          rows={4}
                          value={formData.summary}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label htmlFor="personal_notes" className="block text-sm font-medium text-gray-700">
                          Personal Notes
                        </label>
                        <textarea
                          name="personal_notes"
                          id="personal_notes"
                          rows={4}
                          value={formData.personal_notes}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_completed"
                          id="is_completed"
                          checked={formData.is_completed}
                          onChange={handleInputChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="is_completed" className="ml-2 block text-sm text-gray-900">
                          Mark as completed
                        </label>
                      </div>

                      {submitError && (
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">{submitError}</h3>
                            </div>
                          </div>
                        </div>
                      )}

                      {submitSuccess && (
                        <div className="rounded-md bg-green-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">
                                Chapter {isEditMode ? 'updated' : 'created'} successfully!
                              </h3>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                              {isEditMode ? 'Updating...' : 'Creating...'}
                            </>
                          ) : (
                            isEditMode ? 'Update Chapter' : 'Create Chapter'
                          )}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ChapterForm; 