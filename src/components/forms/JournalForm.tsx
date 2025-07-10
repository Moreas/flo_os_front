import React, { Fragment, useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationCircleIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { apiClient } from '../../api/apiConfig';
import { useRefresh } from '../../contexts/RefreshContext';
import MentionInput from '../ui/MentionInput';
import { JournalEntry } from '../../types/journal';
import { Project } from '../../types/project';

interface JournalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onJournalEntryCreated: () => void;
  initialEntry?: JournalEntry | null;
  isEditMode?: boolean;
  onJournalEntryUpdated?: (updatedEntry: JournalEntry) => void;
}

interface FormData {
  content: string;
  emotion: string;
  tags: string;
  project_id?: number | null;
}

const initialFormData: FormData = {
  content: '',
  emotion: '',
  tags: '',
  project_id: null,
};

// Define emotions and their corresponding emojis
const emotionsMap: { [key: string]: string } = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  surprised: '😮',
  calm: '😌',
  anxious: '😟',
  excited: '🤩',
  tired: '😴',
  confused: '😕',
};

const JournalForm: React.FC<JournalFormProps> = ({
  isOpen,
  onClose,
  onJournalEntryCreated,
  initialEntry = null,
  isEditMode = false,
  onJournalEntryUpdated,
}) => {
  const { refreshJournal } = useRefresh();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (initialEntry && isEditMode) {
      setFormData({
        content: initialEntry.content || '',
        emotion: initialEntry.emotion || '',
        tags: initialEntry.tags || '',
        project_id: initialEntry.project?.id || null,
      });
    } else if (isOpen) {
      setFormData(initialFormData);
    }
  }, [isOpen, initialEntry, isEditMode]);

  useEffect(() => {
    if (isOpen) {
      const fetchProjects = async () => {
        try {
          const response = await apiClient.get('/api/projects/');
          setProjects(response.data);
        } catch (error) {
          console.error('Error fetching projects:', error);
        }
      };
      fetchProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSubmitError(null);
        setSubmitSuccess(false);
      }, 300);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'project_id' ? (value ? parseInt(value) : null) : value 
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  // Handler for selecting an emotion emoji
  const handleEmotionSelect = (emotionName: string) => {
    setFormData(prev => ({
        ...prev,
        // Toggle selection: if clicking the same one, clear it; otherwise, set it.
        emotion: prev.emotion === emotionName ? '' : emotionName 
    }));
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const payload = {
      content: formData.content,
      emotion: formData.emotion,
      tags: formData.tags,
      project_id: formData.project_id,
    };

    try {
      let response;
      if (initialEntry?.id && isEditMode) {
        response = await apiClient.patch(`/api/journal_entries/${initialEntry.id}/`, payload);
      } else {
        response = await apiClient.post('/api/journal_entries/', payload);
      }
      
      if (response.status >= 200 && response.status < 300) {
        setSubmitSuccess(true);
        if (isEditMode && onJournalEntryUpdated) onJournalEntryUpdated(response.data);
        else onJournalEntryCreated();
        refreshJournal();
        setTimeout(() => onClose(), 1500);
      } else {
        throw new Error(`Failed to ${isEditMode ? 'update' : 'create'} journal entry (${response.status})`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error 
        ? err.message 
        : `Failed to ${isEditMode ? 'update' : 'create'} journal entry.`;
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Create New Journal Entry
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
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <MentionInput
                      value={formData.content}
                      onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                      placeholder="Type @ to mention someone..."
                      rows={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emotion (Optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(emotionsMap).map(([name, emoji]) => (
                        <button
                          key={name}
                          type="button" // Important: prevent form submission
                          onClick={() => handleEmotionSelect(name)}
                          className={`p-2 rounded-full text-2xl transition-transform duration-100 ease-in-out ${ 
                            formData.emotion === name 
                              ? 'bg-primary-100 ring-2 ring-primary-500 scale-110' // Highlight selected
                              : 'bg-gray-100 hover:bg-gray-200 hover:scale-105' // Default style
                          }`}
                          title={name.charAt(0).toUpperCase() + name.slice(1)} // Capitalize name for tooltip
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                      Tags (Optional, comma-separated)
                    </label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="e.g., work, project-alpha, idea"
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
                      value={formData.project_id || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">No project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-6 space-y-3">
                    {submitSuccess && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200 flex items-center"><CheckCircleIcon className="h-5 w-5 mr-2" />Entry created!</div>}
                    {submitError && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200 flex items-center"><ExclamationCircleIcon className="h-5 w-5 mr-2" />{submitError}</div>}
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
                        {isSubmitting ? 'Saving...' : 'Save Entry'}
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

export default JournalForm; 