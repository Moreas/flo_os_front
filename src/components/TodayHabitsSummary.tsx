import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/apiConfig';
import { 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { TrackingSummary, PendingHabit } from '../types/habit';

interface TodayHabitsSummaryProps {
  onUpdate?: () => void;
}

const TodayHabitsSummary: React.FC<TodayHabitsSummaryProps> = ({ onUpdate }) => {
  const [trackingSummary, setTrackingSummary] = useState<TrackingSummary[]>([]);
  const [pendingHabits, setPendingHabits] = useState<PendingHabit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodaySummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const [summaryRes, pendingRes] = await Promise.all([
        apiClient.get(`/api/habits/tracking_summary/?start_date=${today}&end_date=${today}`),
        apiClient.get(`/api/habits/pending_for_date/?date=${today}`)
      ]);
      
      setTrackingSummary(summaryRes.data || []);
      setPendingHabits(pendingRes.data || []);
    } catch (err: unknown) {
      console.error("Error fetching today's summary:", err);
      setError("Failed to load today's habits summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaySummary();
  }, [fetchTodaySummary]);

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return 'text-green-600';
    if (streak >= 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <ClockIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  const totalHabits = trackingSummary.length;
  const completedToday = trackingSummary.filter(h => h.completed_count > 0).length;
  const pendingCount = pendingHabits.length;

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Today's Habits Summary</h3>
        <span className="text-sm text-gray-500">
          {format(new Date(), 'MMM d, yyyy')}
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalHabits}</div>
          <div className="text-xs text-gray-500">Total Habits</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{completedToday}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
      </div>

      {trackingSummary.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">No habits found</p>
          <p className="mt-1 text-sm text-gray-500">
            Create your first habit to start tracking
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trackingSummary.map(habit => (
            <div 
              key={habit.habit_id} 
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-150"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900">{habit.habit_name}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>
                      Today: {habit.completed_count > 0 ? (
                        <span className="text-green-600 font-medium">✓ Completed</span>
                      ) : habit.not_completed_count > 0 ? (
                        <span className="text-red-600 font-medium">✗ Not Completed</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">⏳ Pending</span>
                      )}
                    </span>
                    <span>
                      Rate: <span className={getCompletionRateColor(habit.completion_rate)}>
                        {habit.completion_rate}%
                      </span>
                    </span>
                    <span>
                      Streak: <span className={getStreakColor(habit.current_streak)}>
                        {habit.current_streak} days
                      </span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {habit.completed_count > 0 ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : habit.not_completed_count > 0 ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                  ) : (
                    <ClockIcon className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pendingCount > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-sm font-medium text-yellow-800">
              {pendingCount} habit{pendingCount !== 1 ? 's' : ''} still pending for today
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayHabitsSummary; 