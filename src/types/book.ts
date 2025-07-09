export interface Book {
  id: number;
  title: string;
  author?: string;
  description?: string;
  status: 'not_started' | 'in_progress' | 'read' | 'read_and_digested';
  current_chapter?: number;
  total_chapters?: number;
  rating?: number;
  notes?: string;
}

export interface Chapter {
  id: number;
  book_id: number;
  title: string;
  chapter_number: number;
  notes?: string;
  is_completed: boolean;
} 