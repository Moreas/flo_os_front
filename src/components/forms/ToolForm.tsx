import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../api/apiConfig';
import { Tool } from '../../types/tool';
import { Project } from '../../types/project';

interface ToolFormProps {
  isOpen: boolean;
  onClose: () => void;
  onToolCreated: (tool: Tool) => void;
  initialTool?: Tool | null;
  isEditMode?: boolean;
}

interface ToolFormData {
  name: string;
  description: string;
  status: 'active' | 'paused' | 'retired' | 'planned';
  tool_type: 'software' | 'outsourcing' | 'other';
  url_or_path: string;
  related_project_id: string;
  is_internal: boolean;
  pending_review: boolean;
}

const initialFormData: ToolFormData = {
  name: '',
  description: '',
  status: 'active',
  tool_type: 'other',
  url_or_path: '',
  related_project_id: '',
  is_internal: false,
  pending_review: false,
};

const ToolForm: React.FC<ToolFormProps> = ({ 
    isOpen, 
    onClose, 
    onToolCreated,
    initialTool = null,
    isEditMode = false 
}) => {
  const [formData, setFormData] = useState<ToolFormData>(initialFormData);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Fetch projects for the dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      if (!isOpen) return;
      setIsLoadingProjects(true);
      try {
        const response = await apiClient.get('/api/projects/');
        setProjects(response.data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [isOpen]);

  // Reset form when modal opens/closes or initial data changes
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialTool) {
        setFormData({
          name: initialTool.name || '',
          description: initialTool.description || '',
          status: initialTool.status || 'active',
          tool_type: initialTool.tool_type || 'other',
          url_or_path: initialTool.url_or_path || '',
          related_project_id: initialTool.related_project?.id?.toString() || '',
          is_internal: initialTool.is_internal || false,
          pending_review: initialTool.pending_review || false,
        });
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
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    const payload: any = { 
      name: formData.name,
      description: formData.description || '',
      status: formData.status,
      tool_type: formData.tool_type,
      url_or_path: formData.url_or_path || '',
      is_internal: formData.is_internal,
      pending_review: formData.pending_review,
    };

    // Only include related_project if a project is selected
    if (formData.related_project_id) {
      payload.related_project = parseInt(formData.related_project_id);
    } else {
      payload.related_project = null;
    }

    try {
      let response;
      if (isEditMode && initialTool?.id) {
        response = await apiClient.patch(`/api/tools/${initialTool.id}/`, payload);
      } else {
        response = await apiClient.post('/api/tools/', payload);
      }
      
      if (response.status >= 200 && response.status < 300) {
        setSubmitSuccess(true);
        onToolCreated(response.data);
        if (!isEditMode) {
          setFormData(initialFormData);
        }
        setTimeout(() => { onClose(); }, 1500);
      } else {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} tool (${response.status})`);
      }
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
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
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
                      <option value="paused">Paused</option>
                      <option value="retired">Retired</option>
                      <option value="planned">Planned</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tool_type" className="block text-sm font-medium text-gray-700">
                      Tool Type
                    </label>
                    <select
                      id="tool_type"
                      name="tool_type"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.tool_type}
                      onChange={handleInputChange}
                    >
                      <option value="software">Software</option>
                      <option value="outsourcing">Outsourcing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="url_or_path" className="block text-sm font-medium text-gray-700">
                      URL or Path
                    </label>
                    <input
                      type="text"
                      id="url_or_path"
                      name="url_or_path"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.url_or_path}
                      onChange={handleInputChange}
                      placeholder="e.g., https://example.com or /path/to/tool"
                    />
                  </div>

                  <div>
                    <label htmlFor="related_project_id" className="block text-sm font-medium text-gray-700">
                      Related Project
                    </label>
                    <select
                      id="related_project_id"
                      name="related_project_id"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.related_project_id}
                      onChange={handleInputChange}
                      disabled={isLoadingProjects}
                    >
                      <option value="">Select a project (optional)</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_internal"
                        name="is_internal"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={formData.is_internal}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="is_internal" className="ml-2 block text-sm text-gray-700">
                        Internal Tool
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="pending_review"
                        name="pending_review"
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        checked={formData.pending_review}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="pending_review" className="ml-2 block text-sm text-gray-700">
                        Pending Review
                      </label>
                    </div>
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