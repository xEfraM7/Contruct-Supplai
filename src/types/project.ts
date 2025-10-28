export interface Project {
  id: string;
  name: string;
  clientName?: string;
  address: string;
  clientPhone?: string;
  clientEmail?: string;
  startDate?: string;
  estimatedEndDate?: string;
  estimatedBudget?: number;
  description?: string;
  status?: string;
  completionPercentage?: number;
  actualEndDate?: string;
  createdAt: string;
  updatedAt: string;
}
