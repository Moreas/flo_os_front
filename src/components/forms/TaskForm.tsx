import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import MentionInput from '../ui/MentionInput';
import API_BASE from '../../apiBase';
import { useRefresh } from '../../contexts/RefreshContext';

interface Category {
  id: number;
  name: string;
}
interface Project {
  id: number;
  name: string;
}
interface Business {
  id: number;
  name: string;
}
interface Task {
  id: number;
  description: string;
  is_done: boolean;
  due?: string | null;
  created_at: string;
  business?: Business | null;
  project?: Project | null;
  categories: Category[];
}

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  onTaskUpdated?: (updatedTask: Task) => void;
  initialTaskData?: Task | null;
  isEditMode?: boolean;
}

const formatDateInput = (isoString?: string | null): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}`;
  } catch (e) {
    console.error("Error formatting date for input:", e);
    return '';
  }
};

const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  onTaskUpdated,
  initialTaskData = null,
  isEditMode = false,
}) => {
  const { refreshTasks } = useRefresh();
  const [formData, setFormData] = useState({
    description: '',
    dueDate: '',
    projectId: '',
    businessId: '',
    selectedCategories: [] as number[],
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;
      setIsLoadingData(true);
      setFetchError(null);
      try {
        const [catRes, projRes, bizRes] = await Promise.all([
          axios.get(`${API_BASE}/api/categories/`),
          axios.get(`${API_BASE}/api/projects/`),
          axios.get(`${API_BASE}/api/businesses/`),
        ]);
        setCategories(catRes.data || []);
        setProjects(projRes.data || []);
        setBusinesses(bizRes.data || []);
      } catch (err) {
        console.error("Error fetching form data:", err);
        setFetchError("Failed to load projects, categories, or businesses. Please try again.");
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, [isOpen]);

  useEffect(() => {
    if (isEditMode && initialTaskData && isOpen) {
      setFormData({
        description: initialTaskData.description || '',
        dueDate: formatDateInput(initialTaskData.due),
        projectId: initialTaskData.project?.id?.toString() || '',
        businessId: initialTaskData.business?.id?.toString() || '',
        selectedCategories: initialTaskData.categories.map(cat => cat.id) || [],
      });
    } else if (!isEditMode && isOpen) {
      setFormData({
        description: '',
        dueDate: '',
        projectId: '',
        businessId: '',
        selectedCategories: [],
      });
    }
  }, [isEditMode, initialTaskData, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setFormData({
          description: '',
          dueDate: '',
          projectId: '',
          businessId: '',
          selectedCategories: [],
        });
        setSubmitError(null);
        setSubmitSuccess(false);
      }, 300);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const categoryId = parseInt(e.target.value);
    const isChecked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      selectedCategories: isChecked ? [...prev.selectedCategories, categoryId] : prev.selectedCategories.filter(id => id !== categoryId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    let dueDatePayload: string | null = null;
    if (formData.dueDate) {
      try {
        const [year, month, day] = formData.dueDate.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (!isNaN(date.getTime())) dueDatePayload = date.toISOString();
      } catch (err) {
        console.error("Error parsing due date input:", err);
      }
    }

    const payload = {
      description: formData.description,
      ...(dueDatePayload && { due: dueDatePayload }),
      ...(formData.projectId ? { project_id: parseInt(formData.projectId) } : { project_id: null }),
      ...(formData.businessId ? { business_id: parseInt(formData.businessId) } : { business_id: null }),
      category_ids: formData.selectedCategories,
    };

    const apiUrl = initialTaskData && initialTaskData.id
      ? `${API_BASE}/api/tasks/${initialTaskData.id}/`
      : `${API_BASE}/api/tasks/`;
    const apiMethod = isEditMode ? 'patch' : 'post';

    try {
      const response = await axios({ method: apiMethod, url: apiUrl, data: payload });
      setSubmitSuccess(true);
      if (isEditMode && onTaskUpdated) onTaskUpdated(response.data);
      else onTaskCreated();
      refreshTasks();
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || JSON.stringify(err.response?.data) || `Failed to ${isEditMode ? 'update' : 'create'} task.`;
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isSubmitting) onClose();
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    {isEditMode ? 'Edit Task' : 'Create New Task'}
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

                {fetchError && (
                    <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 flex items-center">
                        <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                        {fetchError}
                    </div>
                )}

                {isLoadingData ? (
                    <div className="flex items-center justify-center h-40">
                        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <MentionInput
                        value={formData.description}
                        onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                        placeholder="Type @ to mention someone..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                        Due Date (Optional)
                      </label>
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={formData.dueDate}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
                            Project (Optional)
                          </label>
                          <select
                            id="projectId"
                            name="projectId"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            value={formData.projectId}
                            onChange={handleInputChange}
                          >
                            <option value="">No Project</option>
                            {projects.map((proj) => (
                              <option key={proj.id} value={proj.id}>
                                {proj.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="businessId" className="block text-sm font-medium text-gray-700">
                            Business (Optional)
                          </label>
                          <select
                            id="businessId"
                            name="businessId"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            value={formData.businessId}
                            onChange={handleInputChange}
                          >
                            <option value="">No Business</option>
                            {businesses.map((biz) => (
                              <option key={biz.id} value={biz.id}>
                                {biz.name}
                              </option>
                            ))}
                          </select>
                        </div>
                    </div>

                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                           Categories (Optional)
                       </label>
                       <div className="mt-1 space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                           {categories.length > 0 ? categories.map((category) => (
                               <div key={category.id} className="flex items-center">
                                   <input
                                       id={`category-${category.id}`}
                                       name="categories"
                                       type="checkbox"
                                       value={category.id}
                                       checked={formData.selectedCategories.includes(category.id)}
                                       onChange={handleCategoryChange}
                                       className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                   />
                                   <label htmlFor={`category-${category.id}`} className="ml-2 block text-sm text-gray-900">
                                       {category.name}
                                   </label>
                               </div>
                           )) : (
                               <p className="text-sm text-gray-500">No categories available.</p>
                           )}
                       </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        {submitSuccess && (
                            <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 flex items-center">
                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                {isEditMode ? 'Task updated successfully!' : 'Task created successfully!'}
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
                            disabled={isSubmitting || isLoadingData || fetchError !== null}
                          >
                            {isSubmitting && <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />}
                            {isSubmitting 
                                ? (isEditMode ? 'Updating...' : 'Creating...') 
                                : (isEditMode ? 'Update Task' : 'Create Task')}
                          </button>
                        </div>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TaskForm; 