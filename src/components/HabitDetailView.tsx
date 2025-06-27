import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  ArrowPathIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, subDays } from 'date-fns';
import API_BASE from '../apiBase';
import HabitForm from './forms/HabitForm';
import { Habit, HabitInstance, HabitTrackingStatus } from '../types/habit';

interface HabitDetailViewProps {
  habitId: number;
  onBack?: () => void;
}

const HabitDetailView: React.FC<HabitDetailViewProps> = ({ habitId, onBack }) => {
  const [habit, setHabit] = useState<Habit | null>(null);
  const [instances, setInstances] = useState<HabitInstance[]>([]);
  const [trackingStatus, setTrackingStatus] = useState<HabitTrackingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNotes, setShowNotes] = useState<number | null>(null);
  const [newNote, setNewNote] = useState('');
  const [updatingInstance, setUpdatingInstance] = useState<number | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<Array<{ date: Date; status: 'completed' | 'not_completed' | 'pending' | 'not_tracked'; instance?: HabitInstance }>>([]);
  const [monthlyProgress, setMonthlyProgress] = useState<Array<{ date: Date; status: 'completed' | 'not_completed' | 'pending' | 'not_tracked'; instance?: HabitInstance }>>([]);

  // Function to get status for a specific date using the new API
  const getStatusForDate = useCallback(async (date: Date): Promise<'completed' | 'not_completed' | 'pending' | 'not_tracked'> => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await axios.get(`${API_BASE}/api/habits/${habitId}/status_for_date/?date=${dateStr}`);
      return response.data.status;
    } catch (err) {
      console.error("Error fetching status for date:", date, err);
      return 'not_tracked';
    }
  }, [habitId]);

  // Function to update progress data based on new API endpoints
  const updateProgressData = useCallback(async (instancesData: HabitInstance[], trackingData: HabitTrackingStatus | null) => {
    // Update weekly progress
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    const weekDays = eachDayOfInterval({ start, end });
    
    const weeklyData = await Promise.all(weekDays.map(async (day) => {
      const status = await getStatusForDate(day);
      const instance = instancesData.find(inst => isSameDay(parseISO(inst.date), day));
      return {
        date: day,
        status: status,
        instance: instance
      };
    }));
    setWeeklyProgress(weeklyData);

    // Update monthly progress
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const monthlyData = await Promise.all(monthDays.map(async (day) => {
      const status = await getStatusForDate(day);
      const instance = instancesData.find(inst => isSameDay(parseISO(inst.date), day));
      return {
        date: day,
        status: status,
        instance: instance
      };
    }));
    setMonthlyProgress(monthlyData);
  }, [selectedDate, habitId, getStatusForDate]);

  const fetchHabitData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = format(startOfWeek(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfWeek(selectedDate), 'yyyy-MM-dd');
      
      const [habitRes, instancesRes, trackingRes] = await Promise.all([
        axios.get(`${API_BASE}/api/habits/${habitId}/`),
        axios.get(`${API_BASE}/api/habit-instances/?habit_id=${habitId}`),
        axios.get(`${API_BASE}/api/habits/${habitId}/tracking_status/?start_date=${startDate}&end_date=${endDate}`)
      ]);
      
      setHabit(habitRes.data);
      setInstances(instancesRes.data || []);
      setTrackingStatus(trackingRes.data);
      
      // Update progress data
      await updateProgressData(instancesRes.data || [], trackingRes.data);
    } catch (err: unknown) {
      console.error("Error fetching habit data:", err);
      setError("Failed to load habit data.");
    } finally {
      setLoading(false);
    }
  }, [habitId, selectedDate, updateProgressData]);

  // Function to get color classes based on status
  const getStatusColorClasses = (status: 'completed' | 'not_completed' | 'pending' | 'not_tracked') => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200';
      case 'not_completed':
        return 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200';
      case 'pending':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100';
    }
  };

  // Function to get icon based on status
  const getStatusIcon = (status: 'completed' | 'not_completed' | 'pending' | 'not_tracked') => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4 mx-auto mt-1" />;
      case 'not_completed':
        return <XCircleIcon className="w-4 h-4 mx-auto mt-1" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 mx-auto mt-1" />;
      default:
        return <XCircleIcon className="w-4 h-4 mx-auto mt-1" />;
    }
  };

  useEffect(() => {
    fetchHabitData();
  }, [fetchHabitData]);

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!habit || !window.confirm('Are you sure you want to delete this habit?')) return;
    
    try {
      await axios.delete(`${API_BASE}/api/habits/${habit.id}/`);
      if (onBack) onBack();
    } catch (err: unknown) {
      console.error("Error deleting habit:", err);
      setError("Failed to delete habit. Please try again.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleHabitUpdated = () => {
    fetchHabitData();
    setIsEditModalOpen(false);
  };

  const toggleHabitCompletion = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingInstance = instances.find(instance => 
      isSameDay(parseISO(instance.date), date)
    );

    setUpdatingInstance(existingInstance?.id || -1);

    try {
      if (existingInstance) {
        // If instance exists, toggle its completion status
        const newCompleted = !existingInstance.completed;
        const endpoint = newCompleted 
          ? `${API_BASE}/api/habits/${habitId}/mark_completed/`
          : `${API_BASE}/api/habits/${habitId}/mark_not_completed/`;
        
        await axios.post(endpoint, {
          date: dateStr,
          notes: existingInstance.notes || null
        });
      } else {
        // Create new instance as completed
        await axios.post(`${API_BASE}/api/habits/${habitId}/mark_completed/`, {
          date: dateStr,
          notes: null
        });
      }
      
      // Refresh the progress data to show updated colors
      await updateProgressData(instances, trackingStatus);
    } catch (err) {
      console.error("Error updating habit instance:", err);
      setError("Failed to update habit completion.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingInstance(null);
    }
  };

  const updateInstanceNote = async (instanceId: number, notes: string) => {
    try {
      await axios.patch(`${API_BASE}/api/habit-instances/${instanceId}/`, { notes });
      setInstances(prev => prev.map(instance => 
        instance.id === instanceId ? { ...instance, notes } : instance
      ));
      setShowNotes(null);
      setNewNote('');
    } catch (err) {
      console.error("Error updating note:", err);
      setError("Failed to update note.");
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCompletionRate = () => {
    if (instances.length === 0) return 0;
    const completed = instances.filter(instance => instance.completed).length;
    return Math.round((completed / instances.length) * 100);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => {
      const newDate = direction === 'prev' ? subDays(prev, 7) : addDays(prev, 7);
      // Refresh progress data for the new date range
      setTimeout(() => {
        updateProgressData(instances, trackingStatus);
      }, 0);
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="text-center py-8">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-900">Habit not found</p>
      </div>
    );
  }

  const completionRate = getCompletionRate();

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <ArrowPathIcon className="w-5 h-5 transform rotate-180" />
              </button>
            )}
            <div className="p-3 bg-primary-50 rounded-full">
              <ClockIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{habit.name}</h1>
              {habit.description && (
                <p className="mt-1 text-gray-600">{habit.description}</p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleEdit}
              className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
              title="Edit habit"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
              title="Delete habit"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <ChartBarIcon className="w-5 h-5 text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-500">Completion Rate</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{completionRate}%</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="w-5 h-5 text-blue-400" />
              <span className="ml-2 text-sm font-medium text-blue-500">Current Streak</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-blue-900">{habit.current_streak}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <ChartBarIcon className="w-5 h-5 text-green-400" />
              <span className="ml-2 text-sm font-medium text-green-500">Longest Streak</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-green-900">{habit.longest_streak}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <CalendarIcon className="w-5 h-5 text-purple-400" />
              <span className="ml-2 text-sm font-medium text-purple-500">Target</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-purple-900">{habit.target_count}</p>
          </div>
        </div>

        {trackingStatus && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm font-medium text-green-600">Completed</div>
              <div className="text-2xl font-bold text-green-900">{trackingStatus.completed_count}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-sm font-medium text-red-600">Not Completed</div>
              <div className="text-2xl font-bold text-red-900">{trackingStatus.not_completed_count}</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-sm font-medium text-yellow-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">{trackingStatus.pending_count}</div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getFrequencyColor(habit.frequency)}`}>
            {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}
          </span>
          <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {habit.is_active ? 'Active' : 'Inactive'}
          </span>
          {habit.reminder_time && (
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              Reminder: {habit.reminder_time}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Weekly Progress</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <MinusIcon className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              {format(startOfWeek(selectedDate), 'MMM d')} - {format(endOfWeek(selectedDate), 'MMM d, yyyy')}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {weeklyProgress.map((day, index) => (
            <button
              key={index}
              onClick={() => toggleHabitCompletion(day.date)}
              disabled={updatingInstance === day.instance?.id}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200 text-center
                ${getStatusColorClasses(day.status)}
                ${updatingInstance === day.instance?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="text-sm font-medium">{format(day.date, 'd')}</div>
              {getStatusIcon(day.status)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Progress</h2>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
          {monthlyProgress.map((day, index) => (
            <button
              key={index}
              onClick={() => toggleHabitCompletion(day.date)}
              disabled={updatingInstance === day.instance?.id}
              className={`
                p-2 rounded text-xs transition-all duration-200 text-center
                ${getStatusColorClasses(day.status)}
                ${updatingInstance === day.instance?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={format(day.date, 'MMM d, yyyy')}
            >
              {format(day.date, 'd')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {instances
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10)
            .map(instance => (
              <div key={instance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {instance.completed ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">
                    {format(parseISO(instance.date), 'MMM d, yyyy')}
                  </span>
                  {instance.notes && (
                    <span className="text-sm text-gray-600">- {instance.notes}</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  {instance.notes && (
                    <button
                      onClick={() => setShowNotes(showNotes === instance.id ? null : instance.id)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {showNotes === instance.id ? 'Hide' : 'View'} Notes
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowNotes(showNotes === instance.id ? null : instance.id);
                      setNewNote(instance.notes || '');
                    }}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    {showNotes === instance.id ? 'Cancel' : 'Edit Notes'}
                  </button>
                </div>
              </div>
            ))}
        </div>
        
        {instances.length === 0 && (
          <p className="text-center text-gray-500 py-4">No activity recorded yet.</p>
        )}
      </div>

      {showNotes !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Notes</h3>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={4}
              placeholder="Add notes about this habit instance..."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowNotes(null);
                  setNewNote('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const instance = instances.find(inst => inst.id === showNotes);
                  if (instance) {
                    updateInstanceNote(instance.id, newNote);
                  }
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {habit && (
        <HabitForm
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
          }}
          onHabitCreated={handleHabitUpdated}
          initialHabit={habit}
          isEditMode={true}
        />
      )}
    </div>
  );
};

export default HabitDetailView; 