import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

import { fetchWithCSRF } from '../../api/fetchWithCreds';
import API_BASE from '../../apiBase';

interface ToolFormProps {
  isOpen: boolean;
  onClose: () => void;
  onToolCreated: (tool: any) => void;
  initialTool?: any;
  isEditMode?: boolean;
}

const initialFormData = {
    name: '',
    description: '',
    status: 'active', // Default status
    category: '',
    last_used: '',
};

const ToolForm: React.FC<ToolFormProps> = ({ 
    isOpen, 
    onClose, 
    onToolCreated,
    initialTool = null,
    isEditMode = false 
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reset form when modal opens/closes or initial data changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialTool) {
        // Format last_used for date input (YYYY-MM-DD)
        const formattedDate = initialTool.last_used 
          ? initialTool.last_used.split('T')[0] // Take only date part if ISO
          : '';
        setFormData({ ...initialTool, last_used: formattedDate });
      } else {
        setFormData(initialFormData);
      }
    } 
    if (!isOpen) { 
      setTimeout(() => { 
        setSubmitError(null); 
        setSubmitSuccess(false); 
      }, 300) 
    }
  }, [isOpen, isEditMode, initialTool]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const apiUrl = initialTool && initialTool.id
      ? `${API_BASE}/api/tools/${initialTool.id}/`
      : `${API_BASE}/api/tools/`;
    
    const payload: any = { ...formData };
    // Remove optional fields if empty
    if (!payload.description) delete payload.description;
    if (!payload.category) delete payload.category;
    if (!payload.last_used) delete payload.last_used;
    else {
      // Ensure date is in YYYY-MM-DD format
      payload.last_used = payload.last_used.split('T')[0];
    }

          try {
        const response = isEditMode
          ? await fetchWithCSRF(apiUrl, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            })
          : await fetchWithCSRF(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });
            
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to ${isEditMode ? 'update' : 'create'} tool (${response.status})`);
        }
      
      setSubmitSuccess(true);
      const responseData = await response.json();
      onToolCreated(responseData); // Pass the created/updated tool back
      if (!isEditMode) {
        setFormData(initialFormData);
      }
      setTimeout(() => { onClose(); }, 1500);
    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} tool:`, err);
      const errorMsg = err.message || `Failed to ${isEditMode ? 'update' : 'create'} tool.`;
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = useCallback(() => {
    if (!isSubmitting) { onClose(); }
  }, [isSubmitting, onClose]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                    {isEditMode ? 'Edit Tool' : 'Add New Tool'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

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
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="retired">Retired</option>
                      <option value="new">New</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="e.g., Development, Design, Testing"
                    />
                  </div>

                  <div>
                    <label htmlFor="last_used" className="block text-sm font-medium text-gray-700">
                      Last Used
                    </label>
                    <input
                      type="date"
                      id="last_used"
                      name="last_used"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.last_used}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mt-6 space-y-3">
                    {submitSuccess && (
                      <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Tool {isEditMode ? 'updated' : 'created'}!
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
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                        onClick={handleClose}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                      >
                        {isSubmitting && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
                        {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Tool' : 'Create Tool')}
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

export default ToolForm; 