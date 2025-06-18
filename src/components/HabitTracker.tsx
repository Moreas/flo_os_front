import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format, parseISO, isSameDay } from 'date-fns';
import API_BASE from '../apiBase';

interface Habit {
  id: number;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  target_count: number;
  current_streak: number;
  longest_streak: number;
  is_active: boolean;
  reminder_time?: string;
  category?: number;
}

interface HabitInstance {
  id: number;
  habit_id: number;
  date: string;
  completed: boolean;
  notes?: string;
}

interface HabitTrackerProps {
  habitId: number;
  onUpdate?: () => void;
}

const HabitTracker: React.FC<HabitTrackerProps> = ({ habitId, onUpdate }) => {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [todayInstance, setTodayInstance] = useState<HabitInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabitData = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [habitRes, instancesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/habits/${habitId}/`),
        axios.get(`${API_BASE}/api/habit-instances/?habit_id=${habitId}&date=${today}`)
      ]);
      
      setHabit(habitRes.data);
      const instances = instancesRes.data || [];
      setTodayInstance(instances.length > 0 ? instances[0] : null);
    } catch (err: unknown) {
      console.error("Error fetching habit data:", err);
      setError("Failed to load habit data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitData();
  }, [habitId]);

  const toggleCompletion = async () => {
    if (!habit) return;
    
    setUpdating(true);
    setError(null);
    
    try {
      if (todayInstance) {
        // Toggle existing instance
        await axios.patch(`${API_BASE}/api/habit-instances/${todayInstance.id}/`, {
          completed: !todayInstance.completed
        });
        setTodayInstance(prev => prev ? { ...prev, completed: !prev.completed } : null);
      } else {
        // Create new instance
        const today = format(new Date(), 'yyyy-MM-dd');
        const response = await axios.post(`${API_BASE}/api/habit-instances/`, {
          habit_id: habitId,
          date: today,
          completed: true
        });
        setTodayInstance(response.data);
      }
      
      if (onUpdate) {
        onUpdate();
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

  const isCompleted = todayInstance?.completed || false;

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
              <span className="text-xs text-gray-500">
                Streak: {habit.current_streak}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={toggleCompletion}
          disabled={updating}
          className={`
            p-3 rounded-full transition-all duration-200 flex items-center justify-center
            ${isCompleted 
              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
            ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted ? (
            <CheckCircleIcon className="w-6 h-6" />
          ) : (
            <XCircleIcon className="w-6 h-6" />
          )}
        </button>
      </div>
      
      {habit.description && (
        <p className="mt-2 text-xs text-gray-600 line-clamp-2">{habit.description}</p>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        Today: {format(new Date(), 'MMM d, yyyy')}
      </div>
    </div>
  );
};

export default HabitTracker; 