import { apiClient } from '../api/apiConfig';
import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Habit } from '../types/habit';
import HabitForm from './forms/HabitForm';
import HabitTracker from './HabitTracker';

const HabitList: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/api/habits/');
      
      if (response.status >= 200 && response.status < 300) {
        setHabits(response.data);
      } else {
        throw new Error(`Failed to fetch habits (${response.status})`);
      }
    } catch (err: unknown) {
      console.error('Error fetching habits:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load habits';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, [refreshKey]);

  const handleHabitCreated = () => {
    setIsFormOpen(false);
    setEditingHabit(undefined);
    setRefreshKey(prev => prev + 1); // Trigger refresh
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingHabit(undefined);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-600">Loading habits...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">My Habits</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Habit
        </button>
      </div>

      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {habits.length === 0 && !error && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No habits found. Create your first habit!</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {habits.map((habit) => (
          <HabitTracker 
            key={habit.id} 
            habitId={habit.id} 
            onUpdate={() => setRefreshKey(prev => prev + 1)}
          />
        ))}
      </div>

      <HabitForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onHabitCreated={handleHabitCreated}
        initialHabit={editingHabit}
        isEditMode={!!editingHabit}
      />
    </div>
  );
};

export default HabitList; 