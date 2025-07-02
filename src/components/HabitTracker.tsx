import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/apiConfig';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Habit, HabitStatusForDate } from '../types/habit';

interface HabitTrackerProps {
  habitId: number;
  onUpdate?: () => void;
}

const HabitTracker: React.FC<HabitTrackerProps> = ({ habitId, onUpdate }) => {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [todayStatus, setTodayStatus] = useState<HabitStatusForDate | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabitData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [habitRes, statusRes] = await Promise.all([
        apiClient.get(`/api/habits/${habitId}/`),
        apiClient.get(`/api/habits/${habitId}/status_for_date/?date=${today}`)
      ]);
      
      setHabit(habitRes.data);
      setTodayStatus(statusRes.data);
    } catch (err: unknown) {
      console.error("Error fetching habit data:", err);
      setError("Failed to load habit data.");
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  useEffect(() => {
    fetchHabitData();
  }, [fetchHabitData]);

  const handleMarkHabit = async (type: 'completed' | 'not_completed') => {
    if (!habit) return;
    
    setUpdating(true);
    setError(null);
    
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const endpoint = type === 'completed' 
        ? `/api/habits/${habitId}/mark_completed/`
        : `/api/habits/${habitId}/mark_not_completed/`;
      
      const response = await apiClient.post(endpoint, {
        date: today,
        notes: null
      });
      
      if (response.status >= 200 && response.status < 300) {
        // Refresh the status
        const statusRes = await apiClient.get(`/api/habits/${habitId}/status_for_date/?date=${today}`);
        setTodayStatus(statusRes.data);
        
        if (onUpdate) {
          onUpdate();
        }
      } else {
        throw new Error(`Failed to update habit (${response.status})`);
      }
    } catch (err) {
      console.error("Error updating habit completion:", err);
      setError("Failed to update habit completion.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdating(false);
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'not_completed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="text-center py-4">
        <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-1 text-sm text-gray-500">Habit not found</p>
      </div>
    );
  }

  const status = todayStatus?.status || 'not_tracked';
  const isCompleted = status === 'completed';
  const isNotCompleted = status === 'not_completed';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-150">
      {error && (
        <div className="mb-3 p-2 text-xs text-red-700 bg-red-50 rounded border border-red-200">
          <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-50 rounded-full">
            <ClockIcon className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{habit.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getFrequencyColor(habit.frequency)}`}>
                {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
              </span>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {status.charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </span>
              <span className="text-xs text-gray-500">
                Streak: {habit.current_streak}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleMarkHabit('completed')}
            disabled={updating || isCompleted}
            className={`
              p-2 rounded-full transition-all duration-200 flex items-center justify-center
              ${isCompleted 
                ? 'bg-green-100 text-green-800 cursor-default' 
                : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-800'
              }
              ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title="Mark as completed"
          >
            <CheckCircleIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleMarkHabit('not_completed')}
            disabled={updating || isNotCompleted}
            className={`
              p-2 rounded-full transition-all duration-200 flex items-center justify-center
              ${isNotCompleted 
                ? 'bg-red-100 text-red-800 cursor-default' 
                : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-800'
              }
              ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title="Mark as not completed"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {habit.description && (
        <p className="mt-2 text-xs text-gray-600 line-clamp-2">{habit.description}</p>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        Today: {format(new Date(), 'MMM d, yyyy')}
      </div>
      
      {todayStatus?.instance?.notes && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <strong>Notes:</strong> {todayStatus.instance.notes}
        </div>
      )}
    </div>
  );
};

export default HabitTracker; 