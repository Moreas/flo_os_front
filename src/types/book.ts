export interface Book {
  id: number;
  title: string;
  author: string;
  overall_summary: string;
  status: 'not_started' | 'in_progress' | 'read' | 'read_and_digested';
  category?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  chapters?: Chapter[];
}

export interface Chapter {
  id: number;
  book_id: number;
  title: string;
  chapter_number: number;
  summary: string;
  personal_notes: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
} 