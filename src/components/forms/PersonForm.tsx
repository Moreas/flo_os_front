import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import API_BASE from '../../apiBase';

interface Person {
  id: number;
  name: string;
  relationship?: string;
  notes?: string;
  appreciation?: string;
  triggers?: string;
  last_interaction?: string;
  tasks?: Array<{
    id: number;
    title: string;
    status: string;
    due_date?: string;
  }>;
  projects?: Array<{
    id: number;
    name: string;
    status: string;
  }>;
  goals?: Array<{
    id: number;
    title: string;
    status: string;
    target_date?: string;
  }>;
  journal_entries?: Array<{
    id: number;
    content: string;
    created_at: string;
    emotion?: string;
  }>;
}

interface PersonFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonCreated: (person: Person) => void;
  initialPerson?: Person;
  isEditMode?: boolean;
}

const PersonForm: React.FC<PersonFormProps> = ({
  isOpen,
  onClose,
  onPersonCreated,
  initialPerson,
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState<Partial<Person>>({
    name: '',
    relationship: '',
    notes: '',
    appreciation: '',
    triggers: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPerson) {
      setFormData({
        name: initialPerson.name,
        relationship: initialPerson.relationship || '',
        notes: initialPerson.notes || '',
        appreciation: initialPerson.appreciation || '',
        triggers: initialPerson.triggers || '',
      });
    }
  }, [initialPerson]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = isEditMode
        ? `${API_BASE}/api/people/${initialPerson?.id}/`
        : `${API_BASE}/api/people/`;
      
      const method = isEditMode ? 'put' : 'post';
      
      const response = await axios[method](url, formData);
      onPersonCreated(response.data);
      onClose();
    } catch (err: unknown) {
      console.error("Error saving person:", err);
      setError("Failed to save person. Please try again.");
    } finally {
      setLoading(false);
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    {isEditMode ? 'Edit Person' : 'Add New Person'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
                      Relationship
                    </label>
                    <input
                      type="text"
                      id="relationship"
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="appreciation" className="block text-sm font-medium text-gray-700">
                      Appreciation
                    </label>
                    <textarea
                      id="appreciation"
                      rows={2}
                      value={formData.appreciation}
                      onChange={(e) => setFormData({ ...formData, appreciation: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="triggers" className="block text-sm font-medium text-gray-700">
                      Triggers
                    </label>
                    <textarea
                      id="triggers"
                      rows={2}
                      value={formData.triggers}
                      onChange={(e) => setFormData({ ...formData, triggers: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Person'}
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

export default PersonForm; 