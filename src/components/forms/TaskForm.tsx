import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { fetchWithCSRF } from '../../api/fetchWithCreds';
import MentionInput from '../ui/MentionInput';
import API_BASE from '../../apiBase';
import { useRefresh } from '../../contexts/RefreshContext';
import { Task } from '../../types/task';
import { Category } from '../../types/category';
import { Project } from '../../types/project';
import { Business } from '../../types/business';
import { Person } from '../../types/person';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  onTaskUpdated?: (updatedTask: Task) => void;
  initialTaskData?: Task | null;
  isEditMode?: boolean;
}

interface TaskFormData {
  description: string;
  due_date: string;
  importance: 'could_do' | 'should_do' | 'must_do';
  is_urgent: boolean;
  project_id: string;
  business_id: string;
  category_ids: number[];
  responsible_ids: number[];
  impacted_ids: number[];
}

const TaskForm: React.FC<TaskFormProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  onTaskUpdated,
  initialTaskData = null,
  isEditMode = false,
}) => {
  const { refreshTasks } = useRefresh();
  const [formData, setFormData] = useState<TaskFormData>({
    description: '',
    due_date: '',
    importance: 'should_do',
    is_urgent: false,
    project_id: '',
    business_id: '',
    category_ids: [],
    responsible_ids: [],
    impacted_ids: [],
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
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
        const [catRes, projRes, bizRes, peopleRes] = await Promise.all([
          axios.get(`${API_BASE}/api/categories/`),
          axios.get(`${API_BASE}/api/projects/`),
          axios.get(`${API_BASE}/api/businesses/`),
          axios.get(`${API_BASE}/api/people/`),
        ]);
        setCategories(catRes.data || []);
        setProjects(projRes.data || []);
        setBusinesses(bizRes.data || []);
        setPeople(peopleRes.data || []);
      } catch (err) {
        console.error("Error fetching form data:", err);
        setFetchError("Failed to load form data. Please try again.");
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
        due_date: initialTaskData.due_date || '',
        importance: initialTaskData.importance || 'should_do',
        is_urgent: initialTaskData.is_urgent || false,
        project_id: initialTaskData.project?.id?.toString() || '',
        business_id: initialTaskData.business?.id?.toString() || '',
        category_ids: initialTaskData.categories.map(cat => cat.id) || [],
        responsible_ids: initialTaskData.responsible.map(p => p.id) || [],
        impacted_ids: initialTaskData.impacted.map(p => p.id) || [],
      });
    } else if (!isEditMode && isOpen) {
      setFormData({
        description: '',
        due_date: '',
        importance: 'should_do',
        is_urgent: false,
        project_id: '',
        business_id: '',
        category_ids: [],
        responsible_ids: [],
        impacted_ids: [],
      });
    }
  }, [isEditMode, initialTaskData, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'category_ids' | 'responsible_ids' | 'impacted_ids') => {
    const id = parseInt(e.target.value);
    const isChecked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      [field]: isChecked 
        ? [...prev[field], id]
        : prev[field].filter(existingId => existingId !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const payload = {
      description: formData.description,
      due_date: formData.due_date || null,
      importance: formData.importance,
      is_urgent: formData.is_urgent,
      project_id: formData.project_id ? parseInt(formData.project_id) : null,
      business_id: formData.business_id ? parseInt(formData.business_id) : null,
      category_ids: formData.category_ids,
      responsible_ids: formData.responsible_ids,
      impacted_ids: formData.impacted_ids,
    };

    const apiUrl = initialTaskData?.id
      ? `${API_BASE}/api/tasks/${initialTaskData.id}/`
      : `${API_BASE}/api/tasks/`;
    const apiMethod = isEditMode ? 'patch' : 'post';

    try {
      const response = await fetchWithCSRF(apiUrl, {
        method: apiMethod.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to ${isEditMode ? 'update' : 'create'} task (${response.status})`);
      }
      
      const responseData = await response.json();
      setSubmitSuccess(true);
      if (isEditMode && onTaskUpdated) onTaskUpdated(responseData);
      else onTaskCreated();
      refreshTasks();
      setTimeout(() => onClose(), 1500);
    } catch (err: unknown) {
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} task. Please try again.`;
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setSubmitError(errorMessage);
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
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
                        Description *
                      </label>
                      <MentionInput
                        value={formData.description}
                        onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                        placeholder="Type @ to mention someone..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label htmlFor="importance" className="block text-sm font-medium text-gray-700">
                        Importance *
                      </label>
                      <select
                        id="importance"
                        name="importance"
                        required
                        value={formData.importance}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="could_do">Could Do</option>
                        <option value="should_do">Should Do</option>
                        <option value="must_do">Must Do</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_urgent"
                        name="is_urgent"
                        checked={formData.is_urgent}
                        onChange={handleInputChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="is_urgent" className="ml-2 block text-sm text-gray-700">
                        Urgent
                      </label>
                    </div>

                    <div>
                      <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                        Due Date (Optional)
                      </label>
                      <input
                        type="date"
                        id="due_date"
                        name="due_date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={formData.due_date}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                        Project (Optional)
                      </label>
                      <select
                        id="project_id"
                        name="project_id"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={formData.project_id}
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
                      <label htmlFor="business_id" className="block text-sm font-medium text-gray-700">
                        Business (Optional)
                      </label>
                      <select
                        id="business_id"
                        name="business_id"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={formData.business_id}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categories (Optional)
                      </label>
                      <div className="mt-1 space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                        {categories.map((category) => (
                          <div key={category.id} className="flex items-center">
                            <input
                              id={`category-${category.id}`}
                              name="categories"
                              type="checkbox"
                              value={category.id}
                              checked={formData.category_ids.includes(category.id)}
                              onChange={(e) => handleMultiSelectChange(e, 'category_ids')}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor={`category-${category.id}`} className="ml-2 block text-sm text-gray-900">
                              {category.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Responsible People (Optional)
                      </label>
                      <div className="mt-1 space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                        {people.map((person) => (
                          <div key={person.id} className="flex items-center">
                            <input
                              id={`responsible-${person.id}`}
                              name="responsible"
                              type="checkbox"
                              value={person.id}
                              checked={formData.responsible_ids.includes(person.id)}
                              onChange={(e) => handleMultiSelectChange(e, 'responsible_ids')}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor={`responsible-${person.id}`} className="ml-2 block text-sm text-gray-900">
                              {person.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Impacted People (Optional)
                      </label>
                      <div className="mt-1 space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                        {people.map((person) => (
                          <div key={person.id} className="flex items-center">
                            <input
                              id={`impacted-${person.id}`}
                              name="impacted"
                              type="checkbox"
                              value={person.id}
                              checked={formData.impacted_ids.includes(person.id)}
                              onChange={(e) => handleMultiSelectChange(e, 'impacted_ids')}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor={`impacted-${person.id}`} className="ml-2 block text-sm text-gray-900">
                              {person.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

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

                    <div className="mt-6 flex justify-end space-x-3">
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