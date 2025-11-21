export interface Project {
  id: string;
  name: string;
  address: string;
  description?: string;
  
  // Client linking
  client_id: string;
  
  // Employee Manager
  employee_manager_id?: string;
  
  // Dates
  startDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  
  // Budget tracking
  estimatedBudget?: number;
  actual_cost?: number;
  
  // Progress
  status?: string;
  completionPercentage?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithDetails extends Project {
  client?: {
    id: string;
    company_name: string;
    company_email: string | null;
    company_phone: string | null;
  };
  employee_manager?: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
  };
}
