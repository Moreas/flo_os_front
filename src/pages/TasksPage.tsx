import React, { useState, useCallback } from 'react';
import TaskList from '../components/TaskList';
import TaskForm from '../components/forms/TaskForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useTaskRefresh } from '../contexts/TaskRefreshContext';

const TasksPage: React.FC = () => {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const { refreshKey, refreshTasks } = useTaskRefresh();

  const handleTaskCreated = useCallback(() => {
    refreshTasks();
  }, [refreshTasks]);

  const handleTaskUpdated = useCallback(() => {
    refreshTasks();
  }, [refreshTasks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <button
          onClick={() => setIsTaskFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Task
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-4">
         <TaskList key={refreshKey} /> 
      </div>

      <TaskForm 
        isOpen={isTaskFormOpen} 
        onClose={() => setIsTaskFormOpen(false)} 
        onTaskCreated={handleTaskCreated} 
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default TasksPage; 