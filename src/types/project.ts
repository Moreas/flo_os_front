export interface ProjectNote {
  id: number;
  content: string;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  business?: {
    id: number;
    name: string;
    description?: string;
    is_active?: boolean;
  };
  categories?: {
    id: number;
    name: string;
  }[];
  goal?: {
    id: number;
    title: string;
  };
  tasks?: {
    id: number;
    description: string;
    is_done: boolean;
    due_date?: string;
  }[];
  notes?: ProjectNote[];
} 