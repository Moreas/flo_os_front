export interface Course {
  id: number;
  title: string;
  source: string;
  description?: string;
  category?: number;
  business?: number;
  status: 'in_progress' | 'completed' | 'paused';
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  modules: Module[];
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  video_url?: string;
  transcript?: string;
  summary?: string;
  personal_notes?: string;
  quiz?: string;
  order: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
} 