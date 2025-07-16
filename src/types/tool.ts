import { Project } from './project';

export interface Tool {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'retired' | 'planned';
  tool_type: 'software' | 'outsourcing' | 'other';
  url_or_path?: string;
  related_project?: Project | null;
  created_at: string;
  is_internal: boolean;
  pending_review: boolean;
} 