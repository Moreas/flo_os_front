import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/apiConfig';
import { XMarkIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
}

interface CategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (category: Category) => void;
  onCategoryUpdated?: (category: Category) => void;
  initialCategory?: Category | null;
  isEditMode?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
  onCategoryUpdated,
  initialCategory = null,
  isEditMode = false,
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialCategory) {
        setCategoryName(initialCategory.name);
      } else {
        setCategoryName('');
      }
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  }, [isOpen, isEditMode, initialCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setSubmitError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let response;
      
      if (isEditMode && initialCategory) {
        // Update existing category
        response = await apiClient.put(`/api/categories/${initialCategory.id}/`, {
          name: categoryName.trim(),
        });
        
        if (response.status >= 200 && response.status < 300) {
          setSubmitSuccess(true);
          onCategoryUpdated?.(response.data);
          
          setTimeout(() => {
            onClose();
            setSubmitSuccess(false);
          }, 1000);
        } else {
          throw new Error(`Failed to update category (${response.status})`);
        }
      } else {
        // Create new category
        response = await apiClient.post('/api/categories/', {
          name: categoryName.trim(),
        });
        
        if (response.status >= 200 && response.status < 300) {
          setSubmitSuccess(true);
          onCategoryCreated?.(response.data);
          
          setTimeout(() => {
            onClose();
            setSubmitSuccess(false);
          }, 1000);
        } else {
          throw new Error(`Failed to create category (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Error submitting category:', error);
      
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {isEditMode ? 'Edit Category' : 'Add New Category'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="category-name" className="block text-sm font-medium text-gray-700">
                    Category Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="category-name"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Enter category name"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {submitError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{submitError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {submitSuccess && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm text-green-700">
                          Category {isEditMode ? 'updated' : 'created'} successfully!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting || !categoryName.trim()}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                        {isEditMode ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      isEditMode ? 'Update Category' : 'Create Category'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryForm; 