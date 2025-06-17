import React, { Fragment, useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import API_BASE from '../../apiBase';

interface Habit {
  id: number;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  current_streak: number;
  longest_streak: number;
  is_active: boolean;
  reminder_time?: string;
  category?: number;
}

interface HabitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onHabitCreated: () => void;
  initialHabit?: Habit;
  isEditMode?: boolean;
}

const HabitForm: React.FC<HabitFormProps> = ({
  isOpen,
  onClose,
  onHabitCreated,
  initialHabit,
  isEditMode = false
}) => {
  const [formData, setFormData] = useState<Partial<Habit>>({
    name: '',
    description: '',
    frequency: 'daily',
    target_count: 1,
    current_streak: 0,
    longest_streak: 0,
    is_active: true,
    reminder_time: '',
    category: undefined
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      frequency: 'daily',
      target_count: 1,
      current_streak: 0,
      longest_streak: 0,
      is_active: true,
      reminder_time: '',
      category: undefined
    });
    setError(null);
  };

  useEffect(() => {
    if (initialHabit) {
      setFormData(initialHabit);
    } else if (isOpen) {
      resetForm();
    }
  }, [initialHabit, isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const validateReminderTime = (time: string): boolean => {
    if (!time) return true; // Empty time is valid (optional field)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate reminder time format
    if (formData.reminder_time && !validateReminderTime(formData.reminder_time)) {
      setError('Reminder time must be in HH:MM format (e.g., 08:00)');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending habit data:', formData);

      if (isEditMode && initialHabit) {
        await axios.put(`${API_BASE}/api/habits/${initialHabit.id}/`, formData);
      } else {
        const response = await axios.post(`${API_BASE}/api/habits/`, formData);
        console.log('API Response:', response.data);
      }
      onHabitCreated();
      onClose();
    } catch (err: unknown) {
      console.error('Error saving habit:', err);
      if (axios.isAxiosError(err) && err.response) {
        console.error('API Error Response:', err.response.data);
        setError(`Failed to save habit: ${err.response.data.message || err.response.data.detail || 'Please try again.'}`);
      } else {
        setError('Failed to save habit. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
          <div className="fixed inset-0 bg-black bg-opacity-30" />
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
                  <Dialog.Title className="text-lg font-medium text-gray-900">
                    {isEditMode ? 'Edit Habit' : 'Create New Habit'}
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={formData.description || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
                      Frequency *
                    </label>
                    <select
                      id="frequency"
                      name="frequency"
                      required
                      value={formData.frequency}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="target_count" className="block text-sm font-medium text-gray-700">
                      Target Count *
                    </label>
                    <input
                      type="number"
                      id="target_count"
                      name="target_count"
                      required
                      value={formData.target_count}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="current_streak" className="block text-sm font-medium text-gray-700">
                      Current Streak
                    </label>
                    <input
                      type="number"
                      id="current_streak"
                      name="current_streak"
                      value={formData.current_streak}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="longest_streak" className="block text-sm font-medium text-gray-700">
                      Longest Streak
                    </label>
                    <input
                      type="number"
                      id="longest_streak"
                      name="longest_streak"
                      value={formData.longest_streak}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                      Active
                    </label>
                  </div>

                  <div>
                    <label htmlFor="reminder_time" className="block text-sm font-medium text-gray-700">
                      Reminder Time (optional, HH:MM format)
                    </label>
                    <input
                      type="text"
                      id="reminder_time"
                      name="reminder_time"
                      placeholder="08:00"
                      value={formData.reminder_time || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                      Category ID (optional)
                    </label>
                    <input
                      type="number"
                      id="category"
                      name="category"
                      value={formData.category || ''}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
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

export default HabitForm; 