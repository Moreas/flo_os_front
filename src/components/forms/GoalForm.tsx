import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { fetchWithCSRF } from '../../api/fetchWithCreds';
import API_BASE from '../../apiBase';

interface GoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated: (goal: any) => void;
  initialGoal?: any;
  isEditMode?: boolean;
}

const initialFormData = {
    title: '',
    description: '',
    status: 'planning', // Default status
    target_date: '',
};

const GoalForm: React.FC<GoalFormProps> = ({ 
    isOpen, 
    onClose, 
    onGoalCreated,
    initialGoal = null,
    isEditMode = false 
}) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reset form when modal opens/closes or initial data changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialGoal) {
        // Format target_date for date input (YYYY-MM-DD)
        const formattedDate = initialGoal.target_date 
          ? initialGoal.target_date.split('T')[0] // Take only date part if ISO
          : '';
        setFormData({ ...initialGoal, target_date: formattedDate });
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
  }, [isOpen, isEditMode, initialGoal]);

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

    const apiUrl = isEditMode && initialGoal
      ? `${API_BASE}/api/goals/${initialGoal.id}/`
      : `${API_BASE}/api/goals/`;
    
    const payload: any = { ...formData };
    // Remove optional fields if empty
    if (!payload.description) delete payload.description;
    if (!payload.target_date) delete payload.target_date;
    else {
      // Ensure date is in YYYY-MM-DD format
      payload.target_date = payload.target_date.split('T')[0];
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
          throw new Error(errorData.detail || `Failed to ${isEditMode ? 'update' : 'create'} goal (${response.status})`);
        }
      
      setSubmitSuccess(true);
      const responseData = await response.json();
      onGoalCreated(responseData); // Pass the created/updated goal back
      if (!isEditMode) {
        setFormData(initialFormData);
      }
      setTimeout(() => { onClose(); }, 1500);
    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} goal:`, err);
      const errorMsg = err.message || `Failed to ${isEditMode ? 'update' : 'create'} goal.`;
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
                    {isEditMode ? 'Edit Goal' : 'Create New Goal'}
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
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.title}
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
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="achieved">Achieved</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="target_date" className="block text-sm font-medium text-gray-700">
                      Target Date
                    </label>
                    <input
                      type="date"
                      id="target_date"
                      name="target_date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.target_date}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mt-6 space-y-3">
                    {submitSuccess && (
                      <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Goal {isEditMode ? 'updated' : 'created'}!
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
                        {isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Goal' : 'Create Goal')}
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

export default GoalForm; 