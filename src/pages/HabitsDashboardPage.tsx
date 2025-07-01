import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/apiConfig';
import { 
  ArrowPathIcon, 
  ExclamationTriangleIcon, 
  PlusIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import HabitForm from '../components/forms/HabitForm';
import HabitTracker from '../components/HabitTracker';
import QuickHabitTracker from '../components/QuickHabitTracker';
import TodayHabitsSummary from '../components/TodayHabitsSummary';

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

const HabitsDashboardPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [instances, setInstances] = useState<HabitInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchHabitsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [habitsRes, instancesRes] = await Promise.all([
        apiClient.get('/habits/'),
        apiClient.get('/habit-instances/')
      ]);
      setHabits(habitsRes.data || []);
      setInstances(instancesRes.data || []);
    } catch (err: unknown) {
      console.error("Error fetching habits data:", err);
      setError("Failed to load habits data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabitsData();
  }, [refreshKey]);

  const handleHabitCreated = () => {
    setRefreshKey(prev => prev + 1);
    setIsHabitFormOpen(false);
  };

  const handleHabitUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const getCompletionStats = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayInstances = instances.filter(instance => instance.date === today);
    const activeHabits = habits.filter(habit => habit.is_active);
    const completedToday = todayInstances.filter(instance => instance.completed).length;
    const totalActive = activeHabits.length;
    
    return {
      completed: completedToday,
      total: totalActive,
      percentage: totalActive > 0 ? Math.round((completedToday / totalActive) * 100) : 0
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
          <Link
            to="/habits"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            View All Habits
          </Link>
          <button
            onClick={() => setIsHabitFormOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Habit
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Progress
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.completed}/{stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-green-600 font-medium">{stats.percentage}%</span>
              <span className="text-gray-500"> completed</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Habits
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {habits.filter(h => h.is_active).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-blue-600 font-medium">
                {habits.filter(h => !h.is_active).length}
              </span>
              <span className="text-gray-500"> inactive</span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Streaks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {habits.reduce((sum, habit) => sum + habit.current_streak, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-purple-600 font-medium">
                {format(new Date(), 'MMM d')}
              </span>
              <span className="text-gray-500"> today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <TodayHabitsSummary onUpdate={handleHabitUpdated} />
      </div>

      {/* Today's Habits */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Habits</h2>
        {habits.filter(habit => habit.is_active).length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-900">No active habits</p>
            <p className="mt-1 text-sm text-gray-500">
              Create your first habit to start tracking
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits
              .filter(habit => habit.is_active)
              .map(habit => (
                <HabitTracker
                  key={habit.id}
                  habitId={habit.id}
                  onUpdate={handleHabitUpdated}
                />
              ))}
          </div>
        )}
      </div>

      {/* Quick Habit Tracker */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <QuickHabitTracker onUpdate={handleHabitUpdated} />
      </div>

      {/* Habit Form Modal */}
      <HabitForm 
        isOpen={isHabitFormOpen} 
        onClose={() => setIsHabitFormOpen(false)} 
        onHabitCreated={handleHabitCreated}
      />
    </div>
  );
};

export default HabitsDashboardPage; 