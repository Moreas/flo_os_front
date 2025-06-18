import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  CheckCircleIcon, 
  ClockIcon,
  PlusIcon,
  MapPinIcon,
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
  reminder_time?: string;
  reminder_enabled?: boolean;
  category?: number;
}

interface HabitInstance {
  id: number;
  habit_id: number;
  date: string;
  notes?: string;
  completed_at?: string;
  effort_level?: number;
  mood_before?: number;
  mood_after?: number;
  duration_minutes?: number;
  location?: string;
  is_automated: boolean;
  automation_source?: string;
}

interface QuickHabitTrackerProps {
  onUpdate?: () => void;
}

const QuickHabitTracker: React.FC<QuickHabitTrackerProps> = ({ onUpdate }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [instances, setInstances] = useState<HabitInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingHabit, setTrackingHabit] = useState<Habit | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingData, setTrackingData] = useState({
    effort_level: 3,
    mood_before: 5,
    mood_after: 5,
    duration_minutes: 0,
    location: '',
    notes: ''
  });

  const fetchHabitsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [habitsRes, instancesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/habits/`),
        axios.get(`${API_BASE}/api/habit-instances/`)
      ]);
      
      // Filter for manual tracking habits that are active
      const manualHabits = (habitsRes.data || []).filter((habit: Habit) => 
        habit.is_active && habit.tracking_type !== 'automated'
      );
      
      setHabits(manualHabits);
      setInstances(instancesRes.data || []);
    } catch (err: unknown) {
      console.error("Error fetching habits data:", err);
      setError("Failed to load habits data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabitsData();
  }, [fetchHabitsData]);

  const getTodayInstances = (habitId: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return instances.filter(instance => 
      instance.habit_id === habitId && instance.date === today
    );
  };

  const isCompletedToday = (habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return false;
    
    const todayInstances = getTodayInstances(habitId);
    const completedCount = todayInstances.length;
    return completedCount >= habit.target_count;
  };

  const quickComplete = async (habit: Habit) => {
    if (isCompletedToday(habit.id)) {
      // If already completed, just mark as incomplete by removing instances
      const todayInstances = getTodayInstances(habit.id);
      try {
        for (const instance of todayInstances) {
          await axios.delete(`${API_BASE}/api/habit-instances/${instance.id}/`);
        }
        await fetchHabitsData();
        if (onUpdate) onUpdate();
      } catch (err) {
        console.error("Error removing habit instance:", err);
        setError("Failed to update habit completion.");
        setTimeout(() => setError(null), 3000);
      }
    } else {
      // Open tracking modal for manual habits
      setTrackingHabit(habit);
      setShowTrackingModal(true);
    }
  };

  const submitTracking = async () => {
    if (!trackingHabit) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await axios.post(`${API_BASE}/api/habit-instances/`, {
        habit_id: trackingHabit.id,
        date: today,
        notes: trackingData.notes,
        effort_level: trackingData.effort_level,
        mood_before: trackingData.mood_before,
        mood_after: trackingData.mood_after,
        duration_minutes: trackingData.duration_minutes || null,
        location: trackingData.location || '',
        is_automated: false
      });

      setShowTrackingModal(false);
      setTrackingHabit(null);
      setTrackingData({
        effort_level: 3,
        mood_before: 5,
        mood_after: 5,
        duration_minutes: 0,
        location: '',
        notes: ''
      });
      
      await fetchHabitsData();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Error creating habit instance:", err);
      setError("Failed to track habit completion.");
      setTimeout(() => setError(null), 3000);
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
          {habits.map(habit => {
            const completed = isCompletedToday(habit.id);
            const todayInstances = getTodayInstances(habit.id);
            
            return (
              <div 
                key={habit.id} 
                className={`bg-white border-2 rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
                  completed ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => quickComplete(habit)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      completed ? 'bg-green-100' : 'bg-primary-50'
                    }`}>
                      <ClockIcon className={`w-4 h-4 ${
                        completed ? 'text-green-600' : 'text-primary-600'
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
                    {completed ? (
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
                  <span>Target: {habit.target_count}</span>
                  <span>Completed: {todayInstances.length}</span>
                </div>
                
                {completed && (
                  <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-800">
                    ✓ Completed today
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tracking Modal */}
      {showTrackingModal && trackingHabit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Track: {trackingHabit.name}
            </h3>
            
            <div className="space-y-4">
              {/* Effort Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How difficult was it? (Effort Level)
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <button
                      key={level}
                      onClick={() => setTrackingData(prev => ({ ...prev, effort_level: level }))}
                      className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                        trackingData.effort_level === level
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Very Easy</span>
                  <span>Very Hard</span>
                </div>
              </div>

              {/* Mood Before */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mood before (1-10)
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(mood => (
                    <button
                      key={mood}
                      onClick={() => setTrackingData(prev => ({ ...prev, mood_before: mood }))}
                      className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                        trackingData.mood_before === mood
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood After */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mood after (1-10)
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(mood => (
                    <button
                      key={mood}
                      onClick={() => setTrackingData(prev => ({ ...prev, mood_after: mood }))}
                      className={`flex-1 py-1 px-2 rounded text-xs font-medium transition-colors ${
                        trackingData.mood_after === mood
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={trackingData.duration_minutes}
                  onChange={(e) => setTrackingData(prev => ({ 
                    ...prev, 
                    duration_minutes: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="0"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={trackingData.location}
                  onChange={(e) => setTrackingData(prev => ({ 
                    ...prev, 
                    location: e.target.value 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Where did you do this?"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChatBubbleLeftIcon className="w-4 h-4 inline mr-1" />
                  Notes (optional)
                </label>
                <textarea
                  value={trackingData.notes}
                  onChange={(e) => setTrackingData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Any thoughts or observations..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingHabit(null);
                  setTrackingData({
                    effort_level: 3,
                    mood_before: 5,
                    mood_after: 5,
                    duration_minutes: 0,
                    location: '',
                    notes: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={submitTracking}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Track Completion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickHabitTracker; 