import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import API_BASE from '../../apiBase';

interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialProject?: any;
  isEditMode?: boolean;
  onProjectUpdated?: () => void;
}

interface Category {
  id: number;
  name: string;
  description: string;
  color?: string;
  icon?: string;
}

// Added Business interface
interface Business {
  id: number;
  name: string;
}

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
  const day = today.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ProjectForm: React.FC<ProjectFormProps> = ({ isOpen, onClose, initialProject = null, isEditMode = false, onProjectUpdated }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]); // State for businesses
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(false); // Loading state for businesses
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [businessError, setBusinessError] = useState<string | null>(null); // Error state for businesses

  // Form State
  const [projectName, setProjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBusiness, setSelectedBusiness] = useState<string>(''); // State for selected business
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState<string | undefined>(undefined); // Optional
  const [status, setStatus] = useState('active'); // Default status changed to 'active'
  const [priority, setPriority] = useState('medium'); // Default priority
  const [tags, setTags] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingCategories(true);
      setIsLoadingBusinesses(true);
      setCategoryError(null);
      setBusinessError(null);
      try {
        const [catResponse, bizResponse] = await Promise.all([
          axios.get(`${API_BASE}/api/categories/`).catch(err => {
            console.error('Error fetching categories:', err);
            setCategoryError('Failed to load categories. Select later if needed.');
            return { data: [] };
          }),
          axios.get(`${API_BASE}/api/businesses/`).catch(err => {
            console.error('Error fetching businesses:', err);
            setBusinessError('Failed to load businesses. Select later if needed.');
            return { data: [] };
          })
        ]);
        setCategories(catResponse.data);
        setBusinesses(bizResponse.data);
      } catch (err) {
        console.error('Error fetching form data:', err);
      } finally {
        setIsLoadingCategories(false);
        setIsLoadingBusinesses(false);
      }
    };
    if (isOpen) {
      fetchData();
      if (isEditMode && initialProject) {
        setProjectName(initialProject.name || '');
        setSelectedCategory(initialProject.categories?.[0]?.id?.toString() || '');
        setSelectedBusiness(initialProject.business?.id?.toString() || '');
        setDescription(initialProject.description || '');
        setStartDate(initialProject.start_date ? initialProject.start_date.split('T')[0] : getTodayDateString());
        setEndDate(initialProject.end_date ? initialProject.end_date.split('T')[0] : undefined);
        setStatus(initialProject.status || 'active');
        setPriority(initialProject.priority || 'medium');
        setTags(initialProject.tags ? initialProject.tags.join(', ') : '');
      } else {
        setProjectName('');
        setSelectedCategory('');
        setSelectedBusiness('');
        setDescription('');
        setStartDate(getTodayDateString());
        setEndDate(undefined);
        setStatus('active');
        setPriority('medium');
        setTags('');
      }
      setIsSubmitting(false);
      setSubmitError(null);
    }
  }, [isOpen, isEditMode, initialProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    if (!projectName || !startDate) {
      setSubmitError('Project Name and Start Date are required.');
      setIsSubmitting(false);
      return;
    }
    const projectData = {
      name: projectName,
      description: description || null,
      start_date: startDate,
      end_date: endDate || null,
      status: status,
      priority: priority,
      categories: selectedCategory ? [parseInt(selectedCategory)] : [],
      business_id: selectedBusiness ? parseInt(selectedBusiness) : null,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    };
    try {
      if (isEditMode && initialProject) {
        await axios.put(`${API_BASE}/api/projects/${initialProject.id}/`, projectData);
        if (onProjectUpdated) onProjectUpdated();
      } else {
        await axios.post(`${API_BASE}/api/projects/`, projectData);
        onClose();
      }
    } catch (err: any) {
      let errorMsg = 'Failed to save project. Please try again.';
      if (err.response?.data) {
        const errors = err.response.data;
        const details = Object.entries(errors).map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`).join('; ');
        if (details) errorMsg = details;
      }
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
                    {isEditMode ? 'Edit Project' : 'Create New Project'}
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
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      id="title"
                      name="title"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <div className="mt-1">
                      {isLoadingCategories ? (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          <span>Loading categories...</span>
                        </div>
                      ) : (
                        <>
                          <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            id="category"
                            name="category"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            defaultValue=""
                          >
                            <option value="" disabled>Select a category</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id.toString()}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                          {categoryError && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                              {categoryError}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="business" className="block text-sm font-medium text-gray-700">
                      Business (Optional)
                    </label>
                    <div className="mt-1">
                      {isLoadingBusinesses ? (
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          <span>Loading businesses...</span>
                        </div>
                      ) : (
                        <>
                          <select
                            value={selectedBusiness} // Bind value
                            onChange={(e) => setSelectedBusiness(e.target.value)} // Add onChange
                            id="business"
                            name="business"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                            defaultValue=""
                          >
                            <option value="">None</option> {/* Option for no business */}
                            {businesses.map((business) => (
                              <option key={business.id} value={business.id.toString()}> 
                                {business.name}
                              </option>
                            ))}
                          </select>
                          {businessError && (
                            <p className="mt-1 text-sm text-red-600 flex items-center">
                              <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                              {businessError}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      id="description"
                      name="description"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        id="startDate"
                        name="startDate"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate || ''}
                        onChange={(e) => setEndDate(e.target.value || undefined)}
                        id="endDate"
                        name="endDate"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      id="status"
                      name="status"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      id="priority"
                      name="priority"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      id="tags"
                      name="tags"
                      placeholder="Separate tags with commas"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  {/* Submission Error Display */}
                  {submitError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <div className="flex items-center">
                              <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                              <span className="text-sm text-red-700">{submitError}</span>
                          </div>
                      </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Project'}
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

export default ProjectForm; 