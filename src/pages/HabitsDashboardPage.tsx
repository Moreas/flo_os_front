import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/apiConfig';
import { 
  ArrowPathIcon, 
  ExclamationTriangleIcon, 
  PlusIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import HabitForm from '../components/forms/HabitForm';
import TodayHabitsSummary from '../components/TodayHabitsSummary';
import { parseDateInput, formatDateForInput, isToday, addDays, subDays } from '../utils/dateUtils';

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
  completed_at: string | null;
  notes?: string;
}

const HabitsDashboardPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [instances, setInstances] = useState<HabitInstance[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalStreaks, setTotalStreaks] = useState(0);

  const fetchHabitsData = useCallback(async (date: Date = selectedDate) => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const [habitsRes, instancesRes] = await Promise.all([
        apiClient.get('/api/habits/'),
        apiClient.get(`/api/habit-instances/?start_date=${dateStr}&end_date=${dateStr}`)
      ]);
      setHabits(habitsRes.data || []);
      setInstances(instancesRes.data || []);
    } catch (err: unknown) {
      console.error("Error fetching habits data:", err);
      setError("Failed to load habits data.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchHabitsData(selectedDate);
  }, [fetchHabitsData, refreshKey, selectedDate]);

  useEffect(() => {
    const calculateTotalStreaks = async () => {
      try {
        const activeHabits = habits.filter(habit => habit.is_active);
        if (activeHabits.length === 0) {
          setTotalStreaks(0);
          return;
        }

        let currentStreak = 0;
        const startDate = new Date(selectedDate);
        
        // Check each day going backwards from the selected date
        for (let i = 0; i < 30; i++) { // Check last 30 days maximum
          const checkDate = new Date(startDate);
          checkDate.setDate(startDate.getDate() - i);
          const dateStr = format(checkDate, 'yyyy-MM-dd');
          
          // Fetch tracking summary for this specific date
          try {
            const summaryRes = await apiClient.get(`/api/habits/tracking_summary/?start_date=${dateStr}&end_date=${dateStr}`);
            const habitsData = summaryRes.data?.habits || [];
            
            // Check if ALL active habits were completed on this day
            let allCompleted = true;
            let hasAnyData = false;
            
            for (const activeHabit of activeHabits) {
              const habitData = habitsData.find((h: any) => h.id === activeHabit.id);
              if (habitData && habitData.summary) {
                hasAnyData = true;
                const completed = habitData.summary.completed || 0;
                const pending = habitData.summary.pending || 0;
                const notCompleted = habitData.summary.not_completed || 0;
                
                // If this habit has any pending or not completed instances, not all habits were completed
                if (pending > 0 || notCompleted > 0 || completed === 0) {
                  allCompleted = false;
                  break;
                }
              } else {
                // No data for this habit on this date means not completed
                allCompleted = false;
                break;
              }
            }
            
            // If we have data and all habits were completed, increment streak
            if (hasAnyData && allCompleted) {
              currentStreak++;
            } else {
              // Streak is broken, stop checking
              break;
            }
          } catch (error) {
            // If we can't fetch data for this date, assume streak is broken
            break;
          }
        }
        
        setTotalStreaks(currentStreak);
      } catch (error) {
        console.error('Error calculating total streaks:', error);
        setTotalStreaks(0);
      }
    };

    if (habits.length > 0) {
      calculateTotalStreaks();
    }
  }, [habits, instances, selectedDate]);

  const handleHabitCreated = () => {
    setRefreshKey(prev => prev + 1);
    setIsHabitFormOpen(false);
  };

  const handleHabitUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  const handlePreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const getCompletionStats = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dateInstances = instances.filter(instance => instance.date === dateStr);
    const activeHabits = habits.filter(habit => habit.is_active);
    
    // Check for completed habits using completed_at field (not boolean completed)
    const completedOnDate = dateInstances.filter(instance => instance.completed_at !== null).length;
    const totalActive = activeHabits.length;
    
    return {
      completed: completedOnDate,
      total: totalActive,
      percentage: totalActive > 0 ? Math.round((completedOnDate / totalActive) * 100) : 0
    };
  };

  const stats = getCompletionStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Habits Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Track your daily habits and build consistency
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsHabitFormOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4 mr-2 inline" />
            Add Habit
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMMM d, yyyy')}
            </h2>
            <div className="flex items-center space-x-1">
              <button
                onClick={handlePreviousDay}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                title="Previous day"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextDay}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                title="Next day"
                disabled={isToday(selectedDate) || selectedDate >= new Date()}
              >
                <ChevronRightIcon className={`w-4 h-4 ${(isToday(selectedDate) || selectedDate >= new Date()) ? 'opacity-30' : ''}`} />
              </button>
              {!isToday(selectedDate) && (
                <button
                  onClick={handleToday}
                  className="ml-2 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  Today
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={formatDateForInput(selectedDate)}
              onChange={(e) => handleDateChange(parseDateInput(e.target.value))}
              max={formatDateForInput(new Date())} // Don't allow future dates
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {/* Date Summary */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <ChartBarIcon className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-900">
                {isToday(selectedDate) ? "Today's Progress" : "Day's Progress"}
              </span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-blue-600">
                {stats.completed}/{stats.total}
              </span>
              <span className="ml-2 text-sm text-blue-600">
                ({stats.percentage}%)
              </span>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-900">Total Streaks</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-green-600">{totalStreaks}</span>
              <span className="ml-2 text-sm text-green-600">days</span>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-900">Active Habits</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-purple-600">{habits.filter(h => h.is_active).length}</span>
              <span className="ml-2 text-sm text-purple-600">habits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Habits Summary */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <TodayHabitsSummary 
          selectedDate={selectedDate}
          onUpdate={handleHabitUpdated} 
        />
      </div>

      {/* Habit Form Modal */}
      {isHabitFormOpen && (
        <HabitForm
          isOpen={isHabitFormOpen}
          onClose={() => setIsHabitFormOpen(false)}
          onHabitCreated={handleHabitCreated}
        />
      )}
    </div>
  );
};

export default HabitsDashboardPage; 