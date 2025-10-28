import { z } from "zod";

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  client_name: z.string().min(1, "Client name is required"),
  address: z.string().min(1, "Project address is required"),
  client_phone: z.string().optional(),
  client_email: z.string().email("Invalid email").optional().or(z.literal("")),
  start_date: z.string().optional(),
  estimated_end_date: z.string().optional(),
  estimated_budget: z.string().optional(),
  description: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
