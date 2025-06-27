export interface Habit {
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
  created_at?: string;
  updated_at?: string;
}

export interface HabitInstance {
  id: number;
  habit_id: number;
  date: string;
  completed: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HabitTrackingStatus {
  habit_id: number;
  start_date: string;
  end_date: string;
  completed_count: number;
  not_completed_count: number;
  pending_count: number;
  total_days: number;
}

export interface HabitStatusForDate {
  status: 'completed' | 'not_completed' | 'pending' | 'not_tracked';
  instance?: HabitInstance;
}

export interface PendingHabit {
  id: number;
  name: string;
  description?: string;
  frequency: string;
  target_count: number;
  tracking_type: string;
  good_bad: string;
  last_completed_date?: string;
  days_since_last_completion?: number;
}

export interface TrackingSummary {
  habit_id: number;
  habit_name: string;
  completed_count: number;
  not_completed_count: number;
  pending_count: number;
  total_days: number;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
} 