import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  address: z.string().min(1, "Project address is required"),
  description: z.string().optional(),
  
  // Client linking
  client_id: z.string().uuid("Invalid client").optional(),
  
  // Project Manager
  project_manager_id: z.string().uuid("Invalid project manager").optional(),
  
  // Dates
  start_date: z.string().optional(),
  estimated_end_date: z.string().optional(),
  actual_end_date: z.string().optional(),
  
  // Budget
  estimated_budget: z.number().min(0).optional(),
  actual_cost: z.number().min(0).optional(),
  
  // Progress
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional(),
  completion_percentage: z.number().min(0).max(100).optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
