export interface WishListItem {
  id: number;
  title: string;
  cost: number;
  comment?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: {
    id: number;
    name: string;
  };
  category_id?: number;
  is_purchased: boolean;
  purchased_at?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

export interface WishListStats {
  total_items: number;
  purchased_items: number;
  pending_items: number;
  total_cost: number;
  purchased_cost: number;
  pending_cost: number;
  priority_breakdown: {
    [key: string]: {
      count: number;
      total_cost: number;
    };
  };
} 