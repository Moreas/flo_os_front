import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { fetchWithCSRF } from '../api/fetchWithCreds';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import API_BASE from '../apiBase';
import { PendingHabit } from '../types/habit';

interface QuickHabitTrackerProps {
  onUpdate?: () => void;
}

const QuickHabitTracker: React.FC<QuickHabitTrackerProps> = ({ onUpdate }) => {
  const [pendingHabits, setPendingHabits] = useState<PendingHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingHabitId, setUpdatingHabitId] = useState<number | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<PendingHabit | null>(null);
  const [notes, setNotes] = useState('');
  const [completionType, setCompletionType] = useState<'completed' | 'not_completed'>('completed');

  const fetchPendingHabits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await axios.get(`${API_BASE}/api/habits/pending_for_date/?date=${today}`);
      setPendingHabits(response.data || []);
    } catch (err: unknown) {
      console.error("Error fetching pending habits:", err);
      setError("Failed to load pending habits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingHabits();
  }, [fetchPendingHabits]);

  const handleMarkHabit = async (habit: PendingHabit, type: 'completed' | 'not_completed') => {
    setSelectedHabit(habit);
    setCompletionType(type);
    setShowNotesModal(true);
  };

  const handleSubmitWithNotes = async () => {
    if (!selectedHabit) return;
    
    setUpdatingHabitId(selectedHabit.id);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const endpoint = completionType === 'completed' 
        ? `${API_BASE}/api/habits/${selectedHabit.id}/mark_completed/`
        : `${API_BASE}/api/habits/${selectedHabit.id}/mark_not_completed/`;
      
              const response = await fetchWithCSRF(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date: today,
            notes: notes.trim() || null
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to mark habit (${response.status})`);
        }
      
      setShowNotesModal(false);
      setSelectedHabit(null);
      setNotes('');
      
      await fetchPendingHabits();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Error marking habit:", err);
      setError("Failed to mark habit.");
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
        <h3 className="text-lg font-semibold text-gray-900">Today's Pending Habits</h3>
        <span className="text-sm text-gray-500">
          {format(new Date(), 'MMM d, yyyy')}
        </span>
      </div>

      {pendingHabits.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">All caught up!</p>
          <p className="mt-1 text-sm text-gray-500">
            No pending habits for today
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingHabits.map(habit => (
            <div 
              key={habit.id} 
              className="bg-white border-2 border-yellow-200 rounded-lg p-4 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 rounded-full bg-yellow-100">
                  <ClockIcon className="w-4 h-4 text-yellow-600" />
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
              
              {habit.description && (
                <p className="mt-2 text-xs text-gray-600 line-clamp-2 mb-3">{habit.description}</p>
              )}
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleMarkHabit(habit, 'completed')}
                  disabled={updatingHabitId === habit.id}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                >
                  {updatingHabitId === habit.id ? (
                    <ClockIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                  )}
                  Done
                </button>
                <button
                  onClick={() => handleMarkHabit(habit, 'not_completed')}
                  disabled={updatingHabitId === habit.id}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {updatingHabitId === habit.id ? (
                    <ClockIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircleIcon className="w-4 h-4 mr-1" />
                  )}
                  Skip
                </button>
              </div>
              
              {habit.days_since_last_completion && habit.days_since_last_completion > 1 && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                  <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />
                  {habit.days_since_last_completion} days since last completion
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
              Mark as {completionType === 'completed' ? 'Completed' : 'Not Completed'}: {selectedHabit.name}
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
                className={`px-4 py-2 text-white rounded-lg ${
                  completionType === 'completed' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Mark as {completionType === 'completed' ? 'Completed' : 'Not Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickHabitTracker; 