import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  address: z.string().min(1, "Project address is required"),
  description: z.string().optional(),
  
  // Client linking
  client_id: z.string().min(1, "Client is required").uuid("Invalid client"),
  
  // Employee Manager
  employee_manager_id: z.string().uuid("Invalid employee manager").optional().or(z.literal("")),
  
  // Dates - optional for creation, can be added later
  start_date: z.string().optional(),
  estimated_end_date: z.string().optional(),
  actual_end_date: z.string().optional(),
  
  // Budget - optional for creation
  estimated_budget: z.number().min(0).optional(),
  
  // Progress
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
