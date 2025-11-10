import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  role: z.enum([
    'project_manager',
    'estimator',
    'field_worker',
    'supervisor',
    'foreman',
    'engineer',
    'contractor',
    'other',
  ]).optional(),
  hourly_rate: z.number().min(0).optional(),
  hire_date: z.string().optional(),
});

export const contactTaskSchema = z.object({
  contact_id: z.string().uuid('Invalid contact ID'),
  project_id: z.string().uuid().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  actual_hours: z.number().min(0).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
export type ContactTaskFormData = z.infer<typeof contactTaskSchema>;
