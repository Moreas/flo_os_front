import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import API_BASE from '../apiBase';
import HabitForm from '../components/forms/HabitForm';

interface Habit {
  id: number;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  target_count: number;
  current_streak: number;
  longest_streak: number;
  is_active: boolean;
  tracking_type: 'manual' | 'automated' | 'hybrid';
  good_bad: 'good' | 'bad';
  is_completed_today: boolean;
  today_instances_count: number;
  total_instances: number;
}

interface TodaySummary {
  date: string;
  summary: Habit[];
  stats: {
    total_habits: number;
    completed_today: number;
    completion_rate: number;
  };
}

const DailyHabitsPage: React.FC = () => {
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingHabitId, setUpdatingHabitId] = useState<number | null>(null);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);

  const fetchTodaySummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching manual habits from:', `${API_BASE}/api/habits/manual_habits/`);
      const response = await axios.get(`${API_BASE}/api/habits/manual_habits/`);
      console.log('Manual habits response:', response.data);
      
      // Handle different response structures
      let habits = [];
      if (Array.isArray(response.data)) {
        habits = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        habits = response.data.results;
      } else if (response.data && Array.isArray(response.data.habits)) {
        habits = response.data.habits;
      } else if (response.data && typeof response.data === 'object') {
        // If it's an object, try to extract habits from common properties
        habits = response.data.data || response.data.items || [];
      }
      
      console.log('Extracted habits:', habits);
      
      // If no habits were extracted, log the full response for debugging
      if (habits.length === 0) {
        console.warn('No habits extracted from response. Full response structure:', response.data);
        console.warn('Response data type:', typeof response.data);
        console.warn('Response data keys:', response.data ? Object.keys(response.data) : 'null/undefined');
      }
      
      // Transform the data to match our expected format
      const todaySummary = {
        date: new Date().toISOString().split('T')[0],
        summary: habits.map((habit: any) => ({
          ...habit,
          is_completed_today: false, // We'll need to check this separately
          today_instances_count: 0,
          total_instances: habit.total_instances || 0
        })),
        stats: {
          total_habits: habits.length,
          completed_today: 0,
          completion_rate: 0
        }
      };
      
      console.log('Transformed today summary:', todaySummary);
      setSummary(todaySummary);
    } catch (err: unknown) {
      console.error("Error fetching manual habits:", err);
      if (axios.isAxiosError(err)) {
        console.error('Axios error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          url: err.config?.url
        });
      }
      setError("Failed to load habits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaySummary();
  }, [fetchTodaySummary]);

  const handleCompleteHabit = async (habitId: number) => {
    setUpdatingHabitId(habitId);
    try {
      console.log('Marking habit as done:', habitId);
      const payload = {
        notes: null,
        effort: 3,
        mood: 3,
        duration: null,
        location: null
      };
      console.log('Sending payload:', payload);
      const response = await axios.post(`${API_BASE}/api/habits/${habitId}/complete_manual/`, payload);
      console.log('Complete habit response:', response.data);
      await fetchTodaySummary();
    } catch (err) {
      console.error("Error marking habit as done:", err);
      if (axios.isAxiosError(err)) {
        console.error('API Error details:', {
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        });
      }
      setError("Failed to mark habit as done.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingHabitId(null);
    }
  };

  const handleUndoCompletion = async (habitId: number) => {
    setUpdatingHabitId(habitId);
    try {
      console.log('Undoing habit completion:', habitId);
      await axios.delete(`${API_BASE}/api/habits/${habitId}/remove_today_instance/`);
      await fetchTodaySummary();
    } catch (err) {
      console.error("Error undoing habit completion:", err);
      if (axios.isAxiosError(err)) {
        console.error('API Error details:', {
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url
        });
      }
      setError("Failed to undo completion.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingHabitId(null);
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return 'bg-blue-100 text-blue-800';
      case 'weekly':
        return 'bg-purple-100 text-purple-800';
      case 'monthly':
        return 'bg-green-100 text-green-800';
      case 'custom':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrackingTypeColor = (trackingType: string) => {
    switch (trackingType) {
      case 'manual':
        return 'bg-yellow-100 text-yellow-800';
      case 'automated':
        return 'bg-blue-100 text-blue-800';
      case 'hybrid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleHabitCreated = () => {
    fetchTodaySummary();
    setIsHabitFormOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClockIcon className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
          {error}
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4">
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">No summary available</p>
        </div>
      </div>
    );
  }

  const manualHabits = summary.summary.filter(habit => 
    habit.is_active
  );

  console.log('All habits from summary:', summary.summary);
  console.log('Manual habits after filtering:', manualHabits);
  console.log('Filtering criteria - is_active only (since we get manual habits directly)');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/habits"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Habits</h1>
            <p className="text-sm text-gray-500">
              {format(new Date(summary.date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsHabitFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Habit
        </button>
      </div>

      {/* Stats Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{summary.stats.total_habits}</div>
            <div className="text-sm text-gray-500">Total Habits</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{summary.stats.completed_today}</div>
            <div className="text-sm text-gray-500">Completed Today</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{summary.stats.completion_rate}%</div>
            <div className="text-sm text-gray-500">Completion Rate</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{manualHabits.length}</div>
            <div className="text-sm text-gray-500">Manual Habits</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Today's Progress</span>
            <span>{summary.stats.completed_today}/{summary.stats.total_habits}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${summary.stats.completion_rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Manual Habits List */}
      {manualHabits.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <ClockIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No manual habits for today</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create habits with manual tracking to see them here
          </p>
          <button
            onClick={() => setIsHabitFormOpen(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Your First Habit
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Manual Habits</h2>
            <p className="text-sm text-gray-500">Use the buttons to mark habits as done or undone</p>
          </div>
          <div className="divide-y divide-gray-200">
            {manualHabits.map(habit => (
              <div 
                key={habit.id}
                className={`p-6 transition-all duration-200 ${
                  habit.is_completed_today ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${
                      habit.is_completed_today ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {updatingHabitId === habit.id ? (
                        <ClockIcon className="w-6 h-6 text-gray-400 animate-spin" />
                      ) : habit.is_completed_today ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-600" />
                      ) : (
                        <ClockIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{habit.name}</h3>
                      {habit.description && (
                        <p className="mt-1 text-sm text-gray-600">{habit.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(habit.frequency)}`}>
                          {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
                        </span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTrackingTypeColor(habit.tracking_type)}`}>
                          {habit.tracking_type.charAt(0).toUpperCase() + habit.tracking_type.slice(1)}
                        </span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          habit.good_bad === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {habit.good_bad.charAt(0).toUpperCase() + habit.good_bad.slice(1)}
                        </span>
                        {habit.target_count > 1 && (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {habit.today_instances_count}/{habit.target_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        habit.is_completed_today ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {habit.is_completed_today ? 'Done' : 'Not Done'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Streak: {habit.current_streak} days
                      </div>
                      <div className="text-sm text-gray-500">
                        Total: {habit.total_instances} times
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCompleteHabit(habit.id)}
                        disabled={updatingHabitId === habit.id || habit.is_completed_today}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                          habit.is_completed_today
                            ? 'bg-green-100 text-green-600 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                        }`}
                      >
                        {updatingHabitId === habit.id && !habit.is_completed_today ? (
                          <ClockIcon className="w-4 h-4 animate-spin" />
                        ) : (
                          'Done'
                        )}
                      </button>
                      <button
                        onClick={() => handleUndoCompletion(habit.id)}
                        disabled={updatingHabitId === habit.id || !habit.is_completed_today}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                          !habit.is_completed_today
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                        }`}
                      >
                        {updatingHabitId === habit.id && habit.is_completed_today ? (
                          <ClockIcon className="w-4 h-4 animate-spin" />
                        ) : (
                          'Undo'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habit Form Modal */}
      <HabitForm 
        isOpen={isHabitFormOpen} 
        onClose={() => setIsHabitFormOpen(false)} 
        onHabitCreated={handleHabitCreated}
      />
    </div>
  );
};

export default DailyHabitsPage; 