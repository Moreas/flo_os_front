import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import API_BASE from '../../apiBase';

interface Book {
  id: number;
  title: string;
  author?: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'completed';
  current_chapter?: number;
  total_chapters?: number;
  rating?: number;
  notes?: string;
}

interface BookFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBookCreated: () => void;
  initialBook?: Book;
  isEditMode?: boolean;
}

const initialFormData: Omit<Book, 'id'> = {
  title: '',
  author: '',
  description: '',
  status: 'not_started',
  current_chapter: 0,
  total_chapters: 0,
  rating: 0,
  notes: '',
};

const BookForm: React.FC<BookFormProps> = ({ 
  isOpen, 
  onClose, 
  onBookCreated,
  initialBook = null,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialBook) {
        setFormData({
          title: initialBook.title,
          author: initialBook.author || '',
          description: initialBook.description || '',
          status: initialBook.status || 'not_started',
          current_chapter: initialBook.current_chapter || 0,
          total_chapters: initialBook.total_chapters || 0,
          rating: initialBook.rating || 0,
          notes: initialBook.notes || '',
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
  }, [isOpen, isEditMode, initialBook]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'current_chapter' || name === 'total_chapters' || name === 'rating' 
        ? parseInt(value) || 0 
        : value 
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const apiUrl = isEditMode 
      ? `${API_BASE}/api/books/${initialBook?.id}/`
      : `${API_BASE}/api/books/`;
    const apiMethod = isEditMode ? 'put' : 'post';

    try {
      await axios({ method: apiMethod, url: apiUrl, data: formData });

      setSubmitSuccess(true);
      onBookCreated();
      
      if (!isEditMode) {
        setFormData(initialFormData);
      }

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} book:`, err);
      const errorMsg = err instanceof Error ? err.message : 
        `Failed to ${isEditMode ? 'update' : 'create'} book.`;
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    {isEditMode ? 'Edit Book' : 'Create New Book'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Author */}
                  <div>
                    <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                      Author
                    </label>
                    <input
                      type="text"
                      id="author"
                      name="author"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.author}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Chapters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="current_chapter" className="block text-sm font-medium text-gray-700">
                        Current Chapter
                      </label>
                      <input
                        type="number"
                        id="current_chapter"
                        name="current_chapter"
                        min="0"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={formData.current_chapter}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="total_chapters" className="block text-sm font-medium text-gray-700">
                        Total Chapters
                      </label>
                      <input
                        type="number"
                        id="total_chapters"
                        name="total_chapters"
                        min="0"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={formData.total_chapters}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-gray-700">
                      Rating (0-5)
                    </label>
                    <input
                      type="number"
                      id="rating"
                      name="rating"
                      min="0"
                      max="5"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.rating}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Submit/Cancel Area */}
                  <div className="mt-6 space-y-3">
                    {submitSuccess && (
                      <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Book {isEditMode ? 'updated' : 'created'} successfully!
                      </div>
                    )}
                    {submitError && (
                      <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 flex items-center">
                        <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                        {submitError}
                      </div>
                    )}
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
                        {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Book' : 'Create Book')}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default BookForm; 