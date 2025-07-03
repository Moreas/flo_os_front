import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/apiConfig';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { fetchWithCSRF } from '../api/fetchWithCreds';
import HabitForm from '../components/forms/HabitForm';
import { PendingHabit, TrackingSummary } from '../types/habit';

const DailyHabitsPage: React.FC = () => {
  const [pendingHabits, setPendingHabits] = useState<PendingHabit[]>([]);
  const [trackingSummary, setTrackingSummary] = useState<TrackingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingHabitId, setUpdatingHabitId] = useState<number | null>(null);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchDailyData = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);
    const targetDate = date || selectedDate;
    
    try {
      const [pendingRes, summaryRes] = await Promise.all([
        apiClient.get(`/api/habits/pending_for_date/?date=${targetDate}`),
        apiClient.get(`/api/habits/tracking_summary/?start_date=${targetDate}&end_date=${targetDate}`)
      ]);
      
      // Ensure we have arrays, even if the API returns unexpected data
      const pendingData = Array.isArray(pendingRes.data) ? pendingRes.data : [];
      const summaryData = Array.isArray(summaryRes.data) ? summaryRes.data : [];
      
      setPendingHabits(pendingData);
      setTrackingSummary(summaryData);
    } catch (err: unknown) {
      console.error("Error fetching daily habits data:", err);
      setError("Failed to load habits.");
      // Set empty arrays on error to prevent undefined issues
      setPendingHabits([]);
      setTrackingSummary([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData]);

  const handleMarkHabit = async (habitId: number, type: 'completed' | 'not_completed') => {
    setUpdatingHabitId(habitId);
    try {
      const endpoint = type === 'completed' 
        ? `/api/habits/${habitId}/mark_completed/`
        : `/api/habits/${habitId}/mark_not_completed/`;
      
      const response = await fetchWithCSRF(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          notes: null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to mark habit as ${type} (${response.status})`);
      }
      
      await fetchDailyData();
    } catch (err) {
      console.error(`Error marking habit as ${type}:`, err);
      setError(`Failed to mark habit as ${type}.`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingHabitId(null);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setShowDatePicker(false);
    fetchDailyData(newDate);
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
    fetchDailyData();
    setIsHabitFormOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ClockIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const totalHabits = trackingSummary?.length || 0;
  const completedToday = trackingSummary?.filter(h => h.completed_count > 0)?.length || 0;
  const pendingCount = pendingHabits?.length || 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
          {error}
        </div>
      )}

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
            <p className="text-gray-600">Track your habits for today</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <CalendarIcon className="w-4 h-4" />
            <span>{format(new Date(selectedDate), 'MMM d, yyyy')}</span>
          </button>
          <button
            onClick={() => setIsHabitFormOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Date Picker */}
      {showDatePicker && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Select Date</h3>
            <button
              onClick={() => setShowDatePicker(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalHabits}</div>
          <div className="text-sm text-gray-500">Total Habits</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{completedToday}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
      </div>

      {/* Pending Habits */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Habits</h2>
        {!pendingHabits || pendingHabits.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">All caught up!</p>
            <p className="mt-1 text-sm text-gray-500">
              No pending habits for {format(new Date(selectedDate), 'MMM d, yyyy')}
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
                    onClick={() => handleMarkHabit(habit.id, 'completed')}
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
                    onClick={() => handleMarkHabit(habit.id, 'not_completed')}
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
      </div>

      {/* Tracking Summary */}
      {trackingSummary && trackingSummary.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h2>
          <div className="space-y-3">
            {trackingSummary.map(habit => (
              <div 
                key={habit.habit_id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {habit.completed_count > 0 ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : habit.not_completed_count > 0 ? (
                    <XCircleIcon className="w-5 h-5 text-red-600" />
                  ) : (
                    <ClockIcon className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{habit.habit_name}</h4>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>
                        Status: {habit.completed_count > 0 ? (
                          <span className="text-green-600 font-medium">Completed</span>
                        ) : habit.not_completed_count > 0 ? (
                          <span className="text-red-600 font-medium">Not Completed</span>
                        ) : (
                          <span className="text-yellow-600 font-medium">Pending</span>
                        )}
                      </span>
                      <span>Rate: {habit.completion_rate}%</span>
                      <span>Streak: {habit.current_streak} days</span>
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