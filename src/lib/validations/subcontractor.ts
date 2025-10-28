import { z } from "zod";

export const subcontractorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email"),
  status: z.enum(["active", "inactive"]).default("active"),
  projectId: z.string().optional(),
});

export type SubcontractorFormData = z.infer<typeof subcontractorSchema>;
