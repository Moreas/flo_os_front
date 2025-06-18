import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowPathIcon, ExclamationTriangleIcon, ClockIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import API_BASE from '../apiBase';
import HabitForm from './forms/HabitForm';

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
  automation_config?: Record<string, any>;
  goal_description?: string;
  motivation_quote?: string;
}

interface HabitInstance {
  id: number;
  habit_id: number;
  date: string;
  completed: boolean;
  notes?: string;
}

const HabitList: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [instances, setInstances] = useState<HabitInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchHabits = async () => {
    setLoading(true);
    setError(null);
    try {
      const [habitsRes, instancesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/habits/`),
        axios.get(`${API_BASE}/api/habit-instances/`)
      ]);
      setHabits(habitsRes.data || []);
      setInstances(instancesRes.data || []);
    } catch (err: unknown) {
      console.error("Error fetching habits:", err);
      setError("Failed to load habits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleEdit = (habit: Habit) => {
    setSelectedHabit(habit);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (habitId: number) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return;
    
    try {
      await axios.delete(`${API_BASE}/api/habits/${habitId}/`);
      setHabits(habits.filter(habit => habit.id !== habitId));
    } catch (err: unknown) {
      console.error("Error deleting habit:", err);
      setDeleteError("Failed to delete habit. Please try again.");
      setTimeout(() => setDeleteError(null), 3000);
    }
  };

  const handleHabitUpdated = () => {
    fetchHabits();
    setIsEditModalOpen(false);
    setSelectedHabit(null);
  };

  const getHabitInstances = (habitId: number) => {
    return instances.filter(instance => instance.habit_id === habitId);
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

      {deleteError && (
        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-md border border-red-200">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {deleteError}
        </div>
      )}

      {habits.length === 0 && !error && !loading && (
        <p className="text-center text-gray-500 py-4">No habits found.</p>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((habit) => {
          const habitInstances = getHabitInstances(habit.id);
          const completedInstances = habitInstances.filter(instance => instance.completed).length;
          
          return (
            <div 
              key={habit.id} 
              className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-150"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-50 rounded-full">
                    <ClockIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{habit.name}</h3>
                    {habit.category && (
                      <p className="mt-1 text-sm text-gray-600">Category ID: {habit.category}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/habits/${habit.id}`}
                    className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-gray-100"
                    title="View details"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleEdit(habit)}
                    className="p-1 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                    title="Edit habit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                    title="Delete habit"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {habit.description && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{habit.description}</p>
                </div>
              )}
              
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getFrequencyColor(habit.frequency || '')}`}>
                    {(habit.frequency || 'daily').charAt(0).toUpperCase() + (habit.frequency || 'daily').slice(1)}
                  </span>
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Target: {habit.target_count}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div>
                    <span>Current Streak: {habit.current_streak}</span>
                    <span className="mx-2">•</span>
                    <span>Longest: {habit.longest_streak}</span>
                  </div>
                  {habit.reminder_time && (
                    <span>Reminder: {habit.reminder_time}</span>
                  )}
                </div>

                {habitInstances.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-gray-900">{completedInstances}/{habitInstances.length}</span>
                    </div>
                    <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-600 rounded-full"
                        style={{ width: `${(completedInstances / habitInstances.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedHabit && (
        <HabitForm
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedHabit(null);
          }}
          onHabitCreated={handleHabitUpdated}
          initialHabit={selectedHabit}
          isEditMode={true}
        />
      )}
    </div>
  );
};

export default HabitList; 