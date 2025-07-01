import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';

interface Goal {
  id: number;
  title?: string;
  description?: string;
  target_date?: string;
  is_completed?: boolean;
  category?: { id: number; name: string } | null;
  business?: any;
  projects?: any[];
  total_tasks?: number;
  completed_tasks?: number;
  completion_percentage?: number;
  days_remaining?: number;
}

const GoalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const response = await apiClient.get(`/api/goals/${id}/`);
        setGoal(response.data);
      } catch (err) {
        setError('Failed to load goal details.');
      } finally {
        setLoading(false);
      }
    };
    fetchGoal();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error || !goal) return <div className="p-6 text-red-600">{error || 'Goal not found.'}</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {goal.title || 'Untitled Goal'}
        </h1>
        <div className="my-2 border-b border-gray-100" />
        <p className="mt-2 text-gray-600 min-h-[1.5rem]">
          {goal.description ? goal.description : <span className="italic text-gray-400">No description provided.</span>}
        </p>
        <div className="mt-4 flex flex-wrap gap-4 items-center">
          {goal.target_date && (
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
              🎯 Target date: {new Date(goal.target_date).toLocaleDateString()}
            </span>
          )}
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${goal.is_completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {goal.is_completed ? 'Completed' : 'Active'}
          </span>
          {goal.days_remaining !== undefined && (
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              {goal.days_remaining} days remaining
            </span>
          )}
          {goal.completion_percentage !== undefined && (
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              {goal.completion_percentage}% complete
            </span>
          )}
          {goal.total_tasks !== undefined && (
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-800">
              {goal.completed_tasks} / {goal.total_tasks} tasks complete
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalDetailPage; 