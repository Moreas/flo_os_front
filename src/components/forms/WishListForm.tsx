import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../api/apiConfig';
import { WishListItem } from '../../types/wishlist';

interface WishListFormProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated: () => void;
  initialItem?: WishListItem | null;
  isEditMode?: boolean;
}

const initialFormData: Omit<WishListItem, 'id' | 'created_at' | 'updated_at'> = {
  title: '',
  cost: 0,
  comment: '',
  priority: 'medium',
  category_id: undefined,
  is_purchased: false,
  url: '',
};

const WishListForm: React.FC<WishListFormProps> = ({ 
  isOpen, 
  onClose, 
  onItemCreated,
  initialItem = null,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    // Fetch categories for dropdown
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/api/categories/');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialItem) {
        setFormData({
          title: initialItem.title,
          cost: initialItem.cost,
          comment: initialItem.comment || '',
          priority: initialItem.priority,
          category_id: initialItem.category?.id,
          is_purchased: initialItem.is_purchased,
          url: initialItem.url || '',
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
  }, [isOpen, isEditMode, initialItem]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 :
              type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              value 
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
      if (isEditMode) {
        const response = await apiClient.put(`/api/wishlist/${initialItem?.id}/`, formData);
        if (response.status >= 200 && response.status < 300) {
          setSubmitSuccess(true);
          onItemCreated();
          setTimeout(() => { onClose(); }, 1500);
        } else {
          throw new Error(`Failed to update wish list item (${response.status})`);
        }
      } else {
        const response = await apiClient.post('/api/wishlist/', formData);
        if (response.status >= 200 && response.status < 300) {
          setSubmitSuccess(true);
          onItemCreated();
          setFormData(initialFormData);
          setTimeout(() => { onClose(); }, 1500);
        } else {
          throw new Error(`Failed to create wish list item (${response.status})`);
        }
      }
    } catch (err: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} wish list item:`, err);
      const errorMsg = err instanceof Error ? err.message : 
        `Failed to ${isEditMode ? 'update' : 'create'} wish list item.`;
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
                    {isEditMode ? 'Edit Wish List Item' : 'Add to Wish List'}
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
                      placeholder="e.g., MacBook Pro, Standing Desk"
                    />
                  </div>

                  {/* Cost */}
                  <div>
                    <label htmlFor="cost" className="block text-sm font-medium text-gray-700">
                      Cost *
                    </label>
                    <input
                      type="number"
                      id="cost"
                      name="cost"
                      step="0.01"
                      min="0"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.cost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.priority}
                      onChange={handleInputChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      id="category_id"
                      name="category_id"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.category_id || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">No Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* URL */}
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                      URL
                    </label>
                    <input
                      type="url"
                      id="url"
                      name="url"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.url}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Comment */}
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.comment}
                      onChange={handleInputChange}
                      placeholder="Any additional notes or details..."
                    />
                  </div>

                  {/* Purchase Status (only in edit mode) */}
                  {isEditMode && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_purchased"
                        name="is_purchased"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={formData.is_purchased}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="is_purchased" className="ml-2 block text-sm text-gray-900">
                        Mark as purchased
                      </label>
                    </div>
                  )}

                  {/* Error/Success Messages */}
                  {submitError && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <ExclamationCircleIcon className="h-5 w-5" />
                      <span className="text-sm">{submitError}</span>
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircleIcon className="h-5 w-5" />
                      <span className="text-sm">
                        {isEditMode ? 'Item updated successfully!' : 'Item added to wish list!'}
                      </span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting || submitSuccess}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                          {isEditMode ? 'Updating...' : 'Adding...'}
                        </>
                      ) : submitSuccess ? (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Success!
                        </>
                      ) : (
                        isEditMode ? 'Update Item' : 'Add to Wish List'
                      )}
                    </button>
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

export default WishListForm; 