import React, { useState, useCallback } from 'react';
import { PlusIcon, ClockIcon } from '@heroicons/react/24/outline';
import HabitList from '../components/HabitList';
import HabitForm from '../components/forms/HabitForm';
import QuickHabitTracker from '../components/QuickHabitTracker';

const HabitsPage: React.FC = () => {
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleHabitCreated = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Habits</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsHabitFormOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Habit
          </button>
        </div>
      </div>

      {/* Quick Habit Tracker */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ClockIcon className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Quick Track Manual Habits</h2>
        </div>
        <QuickHabitTracker onUpdate={handleHabitCreated} />
      </div>

      <div className="bg-white shadow-sm rounded-lg p-4">
        <HabitList key={refreshKey} />
      </div>

      <HabitForm 
        isOpen={isHabitFormOpen} 
        onClose={() => setIsHabitFormOpen(false)} 
        onHabitCreated={handleHabitCreated}
      />
    </div>
  );
};

export default HabitsPage; 