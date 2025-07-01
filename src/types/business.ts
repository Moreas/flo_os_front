export interface Business {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  
  // Valuation fields
  sde?: number;
  valuation_multiple?: number;
  gross_valuation?: number;
  sale_cost?: number;
  net_cash_if_sold?: number;
  
  // Related items
  tasks?: Array<{
    id: number;
    description: string;
    status?: string;
    due?: string | null;
    is_done?: boolean;
  }>;
  projects?: Array<{
    id: number;
    title: string;
    description?: string;
    status?: string;
  }>;
  goals?: Array<{
    id: number;
    title: string;
    description?: string;
    status?: string;
  }>;
} 