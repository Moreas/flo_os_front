import React, { useState, useCallback } from 'react';
import GoalList from '../components/GoalList';
import GoalForm from '../components/forms/GoalForm'; // Assuming this exists
import { PlusIcon } from '@heroicons/react/24/outline';

const GoalsPage: React.FC = () => {
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  const handleGoalCreated = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1); 
    // We might need to adapt GoalForm to accept onGoalCreated 
    // and call it on successful POST, similar to other forms.
    // Also, GoalForm might need updating to POST to /api/goals/.
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
        <button
          onClick={() => setIsGoalFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Goal
        </button>
      </div>

       <div className="bg-white shadow-sm rounded-lg p-4">
         <GoalList key={refreshKey} /> 
       </div>

      <GoalForm 
        isOpen={isGoalFormOpen} 
        onClose={() => setIsGoalFormOpen(false)} 
        // Ensure GoalForm accepts and uses this callback
        onGoalCreated={handleGoalCreated} 
      />
    </div>
  );
};

export default GoalsPage; 