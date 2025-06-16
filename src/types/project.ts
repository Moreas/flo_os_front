export interface Project {
  id: number;
  name: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  business?: {
    id: number;
    name: string;
  };
  tasks?: {
    id: number;
    description: string;
    is_done: boolean;
    due_date?: string;
  }[];
} 