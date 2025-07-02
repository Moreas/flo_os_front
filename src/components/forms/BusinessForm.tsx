import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../api/apiConfig';

interface BusinessFormProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessCreated: () => void; // Callback for success
  // Add initialBusinessData and isEditMode later for editing
}

const initialFormData = {
    name: '',
    description: '',
};

const BusinessForm: React.FC<BusinessFormProps> = ({ 
    isOpen, 
    onClose, 
    onBusinessCreated 
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
        // Reset to initial state when opening for creation
        setFormData(initialFormData);
    } 
    // Clear errors/success on close regardless of mode
    if (!isOpen) {
        setTimeout(() => { // Delay to allow fade-out
           setSubmitError(null);
           setSubmitSuccess(false); 
        }, 300)
    }
    
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    try {
      const response = await apiClient.post('/api/businesses/', formData);
      
      if (response.status >= 200 && response.status < 300) {
        setSubmitSuccess(true);
        onBusinessCreated();
        setFormData(initialFormData); // Clear form
        setTimeout(() => { onClose(); }, 1500);
      } else {
        throw new Error(`Failed to create business (${response.status})`);
      }
    } catch (err: any) {
      console.error(`Error creating business:`, err);
      const errorMsg = err.message || `Failed to create business.`;
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = useCallback(() => {
      if (!isSubmitting) {
          onClose();
      }
  }, [isSubmitting, onClose]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child /* Backdrop */
            as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0"
            enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child /* Panel */
                as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                     Create New Business
                  </Dialog.Title>
                  <button type="button" className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
                    onClick={handleClose} disabled={isSubmitting}>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
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

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description (Optional)
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

                  {/* Submit/Cancel Area */}
                  <div className="mt-6 space-y-3">
                        {submitSuccess && (
                            <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 flex items-center">
                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                Business created!
                            </div>
                        )}
                        {submitError && (
                            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 flex items-center">
                                <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                                {submitError}
                            </div>
                        )}
                        <div className="flex justify-end space-x-3">
                          <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                            onClick={handleClose} disabled={isSubmitting}> Cancel </button>
                          <button type="submit" className="inline-flex justify-center items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}> 
                            {isSubmitting && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
                            {isSubmitting ? 'Creating...' : 'Create Business'}
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

export default BusinessForm; 