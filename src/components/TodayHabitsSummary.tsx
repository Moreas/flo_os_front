import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/apiConfig';
import { 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { format, isToday } from 'date-fns';
import { TrackingSummary } from '../types/habit';

interface TodayHabitsSummaryProps {
  selectedDate?: Date;
  onUpdate?: () => void;
}

const TodayHabitsSummary: React.FC<TodayHabitsSummaryProps> = ({ selectedDate = new Date(), onUpdate }) => {
  const navigate = useNavigate();
  const [trackingSummary, setTrackingSummary] = useState<TrackingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  // Hide completed habits by default for today, show all for other dates
  const [hideCompleted, setHideCompleted] = useState(isToday(selectedDate));

  // Update hideCompleted when selectedDate changes
  useEffect(() => {
    setHideCompleted(isToday(selectedDate));
  }, [selectedDate]);

  const fetchTodaySummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const summaryRes = await apiClient.get(`/api/habits/tracking_summary/?start_date=${dateStr}&end_date=${dateStr}`);
      
      // Extract tracking summary data from the API response structure
      const habitsData = summaryRes.data?.habits || [];
      const summaryData = habitsData.map((habit: any) => {
        const summary = habit.summary || {};
        const completed = summary.completed || 0;
        const notCompleted = summary.not_completed || 0;
        const pending = summary.pending || 0;
        const notTracked = summary.not_tracked || 0;
        const totalDates = summary.total_dates || 0;
        
        // Calculate completion rate based on actual tracking days (exclude not_tracked)
        const actualTrackingDays = totalDates - notTracked;
        const completionRate = actualTrackingDays > 0 
          ? Math.round((completed / actualTrackingDays) * 100) 
          : 0;
        
        return {
          habit_id: habit.id,
          habit_name: habit.name,
          completed_count: completed,
          not_completed_count: notCompleted,
          pending_count: pending,
          total_days: totalDates,
          completion_rate: completionRate,
          current_streak: summary.current_streak || 0,
          longest_streak: summary.longest_streak || 0,
        };
      });
      
      setTrackingSummary(summaryData);
    } catch (err: unknown) {
      console.error("Error fetching habits summary:", err);
      setError("Failed to load habits summary.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTodaySummary();
  }, [fetchTodaySummary]);

  const handleMarkCompleted = async (habitId: number) => {
    setActionLoading(habitId);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await apiClient.post(`/api/habits/${habitId}/mark_completed/`, {
        date: dateStr
      });
      
      // Refresh the data
      await fetchTodaySummary();
      
      // Call onUpdate if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error marking habit as completed:', err);
      setError('Failed to mark habit as completed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkMissed = async (habitId: number) => {
    setActionLoading(habitId);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await apiClient.post(`/api/habits/${habitId}/mark_not_completed/`, {
        date: dateStr
      });
      
      // Refresh the data
      await fetchTodaySummary();
      
      // Call onUpdate if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error marking habit as missed:', err);
      setError('Failed to mark habit as missed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUndo = async (habitId: number) => {
    setActionLoading(habitId);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      await apiClient.post(`/api/habits/${habitId}/undo_habit/`, {
        date: dateStr
      });
      
      // Refresh the data
      await fetchTodaySummary();
      
      // Call onUpdate if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error undoing habit:', err);
      setError('Failed to undo habit');
    } finally {
      setActionLoading(null);
    }
  };

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
  const missedToday = trackingSummary.filter(h => h.not_completed_count > 0).length;
  const pendingCount = totalHabits - completedToday - missedToday;
  
  // Filter habits based on hideCompleted setting - exclude both completed and missed habits
  const filteredHabits = hideCompleted 
    ? trackingSummary.filter(h => h.completed_count === 0 && h.not_completed_count === 0) 
    : trackingSummary;
  
  // Calculate progress percentage for the selected date
  const progressPercentage = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {isToday(selectedDate) ? "Today's Habits" : "Habits"}
        </h3>
        <div className="flex items-center space-x-3">
          {/* Filter Toggle */}
          {(completedToday > 0 || missedToday > 0) && (
            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            >
              {hideCompleted ? (
                <>
                  <EyeSlashIcon className="w-4 h-4" />
                  <span>Show all</span>
                </>
              ) : (
                <>
                  <EyeIcon className="w-4 h-4" />
                  <span>Show pending only</span>
                </>
              )}
            </button>
          )}
          <div className="text-right">
            <div className="text-sm text-gray-500">
              {format(selectedDate, 'MMM d, yyyy')}
            </div>
            <div className="text-lg font-bold text-blue-600">
              {progressPercentage}% complete
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{totalHabits}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-green-600">{completedToday}</div>
          <div className="text-xs text-gray-500">Done</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-red-600">{missedToday}</div>
          <div className="text-xs text-gray-500">Missed</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{pendingCount}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
      </div>

      {filteredHabits.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">
            {hideCompleted && (completedToday > 0 || missedToday > 0)
              ? `All habits completed or missed! 🎉` 
              : "No habits found"
            }
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {hideCompleted && (completedToday > 0 || missedToday > 0)
              ? "Click 'Show all' to see finished and missed habits"
              : "Create your first habit to start tracking"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHabits.map(habit => {
            const isCompleted = habit.completed_count > 0;
            const isMissed = habit.not_completed_count > 0;
            const isPending = !isCompleted && !isMissed;
            const isLoading = actionLoading === habit.habit_id;

            return (
              <div 
                key={habit.habit_id} 
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-150 cursor-pointer"
                onClick={() => navigate(`/habits/${habit.habit_id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">{habit.habit_name}</h4>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>
                        Status: {isCompleted ? (
                          <span className="text-green-600 font-medium">✓ Done</span>
                        ) : isMissed ? (
                          <span className="text-red-600 font-medium">✗ Missed</span>
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
                    {/* Status Icon */}
                    {isCompleted ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-600" />
                    ) : isMissed ? (
                      <XCircleIcon className="w-5 h-5 text-red-600" />
                    ) : (
                      <ClockIcon className="w-5 h-5 text-yellow-600" />
                    )}
                    
                    {/* Action Buttons - Only show for today or future dates */}
                    {(isToday(selectedDate) || selectedDate > new Date()) && (
                      <div 
                        className="flex space-x-2 ml-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isPending ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkCompleted(habit.habit_id);
                              }}
                              disabled={isLoading}
                              className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isLoading ? '...' : 'Done'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkMissed(habit.habit_id);
                              }}
                              disabled={isLoading}
                              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isLoading ? '...' : 'Missed'}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUndo(habit.habit_id);
                            }}
                            disabled={isLoading}
                            className="px-3 py-1 text-xs font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isLoading ? '...' : 'Undo'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodayHabitsSummary; 