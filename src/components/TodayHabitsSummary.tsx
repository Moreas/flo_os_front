import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import API_BASE from '../apiBase';

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

interface TodayHabitsSummaryProps {
  onUpdate?: () => void;
}

const TodayHabitsSummary: React.FC<TodayHabitsSummaryProps> = ({ onUpdate }) => {
  const [summary, setSummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingHabitId, setUpdatingHabitId] = useState<number | null>(null);

  const fetchTodaySummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/api/habits/today_summary/`);
      setSummary(response.data);
    } catch (err: unknown) {
      console.error("Error fetching today's summary:", err);
      setError("Failed to load today's summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaySummary();
  }, [fetchTodaySummary]);

  const handleMarkAsDone = async (habit: Habit) => {
    if (habit.is_completed_today) {
      // Undo today's completion
      await handleUndoCompletion(habit.id);
    } else {
      // Mark as done
      await handleCompleteHabit(habit.id);
    }
  };

  const handleCompleteHabit = async (habitId: number) => {
    setUpdatingHabitId(habitId);
    try {
      await axios.post(`${API_BASE}/api/habits/${habitId}/complete_manual/`);
      await fetchTodaySummary();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Error marking habit as done:", err);
      setError("Failed to mark habit as done.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingHabitId(null);
    }
  };

  const handleUndoCompletion = async (habitId: number) => {
    setUpdatingHabitId(habitId);
    try {
      await axios.delete(`${API_BASE}/api/habits/${habitId}/remove_today_instance/`);
      await fetchTodaySummary();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Error undoing habit completion:", err);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <ClockIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
        <ExclamationTriangleIcon className="w-5 h-5 inline mr-2" />
        {error}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-900">No summary available</p>
      </div>
    );
  }

  const manualHabits = summary.summary.filter(habit => 
    habit.is_active && habit.tracking_type !== 'automated'
  );

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Today's Habits</h3>
          <span className="text-sm text-gray-500">
            {format(new Date(summary.date), 'MMM d, yyyy')}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.stats.total_habits}</div>
            <div className="text-xs text-gray-500">Total Habits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.stats.completed_today}</div>
            <div className="text-xs text-gray-500">Completed Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.stats.completion_rate}%</div>
            <div className="text-xs text-gray-500">Completion Rate</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{summary.stats.completed_today}/{summary.stats.total_habits}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${summary.stats.completion_rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Manual Habits List */}
      {manualHabits.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">No manual habits for today</p>
          <p className="mt-1 text-sm text-gray-500">
            Create habits with manual tracking to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {manualHabits.map(habit => (
            <div 
              key={habit.id}
              className={`bg-white border rounded-lg p-3 transition-all duration-200 cursor-pointer hover:shadow-sm ${
                habit.is_completed_today ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleMarkAsDone(habit)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    habit.is_completed_today ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {updatingHabitId === habit.id ? (
                      <ClockIcon className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : habit.is_completed_today ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    ) : (
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{habit.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getFrequencyColor(habit.frequency)}`}>
                        {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
                      </span>
                      {habit.target_count > 1 && (
                        <span className="text-xs text-gray-500">
                          {habit.today_instances_count}/{habit.target_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {habit.is_completed_today ? 'Done' : 'Not Done'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Streak: {habit.current_streak}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodayHabitsSummary; 