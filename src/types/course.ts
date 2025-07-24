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
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  course: number;
  title: string;
  video_url?: string;
  transcript?: string;
  summary?: string;
  quiz?: string;
  order: number;
} 