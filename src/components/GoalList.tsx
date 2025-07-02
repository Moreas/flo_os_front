import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiConfig';
import { ArrowPathIcon, ExclamationTriangleIcon, FlagIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import GoalForm from './forms/GoalForm';
import { Link } from 'react-router-dom';

// Interface for Goal data
interface Goal {
  id: number;
  title: string;
  description?: string;
  status?: string; // e.g., 'active', 'achieved', 'on_hold'
  target_date?: string | null;
  // Add other fields like progress, related_projects, etc.
}

const GoalList: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/goals/');
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (goalId: number) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      const response = await apiClient.delete(`/api/goals/${goalId}/`);
      
      if (response.status >= 200 && response.status < 300) {
        setGoals(goals.filter(goal => goal.id !== goalId));
      } else {
        throw new Error(`Failed to delete goal (${response.status})`);
      }
    } catch (err) {
      console.error("Error deleting goal:", err);
      setDeleteError("Failed to delete goal. Please try again.");
      setTimeout(() => setDeleteError(null), 3000);
    }
  };

  const handleGoalUpdated = (updatedGoal: Goal) => {
    setGoals(goals.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal));
    setIsEditModalOpen(false);
    setSelectedGoal(null);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'achieved': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch { 
      return "Invalid Date"; 
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {deleteError && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {deleteError}
        </div>
      )}

      {goals.length === 0 && !error && !loading && (
        <p className="text-center text-gray-500 py-4">No goals found.</p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => (
          <Link
            to={`/goals/${goal.id}`}
            key={goal.id}
            className="block bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-150 focus:ring-2 focus:ring-primary-500 outline-none"
            tabIndex={0}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-50 rounded-full">
                  <FlagIcon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{goal.title}</h3>
                  {goal.status && (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                      {goal.status.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={e => { e.preventDefault(); handleEdit(goal); }}
                  className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                  title="Edit goal"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={e => { e.preventDefault(); handleDelete(goal.id); }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                  title="Delete goal"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {goal.description && (
              <p className="mt-2 text-sm text-gray-500 line-clamp-3">{goal.description}</p>
            )}
            
            {goal.target_date && (
              <p className="text-xs text-gray-400 mt-2 text-right">
                Target: {formatDate(goal.target_date)}
              </p>
            )}
          </Link>
        ))}
      </div>

      {selectedGoal && (
        <GoalForm
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedGoal(null);
          }}
          onGoalCreated={handleGoalUpdated}
          initialGoal={selectedGoal}
          isEditMode={true}
        />
      )}
    </div>
  );
};

export default GoalList; 