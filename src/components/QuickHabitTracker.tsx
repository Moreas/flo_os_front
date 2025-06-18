import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  CheckCircleIcon, 
  ClockIcon,
  PlusIcon,
  ChatBubbleLeftIcon
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

interface QuickHabitTrackerProps {
  onUpdate?: () => void;
}

const QuickHabitTracker: React.FC<QuickHabitTrackerProps> = ({ onUpdate }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingHabitId, setUpdatingHabitId] = useState<number | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [notes, setNotes] = useState('');

  const fetchTodaySummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}/api/habits/today_summary/`);
      // Filter for manual habits that are active
      const manualHabits = (response.data.summary || []).filter((habit: Habit) => 
        habit.is_active && habit.tracking_type !== 'automated'
      );
      setHabits(manualHabits);
    } catch (err: unknown) {
      console.error("Error fetching today's summary:", err);
      setError("Failed to load today's habits.");
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
      setSelectedHabit(habit);
      setShowNotesModal(true);
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

  const handleSubmitWithNotes = async () => {
    if (!selectedHabit) return;
    
    setUpdatingHabitId(selectedHabit.id);
    try {
      await axios.post(`${API_BASE}/api/habits/${selectedHabit.id}/complete_manual/`, {
        notes: notes.trim() || null
      });
      
      setShowNotesModal(false);
      setSelectedHabit(null);
      setNotes('');
      
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

  const getCompletionProgress = (habit: Habit) => {
    if (habit.target_count === 1) {
      return habit.is_completed_today ? 'Done' : 'Not Done';
    }
    return `${habit.today_instances_count}/${habit.target_count}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <ClockIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Quick Track Manual Habits</h3>
        <span className="text-sm text-gray-500">
          {format(new Date(), 'MMM d, yyyy')}
        </span>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">No manual habits found</p>
          <p className="mt-1 text-sm text-gray-500">
            Create habits with manual tracking to use quick tracking
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map(habit => (
            <div 
              key={habit.id} 
              className={`bg-white border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
                habit.is_completed_today ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleMarkAsDone(habit)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    habit.is_completed_today ? 'bg-green-100' : 'bg-primary-50'
                  }`}>
                    <ClockIcon className={`w-4 h-4 ${
                      habit.is_completed_today ? 'text-green-600' : 'text-primary-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">{habit.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getFrequencyColor(habit.frequency)}`}>
                        {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTrackingTypeColor(habit.tracking_type)}`}>
                        {habit.tracking_type.charAt(0).toUpperCase() + habit.tracking_type.slice(1)}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        habit.good_bad === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {habit.good_bad.charAt(0).toUpperCase() + habit.good_bad.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {updatingHabitId === habit.id ? (
                    <ClockIcon className="w-5 h-5 text-gray-400 animate-spin" />
                  ) : habit.is_completed_today ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <PlusIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {habit.description && (
                <p className="mt-2 text-xs text-gray-600 line-clamp-2">{habit.description}</p>
              )}
              
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Progress: {getCompletionProgress(habit)}</span>
                <span>Total: {habit.total_instances}</span>
              </div>
              
              {habit.is_completed_today && (
                <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-800">
                  ✓ Completed today
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedHabit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Mark as Done: {selectedHabit.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChatBubbleLeftIcon className="w-4 h-4 inline mr-1" />
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Any thoughts or observations..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedHabit(null);
                  setNotes('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWithNotes}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Mark as Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickHabitTracker; 