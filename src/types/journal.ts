export interface JournalEntry {
  id: number;
  title?: string;
  content: string;
  date?: string;
  created_at?: string;
  emotion: string; // always a string, never undefined
  tags?: string;
} 