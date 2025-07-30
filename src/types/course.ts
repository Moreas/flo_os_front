export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  video_url?: string;
  video_file?: File | null;
  video_url_signed?: string;
  transcript?: string;
  summary?: string;
  personal_notes?: string;
  quiz?: string;
  order: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
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

export interface Course {
  id: number;
  title: string;
  source: string;
  description?: string;
  status: 'in_progress' | 'completed' | 'paused';
  category?: number;
  business?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  modules: Module[];
} 