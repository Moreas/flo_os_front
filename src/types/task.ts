import { Project } from './project';
import { Business } from './business';
import { Category } from './category';
import { Person } from './person';

export interface Task {
  id: number;
  description: string;
  due_date: string | null;
  is_done: boolean;
  completion_date: string | null;
  created_at: string;
  importance: 'could_do' | 'should_do' | 'must_do';
  is_urgent: boolean;
  project: Project | null;
  business: Business | null;
  categories: Category[];
  responsible: Person[];
  impacted: Person[];
} 