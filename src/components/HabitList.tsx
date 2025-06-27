import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowPathIcon, ExclamationTriangleIcon, ClockIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import API_BASE from '../apiBase';
import HabitForm from './forms/HabitForm';
import { Habit, HabitInstance } from '../types/habit';

interface HabitListProps {
  onUpdate?: () => void;
}

const HabitList: React.FC<HabitListProps> = ({ onUpdate }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitInstances, setHabitInstances] = useState<HabitInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  useEffect(() => {
    const fetchHabits = async () => {
      setLoading(true);
      setError(null);
      try {
        const [habitsRes, instancesRes] = await Promise.all([
          axios.get(`${API_BASE}/api/habits/`),
          axios.get(`${API_BASE}/api/habit-instances/`)
        ]);
        setHabits(habitsRes.data || []);
        setHabitInstances(instancesRes.data || []);
      } catch (err: unknown) {
        console.error("Error fetching habits:", err);
        setError("Failed to load habits.");
      } finally {
        setLoading(false);
      }
    };
    fetchHabits();
  }, []);

  const handleDelete = async (habitId: number) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return;
    
    try {
      await axios.delete(`${API_BASE}/api/habits/${habitId}/`);
      setHabits(prev => prev.filter(habit => habit.id !== habitId));
      if (onUpdate) onUpdate();
    } catch (err: unknown) {
      console.error("Error deleting habit:", err);
      setError("Failed to delete habit.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsHabitFormOpen(true);
  };

  const handleHabitCreated = () => {
    // Refresh the habits list
    const fetchHabits = async () => {
      try {
        const [habitsRes, instancesRes] = await Promise.all([
          axios.get(`${API_BASE}/api/habits/`),
          axios.get(`${API_BASE}/api/habit-instances/`)
        ]);
        setHabits(habitsRes.data || []);
        setHabitInstances(instancesRes.data || []);
      } catch (err: unknown) {
        console.error("Error fetching habits:", err);
        setError("Failed to load habits.");
      }
    };
    fetchHabits();
    setIsHabitFormOpen(false);
    if (onUpdate) onUpdate();
  };

  const handleHabitUpdated = () => {
    // Refresh the habits list
    const fetchHabits = async () => {
      try {
        const [habitsRes, instancesRes] = await Promise.all([
          axios.get(`${API_BASE}/api/habits/`),
          axios.get(`${API_BASE}/api/habit-instances/`)
        ]);
        setHabits(habitsRes.data || []);
        setHabitInstances(instancesRes.data || []);
      } catch (err: unknown) {
        console.error("Error fetching habits:", err);
        setError("Failed to load habits.");
      }
    };
    fetchHabits();
    setIsHabitFormOpen(false);
    setEditingHabit(null);
    if (onUpdate) onUpdate();
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
      <div className="flex items-center justify-center p-6">
        <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {habits.length === 0 && !error && !loading && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">No habits found</p>
          <p className="mt-1 text-sm text-gray-500">
            Create your first habit to start tracking
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((habit) => {
          return (
            <div 
              key={habit.id} 
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-150"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-50 rounded-full">
                    <ClockIcon className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{habit.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getFrequencyColor(habit.frequency || '')}`}>
                        {(habit.frequency || 'daily').charAt(0).toUpperCase() + (habit.frequency || 'daily').slice(1)}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTrackingTypeColor(habit.tracking_type || '')}`}>
                        {(habit.tracking_type || 'manual').charAt(0).toUpperCase() + (habit.tracking_type || 'manual').slice(1)}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        (habit.good_bad || 'good') === 'good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {(habit.good_bad || 'good').charAt(0).toUpperCase() + (habit.good_bad || 'good').slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Link
                    to={`/habits/${habit.id}`}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded"
                    title="View Details"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleEdit(habit)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded"
                    title="Edit Habit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
                    title="Delete Habit"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {habit.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{habit.description}</p>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(habit.frequency || '')}`}>
                    {(habit.frequency || 'daily').charAt(0).toUpperCase() + (habit.frequency || 'daily').slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div>
                    <span>Current Streak: {habit.current_streak}</span>
                    <span className="mx-2">•</span>
                    <span>Longest: {habit.longest_streak}</span>
                    <span className="mx-2">•</span>
                    <span>Latest Failure: {
                      (() => {
                        const missed = habitInstances
                          .filter(i => !i.completed)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        return missed.length > 0 ? new Date(missed[0].date).toLocaleDateString() : '—';
                      })()
                    }</span>
                  </div>
                  {habit.reminder_time && (
                    <span>Reminder: {habit.reminder_time}</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Target: {habit.target_count}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    habit.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {habit.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <HabitForm 
        isOpen={isHabitFormOpen} 
        onClose={() => {
          setIsHabitFormOpen(false);
          setEditingHabit(null);
        }} 
        onHabitCreated={handleHabitCreated}
        initialHabit={editingHabit ?? undefined}
        isEditMode={!!editingHabit}
      />
    </div>
  );
};

export default HabitList; 