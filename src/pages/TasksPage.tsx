import React, { useState, useCallback, useEffect } from 'react';
import TaskList from '../components/TaskList';
import TaskForm from '../components/forms/TaskForm';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useTaskRefresh } from '../contexts/TaskRefreshContext';
import CompletedTasksChart from '../components/CompletedTasksChart';
import { apiClient } from '../api/apiConfig';
import { format, parseISO } from 'date-fns';

interface CompletedTask {
  id: number;
  description: string;
  completion_date?: string | null;
}

const TasksPage: React.FC = () => {
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const { refreshKey, refreshTasks } = useTaskRefresh();
  const [completedPage, setCompletedPage] = useState(1);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [completedHasMore, setCompletedHasMore] = useState(true);

  const handleTaskCreated = useCallback(() => {
    refreshTasks();
  }, [refreshTasks]);

  const handleTaskUpdated = useCallback(() => {
    refreshTasks();
  }, [refreshTasks]);

  // Fetch completed tasks (paginated)
  useEffect(() => {
    const fetchCompleted = async () => {
      setCompletedLoading(true);
      try {
        const res = await apiClient.get('/api/tasks/', {
          params: {
            is_done: true,
            ordering: '-completion_date',
            page: completedPage,
            page_size: 10
          }
        });
        const results = Array.isArray(res.data) ? res.data : res.data.results || [];
        console.log('Fetched tasks for completed list:', results);
        const completed = results.filter((task: any) => task.is_done === true);
        console.log('Filtered completed tasks:', completed);
        setCompletedTasks(prev => completedPage === 1 ? completed : [...prev, ...completed]);
        setCompletedHasMore(completed.length === 10);
      } catch (e) {
        setCompletedHasMore(false);
      } finally {
        setCompletedLoading(false);
      }
    };
    fetchCompleted();
  }, [completedPage]);

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

      <div className="my-8">
        <CompletedTasksChart />
      </div>
      <div className="bg-white shadow-sm rounded-lg p-4 mt-8">
        <h2 className="text-lg font-semibold mb-4">Completed Tasks</h2>
        <ul>
          {completedTasks.map(task => (
            <li key={task.id} className="border-b last:border-b-0 py-2">
              <span className="font-medium">{task.description}</span>
              {task.completion_date && (
                <span className="ml-2 text-xs text-gray-500">{format(parseISO(task.completion_date), 'PPpp')}</span>
              )}
            </li>
          ))}
        </ul>
        {completedHasMore && (
          <button
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            onClick={() => setCompletedPage(p => p + 1)}
            disabled={completedLoading}
          >
            {completedLoading ? 'Loading...' : 'Load more'}
          </button>
        )}
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